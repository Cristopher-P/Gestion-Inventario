import React, { useState, useEffect, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, AlertTriangle, Search, Filter } from 'lucide-react';

const STATUS_CONFIG = {
  null:              { label: 'Sin revisar',        color: 'var(--text-secondary)', bg: 'transparent',   border: '#d1d5db' },
  found_ok:          { label: 'Encontrado ✓',       color: '#15803d',              bg: '#f0fdf4',        border: '#86efac' },
  found_damaged:     { label: 'Encontrado (Dañado)', color: '#b45309',             bg: '#fffbeb',        border: '#fcd34d' },
  missing:           { label: 'No encontrado',       color: '#dc2626',             bg: '#fff5f5',        border: '#fca5a5' },
};

export default function ActiveAudit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { audits, products, getAuditItems, saveAuditProgress, finishAudit } = useInventory();
  
  const [audit, setAudit] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const loadAudit = async () => {
      const foundAudit = audits.find(a => a.id === Number(id));
      if (!foundAudit) { navigate('/audits'); return; }
      setAudit(foundAudit);
      
      const dbItems = await getAuditItems(foundAudit.id);
      
      // Enriquecer con metadatos de producto
      const enriched = dbItems.map((item, idx) => {
        const prod = products.find(p => p.id === item.productId);
        return {
          ...item,
          productName:       prod ? prod.name        : 'Producto Eliminado',
          productSku:        prod ? prod.sku         : '',
          productMarca:      prod ? prod.marca       : '',
          productResponsable:prod ? prod.responsable : '',
          // Número de unidad secuencial por producto
          _globalIndex: idx
        };
      });

      // Agrupar por producto para asignar número de unidad dentro del grupo
      const countPerProduct = {};
      const enrichedWithSeq = enriched.map(item => {
        if (!countPerProduct[item.productId]) countPerProduct[item.productId] = 0;
        countPerProduct[item.productId]++;
        return { ...item, unitSeq: countPerProduct[item.productId] };
      });

      // Ordenar por nombre de producto, luego unidad secuencial
      enrichedWithSeq.sort((a, b) => {
        const nameCmp = (a.productName || '').localeCompare(b.productName || '');
        if (nameCmp !== 0) return nameCmp;
        return a.unitSeq - b.unitSeq;
      });

      setItems(enrichedWithSeq);
      setLoading(false);
    };

    if (audits.length > 0 && products.length > 0) {
      loadAudit();
    } else {
      const t = setTimeout(() => loadAudit(), 600);
      return () => clearTimeout(t);
    }
  }, [id, audits, products]);

  const handleSetStatus = (itemId, newStatus) => {
    if (audit?.status === 'completed') return;
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, status: newStatus } : it));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await saveAuditProgress(items.map(it => ({ id: it.id, status: it.status })));
      alert('Progreso guardado correctamente.');
    } catch { alert('Error al guardar.'); }
    finally { setSaving(false); }
  };

  const handleFinishAudit = async () => {
    const pending = items.filter(it => it.status === null).length;
    const msg = pending > 0
      ? `Hay ${pending} unidades sin revisar y se contarán como "No encontrado". ¿Continuar?`
      : '¿Finalizar la auditoría? Esto aplicará los ajustes de inventario automáticamente.';
    if (!window.confirm(msg)) return;
    
    setSaving(true);
    try {
      // Marcar nulos como missing antes de guardar
      const withDefaults = items.map(it => ({ id: it.id, status: it.status ?? 'missing' }));
      await saveAuditProgress(withDefaults);
      await finishAudit(audit.id);
      alert('Auditoría completada. Se actualizó el inventario.');
      navigate('/audits');
    } catch (e) {
      console.error(e);
      alert('Error al finalizar.');
      setSaving(false);
    }
  };

  // Estadísticas en tiempo real
  const stats = useMemo(() => ({
    total:        items.length,
    found_ok:     items.filter(i => i.status === 'found_ok').length,
    found_damaged:items.filter(i => i.status === 'found_damaged').length,
    missing:      items.filter(i => i.status === 'missing').length,
    pending:      items.filter(i => i.status === null).length,
  }), [items]);

  const filtered = useMemo(() => items.filter(it => {
    const matchSearch = (it.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (it.productSku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (it.productMarca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (it.productResponsable || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterStatus === 'all' || it.status === (filterStatus === 'null' ? null : filterStatus);
    return matchSearch && matchFilter;
  }), [items, searchTerm, filterStatus]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando auditoría...</div>;
  if (!audit)  return null;

  const isCompleted = audit.status === 'completed';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      
      {/* Header */}
      <div>
        <button 
          className="btn btn-secondary text-sm" 
          style={{ marginBottom: '0.5rem', padding: '0.25rem 0.5rem', height: 'auto', border: 'none', background: 'transparent' }}
          onClick={() => navigate('/audits')}
        >
          <ArrowLeft size={16} style={{ marginRight: '0.25rem' }}/> Volver al listado
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.375rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Auditoría Global de Existencia
              {isCompleted && <span className="badge badge-success"><CheckCircle size={12} style={{ marginRight: '3px' }}/> Finalizada</span>}
            </h1>
            <p className="text-sm text-muted">
              AUD-{String(audit.id).padStart(4, '0')} · {new Date(audit.date).toLocaleString('es-ES')} · {stats.total} unidades totales
            </p>
          </div>
          {!isCompleted && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={handleSaveDraft} disabled={saving}>
                <Save size={15}/> {saving ? 'Guardando...' : 'Guardar progreso'}
              </button>
              <button className="btn btn-primary" onClick={handleFinishAudit} disabled={saving}>
                <CheckCircle size={15}/> Finalizar y ajustar inventario
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra de progreso y stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {[
          { label: 'Sin revisar', value: stats.pending,       color: '#6b7280', bg: '#f3f4f6' },
          { label: 'Encontrado',  value: stats.found_ok,      color: '#15803d', bg: '#f0fdf4' },
          { label: 'Dañado',      value: stats.found_damaged, color: '#b45309', bg: '#fffbeb' },
          { label: 'No encontrado', value: stats.missing,     color: '#dc2626', bg: '#fff5f5' },
        ].map(stat => (
          <div key={stat.label} style={{ 
              backgroundColor: stat.bg, 
              border: `1px solid ${stat.color}30`, 
              borderRadius: '8px', 
              padding: '0.75rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.125rem'
          }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Barra de búsqueda / filtros */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar producto..."
            style={{ paddingLeft: '2rem', height: '34px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="form-control" 
          style={{ height: '34px', width: 'auto' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos ({stats.total})</option>
          <option value="null">Sin revisar ({stats.pending})</option>
          <option value="found_ok">Encontrado OK ({stats.found_ok})</option>
          <option value="found_damaged">Encontrado Dañado ({stats.found_damaged})</option>
          <option value="missing">No encontrado ({stats.missing})</option>
        </select>
      </div>

      {/* Tabla de checklist */}
      <div className="glass-panel" style={{ flex: 1, overflow: 'auto', padding: 0 }}>
        <table className="table" style={{ width: '100%', minWidth: '700px', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ backgroundColor: '#f8fafc', width: '40%' }}>Producto / Info</th>
              <th style={{ backgroundColor: '#f8fafc', width: '15%', textAlign: 'center' }}>Sede Original</th>
              <th style={{ backgroundColor: '#f8fafc', width: '15%', textAlign: 'center' }}>Estado Previo</th>
              <th style={{ backgroundColor: '#f8fafc', textAlign: 'center' }}>Marcar Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, rowIdx) => {
              const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG[null];

              return (
                <tr 
                  key={item.id}
                  style={{ 
                    backgroundColor: item.status ? cfg.bg : (rowIdx % 2 === 0 ? '#ffffff' : '#fafafa'),
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Indicador de número de unidad */}
                      <div style={{
                        minWidth: '28px', height: '28px',
                        borderRadius: '50%',
                        backgroundColor: cfg.bg || '#f1f5f9',
                        border: `2px solid ${cfg.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6875rem', fontWeight: 700, color: cfg.color
                      }}>
                        {item.unitSeq}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.productName}</div>
                        <div className="text-xs text-muted" style={{ display: 'flex', gap: '0.5rem' }}>
                          {item.productMarca && <span>{item.productMarca}</span>}
                          {item.productSku && <span>· {item.productSku}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>{item.originalLocation}</span>
                  </td>
                  
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: item.originalCondition === 'funcional' ? 'var(--success-color)' : 'var(--error-color)',
                      fontWeight: 500 
                    }}>
                      {item.originalCondition === 'funcional' ? '● Funcional' : '● No funcional'}
                    </span>
                  </td>
                  
                  <td>
                    {isCompleted ? (
                      <div style={{ textAlign: 'center', padding: '0.25rem', color: cfg.color, fontWeight: 600, fontSize: '0.875rem' }}>
                        {cfg.label}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleSetStatus(item.id, item.status === 'found_ok' ? null : 'found_ok')}
                          style={{
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            border: `1px solid ${item.status === 'found_ok' ? '#16a34a' : '#d1d5db'}`,
                            backgroundColor: item.status === 'found_ok' ? '#15803d' : 'white',
                            color: item.status === 'found_ok' ? 'white' : '#374151',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            transition: 'all 0.15s'
                          }}
                        >
                          ✓ Funcional
                        </button>
                        <button
                          onClick={() => handleSetStatus(item.id, item.status === 'found_damaged' ? null : 'found_damaged')}
                          style={{
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            border: `1px solid ${item.status === 'found_damaged' ? '#d97706' : '#d1d5db'}`,
                            backgroundColor: item.status === 'found_damaged' ? '#b45309' : 'white',
                            color: item.status === 'found_damaged' ? 'white' : '#374151',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            transition: 'all 0.15s'
                          }}
                        >
                          ⚠ Dañado
                        </button>
                        <button
                          onClick={() => handleSetStatus(item.id, item.status === 'missing' ? null : 'missing')}
                          style={{
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            border: `1px solid ${item.status === 'missing' ? '#dc2626' : '#d1d5db'}`,
                            backgroundColor: item.status === 'missing' ? '#dc2626' : 'white',
                            color: item.status === 'missing' ? 'white' : '#374151',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            transition: 'all 0.15s'
                          }}
                        >
                          ✕ No encontrado
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {items.length === 0
                    ? 'No hay unidades para auditar (el inventario está en 0).'
                    : 'No hay resultados para los filtros aplicados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
