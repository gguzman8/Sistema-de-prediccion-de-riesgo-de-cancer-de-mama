import { NavLink } from 'react-router-dom';
import { IconGrid, IconScan, IconUsers, IconGear, IconLogout } from './icons';
import { useData } from '../context/DataContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: IconGrid, end: true },
  { to: '/mamografias', label: 'Mamografías', icon: IconScan },
  { to: '/pacientes', label: 'Pacientes', icon: IconUsers },
  { to: '/configuracion', label: 'Configuración', icon: IconGear },
];

export default function Sidebar({ open, onClose, isCollapsed }) {
  const { showToast } = useData();

  const handleLogout = () => {
    showToast('Sesión cerrada (demo).', 'error');
  };

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="0" y="0" width="32" height="32" rx="8" fill="#2563eb" />
            <path d="M16 8 v16 M8 16 h16" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
          </svg>
          {!isCollapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy)', lineHeight: 1.1 }}>
                Mamopredic
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-light)', letterSpacing: '1.5px' }}>
                PREDICCIÓN MAMOGRAFÍAS
              </div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={isCollapsed ? label : undefined}
              onClick={onClose}
            >
              <span className="nav-icon">
                <Icon />
              </span>
              {!isCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout} title={isCollapsed ? 'Cerrar sesión' : undefined}>
            <span className="nav-icon">
              <IconLogout />
            </span>
            {!isCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
      <div className={`sidebar-backdrop ${open ? 'show' : ''}`} onClick={onClose} aria-hidden="true" />
    </>
  );
}