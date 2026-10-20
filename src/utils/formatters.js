export function formatDate(iso) {
  if (!iso) return 'Sin fecha';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

export function riskMeta(riskLevel) {
  const normalized = String(riskLevel || '').trim().toUpperCase();
  const map = {
    'ALTO RIESGO': { label: 'Alto riesgo', className: 'risk-high' },
    'RIESGO MEDIO': { label: 'Riesgo medio', className: 'risk-medium' },
    'BAJO RIESGO': { label: 'Bajo riesgo', className: 'risk-medium' },
    'RIESGO MUY BAJO': { label: 'Riesgo muy bajo', className: 'risk-low' },
  };
  return map[normalized] || { label: normalized || 'Sin riesgo', className: 'risk-low' };
}

export function formatProbability(value) {
  const percent = Math.round((Number(value) || 0) * 100);
  return `${percent}%`;
}