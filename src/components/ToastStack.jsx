import { useData } from '../context/DataContext';

export default function ToastStack() {
  const { toasts } = useData();
  if (toasts.length === 0) return null;

  return (
    <div className="toast-wrap" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}