import { useState } from 'react';
import { useData } from '../context/DataContext';
import { IconInfo } from '../components/icons';

export default function Settings() {
  const { showToast } = useData();
  const [profile, setProfile] = useState({
    name: 'Gabriela Rojas',
    email: 'gabriela.rojas@hospital.gob.pe',
    specialty: 'Radiología · Especialista en mama',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast('Configuración guardada correctamente.');
  };

  return (
    <>
      <h1 className="page-title">Configuración</h1>
      <p className="page-subtitle">Preferencias de la cuenta y del sistema de análisis.</p>

      <div className="grid-2">
        <section>
          <form onSubmit={handleSubmit} className="card card-pad" noValidate>
            <h2 className="section-title" style={{ fontSize: 16 }}>Perfil del profesional</h2>

            <div className="form-group">
              <label className="form-label" htmlFor="s-name">Nombre completo</label>
              <input
                id="s-name"
                className="form-control"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="s-email">Correo electrónico</label>
              <input
                id="s-email"
                type="email"
                className="form-control"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="s-specialty">Especialidad</label>
              <input
                id="s-specialty"
                className="form-control"
                value={profile.specialty}
                onChange={(e) => setProfile((p) => ({ ...p, specialty: e.target.value }))}
              />
            </div>

            <div className="modal-actions">
              <button type="submit" className="btn btn-primary">Guardar cambios</button>
            </div>
          </form>
        </section>

        <section>
          <div className="card card-pad" style={{ marginBottom: 18 }}>
            <h2 className="section-title" style={{ fontSize: 16 }}>Umbrales de riesgo del modelo</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {[
                  ['ALTO RIESGO', '≥ 0.70', 'Caso urgente', 'var(--danger)'],
                  ['RIESGO MEDIO', '≥ 0.30 y < 0.70', 'Prioridad alta', 'var(--orange)'],
                  ['BAJO RIESGO', '≥ 0.10 y < 0.30', 'Seguimiento', 'var(--yellow)'],
                  ['RIESGO MUY BAJO', '< 0.10', 'Rutina', 'var(--green)'],
                ].map(([nivel, rango, accion, color]) => (
                  <tr key={nivel} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 8px' }}>
                      <span className="badge badge-dot" style={{ background: 'transparent', color }}>
                        {nivel}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{rango}</td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{accion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card card-pad">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <IconInfo width={22} height={22} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3 style={{ fontSize: 15, marginBottom: 6 }}>Acerca del sistema</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  Mamopredic clasifica mamografías del dataset MIAS en{' '}
                  <strong>Normal</strong>, <strong>Benigno</strong> o <strong>Maligno</strong> usando un
                  modelo Random Forest basado en los metadatos de la lesión (ubicación, tamaño y densidad
                  glandular), no en los píxeles de la imagen. Su propósito es asistir a los
                  especialistas y priorizar los casos de mayor urgencia.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}