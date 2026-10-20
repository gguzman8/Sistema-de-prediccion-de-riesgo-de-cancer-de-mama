import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { MammogramCard } from '../components/cards';
import { EmptyState } from '../components/ui';
import { PLACEHOLDER_AVATAR } from '../data/mockData';
import { formatDate } from '../utils/formatters';
import { IconChevronLeft, IconCalendar, IconUser } from '../components/icons';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, mammograms } = useData();

  const patient = patients.find((p) => p.id === id);

  if (!patient) {
    return (
      <div className="card">
        <EmptyState
          title="Paciente no encontrado"
          description="El paciente que buscas no existe o fue eliminado."
        />
      </div>
    );
  }

  const patientStudies = mammograms.filter((m) => m.patientId === id);

  return (
    <>
      <button className="back-link btn-ghost btn btn-xs" onClick={() => navigate('/pacientes')}>
        <IconChevronLeft /> Volver a pacientes
      </button>

      <section className="card card-pad detail-hero" style={{ marginBottom: 24 }}>
        <img src={PLACEHOLDER_AVATAR} alt={`Foto de ${patient.name}`} className="detail-avatar" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="page-title" style={{ marginBottom: 4 }}>{patient.name}</h1>
          <div className="featured-meta" style={{ margin: 0 }}>
            <span>
              <IconUser width={14} height={14} style={{ verticalAlign: -2 }} /> {patient.age} años · Sexo {patient.sex}
            </span>
            <span>
              <IconCalendar width={14} height={14} style={{ verticalAlign: -2 }} /> Última mamografía:{' '}
              {formatDate(patient.lastMammogram)}
            </span>
          </div>
          {patient.email && (
            <div className="featured-meta" style={{ marginTop: 6 }}>
              <span>{patient.email}</span>
              <span>{patient.phone}</span>
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => navigate(`/revision/${patient.id}`)} style={{ flexShrink: 0 }}>
          Nueva revisión
        </button>
      </section>

      {patient.history && (
        <section className="card card-pad" style={{ marginBottom: 24 }}>
          <h2 className="section-title">Antecedentes clínicos</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>{patient.history}</p>
        </section>
      )}

      <section>
        <div className="section-header">
          <h2 className="section-title">Mamografías registradas</h2>
          <Link to="/mamografias" className="btn btn-secondary btn-xs">Ver todas</Link>
        </div>
        {patientStudies.length === 0 ? (
          <div className="card">
            <EmptyState
              title="Sin estudios registrados"
              description={`Todavía no se registraron mamografías para ${patient.name}.`}
            />
          </div>
        ) : (
          <div className="grid-cards">
            {patientStudies.map((mammogram) => (
              <MammogramCard key={mammogram.id} mammogram={mammogram} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}