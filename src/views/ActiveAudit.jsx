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
      
      // Intentar recuperar progreso de localStorage
      const localKey = `audit_progress_${id}`;
      const savedData = localStorage.getItem(localKey);
      let localParsed = null;
      if (savedData) {
        try { localParsed = JSON.parse(savedData); } catch (e) { console.error("Error parsing local audit progress", e); }
      }

      // Enriquecer con metadatos de producto
      const enriched = dbItems.map((item, idx) => {
        const prod = products.find(p => p.id === item.productId);
        const localItem = localParsed ? localParsed.find(li => li.id === item.id) : null;
        
        return {
          ...item,
          status:            localItem ? localItem.status : item.status,
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

  // Guardado automático en localStorage y debounce a base de datos
  useEffect(() => {
    if (loading || isCompleted) return;

    // Guardar en localStorage inmediatamente
    const localKey = `audit_progress_${id}`;
    localStorage.setItem(localKey, JSON.stringify(items.map(it => ({ id: it.id, status: it.status }))));

    // Debounce para guardar en la base de datos
    const timeout = setTimeout(async () => {
      setSaving(true);
      try {
        await saveAuditProgress(items.map(it => ({ id: it.id, status: it.status })));
      } catch (e) {
        console.error("Error en autosave:", e);
      } finally {
        setSaving(false);
      }
    }, 3000); // Guardar 3 segundos después del último cambio

    return () => clearTimeout(timeout);
  }, [items, id, loading]);

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
      
      // Limpiar localStorage
      localStorage.removeItem(`audit_progress_${id}`);
      
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

  const filtered = useMemo(() => items
    .filter(it => {
      const matchSearch = (it.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (it.productSku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (it.productMarca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (it.productResponsable || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = filterStatus === 'all' || it.status === (filterStatus === 'null' ? null : filterStatus);
      return matchSearch && matchFilter;
    })
    // Pending (null) first — marked items sink to the bottom
    .sort((a, b) => {
      const aPending = a.status === null ? 0 : 1;
      const bPending = b.status === null ? 0 : 1;
      return aPending - bPending;
    })
  , [items, searchTerm, filterStatus]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando auditoría...</div>;
  if (!audit)  return null;

  const isCompleted = audit.status === 'completed';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>

      {/* ── Header ── */}
      <div>
        {/* Back button — oculto en móvil (la barra inferior reemplaza la navegación) */}
        <button
          className="btn btn-secondary text-sm audit-back-btn"
          style={{ marginBottom: '0.25rem', padding: '0.25rem 0.5rem', height: 'auto', border: 'none', background: 'transparent' }}
          onClick={() => navigate('/audits')}
        >
          <ArrowLeft size={16} style={{ marginRight: '0.25rem' }}/> Volver al listado
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '1.125rem', marginBottom: '0.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              Auditoría de Existencia
              {isCompleted && <span className="badge badge-success"><CheckCircle size={12} style={{ marginRight: '3px' }}/>Finalizada</span>}
            </h1>
            <p className="text-xs text-muted">
              AUD-{String(audit.id).padStart(4, '0')} · {new Date(audit.date).toLocaleDateString('es-MX')} · {stats.total} unidades
            </p>
          </div>
          {/* Botones de acción — en desktop van aquí, en móvil se convierten en barra flotante */}
          {!isCompleted && (
            <div className="audit-header-actions" style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.625rem' }} onClick={handleSaveDraft} disabled={saving}>
                <Save size={16}/> Guardar
              </button>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.625rem' }} onClick={handleFinishAudit} disabled={saving}>
                <CheckCircle size={16}/> Finalizar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats — single row, compact on mobile ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.375rem' }}>
        {[
          { label: 'Sin revisar',   value: stats.pending,       color: '#6b7280', bg: '#f3f4f6' },
          { label: 'Encontrado',    value: stats.found_ok,      color: '#15803d', bg: '#f0fdf4' },
          { label: 'Dañado',        value: stats.found_damaged, color: '#b45309', bg: '#fffbeb' },
          { label: 'No encontrado', value: stats.missing,       color: '#dc2626', bg: '#fff5f5' },
        ].map(stat => (
          <div key={stat.label} style={{
            backgroundColor: stat.bg,
            border: `1px solid ${stat.color}30`,
            borderRadius: '8px',
            padding: '0.375rem 0.25rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.2 }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ── Búsqueda y filtro ── */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar producto..."
            style={{ paddingLeft: '2rem' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          style={{ width: 'auto', flexShrink: 0, maxWidth: '140px' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos ({stats.total})</option>
          <option value="null">Sin revisar ({stats.pending})</option>
          <option value="found_ok">OK ({stats.found_ok})</option>
          <option value="found_damaged">Dañado ({stats.found_damaged})</option>
          <option value="missing">Faltante ({stats.missing})</option>
        </select>
      </div>

      {/* ── Lista de cards ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

        {filtered.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {items.length === 0
              ? 'No hay unidades para auditar (el inventario está en 0).'
              : 'No hay resultados para los filtros aplicados.'}
          </div>
        )}

        {filtered.map((item) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG[null];

          return (
            <div
              key={item.id}
              style={{
                backgroundColor: item.status ? cfg.bg : 'white',
                border: `1.5px solid ${item.status ? cfg.border : 'var(--border-color)'}`,
                borderRadius: '10px',
                padding: '0.875rem 1rem',
                transition: 'all 0.15s',
              }}
            >
              {/* Fila superior: número + nombre + sede */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: '0.625rem' }}>
                {/* Número de unidad */}
                <div style={{
                  minWidth: '30px', height: '30px', borderRadius: '50%',
                  backgroundColor: cfg.bg || '#f1f5f9',
                  border: `2px solid ${cfg.border || '#d1d5db'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: cfg.color, flexShrink: 0,
                }}>
                  {item.unitSeq}
                </div>

                {/* Nombre y metadatos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3, wordBreak: 'break-word' }}>
                    {item.productName}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.25rem', alignItems: 'center' }}>
                    {item.productMarca && item.productMarca !== 'S/M' && (
                      <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>{item.productMarca}</span>
                    )}
                    {item.productSku && (
                      <span className="text-xs text-muted">{item.productSku}</span>
                    )}
                    <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>{item.originalLocation}</span>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 500,
                      color: item.originalCondition === 'funcional' ? 'var(--success-color)' : 'var(--error-color)',
                    }}>
                      ● {item.originalCondition === 'funcional' ? 'Funcional' : 'No func.'}
                    </span>
                  </div>
                </div>

                {/* Estado actual (si ya fue marcado) */}
                {item.status && (
                  <span style={{ fontSize: '0.7rem', color: cfg.color, fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>
                    {cfg.label}
                  </span>
                )}
              </div>

              {/* Botones de acción — 3 columnas a ancho completo */}
              {!isCompleted && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.375rem' }}>
                  {[
                    { key: 'found_ok',      label: '✓ Funcional',    activeColor: '#15803d', activeBorder: '#16a34a', activeText: 'white', inactiveText: '#374151' },
                    { key: 'found_damaged', label: '⚠ Dañado',       activeColor: '#b45309', activeBorder: '#d97706', activeText: 'white', inactiveText: '#374151' },
                    { key: 'missing',       label: '✕ No encontrado', activeColor: '#dc2626', activeBorder: '#dc2626', activeText: 'white', inactiveText: '#374151' },
                  ].map(({ key, label, activeColor, activeBorder, activeText, inactiveText }) => {
                    const isActive = item.status === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleSetStatus(item.id, isActive ? null : key)}
                        style={{
                          padding: '0.625rem 0.25rem',
                          borderRadius: '8px',
                          border: `1.5px solid ${isActive ? activeBorder : '#d1d5db'}`,
                          backgroundColor: isActive ? activeColor : 'white',
                          color: isActive ? activeText : inactiveText,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          minHeight: '44px',
                          lineHeight: 1.2,
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {isCompleted && (
                <div style={{ textAlign: 'center', padding: '0.375rem 0 0', color: cfg.color, fontWeight: 600, fontSize: '0.875rem' }}>
                  {cfg.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Barra flotante de acciones — solo visible en móvil (CSS lo controla) */}
      {!isCompleted && (
        <div className="audit-float-bar" style={{ display: 'none' }}>
          <button className="btn btn-secondary" onClick={handleSaveDraft} disabled={saving}>
            <Save size={16}/> Guardar progreso
          </button>
          <button className="btn btn-primary" onClick={handleFinishAudit} disabled={saving}>
            <CheckCircle size={16}/> Finalizar
          </button>
        </div>
      )}
    </div>
  );
}

