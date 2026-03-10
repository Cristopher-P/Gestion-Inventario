import { useInventory } from '../context/InventoryContext';
import { Package, Activity, AlertTriangle, XOctagon } from 'lucide-react';
import { LOCATIONS } from '../db/database';

export default function Dashboard() {
  const { products, transactions, getTotalStock } = useInventory();

  // New KPIs considering location maps
  let totalStock = 0;
  let totalFuncional = 0;
  let totalDañados = 0;
  let skusBajoStock = 0;

  products.forEach(p => {
    const pTotal = getTotalStock(p);
    totalStock += pTotal;
    
    // Sum functions logic
    if (p.locations) {
        LOCATIONS.forEach(l => {
             totalFuncional += (p.locations[l]?.funcional || 0);
             totalDañados += (p.locations[l]?.no_funcional || 0);
        });
    } else {
        totalFuncional += pTotal; // Fallback
    }

    if (pTotal > 0 && pTotal <= 5) skusBajoStock++;
  });

  const tenRecentTransactions = transactions.slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Resumen Ejecutivo</h1>
        <p className="text-sm text-muted">Auditoría Global Multi-Sede al {new Date().toLocaleDateString()}</p>
      </div>

      {/* KPI Belt */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-color)', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Package size={24} />
          </div>
          <div>
            <p className="text-xs" style={{ fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Volúmen Global</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{totalStock}</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--success-bg)', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Activity size={24} />
          </div>
          <div>
            <p className="text-xs" style={{ fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Operativos</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{totalFuncional}</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--warning-bg)', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs" style={{ fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Alerta de Stock &lt; 5</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{skusBajoStock}</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <XOctagon size={24} />
          </div>
          <div>
            <p className="text-xs" style={{ fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Mermas / Reparación</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{totalDañados}</p>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', flex: 1 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
               <Activity size={16} className="text-muted" /> Actividad Reciente de Traslados
            </h3>
        </div>

        {tenRecentTransactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No existen registros en la bitácora actualmente.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
             <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
                <thead>
                    <tr>
                      <th style={{ width: '140px' }}>Fecha</th>
                      <th style={{ width: '150px' }}>Sede</th>
                      <th>Activo Involucrado</th>
                      <th>Concepto</th>
                      <th style={{ width: '80px', textAlign: 'right' }}>Var.</th>
                    </tr>
                </thead>
                <tbody>
                    {tenRecentTransactions.map(tx => (
                        <tr key={tx.id}>
                            <td className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(tx.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short'})}</td>
                            <td>{tx.location}</td>
                            <td style={{ fontWeight: 500 }}>{tx.productName}</td>
                            <td className="text-muted text-sm">{tx.reason || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: tx.type === 'ENTRADA' ? 'var(--success-color)' : (tx.type === 'SALIDA' ? 'var(--text-primary)' : 'var(--text-secondary)') }}>
                               {tx.type === 'ENTRADA' ? '+' : (tx.type === 'SALIDA' ? '-' : '')}{tx.quantity}
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

    </div>
  );
}
