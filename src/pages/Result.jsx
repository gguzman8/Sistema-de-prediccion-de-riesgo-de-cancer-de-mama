import { useLocation, useNavigate, Link } from 'react-router-dom';
import { RiskBadge, EmptyState } from '../components/ui';
import { CLASS_LABELS } from '../data/mockData';
import { formatDateTime, formatProbability } from '../utils/formatters';
import { IconGrid } from '../components/icons';

const CLASS_COLORS = {
  Normal: '#16a34a',
  Benign: '#2563eb',
  Malignant: '#dc2626',
};

function ringParams(malignancyProbability) {
  const pct = Math.min(100, Math.max(0, Math.round((Number(malignancyProbability) || 0) * 100)));
  let color = '#16a34a';
  if (pct >= 70) color = '#dc2626';
  else if (pct >= 30) color = '#ea580c';
  else if (pct >= 10) color = '#d97706';
  return { pct, color };
}

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const payload = location.state;

  if (!payload) {
    return (
      <div className="card">
        <EmptyState
          title="No hay un resultado para mostrar"
          description="Primero ejecutá un análisis desde la pantalla de revisión."
        />
        <div style={{ textAlign: 'center', paddingBottom: 24 }}>
          <Link to="/revision" className="btn btn-primary">Ir a la revisión</Link>
        </div>
      </div>
    );
  }

  const { result, input, patient, createdAt, id, imagePreview } = payload;
  const probabilities = result?.probabilities || {};
  const classes = Object.keys(probabilities);
  const ring = ringParams(result?.malignancy_probability);
  const predictedClass = result?.predicted_class || 'Desconocido';

  return (
    <>
      <button className="back-link btn btn-ghost btn-xs" onClick={() => navigate(-1)}>
        Volver
      </button>

      <h1 className="page-title">Resultado del análisis</h1>
      <p className="page-subtitle">
        Estudio de <strong>{patient?.name || 'paciente sin asignar'}</strong>
        {createdAt ? ` · ${formatDateTime(createdAt)}` : ''}
      </p>

      <section className="card card-pad" style={{ marginBottom: 24 }}>
        <div className="result-hero">
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Mamografía analizada"
              style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}
            />
          )}
          <div className="result-ring" style={{ '--ring-pct': `${ring.pct}%`, '--ring-color': ring.color }}>
            <div className="result-ring-label">
              <span className="pct" style={{ color: ring.color }}>{ring.pct}%</span>
              <span className="title">probabilidad de<br />malignidad</span>
            </div>
          </div>
          <div className="result-summary">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 26, margin: 0 }}>{CLASS_LABELS[predictedClass] || predictedClass}</h2>
              {result?.risk_level && <RiskBadge riskLevel={result.risk_level} />}
            </div>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 6px' }}>
              Clase predicha: <strong style={{ color: 'var(--text)' }}>{CLASS_LABELS[predictedClass] || predictedClass}</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              Modelo: Random Forest sobre metadatos de la lesión · Dataset MIAS
            </p>
          </div>
        </div>

        <div style={{ marginTop: 28, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h3 className="section-title" style={{ fontSize: 15, marginBottom: 14 }}>Probabilidades por clase</h3>
          {classes.map((cls) => {
            const pct = Math.round((Number(probabilities[cls]) || 0) * 100);
            return (
              <div className="prob-bar-wrap" key={cls}>
                <span className="prob-label">{CLASS_LABELS[cls] || cls}</span>
                <div className="prob-bar-track">
                  <div
                    className="prob-bar-fill"
                    style={{ width: `${pct}%`, background: CLASS_COLORS[cls] || 'var(--primary)' }}
                  />
                </div>
                <span className="prob-value">{formatProbability(probabilities[cls])}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card card-pad" style={{ marginBottom: 24 }}>
        <h3 className="section-title" style={{ fontSize: 15 }}>Parámetros del estudio</h3>
        <div className="meta-grid">
          <div className="meta-item">
            <div className="meta-key">Coordenada X</div>
            <div className="meta-val">{input?.x ?? '—'}</div>
          </div>
          <div className="meta-item">
            <div className="meta-key">Coordenada Y</div>
            <div className="meta-val">{input?.y ?? '—'}</div>
          </div>
          <div className="meta-item">
            <div className="meta-key">Radio de la lesión</div>
            <div className="meta-val">{input?.radius ?? '—'}</div>
          </div>
          <div className="meta-item">
            <div className="meta-key">Tipo de tejido</div>
            <div className="meta-val">{input?.bg_type ?? '—'}</div>
          </div>
          <div className="meta-item">
            <div className="meta-key">Paciente</div>
            <div className="meta-val" style={{ fontSize: 13 }}>{patient?.name || '—'}</div>
          </div>
          <div className="meta-item">
            <div className="meta-key">ID de estudio</div>
            <div className="meta-val" style={{ fontSize: 13, fontFamily: 'monospace' }}>{id || '—'}</div>
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => navigate('/revision')}>
          Nueva revisión
        </button>
        <Link to="/mamografias" className="btn btn-secondary">Ver guardadas</Link>
        <Link to="/" className="btn btn-ghost">
          <IconGrid width={16} height={16} /> Volver al dashboard
        </Link>
      </div>
    </>
  );
}