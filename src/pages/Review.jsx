import { useCallback, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { predictMammogram } from '../services/api';
import { Spinner } from '../components/ui';
import { IconUpload, IconChevronLeft, IconAlert } from '../components/icons';

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function Review() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { patients, addMammogram } = useData();

  const preselectedPatient = useMemo(
    () => patients.find((p) => p.id === patientId),
    [patients, patientId],
  );

  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatient?.id || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState('idle'); // idle | submitting | error
  const [submitError, setSubmitError] = useState('');
  const inputRef = useRef(null);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const handleFile = useCallback(async (chosen) => {
    if (!chosen) return;
    setFile(chosen);
    setErrors((prev) => ({ ...prev, image: undefined }));
    try {
      setPreview(await readFileAsDataURL(chosen));
    } catch {
      setPreview('');
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      handleFile(e.dataTransfer.files?.[0]);
    },
    [handleFile],
  );

  const validate = () => {
    const nextErrors = {};
    if (!file) nextErrors.image = 'Adjuntá una imagen de la mamografía.';
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPhase('submitting');
    setSubmitError('');

    const body = new FormData();
    body.append('image', file);

    try {
      const payload = await predictMammogram(body);

      if (selectedPatient) {
        const today = new Date().toISOString();
        addMammogram({
          patientId: selectedPatient.id,
          patientName: selectedPatient.name,
          sex: selectedPatient.sex,
          date: today,
          side: 'En evaluación',
          results: payload.result,
        });
      }

      navigate('/resultado', {
        state: {
          ...payload,
          patient: selectedPatient
            ? { id: selectedPatient.id, name: selectedPatient.name }
            : { id: null, name: 'Sin paciente asignado' },
          imagePreview: preview,
        },
        replace: true,
      });
    } catch (error) {
      setPhase('error');
      setSubmitError(error.message);
    }
  };

  return (
    <>
      <button className="back-link btn btn-ghost btn-xs" onClick={() => navigate(-1)}>
        <IconChevronLeft /> Volver
      </button>

      <h1 className="page-title">Revisión de mamografía</h1>
      <p className="page-subtitle">
        Cargá la imagen del estudio para obtener la clasificación del modelo.
      </p>

      <div className="grid-2">
        <section>
          <form onSubmit={handleSubmit} noValidate className="card card-pad">
            <div className="form-group">
              <label className="form-label" htmlFor="patient-select">
                Paciente
              </label>
              <select
                id="patient-select"
                className="form-control"
                value={selectedPatientId}
                disabled={Boolean(preselectedPatient)}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="">— Sin asignar —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.age} años
                  </option>
                ))}
              </select>
              {selectedPatient && (
                <div className="form-hint">
                  Estudio para: <strong>{selectedPatient.name}</strong>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" id="image-label">
                Imagen de la mamografía <span className="required">*</span>
              </label>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/bmp,image/tiff"
                className="sr-only"
                id="image-upload"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <div
                className={`upload-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
                aria-labelledby="image-label"
              >
                <IconUpload className="upload-icon" />
                <div className="upload-title">
                  {file ? file.name : 'Arrastrá la imagen aquí o hacé clic para elegirla'}
                </div>
                {!file && (
                  <div className="upload-hint">PNG, JPEG, BMP o TIFF · Máximo 8 MB</div>
                )}
                {preview && <img src={preview} alt="Vista previa de la mamografía" className="upload-preview" />}
              </div>
              {errors.image && <div className="form-error">{errors.image}</div>}
            </div>

            {phase === 'error' && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <IconAlert width={18} height={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>{submitError}</div>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: 8 }}>
              <Link to="/" className="btn btn-secondary">Cancelar</Link>
              <button type="submit" className="btn btn-primary" disabled={phase === 'submitting'}>
                {phase === 'submitting' && <Spinner light />}
                {phase === 'submitting' ? 'Analizando…' : 'Ejecutar análisis'}
              </button>
            </div>
          </form>
        </section>

        <section>
          <div className="card card-pad">
            <h2 className="section-title">¿Cómo funciona la revisión?</h2>
            <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--text-muted)', lineHeight: 1.9 }}>
              <li>Seleccioná el paciente (opcional) o cargá la imagen directamente.</li>
              <li>La imagen se envía de forma segura a la API y luego al servicio de IA.</li>
              <li>YOLOv8 analiza directamente la mamografía y estima la probabilidad de cada clase.</li>
              <li>Verás la clase, las probabilidades y el nivel de riesgo.</li>
            </ol>
            {selectedPatient && (
              <div className="alert alert-info" style={{ marginTop: 18 }}>
                El resultado quedará asociado a {selectedPatient.name} y se reflejará en su historial.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
