import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastStack from './ToastStack';

const MOBILE_BREAKPOINT = 768;

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleToggle = () => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  return (
    <div className={isCollapsed && !isMobile ? 'app-shell sidebar-collapsed' : 'app-shell'}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed && !isMobile}
      />
      <div className="main-content">
        <Header onToggleSidebar={handleToggle} />
        <main className="page">
          <Outlet />
        </main>
      </div>
      <ToastStack />
    </div>
  );
}