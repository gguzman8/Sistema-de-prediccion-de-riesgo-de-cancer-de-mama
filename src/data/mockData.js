import avatar from '../assets/avatar-placeholder.svg';
import mammogram from '../assets/mammogram-placeholder.svg';

export const PLACEHOLDER_AVATAR = avatar;
export const PLACEHOLDER_MAMMOGRAM = mammogram;

export const RISK_LEVELS = {
  'ALTO RIESGO': { level: 'Alto', color: 'red' },
  'RIESGO MEDIO': { level: 'Medio', color: 'orange' },
  'BAJO RIESGO': { level: 'Bajo', color: 'yellow' },
  'RIESGO MUY BAJO': { level: 'Muy bajo', color: 'green' },
};

export const CLASS_LABELS = {
  Normal: 'Normal',
  Benign: 'Benigno',
  Malignant: 'Maligno',
};

export const PRIORITY_META = {
  red: { label: 'Alta prioridad', className: 'priority-red' },
  orange: { label: 'Prioridad media', className: 'priority-orange' },
  yellow: { label: 'Baja prioridad', className: 'priority-yellow' },
};

export const mockPatients = [
  {
    id: 'p1',
    name: 'María Elena Gutiérrez',
    age: 54,
    sex: 'F',
    lastMammogram: '2026-08-20',
    email: 'maria.gutierrez@correo.com',
    phone: '+51 987 654 321',
    priority: 'red',
    history: 'Lesión en cuadrante superior izquierdo detectada en control anterior. Antecedente familiar de cáncer de mama.',
  },
  {
    id: 'p2',
    name: 'Lucía Fernández Díaz',
    age: 47,
    sex: 'F',
    lastMammogram: '2026-08-12',
    email: 'lucia.fernandez@correo.com',
    phone: '+51 234 567 890',
    priority: 'orange',
    history: 'Microcalcificaciones agrupadas en mama derecha. En seguimiento trimestral.',
  },
  {
    id: 'p3',
    name: 'Ana María Rodríguez',
    age: 61,
    sex: 'F',
    lastMammogram: '2026-07-30',
    email: 'ana.rodriguez@correo.com',
    phone: '+51 345 678 901',
    priority: 'yellow',
    history: 'Control anual de rutina. Antecedente de fibrosis quística.',
  },
  {
    id: 'p4',
    name: 'Carmen Rosa Quispe',
    age: 39,
    sex: 'F',
    lastMammogram: '2026-07-18',
    email: 'carmen.quispe@correo.com',
    phone: '+51 456 789 012',
    priority: 'red',
    history: 'Nódulo palpable en cuadrante externo. Derivada para biopsia si el estudio lo sugiere.',
  },
  {
    id: 'p5',
    name: 'Sofía Martínez Luna',
    age: 44,
    sex: 'F',
    lastMammogram: '2026-06-25',
    email: 'sofia.martinez@correo.com',
    phone: '+51 567 890 123',
    priority: null,
    history: 'Asimetría focal en control previo. Estudio actual en evaluación.',
  },
  {
    id: 'p6',
    name: 'Julia Torres Medina',
    age: 58,
    sex: 'F',
    lastMammogram: '2026-06-10',
    email: 'julia.torres@correo.com',
    phone: '+51 678 901 234',
    priority: null,
    history: 'Post-tratamiento de lesión benigna. Control anual.',
  },
];

export const mockMammograms = [
  {
    id: 'm1',
    patientId: 'p1',
    patientName: 'María Elena Gutiérrez',
    sex: 'F',
    date: '2026-08-20',
    side: 'Mama izquierda',
    saved: false,
    results: {
      predicted_class: 'Malignant',
      probabilities: { Normal: 0.08, Benign: 0.18, Malignant: 0.74 },
      malignancy_probability: 0.74,
      risk_level: 'ALTO RIESGO',
    },
  },
  {
    id: 'm2',
    patientId: 'p2',
    patientName: 'Lucía Fernández Díaz',
    sex: 'F',
    date: '2026-08-12',
    side: 'Mama derecha',
    saved: true,
    results: {
      predicted_class: 'Benign',
      probabilities: { Normal: 0.15, Benign: 0.72, Malignant: 0.13 },
      malignancy_probability: 0.13,
      risk_level: 'BAJO RIESGO',
    },
  },
  {
    id: 'm3',
    patientId: 'p3',
    patientName: 'Ana María Rodríguez',
    sex: 'F',
    date: '2026-07-30',
    side: 'Bilateral',
    saved: false,
    results: {
      predicted_class: 'Normal',
      probabilities: { Normal: 0.86, Benign: 0.09, Malignant: 0.05 },
      malignancy_probability: 0.05,
      risk_level: 'RIESGO MUY BAJO',
    },
  },
  {
    id: 'm4',
    patientId: 'p4',
    patientName: 'Carmen Rosa Quispe',
    sex: 'F',
    date: '2026-07-18',
    side: 'Mama derecha',
    saved: true,
    results: {
      predicted_class: 'Malignant',
      probabilities: { Normal: 0.05, Benign: 0.25, Malignant: 0.7 },
      malignancy_probability: 0.7,
      risk_level: 'ALTO RIESGO',
    },
  },
  {
    id: 'm5',
    patientId: 'p5',
    patientName: 'Sofía Martínez Luna',
    sex: 'F',
    date: '2026-06-25',
    side: 'Mama izquierda',
    saved: false,
    results: {
      predicted_class: 'Benign',
      probabilities: { Normal: 0.2, Benign: 0.68, Malignant: 0.12 },
      malignancy_probability: 0.12,
      risk_level: 'BAJO RIESGO',
    },
  },
  {
    id: 'm6',
    patientId: 'p6',
    patientName: 'Julia Torres Medina',
    sex: 'F',
    date: '2026-06-10',
    side: 'Bilateral',
    saved: false,
    results: {
      predicted_class: 'Normal',
      probabilities: { Normal: 0.91, Benign: 0.06, Malignant: 0.03 },
      malignancy_probability: 0.03,
      risk_level: 'RIESGO MUY BAJO',
    },
  },
];

export const mockQueue = [
  { id: 'q1', patientId: 'p1', name: 'María Elena Gutiérrez', age: 54, priority: 'red', addedAt: '2026-09-14T08:30:00Z', position: 1, summary: 'Lesión en cuadrante superior izquierdo.' },
  { id: 'q2', patientId: 'p4', name: 'Carmen Rosa Quispe', age: 39, priority: 'red', addedAt: '2026-09-14T09:00:00Z', position: 2, summary: 'Nódulo palpable en cuadrante externo.' },
  { id: 'q3', patientId: 'p2', name: 'Lucía Fernández Díaz', age: 47, priority: 'orange', addedAt: '2026-09-13T17:45:00Z', position: 3, summary: 'Microcalcificaciones agrupadas en mama derecha.' },
  { id: 'q4', patientId: 'p3', name: 'Ana María Rodríguez', age: 61, priority: 'yellow', addedAt: '2026-09-12T11:20:00Z', position: 4, summary: 'Control anual de rutina.' },
];