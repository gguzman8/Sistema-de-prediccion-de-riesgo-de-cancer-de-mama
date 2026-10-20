import { riskMeta } from '../utils/formatters';
import { IconX, IconInbox } from './icons';

export function RiskBadge({ riskLevel }) {
  const meta = riskMeta(riskLevel);
  return <span className={`badge badge-dot ${meta.className}`}>{meta.label}</span>;
}

export function PriorityBadge({ priority }) {
  if (!priority) return null;
  const labels = {
    red: 'Alta prioridad',
    orange: 'Prioridad media',
    yellow: 'Baja prioridad',
  };
  return <span className={`badge badge-dot ${priority === 'red' ? 'risk-high' : priority === 'orange' ? 'risk-medium' : 'risk-low'}`}>{labels[priority]}</span>;
}

export function Spinner({ light }) {
  return <span className={`spinner ${light ? 'light' : ''}`} aria-hidden="true" />;
}

export function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <IconInbox />
      <div className="title">{title}</div>
      {description && <p style={{ marginTop: 4, marginBottom: 0 }}>{description}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar" style={{ color: 'var(--text-muted)' }}>
            <IconX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const range = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      range.push(i);
    }
  }
  const pages = [];
  let last = 0;
  range.forEach((p) => {
    if (last && p - last > 1) pages.push('...');
    pages.push(p);
    last = p;
  });

  return (
    <nav className="pagination" aria-label="Paginación">
      <button className="pagination-page" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Página anterior">
        ‹
      </button>
      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`e${idx}`} className="pagination-page" style={{ border: 'none' }}>…</span>
        ) : (
          <button
            key={p}
            className={`pagination-page ${p === page ? 'active' : ''}`}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}
      <button className="pagination-page" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Página siguiente">
        ›
      </button>
    </nav>
  );
}

