import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, ClipboardCheck } from 'lucide-react';

const NAV_ITEMS = [
  { to: "/",          icon: LayoutDashboard, label: "Panel" },
  { to: "/inventario",icon: Database,        label: "Inventario" },
  { to: "/audits",    icon: ClipboardCheck,  label: "Auditorías" },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* ── Desktop / Drawer Sidebar ── */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div style={{ height: '52px', padding: '0 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 24, height: 24, backgroundColor: 'var(--accent-color)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Database size={14} />
            </div>
            <h2 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>SysAdmin</h2>
          </div>
          <button className="btn btn-secondary mobile-toggle" onClick={toggleSidebar} style={{ padding: '0.25rem', border: 'none', boxShadow: 'none' }}>✕</button>
        </div>

        <div style={{ padding: '1rem 1.5rem 0.5rem' }}>
          <span className="text-xs text-muted" style={{ fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Gestión de Activos</span>
        </div>

        <nav style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
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
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay behind drawer on mobile */}
      {isOpen && (
        <div
          className="modal-overlay mobile-toggle"
          onClick={toggleSidebar}
          style={{ zIndex: 90, backdropFilter: 'none', backgroundColor: 'rgba(15,23,42,0.4)' }}
        />
      )}

      {/* ── Bottom Navigation Bar (mobile only) ── */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
