import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  return (
    <div className="card">
      <EmptyState
        title="Página no encontrada"
        description="La dirección a la que intentaste acceder no existe."
      />
      <div style={{ textAlign: 'center', paddingBottom: 24 }}>
        <Link to="/" className="btn btn-primary">Volver al dashboard</Link>
      </div>
    </div>
  );
}