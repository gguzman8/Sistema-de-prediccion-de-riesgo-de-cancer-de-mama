import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { PatientCard } from '../components/cards';
import { Pagination, EmptyState, Modal, Spinner } from '../components/ui';
import { IconSearch, IconPlus } from '../components/icons';

const PER_PAGE = 6;

const EMPTY_FORM = { name: '', age: '', sex: 'F', lastMammogram: '' };

export default function Patients() {
  const { patients, addPatient } = useData();
  const [query, setQuery] = useState('');
  const [sex, setSex] = useState('all');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = patients.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const matchesSex = sex === 'all' || p.sex === sex;
      return matchesQuery && matchesSex;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'age') return a.age - b.age;
      if (sort === 'recent') return new Date(b.lastMammogram || 0) - new Date(a.lastMammogram || 0);
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [patients, query, sex, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const handleChangePage = (next) => setPage(Math.max(1, Math.min(totalPages, next)));

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'El nombre es obligatorio.';
    const age = Number(form.age);
    if (!form.age || !Number.isFinite(age) || age < 0 || age > 120) {
      nextErrors.age = 'Ingresá una edad válida (0–120).';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setTimeout(() => {
      addPatient({
        name: form.name.trim(),
        age,
        sex: form.sex,
        lastMammogram: form.lastMammogram || null,
      });
      setSaving(false);
      setModalOpen(false);
      setForm(EMPTY_FORM);
    }, 400);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-subtitle">Administrá los pacientes y sus antecedentes de estudio.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <IconPlus /> Nuevo paciente
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">
            <IconSearch />
          </span>
          <input
            type="search"
            placeholder="Buscar paciente por nombre…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="select-control"
          value={sex}
          onChange={(e) => { setSex(e.target.value); setPage(1); }}
          aria-label="Filtrar por sexo"
        >
          <option value="all">Todos los sexos</option>
          <option value="F">Femenino</option>
          <option value="M">Masculino</option>
        </select>

        <select className="select-control" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar pacientes">
          <option value="name">Orden alfabético</option>
          <option value="age">Ordenar por edad</option>
          <option value="recent">Más recientes</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No se encontraron pacientes"
            description="Probá con otro término de búsqueda o registra un nuevo paciente."
          />
        </div>
      ) : (
        <div className="grid-cards">
          {visible.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}

      <Pagination page={currentPage} total={filtered.length} perPage={PER_PAGE} onChange={handleChangePage} />

      {modalOpen && (
        <Modal title="Registrar nuevo paciente" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="p-name">
                Nombre completo <span className="required">*</span>
              </label>
              <input
                id="p-name"
                className={`form-control ${errors.name ? 'invalid' : ''}`}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Ej.: Rosa María Flores"
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="p-age">
                  Edad <span className="required">*</span>
                </label>
                <input
                  id="p-age"
                  type="number"
                  min="0"
                  max="120"
                  className={`form-control ${errors.age ? 'invalid' : ''}`}
                  value={form.age}
                  onChange={(e) => setField('age', e.target.value)}
                  placeholder="45"
                />
                {errors.age && <div className="form-error">{errors.age}</div>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="p-sex">
                  Sexo
                </label>
                <select
                  id="p-sex"
                  className="form-control"
                  value={form.sex}
                  onChange={(e) => setField('sex', e.target.value)}
                >
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="p-date">
                  Última mamografía
                </label>
                <input
                  id="p-date"
                  type="date"
                  className="form-control"
                  value={form.lastMammogram}
                  onChange={(e) => setField('lastMammogram', e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving && <Spinner light />}
                {saving ? 'Guardando…' : 'Guardar paciente'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}