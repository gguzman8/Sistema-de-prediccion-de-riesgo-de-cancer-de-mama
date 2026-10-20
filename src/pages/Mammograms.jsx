import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { MammogramCard } from '../components/cards';
import { Pagination, EmptyState } from '../components/ui';
import { IconSearch } from '../components/icons';

const PER_PAGE = 6;

export default function Mammograms() {
  const { mammograms, savedMammograms } = useData();
  const [query, setQuery] = useState('');
  const [view, setView] = useState('all'); // all | saved
  const [sex, setSex] = useState('all'); // all | F | M
  const [sort, setSort] = useState('date'); // date | alpha
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = mammograms.filter((m) => {
      const matchesQuery =
        !q ||
        m.patientName.toLowerCase().includes(q) ||
        m.patientId.toLowerCase().includes(q);
      const matchesView = view === 'all' || savedMammograms.includes(m.id);
      const matchesSex = sex === 'all' || m.sex === sex;
      return matchesQuery && matchesView && matchesSex;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'alpha') return a.patientName.localeCompare(b.patientName);
      return new Date(b.date) - new Date(a.date);
    });

    return list;
  }, [mammograms, savedMammograms, query, view, sex, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const handleChangePage = (next) => setPage(Math.max(1, Math.min(totalPages, next)));

  return (
    <>
      <h1 className="page-title">Mamografías</h1>
      <p className="page-subtitle">
        Buscá los estudios realizados, guardalos y comienza la revisión de cada caso.
      </p>

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">
            <IconSearch />
          </span>
          <input
            type="search"
            placeholder="Buscar por paciente o ID de estudio…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-chips">
          <button className={`chip ${view === 'all' ? 'active' : ''}`} onClick={() => { setView('all'); setPage(1); }}>
            Todas
          </button>
          <button className={`chip ${view === 'saved' ? 'active' : ''}`} onClick={() => { setView('saved'); setPage(1); }}>
            Guardadas ({savedMammograms.length})
          </button>
        </div>

        <select
          className="select-control"
          value={sex}
          onChange={(e) => { setSex(e.target.value); setPage(1); }}
          aria-label="Filtrar por sexo"
        >
          <option value="all">Todos los pacientes</option>
          <option value="F">Sexo Femenino</option>
          <option value="M">Sexo Masculino</option>
        </select>

        <select
          className="select-control"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Ordenar estudios"
        >
          <option value="date">Ordenar por fecha</option>
          <option value="alpha">Orden alfabético</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No se encontraron mamografías"
            description="Probá con otro término de búsqueda o cambiá los filtros."
          />
        </div>
      ) : (
        <div className="grid-cards">
          {visible.map((mammogram) => (
            <MammogramCard key={mammogram.id} mammogram={mammogram} />
          ))}
        </div>
      )}

      <Pagination page={currentPage} total={filtered.length} perPage={PER_PAGE} onChange={handleChangePage} />
    </>
  );
}