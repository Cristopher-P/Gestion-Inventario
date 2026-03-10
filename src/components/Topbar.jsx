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
                 stock: Math.floor(Math.random() * 20),
                 createdAt: new Date().toISOString(),
                 updatedAt: new Date().toISOString()
               }));
               
               for(let p of dummyProducts) {
                 const newP = {...p, stock: 0};
                 const id = await db.products.add(newP);
                 
                 // Transactions simulate stock history
                 const now = new Date();
                 const randDays = Math.floor(Math.random()*30);
                 const pastDate = new Date(now.setDate(now.getDate() - randDays));
                 
                 const initialQty = p.stock + Math.floor(Math.random()*10);
                 
                 await db.products.update(id, { stock: initialQty });
                 await db.transactions.add({
                    productId: id, productName: p.name, type: 'ENTRADA', quantity: initialQty, 
                    reason: 'Compra inicial', date: pastDate.toISOString()
                 });
                 
                 if (initialQty > p.stock) { // Simulate some going out
                    await db.products.update(id, { stock: p.stock });
                    await db.transactions.add({
                        productId: id, productName: p.name, type: 'SALIDA', quantity: initialQty - p.stock, 
                        reason: 'Asignación a personal', date: new Date().toISOString()
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
