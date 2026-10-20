import { IconMenu } from './icons';
import avatar from '../assets/avatar-placeholder.svg';

const CURRENT_USER = {
  name: 'Dra. Gabriela Rojas',
  role: 'Radióloga · Especialista en mama',
};

export default function Header({ onToggleSidebar }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn" onClick={onToggleSidebar} aria-label="Abrir menú">
          <IconMenu />
        </button>
        <span className="topbar-title">Sistema de Predicción de Mamografías</span>
      </div>
      <div className="topbar-user">
        <div className="topbar-meta">
          <div className="topbar-name">{CURRENT_USER.name}</div>
          <div className="topbar-role">{CURRENT_USER.role}</div>
        </div>
        <img src={avatar} alt={CURRENT_USER.name} className="topbar-avatar" />
      </div>
    </header>
  );
}