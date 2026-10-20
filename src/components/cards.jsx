import { Link, useNavigate } from 'react-router-dom';
import { PLACEHOLDER_AVATAR, PLACEHOLDER_MAMMOGRAM } from '../data/mockData';
import { formatDate, timeAgo } from '../utils/formatters';
import { RiskBadge, PriorityBadge } from './ui';
import { IconEye, IconBookmark } from './icons';
import { useData } from '../context/DataContext';

export function PatientCard({ patient }) {
  const navigate = useNavigate();

  return (
    <article className={`card patient-card ${patient.priority ? `priority-${patient.priority}` : ''}`}>
      <img src={PLACEHOLDER_AVATAR} alt={`Foto de ${patient.name}`} className="patient-avatar" />
      <div className="patient-info">
        <div className="patient-name">{patient.name}</div>
        <div className="patient-desc">
          {patient.age} años · Sexo {patient.sex} · Última mamografía:{' '}
          {formatDate(patient.lastMammogram)}
        </div>
        <div className="queue-meta" style={{ marginTop: 8 }}>
          <PriorityBadge priority={patient.priority} />
        </div>
      </div>
      <div className="patient-actions">
        <Link to={`/pacientes/${patient.id}`} className="btn btn-secondary btn-xs">
          <IconEye /> Ver
        </Link>
        <button className="btn btn-primary btn-xs" onClick={() => navigate(`/revision/${patient.id}`)}>
          Revisar
        </button>
      </div>
    </article>
  );
}

export function MammogramCard({ mammogram }) {
  const { savedMammograms, toggleSaved } = useData();
  const navigate = useNavigate();
  const isSaved = savedMammograms.includes(mammogram.id);

  return (
    <article className={`card mammogram-card ${mammogram.results?.risk_level ? '' : ''}`}>
      <div className="mammogram-thumb">
        <img src={PLACEHOLDER_MAMMOGRAM} alt={`Mamografía de ${mammogram.patientName}`} />
      </div>
      <div className="mammogram-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <strong className="queue-name">{mammogram.patientName}</strong>
          <button
            className="icon-btn"
            onClick={() => toggleSaved(mammogram.id)}
            aria-label={isSaved ? 'Quitar de guardadas' : 'Guardar'}
            title={isSaved ? 'Quitar de guardadas' : 'Guardar mamografía'}
            style={{ color: isSaved ? 'var(--yellow)' : 'var(--text-light)', width: 32, height: 32 }}
          >
            <IconBookmark filled={isSaved} />
          </button>
        </div>
        <div className="queue-meta">
          <span>{formatDate(mammogram.date)}</span>
          <span>·</span>
          <span>{mammogram.side}</span>
        </div>
        <div className="queue-meta">
          {isSaved ? <span className="badge badge-saved">Guardada</span> : null}
          {mammogram.results?.risk_level && <RiskBadge riskLevel={mammogram.results.risk_level} />}
        </div>
        <div className="queue-actions">
          <button className="btn btn-primary btn-xs" onClick={() => navigate(`/revision/${mammogram.patientId}`)}>
            Iniciar revisión
          </button>
        </div>
      </div>
    </article>
  );
}

export function QueueCard({ item, onReview }) {
  return (
    <article className={`card queue-card priority-${item.priority || 'yellow'}`} style={{ width: '100%' }}>
      <img src={PLACEHOLDER_AVATAR} alt={`Foto de ${item.name}`} className="queue-avatar" />
      <div className="queue-info">
        <div className="queue-name">{item.name}</div>
        <div className="queue-meta">
          <span className="priority-dot" />
          <span>{timeAgo(item.addedAt)}</span>
          <span>·</span>
          <span>{item.age} años</span>
        </div>
        <div className="queue-summary">{item.summary}</div>
      </div>
      <div className="queue-actions">
        <PriorityBadge priority={item.priority} />
        <button className="btn btn-primary btn-xs" onClick={() => onReview(item.patientId)}>
          Revisar
        </button>
      </div>
    </article>
  );
}