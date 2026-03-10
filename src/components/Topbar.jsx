import { useAuth } from '../context/AuthContext';
import { Menu, Settings, LogOut } from 'lucide-react';

export default function Topbar({ toggleSidebar }) {
  const { logout } = useAuth();
  
  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          className="btn btn-secondary mobile-toggle" 
          onClick={toggleSidebar}
          style={{ padding: '0.375rem' }}
        >
          <Menu size={18} />
        </button>
        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>/ Sistema de Control Interno</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn" style={{ padding: '0.375rem', color: 'var(--text-secondary)' }} onClick={async () => {
             // Inyectar datos mock directamente desde IndexedDB en el cliente
             const { db } = await import('../db/database.js');
             const { addTransaction } = await import('../context/InventoryContext.jsx');
             
             if(window.confirm('¿Inyectar lote de 30 equipos y movimientos falsos para testing?')) {
               const dummyProducts = Array.from({length: 30}).map((_, i) => ({
                 name: `Equipo Aleatorio Modelo ${Math.floor(Math.random()*1000)}`,
                 sku: `SKU-${Date.now()}-${i}`,
                 category: ['Equipos de Cómputo', 'Monitores', 'Periféricos', 'Mobiliario'][Math.floor(Math.random()*4)],
                 createdAt: new Date().toISOString(),
                 updatedAt: new Date().toISOString()
               }));
               
               const LOCATIONS = ['C5', 'Seguridad Pública', 'CERITY'];

               for(let p of dummyProducts) {
                 const locs = {
                   'C5': { funcional: 0, no_funcional: 0 },
                   'Seguridad Pública': { funcional: 0, no_funcional: 0 },
                   'CERITY': { funcional: 0, no_funcional: 0 }
                 };
                 const initialQty = Math.floor(Math.random()*10) + 1; // 1 to 10
                 const randomLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
                 const now = new Date();
                 const randDays = Math.floor(Math.random()*30);
                 const pastDate = new Date(now.setDate(now.getDate() - randDays));
                 
                 // Simular entrada inicial
                 locs[randomLoc].funcional += initialQty;
                 const newP = {...p, locations: locs};
                 const id = await db.products.add(newP);
                 
                 await db.transactions.add({
                    productId: id, productName: p.name, type: 'ENTRADA', quantity: initialQty, 
                    location: randomLoc, condition: 'funcional', targetLocation: null,
                    reason: 'Compra inicial', date: pastDate.toISOString()
                 });
                 
                 // Simular salida parcial
                 const outQty = Math.floor(Math.random() * initialQty);
                 if (outQty > 0) { 
                    locs[randomLoc].funcional -= outQty;
                    await db.products.update(id, { locations: locs });
                    await db.transactions.add({
                        productId: id, productName: p.name, type: 'SALIDA', quantity: outQty, 
                        location: randomLoc, condition: 'funcional', targetLocation: null,
                        reason: 'Asignación a personal / Bajas', date: new Date().toISOString()
                     });
                 }
               }
               alert('¡Inyección completada! Recarga la página para visualizar los cambios.');
               window.location.reload();
             }
        }}>
          <Settings size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--accent-color)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}>
            AD
          </div>
          <span className="text-sm d-sm-block" style={{ fontWeight: 500, display: 'none' }}>Admin</span>
          <button 
            className="btn" 
            style={{ padding: '0.375rem', marginLeft: '0.5rem', color: 'var(--error-color)' }}
            onClick={logout}
            title="Cerrar Sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
