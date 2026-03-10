import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, Search, Filter, MapPin } from 'lucide-react';
import { LOCATIONS, getInitialLocations } from '../db/database';

export default function InventoryManager() {
  const { products, addProduct, updateProduct, deleteProduct, getTotalStock } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null); // Para mostrar el acordeón de ubicaciones
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    photo: null,
    locations: getInitialLocations()
  });

  const fileInputRef = useRef(null);

  const openModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category,
        photo: product.photo || null,
        locations: product.locations || getInitialLocations()
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        sku: '',
        category: '',
        photo: null,
        locations: getInitialLocations()
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result }); // Base64
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationStockChange = (loc, prop, val) => {
      const num = parseInt(val) || 0;
      setFormData({
          ...formData,
          locations: {
              ...formData.locations,
              [loc]: {
                  ...formData.locations[loc],
                  [prop]: num > 0 ? num : 0
              }
          }
      });
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
    if(window.confirm('¿Confirmas la eliminación de este registro maestro? Se eliminarán también sus trazas en la bitácora.')) {
      await deleteProduct(id);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Catálogo Maestro de Activos</h1>
        <p className="text-sm text-muted">Gestión de identidades, clasificación y existencias por cada Sede.</p>
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
                placeholder="Buscar por descripción, código o categoría..." 
                style={{ paddingLeft: '2rem', height: '32px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary" style={{ padding: '0 0.5rem', height: '32px' }} title="Filtros avanzados">
              <Filter size={16} />
            </button>
          </div>
          
          <button className="btn btn-primary" onClick={() => openModal()} style={{ height: '32px' }}>
            <Plus size={16} />
            Nuevo Registro
          </button>
        </div>

        {/* DataGrid */}
        {products.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p className="text-muted">El catálogo está vacío. Comienza creando el primer registro de activo físico.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => openModal()}>Crear Registro</button>
          </div>
        ) : (
          <div className="table-container" style={{ flex: 1, border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '48px', padding: '0.5rem' }}></th>
                  <th style={{ width: '120px' }}>Código / SKU</th>
                  <th>Descripción del Activo</th>
                  <th style={{ width: '150px' }}>Clasificación</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>Total (Global)</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
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
                      <td className="text-muted text-sm" style={{ fontFamily: 'monospace' }}>{p.sku || 'N/A'}</td>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td><span className="badge badge-neutral">{p.category}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ 
                          fontWeight: 600, 
                          color: total === 0 ? 'var(--error-color)' : (total <= 5 ? 'var(--warning-color)' : 'var(--text-primary)') 
                        }}>
                          {total}
                        </span>
                        <span className="text-xs text-muted" style={{ display: 'block', marginTop: '-2px' }}>
                          en {LOCATIONS.filter(l => (p.locations?.[l]?.funcional + p.locations?.[l]?.no_funcional) > 0).length} sedes
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                          <button className={`btn ${isExpanded ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.25rem', height: '28px', fontSize: '0.75rem' }} onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                            <MapPin size={14} style={{ marginRight: '4px' }}/> Sedes
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
                    
                    {/* Expanded Location Details row */}
                    {isExpanded && p.locations && (
                      <tr>
                        <td colSpan="6" style={{ padding: 0, border: 'none' }}>
                           <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderBottom: '1px solid var(--border-color)', boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.02)' }}>
                              <h4 className="text-sm" style={{ marginBottom: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={14}/> Distribución Física y Estado Operativo
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
                                              <span className="text-muted">Total en sede:</span>
                                              <span style={{ fontWeight: 600 }}>{totalLoc}</span>
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                              <span style={{ color: 'var(--success-color)' }}>● Funcionales:</span>
                                              <span>{func}</span>
                                          </div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                              <span style={{ color: 'var(--error-color)' }}>● Dañados/Mto:</span>
                                              <span>{noFunc}</span>
                                          </div>
                                       </div>
                                     )
                                 })}
                              </div>
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )})}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No se encontraron activos que coincidan con la búsqueda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: 0, borderRadius: 'var(--border-radius-lg)', display: 'flex', flexDirection: 'column', maxWidth: '800px', width: '90%' }}>
            {/* ... Modal header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: 'var(--border-radius-lg)', borderTopRightRadius: 'var(--border-radius-lg)' }}>
              <h2 style={{ fontSize: '1.125rem' }}>{editingId ? 'Ficha de Activo (Edición)' : 'Registro de Nuevo Activo'}</h2>
              <button className="btn btn-secondary" style={{ padding: '0.375rem', border: 'none', boxShadow: 'none' }} onClick={closeModal}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '70vh' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                
                {/* Meta data */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Descripción del Activo <span style={{color: 'var(--error-color)'}}>*</span></label>
                        <input required autoFocus type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Monitor Dell UltraSharp 27" />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Código Interno / SKU</label>
                          <input type="text" className="form-control" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="Ej: IT-MON-045" />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Clasificación <span style={{color: 'var(--error-color)'}}>*</span></label>
                          <select required className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            <option value="">Seleccionar...</option>
                            <option value="Equipos de Cómputo">Equipos de Cómputo</option>
                            <option value="Monitores y Pantallas">Monitores y Pantallas</option>
                            <option value="Periféricos">Periféricos</option>
                            <option value="Mobiliario">Mobiliario</option>
                            <option value="Herramientas">Herramientas</option>
                            <option value="Consumibles">Consumibles</option>
                            <option value="Otros">Otros</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Photo */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label" style={{ marginBottom: '0.25rem' }}>Evidencia Fotográfica</label>
                      <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageUpload} />
                      
                      <div className="image-upload-wrapper" onClick={() => fileInputRef.current?.click()} style={{ height: '100px' }}>
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
                        <button type="button" className="btn btn-secondary text-xs" style={{ marginTop: '0.5rem', alignSelf: 'center', border: 'none', boxShadow: 'none' }} onClick={() => setFormData({...formData, photo: null})}>
                          Quitar imagen
                        </button>
                      )}
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
                
                {/* Location Stocks Matrix */}
                <div>
                   <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{editingId ? 'Ajuste Manual de Existencias' : 'Inventario Físico Inicial'}</h3>
                   <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>Introduce la cuenta de los equipos presentes en cada sede clasificados por su estado operativo actual.</p>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                       {LOCATIONS.map(loc => (
                           <div key={loc} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '1rem', backgroundColor: '#fafafa' }}>
                               <div style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>{loc}</div>
                               <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                       <span className="text-sm" style={{ color: 'var(--success-color)' }}>Funcionales:</span>
                                       <input type="number" min="0" className="form-control" style={{ width: '80px', height: '28px', padding: '0.25rem' }} value={formData.locations[loc]?.funcional || ''} onChange={e => handleLocationStockChange(loc, 'funcional', e.target.value)} />
                                   </div>
                                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                       <span className="text-sm" style={{ color: 'var(--error-color)' }}>No funcionales:</span>
                                       <input type="number" min="0" className="form-control" style={{ width: '80px', height: '28px', padding: '0.25rem' }} value={formData.locations[loc]?.no_funcional || ''} onChange={e => handleLocationStockChange(loc, 'no_funcional', e.target.value)} />
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
    </div>
  );
}
