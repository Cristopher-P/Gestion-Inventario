import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

export default function ActiveAudit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { audits, products, getAuditItems, saveAuditProgress, finishAudit } = useInventory();
  
  const [audit, setAudit] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    const loadAudit = async () => {
      const foundAudit = audits.find(a => a.id === Number(id));
      if (!foundAudit) {
        navigate('/audits'); // not found
        return;
      }
      setAudit(foundAudit);
      
      const dbItems = await getAuditItems(foundAudit.id);
      
      // Match with product metadata
      const itemsWithMeta = dbItems.map(item => {
        const prod = products.find(p => p.id === item.productId);
        return {
          ...item,
          productName: prod ? prod.name : 'Producto Eliminado',
          productSku: prod ? prod.sku : '',
          productCategory: prod ? prod.category : ''
        };
      });
      
      // Sort alphabetically by category and name
      itemsWithMeta.sort((a,b) => {
        if(a.productCategory !== b.productCategory) return a.productCategory.localeCompare(b.productCategory);
        return a.productName.localeCompare(b.productName);
      });
      
      setItems(itemsWithMeta);
      setLoading(false);
    };
    
    if (audits.length > 0 && products.length > 0) {
      loadAudit();
    } else if (audits.length === 0 && loading === false) {
      // In case we don't have audits after waiting
      navigate('/audits');
    } else {
        // give it a bit, maybe it's still loading
        const timer = setTimeout(() => {
            if(products.length === 0 || audits.length===0){
              // if it stays 0, try to rely on direct DB hits later or just skip
              loadAudit(); 
            }
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [id, audits, products, loading, getAuditItems, navigate]);

  const handleCountChange = (itemId, type, value) => {
     if (audit.status === 'completed') return;
     
     const numVal = value === '' ? null : Number(value);
     
     setItems(prev => prev.map(it => {
       if (it.id === itemId) {
         return {
           ...it,
           [type]: numVal
         };
       }
       return it;
     }));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await saveAuditProgress(items.map(it => ({
         id: it.id,
         countedFuncional: it.countedFuncional,
         countedNoFuncional: it.countedNoFuncional
      })));
      alert("Progreso guardado correctamente.");
    } catch (e) {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleFinishAudit = async () => {
    // Check if there are uncounted items
    const uncounted = items.filter(it => it.countedFuncional === null && it.countedNoFuncional === null);
    
    if (uncounted.length > 0) {
       const confirm = window.confirm(`Hay ${uncounted.length} productos sin contar. Si finalizas, el sistema asumirá que el conteo es IGUAL a lo esperado. ¿Deseas continuar?`);
       if (!confirm) return;
    } else {
       const confirm = window.confirm("¿Estás seguro de finalizar la auditoría? Esto ajustará automáticamente el inventario global corrigiendo faltantes o sobrantes encontrados.");
       if (!confirm) return;
    }
    
    setSaving(true);
    try {
      // guardamos primero los cambios
      await saveAuditProgress(items.map(it => ({
         id: it.id,
         countedFuncional: it.countedFuncional,
         countedNoFuncional: it.countedNoFuncional
      })));
      
      await finishAudit(audit.id);
      alert("Auditoría completada exitosamente. Se generaron las transacciones de ajuste necesarias.");
      navigate('/audits');
    } catch (e) {
      alert("Error al finalizar auditoría");
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando auditoría...</div>;
  if (!audit) return null;

  const isCompleted = audit.status === 'completed';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <button 
            className="btn btn-secondary text-sm" 
            style={{ marginBottom: '0.75rem', padding: '0.25rem 0.5rem', height: 'auto', border: 'none', background: 'transparent' }}
            onClick={() => navigate('/audits')}
          >
            <ArrowLeft size={16} style={{ marginRight: '0.25rem' }}/> Volver a Listado
          </button>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Auditoría en {audit.location} 
            {isCompleted && <span className="badge badge-success" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}><CheckCircle size={12} style={{marginRight: '2px'}}/> Finalizada</span>}
          </h1>
          <p className="text-sm text-muted">ID: AUD-{String(audit.id).padStart(4, '0')} | Fecha de inicio: {new Date(audit.date).toLocaleString('es-ES')}</p>
        </div>
        
        {!isCompleted && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={handleSaveDraft} disabled={saving}>
               <Save size={16}/> {saving ? 'Guardando...' : 'Guardar Progreso'}
            </button>
            <button className="btn btn-primary" onClick={handleFinishAudit} disabled={saving}>
               <CheckCircle size={16}/> Finalizar y Ajustar
            </button>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ flex: 1, overflow: 'auto' }}>
        <table className="table" style={{ width: '100%', minWidth: '900px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th rowSpan="2" style={{ backgroundColor: '#f8fafc' }}>Producto / Categoría</th>
              <th colSpan="2" style={{ textAlign: 'center', backgroundColor: '#f1f5f9', borderBottom: '1px solid var(--border-color)' }}>Sistema (Esperado)</th>
              <th colSpan="2" style={{ textAlign: 'center', backgroundColor: '#e2e8f0', borderBottom: '1px solid var(--border-color)' }}>Físico (Conteo Real)</th>
              <th rowSpan="2" style={{ textAlign: 'center', width: '120px', backgroundColor: '#f8fafc' }}>Diferencia</th>
            </tr>
            <tr>
              <th style={{ textAlign: 'center', width: '100px', backgroundColor: '#f8fafc' }}><span style={{ color: 'var(--success-color)' }}>Funcional</span></th>
              <th style={{ textAlign: 'center', width: '100px', backgroundColor: '#f8fafc' }}><span style={{ color: 'var(--error-color)' }}>No Funcional</span></th>
              <th style={{ textAlign: 'center', width: '120px', backgroundColor: '#f8fafc' }}><span style={{ color: 'var(--success-color)' }}>Funcional</span></th>
              <th style={{ textAlign: 'center', width: '120px', backgroundColor: '#f8fafc' }}><span style={{ color: 'var(--error-color)' }}>No Funcional</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
               // Cálculos de diferencia
               const cFunc = item.countedFuncional !== null ? item.countedFuncional : item.expectedFuncional;
               const cNoFunc = item.countedNoFuncional !== null ? item.countedNoFuncional : item.expectedNoFuncional;
               
               const diffFunc = cFunc - item.expectedFuncional;
               const diffNoFunc = cNoFunc - item.expectedNoFuncional;
               
               const netDiff = diffFunc + diffNoFunc;
               let diffIndicator = null;
               
               if (netDiff < 0) {
                  diffIndicator = <span style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontWeight: 600 }}><AlertTriangle size={14}/> Faltante ({Math.abs(netDiff)})</span>;
               } else if (netDiff > 0) {
                  diffIndicator = <span style={{ color: 'var(--warning-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontWeight: 600 }}><AlertCircle size={14}/> Sobrante (+{netDiff})</span>;
               } else if (item.countedFuncional !== null || item.countedNoFuncional !== null || isCompleted) {
                  diffIndicator = <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontWeight: 600 }}><CheckCircle size={14}/> Cuadra</span>;
               } else {
                  diffIndicator = <span className="text-muted text-sm">-</span>;
               }

               return (
                 <tr key={item.id} style={{ backgroundColor: (item.countedFuncional!==null||item.countedNoFuncional!==null||isCompleted) ? (netDiff !== 0 ? '#fff5f5' : '#f0fdf4') : 'transparent' }}>
                   <td>
                     <div style={{ fontWeight: 500 }}>{item.productName}</div>
                     <div className="text-xs text-muted" style={{ display: 'flex', gap: '0.5rem' }}>
                       <span>{item.productCategory}</span>
                       {item.productSku && <span>| {item.productSku}</span>}
                     </div>
                   </td>
                   
                   <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.expectedFuncional}</td>
                   <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.expectedNoFuncional}</td>
                   
                   <td style={{ textAlign: 'center' }}>
                     {isCompleted ? (
                        <div style={{ fontWeight: 600, color: item.countedFuncional !== item.expectedFuncional ? 'var(--primary-color)' : 'inherit' }}>
                          {item.countedFuncional !== null ? item.countedFuncional : item.expectedFuncional}
                        </div>
                     ) : (
                        <input 
                          type="number" 
                          min="0"
                          className="form-control" 
                          style={{ width: '80px', textAlign: 'center', margin: '0 auto', borderColor: (item.countedFuncional !== null && item.countedFuncional !== item.expectedFuncional) ? 'var(--primary-color)' : '' }}
                          placeholder={item.expectedFuncional}
                          value={item.countedFuncional === null ? '' : item.countedFuncional}
                          onChange={e => handleCountChange(item.id, 'countedFuncional', e.target.value)}
                        />
                     )}
                   </td>
                   
                   <td style={{ textAlign: 'center' }}>
                     {isCompleted ? (
                        <div style={{ fontWeight: 600, color: item.countedNoFuncional !== item.expectedNoFuncional ? 'var(--primary-color)' : 'inherit' }}>
                          {item.countedNoFuncional !== null ? item.countedNoFuncional : item.expectedNoFuncional}
                        </div>
                     ) : (
                        <input 
                          type="number" 
                          min="0"
                          className="form-control" 
                          style={{ width: '80px', textAlign: 'center', margin: '0 auto', borderColor: (item.countedNoFuncional !== null && item.countedNoFuncional !== item.expectedNoFuncional) ? 'var(--primary-color)' : '' }}
                          placeholder={item.expectedNoFuncional}
                          value={item.countedNoFuncional === null ? '' : item.countedNoFuncional}
                          onChange={e => handleCountChange(item.id, 'countedNoFuncional', e.target.value)}
                        />
                     )}
                   </td>
                   
                   <td style={{ textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      {diffIndicator}
                   </td>
                 </tr>
               );
            })}
            
            {items.length === 0 && (
              <tr>
                 <td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">No hay productos registrados en el sistema para contar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
