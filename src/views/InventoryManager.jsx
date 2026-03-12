import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, Search, MapPin, Upload } from 'lucide-react';
import { LOCATIONS, getInitialLocations } from '../db/database';
import ImportModal from '../components/ImportModal';

const TIPOS_ADQUISICION = ['COMPRA', 'DONACIÓN', 'COMODATO', 'TRANSFERENCIA', 'PENDIENTE'];

const emptyForm = () => ({
  name: '',
  sku: '',           // Número de Inventario
  marca: '',
  modelo: '',
  serie: '',
  proveedor: '',
  tipoAdquisicion: 'COMPRA',
  fechaAdquisicion: '',
  responsable: '',
  unidadAdministrativa: '',
  valorEnLibros: '',
  photo: null,
  locations: getInitialLocations()
});

export default function InventoryManager() {
  const { products, addProduct, updateProduct, deleteProduct, getTotalStock } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [isImportOpen, setIsImportOpen] = useState(false);
  const fileInputRef = useRef(null);

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const openModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        marca: product.marca || '',
        modelo: product.modelo || '',
        serie: product.serie || '',
        proveedor: product.proveedor || '',
        tipoAdquisicion: product.tipoAdquisicion || 'COMPRA',
        fechaAdquisicion: product.fechaAdquisicion || '',
        responsable: product.responsable || '',
        unidadAdministrativa: product.unidadAdministrativa || '',
        valorEnLibros: product.valorEnLibros || '',
        photo: product.photo || null,
        locations: product.locations || getInitialLocations()
      });
    } else {
      setEditingId(null);
      setFormData(emptyForm());
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleLocationChange = (loc, prop, val) => {
    const num = parseInt(val) || 0;
    setFormData(prev => ({
      ...prev,
      locations: {
        ...prev.locations,
        [loc]: { ...prev.locations[loc], [prop]: num > 0 ? num : 0 }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateProduct(editingId, formData);
    } else {
      await addProduct(formData);
    }
    closeModal();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Confirmas la eliminación de este registro? Se eliminarán también sus trazas en la bitácora.')) {
      await deleteProduct(id);
    }
  };

  const filteredProducts = products.filter(p =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.marca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.responsable || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.unidadAdministrativa || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ─── Sección del formulario ─── */
  const SectionTitle = ({ children }) => (
    <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
      {children}
    </div>
  );

  const Field = ({ label, required, children }) => (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label className="form-label">{label} {required && <span style={{ color: 'var(--error-color)' }}>*</span>}</label>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Catálogo Maestro de Activos</h1>
        <p className="text-sm text-muted">Registro oficial de bienes patrimoniales por sede y responsable de resguardo.</p>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
            <div style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
              <Search size={16} />
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por descripción, nº inventario, marca, responsable..."
              style={{ paddingLeft: '2rem', height: '32px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsImportOpen(true)} style={{ height: '32px' }}>
              <Upload size={16} /> Importar
            </button>
            <button className="btn btn-primary" onClick={() => openModal()} style={{ height: '32px' }}>
              <Plus size={16} /> Nuevo Registro
            </button>
          </div>
        </div>

        {/* DataGrid */}
        {products.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p className="text-muted">El catálogo está vacío. Comienza creando el primer registro.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => openModal()}>Crear Registro</button>
          </div>
        ) : (
          <div className="table-container" style={{ flex: 1, border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '48px', padding: '0.5rem' }}></th>
                  <th style={{ width: '130px' }}>Nº Inventario</th>
                  <th>Descripción / Marca / Modelo</th>
                  <th style={{ width: '160px' }}>Responsable</th>
                  <th style={{ width: '180px' }}>Unidad Administrativa</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>Total</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const total = getTotalStock(p);
                  const isExpanded = expandedId === p.id;
                  return (
                    <React.Fragment key={p.id}>
                      <tr style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#f8fafc' : 'transparent' }} onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                        <td style={{ padding: '0.25rem 0.5rem', textAlign: 'center' }}>
                          {p.photo ? (
                            <div style={{ width: 32, height: 32, borderRadius: 4, overflow: 'hidden', backgroundColor: '#e2e8f0', margin: '0 auto', border: '1px solid var(--border-color)' }}>
                              <img src={p.photo} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: 4, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', margin: '0 auto', border: '1px solid var(--border-color)' }}>
                              <ImageIcon size={14} />
                            </div>
                          )}
                        </td>
                        <td className="text-muted text-sm" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{p.sku || 'S/N'}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{p.name}</div>
                          {(p.marca || p.modelo) && (
                            <div className="text-xs text-muted">{[p.marca, p.modelo].filter(Boolean).join(' · ')}</div>
                          )}
                        </td>
                        <td className="text-sm">{p.responsable || <span className="text-muted" style={{ fontStyle: 'italic' }}>S/N</span>}</td>
                        <td className="text-sm text-muted" style={{ fontSize: '0.8rem' }}>{p.unidadAdministrativa || '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 600, color: total === 0 ? 'var(--error-color)' : 'var(--text-primary)' }}>{total}</span>
                          <span className="text-xs text-muted" style={{ display: 'block', marginTop: '-2px' }}>
                            en {LOCATIONS.filter(l => (p.locations?.[l]?.funcional + p.locations?.[l]?.no_funcional) > 0).length} sedes
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                            <button className={`btn ${isExpanded ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.25rem', height: '28px', fontSize: '0.75rem' }} onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                              <MapPin size={14} style={{ marginRight: '4px' }} /> Sedes
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem', height: '28px', border: 'none', boxShadow: 'none' }} onClick={() => openModal(p)} title="Editar">
                              <Edit2 size={14} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem', height: '28px', border: 'none', boxShadow: 'none', color: 'var(--error-color)' }} onClick={() => handleDelete(p.id)} title="Eliminar">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {isExpanded && p.locations && (
                        <tr>
                          <td colSpan="7" style={{ padding: 0, border: 'none' }}>
                            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                              {/* Extra fields info */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                                {p.serie && <div><span className="text-muted">Serie: </span><strong>{p.serie}</strong></div>}
                                {p.proveedor && <div><span className="text-muted">Proveedor: </span><strong>{p.proveedor}</strong></div>}
                                {p.tipoAdquisicion && <div><span className="text-muted">Adquisición: </span><strong>{p.tipoAdquisicion}</strong></div>}
                                {p.fechaAdquisicion && <div><span className="text-muted">Fecha: </span><strong>{p.fechaAdquisicion}</strong></div>}
                                {p.valorEnLibros !== undefined && p.valorEnLibros !== '' && <div><span className="text-muted">Valor en libros: </span><strong>${Number(p.valorEnLibros).toFixed(2)}</strong></div>}
                              </div>
                              <h4 className="text-sm" style={{ marginBottom: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={14} /> Distribución Física por Sede
                              </h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                {LOCATIONS.map(loc => {
                                  const func = p.locations[loc]?.funcional || 0;
                                  const noFunc = p.locations[loc]?.no_funcional || 0;
                                  const totalLoc = func + noFunc;
                                  if (totalLoc === 0) return null;
                                  return (
                                    <div key={loc} style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '0.75rem' }}>
                                      <div style={{ fontWeight: 500, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{loc}</div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                        <span className="text-muted">Total:</span><span style={{ fontWeight: 600 }}>{totalLoc}</span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                        <span style={{ color: 'var(--success-color)' }}>● Funcionales:</span><span>{func}</span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                        <span style={{ color: 'var(--error-color)' }}>● Dañados/Mto:</span><span>{noFunc}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No se encontraron activos que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: 0, borderRadius: 'var(--border-radius-lg)', display: 'flex', flexDirection: 'column', maxWidth: '860px', width: '95%' }}>
            {/* Header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: 'var(--border-radius-lg)', borderTopRightRadius: 'var(--border-radius-lg)' }}>
              <h2 style={{ fontSize: '1.125rem' }}>{editingId ? 'Editar Registro de Activo' : 'Nuevo Registro de Activo'}</h2>
              <button className="btn btn-secondary" style={{ padding: '0.375rem', border: 'none', boxShadow: 'none' }} onClick={closeModal}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '75vh' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>

                {/* ── Sección 1: Identidad del Activo ── */}
                <div>
                  <SectionTitle>1. Datos de Identidad del Activo</SectionTitle>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: '1.5rem' }}>
                    {/* Left */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                      <Field label="Descripción" required>
                        <input required autoFocus type="text" className="form-control" value={formData.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Escritorio de madera color nogal, 3 gavetas" />
                      </Field>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <Field label="Marca">
                          <input type="text" className="form-control" value={formData.marca} onChange={e => set('marca', e.target.value)} placeholder="Ej: Dell, HP, Steelcase..." />
                        </Field>
                        <Field label="Modelo">
                          <input type="text" className="form-control" value={formData.modelo} onChange={e => set('modelo', e.target.value)} placeholder="Ej: OptiPlex 7090" />
                        </Field>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <Field label="Número de Serie">
                          <input type="text" className="form-control" value={formData.serie} onChange={e => set('serie', e.target.value)} placeholder="Nº de serie del fabricante" />
                        </Field>
                        <Field label="Número de Inventario">
                          <input type="text" className="form-control" value={formData.sku} onChange={e => set('sku', e.target.value)} placeholder="Ej: 5191-0000734 055" />
                        </Field>
                      </div>
                    </div>

                    {/* Right — Photo */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label" style={{ marginBottom: '0.25rem' }}>Evidencia Fotográfica</label>
                      <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageUpload} />
                      <div className="image-upload-wrapper" onClick={() => fileInputRef.current?.click()} style={{ flex: 1, minHeight: '110px' }}>
                        {formData.photo ? (
                          <img src={formData.photo} alt="Preview" className="image-preview" />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
                            <ImageIcon size={24} style={{ marginBottom: '0.25rem', opacity: 0.5 }} />
                            <span className="text-xs">Adjuntar foto</span>
                          </div>
                        )}
                      </div>
                      {formData.photo && (
                        <button type="button" className="btn btn-secondary text-xs" style={{ marginTop: '0.5rem', alignSelf: 'center', border: 'none', boxShadow: 'none' }} onClick={() => set('photo', null)}>
                          Quitar imagen
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />

                {/* ── Sección 2: Adquisición ── */}
                <div>
                  <SectionTitle>2. Datos de Adquisición</SectionTitle>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
                    <Field label="Tipo de Adquisición">
                      <select className="form-control" value={formData.tipoAdquisicion} onChange={e => set('tipoAdquisicion', e.target.value)}>
                        {TIPOS_ADQUISICION.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Proveedor">
                      <input type="text" className="form-control" value={formData.proveedor} onChange={e => set('proveedor', e.target.value)} placeholder="Nombre del proveedor" />
                    </Field>
                    <Field label="Fecha de Adquisición">
                      <input type="date" className="form-control" value={formData.fechaAdquisicion} onChange={e => set('fechaAdquisicion', e.target.value)} />
                    </Field>
                    <Field label="Valor en Libros ($)">
                      <input type="number" min="0" step="0.01" className="form-control" value={formData.valorEnLibros} onChange={e => set('valorEnLibros', e.target.value)} placeholder="0.00" />
                    </Field>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />

                {/* ── Sección 3: Resguardo ── */}
                <div>
                  <SectionTitle>3. Resguardo y Unidad Administrativa</SectionTitle>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <Field label="Responsable del Resguardo">
                      <input type="text" className="form-control" value={formData.responsable} onChange={e => set('responsable', e.target.value)} placeholder="Nombre completo del resguardante" />
                    </Field>
                    <Field label="Unidad Administrativa">
                      <input type="text" className="form-control" value={formData.unidadAdministrativa} onChange={e => set('unidadAdministrativa', e.target.value)} placeholder="Ej: Dirección de Seguridad Pública" />
                    </Field>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />

                {/* ── Sección 4: Inventario por Sede ── */}
                <div>
                  <SectionTitle>4. {editingId ? 'Ajuste de Existencias por Sede' : 'Inventario Físico Inicial'}</SectionTitle>
                  <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>Unidades presentes en cada sede, clasificadas por estado operativo.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {LOCATIONS.map(loc => (
                      <div key={loc} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '1rem', backgroundColor: '#fafafa' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>{loc}</div>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span className="text-sm" style={{ color: 'var(--success-color)' }}>Funcionales:</span>
                            <input type="number" min="0" className="form-control" style={{ width: '80px', height: '28px', padding: '0.25rem' }} value={formData.locations[loc]?.funcional || ''} onChange={e => handleLocationChange(loc, 'funcional', e.target.value)} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span className="text-sm" style={{ color: 'var(--error-color)' }}>No funcionales:</span>
                            <input type="number" min="0" className="form-control" style={{ width: '80px', height: '28px', padding: '0.25rem' }} value={formData.locations[loc]?.no_funcional || ''} onChange={e => handleLocationChange(loc, 'no_funcional', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Guardar Cambios' : 'Registrar en Catálogo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      <div className="fab mobile-toggle" onClick={() => openModal()}>
        <Plus size={24} />
      </div>

      {/* Import Modal */}
      {isImportOpen && (
        <ImportModal
          onClose={() => { setIsImportOpen(false); }}
          onImport={addProduct}
        />
      )}
    </div>
  );
}
