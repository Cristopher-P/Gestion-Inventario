import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Plus, X, Search, MapPin, Calendar, Clock, CheckCircle } from 'lucide-react';
import { LOCATIONS } from '../db/database';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function InventoryAudit() {
  const { audits } = useInventory();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const { startAudit } = useInventory();

  const handleStartAudit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) return;
    
    try {
      const auditId = await startAudit(selectedLocation);
      navigate(`/audits/${auditId}`);
    } catch (error) {
      alert("Error al iniciar la auditoría");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Auditorías Físicas de Inventario</h1>
        <p className="text-sm text-muted">Asegura la precisión del inventario realizando conteos periódicos por sede.</p>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Historial de Auditorías</h2>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ height: '32px' }}>
            <Plus size={16} />
            Nueva Auditoría
          </button>
        </div>

        {audits.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#cbd5e1' }}>
              <ClipboardCheck size={48} />
            </div>
            <p className="text-muted">No hay auditorías registradas en el sistema.</p>
            <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>Inicia una nueva auditoría para realizar un conteo físico y ajustar el sistema.</p>
            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setIsModalOpen(true)}>Iniciar Auditoría</button>
          </div>
        ) : (
          <div className="table-container" style={{ flex: 1, border: 'none', borderRadius: 0 }}>
             <table className="table" style={{ width: '100%' }}>
               <thead>
                 <tr>
                   <th style={{ width: '80px' }}># ID</th>
                   <th style={{ width: '200px' }}>Sede</th>
                   <th style={{ width: '200px' }}>Fecha y Hora</th>
                   <th>Estado</th>
                   <th style={{ width: '120px', textAlign: 'center' }}>Acción</th>
                 </tr>
               </thead>
               <tbody>
                 {audits.map(audit => (
                   <tr key={audit.id}>
                     <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>AUD-{String(audit.id).padStart(4, '0')}</td>
                     <td style={{ fontWeight: 500 }}><MapPin size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }}/> {audit.location}</td>
                     <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={14} className="text-muted" />
                          <span>{format(new Date(audit.date), "dd MMM yyyy", { locale: es })}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <Clock size={12} />
                          <span>{format(new Date(audit.date), "HH:mm")} hrs</span>
                        </div>
                     </td>
                     <td>
                        {audit.status === 'completed' ? (
                          <span className="badge badge-success"><CheckCircle size={12} style={{ marginRight: '4px' }}/> Completada</span>
                        ) : (
                          <span className="badge badge-warning">En progreso</span>
                        )}
                     </td>
                     <td style={{ textAlign: 'center' }}>
                         <button 
                           className={`btn ${audit.status === 'completed' ? 'btn-secondary' : 'btn-primary'}`} 
                           style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                           onClick={() => navigate(`/audits/${audit.id}`)}
                         >
                           {audit.status === 'completed' ? 'Ver Resultados' : 'Continuar'}
                         </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Iniciar Auditoría</h2>
              <button className="btn btn-secondary" style={{ padding: '0.25rem', border: 'none' }} onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleStartAudit}>
              <div className="form-group">
                <label className="form-label">Sede a Auditar</label>
                <select 
                  className="form-control" 
                  required 
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="">Seleccione una sede...</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>
                  Al iniciar, el sistema tomará una "foto" del inventario actual en esta sede para compararlo con el conteo físico.
                </p>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={!selectedLocation}>Comenzar Conteo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
