import { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Plus, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Wrench, X, Filter, Search } from 'lucide-react';
import { LOCATIONS } from '../db/database';

export default function Transactions() {
  const { transactions, products, addTransaction } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    productId: '',
    type: 'ENTRADA',
    location: '',
    targetLocation: '',
    condition: 'funcional',
    quantity: '',
    date: '', 
    reason: ''
  });

  const [error, setError] = useState('');

  const openModal = () => {
    setError('');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const localNow = now.toISOString().slice(0, 16);

    setFormData({
      productId: '',
      type: 'ENTRADA',
      location: '',
      targetLocation: '',
      condition: 'funcional',
      quantity: '',
      date: localNow,
      reason: ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const customDateISO = new Date(formData.date).toISOString();
      await addTransaction(
        formData.productId, 
        formData.type, 
        formData.quantity, 
        formData.reason, 
        customDateISO,
        formData.location,
        formData.condition,
        formData.type === 'TRANSFERENCIA' ? formData.targetLocation : null
      );
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (tx.reason && tx.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Bitácora de Movimientos</h1>
          <p className="text-sm text-muted">Registro histórico de reabastecimiento, asignaciones, transferencias y mermas.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Toolbar */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <div style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <Search size={16} />
              </div>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Buscar por equipo o referencia..." 
                style={{ paddingLeft: '2rem', height: '32px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary" style={{ padding: '0 0.5rem', height: '32px' }}>
              <Filter size={16} />
            </button>
          </div>
          
          <button className="btn btn-primary" onClick={openModal} style={{ height: '32px' }}>
            <Plus size={16} />
            Registrar Movimiento
          </button>
        </div>

        {/* DataGrid */}
        {transactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p className="text-muted">No existen operaciones registradas en el sistema todavía.</p>
          </div>
        ) : (
          <div className="table-container" style={{ flex: 1, border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '140px' }}>Fecha</th>
                  <th style={{ width: '110px' }}>Operación</th>
                  <th style={{ width: '150px' }}>Sede (Origen)</th>
                  <th>Identificador / Activo</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Var.</th>
                  <th>Estado / Concepto</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="text-muted text-sm">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{new Date(tx.date).toLocaleDateString()}</span>
                        <span style={{ fontSize: '0.75rem' }}>{new Date(tx.date).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                         tx.type === 'ENTRADA' ? 'badge-success' : 
                         tx.type === 'SALIDA' ? 'badge-error' :
                         tx.type === 'TRANSFERENCIA' ? 'badge-warning' : 'badge-neutral'
                      }`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}>
                        {tx.type === 'ENTRADA' && <ArrowUpRight size={12} />}
                        {tx.type === 'SALIDA' && <ArrowDownRight size={12} />}
                        {tx.type === 'TRANSFERENCIA' && <ArrowRightLeft size={12} />}
                        {tx.type === 'CAMBIO_ESTADO' && <Wrench size={12} />}
                        <span style={{ fontSize: '0.7rem'}}>{tx.type}</span>
                      </span>
                    </td>
                    <td className="text-sm">
                        <div style={{ fontWeight: 500 }}>{tx.location}</div>
                        {tx.type === 'TRANSFERENCIA' && (
                            <div className="text-muted text-xs">➔ a: {tx.targetLocation}</div>
                        )}
                    </td>
                    <td style={{ fontWeight: 500 }}>{tx.productName}</td>
                    <td style={{ fontWeight: 600, textAlign: 'right', color: tx.type === 'ENTRADA' ? 'var(--success-color)' : (tx.type === 'SALIDA' ? 'var(--text-primary)' : 'var(--text-secondary)') }}>
                      {tx.type === 'ENTRADA' ? '+' : (tx.type === 'SALIDA' ? '-' : '')}{tx.quantity}
                    </td>
                    <td className="text-sm">
                      <div style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tx.condition === 'funcional' ? 'var(--success-color)' : 'var(--error-color)', marginRight: '6px' }} title={tx.condition}></div>
                      <span className="text-muted">{tx.reason || <span style={{ fontStyle: 'italic', color: 'var(--border-color)' }}>Sin referencia</span>}</span>
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
          <div className="modal-content" style={{ padding: 0, borderRadius: 'var(--border-radius-lg)', maxWidth: '600px', width: '90%' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: 'var(--border-radius-lg)', borderTopRightRadius: 'var(--border-radius-lg)' }}>
              <h2 style={{ fontSize: '1.125rem' }}>Registro de Movimiento Físico</h2>
              <button className="btn btn-secondary" style={{ padding: '0.375rem', border: 'none', boxShadow: 'none' }} onClick={closeModal}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
              
              {error && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', borderRadius: 'var(--border-radius-sm)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                   {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Movimiento <span style={{color: 'var(--error-color)'}}>*</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', backgroundColor: formData.type === 'ENTRADA' ? 'var(--success-bg)' : 'white' }}>
                      <input type="radio" name="type" value="ENTRADA" checked={formData.type === 'ENTRADA'} onChange={e => setFormData({...formData, type: e.target.value})} style={{ accentColor: 'var(--success-color)' }} />
                      <span className="text-sm" style={{ fontWeight: 500 }}><ArrowUpRight size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Entrada (Ingreso/Compra)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', backgroundColor: formData.type === 'SALIDA' ? 'var(--error-bg)' : 'white' }}>
                      <input type="radio" name="type" value="SALIDA" checked={formData.type === 'SALIDA'} onChange={e => setFormData({...formData, type: e.target.value})} style={{ accentColor: 'var(--error-color)' }} />
                      <span className="text-sm" style={{ fontWeight: 500 }}><ArrowDownRight size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Salida (Asignación/Baja)</span>
                    </label>
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', backgroundColor: formData.type === 'TRANSFERENCIA' ? 'var(--warning-bg)' : 'white' }}>
                      <input type="radio" name="type" value="TRANSFERENCIA" checked={formData.type === 'TRANSFERENCIA'} onChange={e => setFormData({...formData, type: e.target.value})} style={{ accentColor: 'var(--warning-color)' }} />
                      <span className="text-sm" style={{ fontWeight: 500 }}><ArrowRightLeft size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Transferir Sede</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', backgroundColor: formData.type === 'CAMBIO_ESTADO' ? 'var(--bg-color)' : 'white' }}>
                      <input type="radio" name="type" value="CAMBIO_ESTADO" checked={formData.type === 'CAMBIO_ESTADO'} onChange={e => setFormData({...formData, type: e.target.value})} style={{ accentColor: 'var(--text-primary)' }} />
                      <span className="text-sm" style={{ fontWeight: 500 }}><Wrench size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Activar/Desactivar Mto.</span>
                    </label>

                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Identificador del Activo <span style={{color: 'var(--error-color)'}}>*</span></label>
                  <select required className="form-control" value={formData.productId} onChange={e => setFormData({...formData, productId: Number(e.target.value)})}>
                    <option value="">Buscar en Catálogo...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.sku ? `[${p.sku}] ` : ''}{p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: formData.type === 'TRANSFERENCIA' ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{formData.type === 'TRANSFERENCIA' ? 'Sede Origen' : 'Sede de Operación'} <span style={{color: 'var(--error-color)'}}>*</span></label>
                            <select required className="form-control" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                                <option value="">Seleccione Sede...</option>
                                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        
                        {formData.type === 'TRANSFERENCIA' && (
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Sede Destino <span style={{color: 'var(--error-color)'}}>*</span></label>
                                <select required className="form-control" value={formData.targetLocation} onChange={e => setFormData({...formData, targetLocation: e.target.value})}>
                                    <option value="">Transferir a...</option>
                                    {LOCATIONS.filter(l => l !== formData.location).map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Cantidad a Afectar <span style={{color: 'var(--error-color)'}}>*</span></label>
                          <input required type="number" min="1" className="form-control" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                        </div>
                        
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Estado Físico Impactado <span style={{color: 'var(--error-color)'}}>*</span></label>
                          <select required className="form-control" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                            <option value="funcional">Funcional / Bueno</option>
                            <option value="no_funcional">Dañado / Mantenimiento</option>
                          </select>
                          {formData.type === 'CAMBIO_ESTADO' && (
                             <span className="text-xs text-muted" style={{ display: 'block', marginTop: '4px' }}>Se convertirá al estado opuesto.</span>
                          )}
                        </div>
                    </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha y Hora Real de Operación <span style={{color: 'var(--error-color)'}}>*</span></label>
                  <input required type="datetime-local" className="form-control" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Concepto / Responsable (Empleado) / Expediente</label>
                  <input type="text" className="form-control" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Ej: Ticket #4521, Enviado a RMA, Asignado a Ing. López..." />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '150px' }}>
                  Aceptar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
