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
  const { startAudit } = useInventory();

  const handleStartAudit = async (e) => {
    e.preventDefault();
    try {
      const auditId = await startAudit();
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
                     <td style={{ fontWeight: 500 }}><MapPin size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--primary-color)' }}/> Global</td>
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
          <div className="modal-content" style={{ maxWidth: '450px', padding: 0, borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardCheck size={20} className="text-primary" />
                Iniciar Nueva Auditoría
              </h2>
              <button className="btn btn-secondary" style={{ padding: '0.25rem', border: 'none', boxShadow: 'none' }} onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleStartAudit} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                  Estás a punto de iniciar un conteo <strong>Global</strong> de inventario.
                </p>
                <div style={{ backgroundColor: '#fff8f1', border: '1px solid #ffd8b4', borderRadius: '6px', padding: '0.75rem', fontSize: '0.875rem', color: '#b45309' }}>
                  <strong>Importante:</strong> Al iniciar, el sistema tomará la existencia esperada de todos los productos en todas las sedes. Asegúrate de que no se estén realizando entradas o salidas al mismo tiempo.
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Comenzar Conteo Global</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
