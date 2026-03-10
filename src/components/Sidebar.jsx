import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, ClipboardList } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const toggleSidebar = () => setIsOpen(!isOpen);

  const navItems = [
    { to: "/", icon: <LayoutDashboard size={18} />, label: "Panel General" },
    { to: "/inventario", icon: <Database size={18} />, label: "Inventario Físico" },
    { to: "/movimientos", icon: <ClipboardList size={18} />, label: "Bitácora" }
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 24, height: 24, backgroundColor: 'var(--accent-color)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Database size={14} />
            </div>
            <h2 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>SysAdmin</h2>
          </div>
          {/* Close button for mobile inside sidebar */}
          <button className="btn btn-secondary mobile-toggle" onClick={toggleSidebar} style={{ padding: '0.25rem', border: 'none', boxShadow: 'none' }}>
            ✕
          </button>
        </div>
        
        <div style={{ padding: '1rem 1.5rem 0.5rem' }}>
          <span className="text-xs text-muted" style={{ fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Gestión de Activos</span>
        </div>

        <nav style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to}
              onClick={() => setIsOpen(false)} // close on mobile when navigating
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                borderRadius: 'var(--border-radius-md)',
                fontWeight: isActive ? '500' : '400',
                fontSize: '0.875rem'
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay to close sidebar on mobile */}
      {isOpen && (
        <div 
          className="modal-overlay mobile-toggle" 
          onClick={toggleSidebar}
          style={{ zIndex: 90 }}
        />
      )}
    </>
  );
}
