import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { mockQueue } from '../data/mockData';
import { QueueCard, MammogramCard } from '../components/cards';
import { PriorityBadge } from '../components/ui';
import { PLACEHOLDER_AVATAR } from '../data/mockData';
import { formatDate } from '../utils/formatters';

export default function Dashboard() {
  const navigate = useNavigate();
  const { patients, mammograms } = useData();

  const featured = patients.find((p) => p.id === 'p1');
  const queue = mockQueue;
  const upcoming = mammograms.filter((m) => m.date).slice(0, 3);

  const review = (patientId) => navigate(`/revision/${patientId}`);

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Cola de revisión y próximos casos pendientes de análisis.</p>

      {featured && (
        <section className="card featured" style={{ marginBottom: 28 }}>
          <div className="featured-media">
            <img src={PLACEHOLDER_AVATAR} alt={`Foto de ${featured.name}`} />
          </div>
          <div className="featured-body">
            <div className="featured-top">
              <div>
                <div className="featured-title">{featured.name}</div>
                <div className="featured-meta" style={{ marginTop: 4 }}>
                  <span>
                    <strong>Edad:</strong> {featured.age} años
                  </span>
                  <span>
                    <strong>Mamografía:</strong> {formatDate(featured.lastMammogram)}
                  </span>
                </div>
              </div>
              <PriorityBadge priority="red" />
            </div>

            <p className="featured-summary">{featured.history}</p>

            <div className="featured-meta">
              <span>
                <strong>Posición en cola:</strong> 1
              </span>
              <span>
                <strong>Estado:</strong> <span className="badge badge-blue">Pendiente de revisión</span>
              </span>
            </div>

            <div style={{ marginTop: 18 }}>
              <button className="btn btn-primary" onClick={() => review(featured.id)}>
                Revisar mamografía
              </button>
            </div>
          </div>
        </section>
      )}

      <section style={{ marginBottom: 28 }}>
        <div className="section-header">
          <h2 className="section-title">Próximos casos para revisión</h2>
          <button className="btn btn-secondary btn-xs" onClick={() => navigate('/mamografias')}>
            Ver todas
          </button>
        </div>
        <div className="list-stack">
          {queue.map((item) => (
            <QueueCard key={item.id} item={item} onReview={review} />
          ))}
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2 className="section-title">Estudios recientes</h2>
          <button className="btn btn-secondary btn-xs" onClick={() => navigate('/mamografias')}>
            Ver todas
          </button>
        </div>
        <div className="grid-cards">
          {upcoming.map((mammogram) => (
            <MammogramCard key={mammogram.id} mammogram={mammogram} />
          ))}
        </div>
      </section>
    </>
  );
}