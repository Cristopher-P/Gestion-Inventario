import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';
import { getInitialLocations, LOCATIONS } from '../db/database';

// ── Mapeo flexible de nombres de columna ──────────────────────────────────────
// Cada campo acepta múltiples variantes de encabezado (case-insensitive, sin acentos)
const COLUMN_MAP = {
  name:                 ['descripcion', 'description', 'nombre', 'activo', 'bien'],
  sku:                  ['numero de inventario', 'num inventario', 'no inventario', 'inventario', 'num_inventario', 'sku', 'codigo'],
  marca:                ['marca', 'brand', 'fabricante'],
  modelo:               ['modelo', 'model'],
  serie:                ['serie', 'num serie', 'numero de serie', 'serial', 'num_serie'],
  proveedor:            ['proveedor', 'vendor', 'proveedor_nombre'],
  tipoAdquisicion:      ['tipo adquisicion', 'tipo_adquisicion', 'adquisicion', 'tipo', 'origen'],
  fechaAdquisicion:     ['fecha adquisicion', 'fecha_adquisicion', 'fecha compra', 'fecha'],
  responsable:          ['responsable', 'resguardante', 'responsable del resguardo', 'custodio'],
  unidadAdministrativa: ['unidad administrativa', 'unidad_administrativa', 'departamento', 'area', 'unidad'],
  valorEnLibros:        ['valor en libros', 'valor_libros', 'valor', 'precio', 'costo'],
  // Inventario por sede
  c5_funcional:         ['c5 funcional', 'c5_funcional', 'funcional c5'],
  c5_no_funcional:      ['c5 no funcional', 'c5_no_funcional', 'no funcional c5'],
  sp_funcional:         ['seguridad publica funcional', 'sp funcional', 'sp_funcional'],
  sp_no_funcional:      ['seguridad publica no funcional', 'sp no funcional', 'sp_no_funcional'],
  cerity_funcional:     ['cerity funcional', 'cerity_funcional'],
  cerity_no_funcional:  ['cerity no funcional', 'cerity_no_funcional'],
};

function normalize(str) {
  return String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function detectColumns(headers) {
  const result = {};
  for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
    for (const header of headers) {
      if (aliases.includes(normalize(header))) {
        result[field] = header;
        break;
      }
    }
  }
  return result;
}

function rowToProduct(row, colMap) {
  const get = (field) => {
    const col = colMap[field];
    return col !== undefined ? (row[col] ?? '') : '';
  };

  const locs = getInitialLocations();
  locs['C5'].funcional           = parseInt(get('c5_funcional')) || 0;
  locs['C5'].no_funcional        = parseInt(get('c5_no_funcional')) || 0;
  locs['Seguridad Pública'].funcional    = parseInt(get('sp_funcional')) || 0;
  locs['Seguridad Pública'].no_funcional = parseInt(get('sp_no_funcional')) || 0;
  locs['CERITY'].funcional               = parseInt(get('cerity_funcional')) || 0;
  locs['CERITY'].no_funcional            = parseInt(get('cerity_no_funcional')) || 0;

  // Fecha: Excel puede devolver número de serie; convertir si es necesario
  let fecha = String(get('fechaAdquisicion') || '');
  if (/^\d+$/.test(fecha)) {
    // Número de serie de Excel
    const d = XLSX.SSF.parse_date_code(Number(fecha));
    if (d) fecha = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  }

  return {
    name:                 String(get('name') || '').trim(),
    sku:                  String(get('sku') || '').trim(),
    marca:                String(get('marca') || '').trim(),
    modelo:               String(get('modelo') || '').trim(),
    serie:                String(get('serie') || '').trim(),
    proveedor:            String(get('proveedor') || '').trim(),
    tipoAdquisicion:      String(get('tipoAdquisicion') || 'COMPRA').trim().toUpperCase() || 'COMPRA',
    fechaAdquisicion:     fecha,
    responsable:          String(get('responsable') || '').trim(),
    unidadAdministrativa: String(get('unidadAdministrativa') || '').trim(),
    valorEnLibros:        parseFloat(get('valorEnLibros')) || 0,
    photo:                null,
    locations:            locs,
    createdAt:            new Date().toISOString(),
    updatedAt:            new Date().toISOString(),
  };
}

export default function ImportModal({ onClose, onImport }) {
  const fileRef = useRef(null);
  const [step, setStep] = useState('upload'); // upload | preview | importing | done
  const [rows, setRows] = useState([]);
  const [colMap, setColMap] = useState({});
  const [headers, setHeaders] = useState([]);
  const [errors, setErrors] = useState([]);
  const [progress, setProgress] = useState(0);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (data.length === 0) { setErrors(['El archivo no tiene filas de datos.']); return; }

        const hdrs = Object.keys(data[0]);
        const detected = detectColumns(hdrs);
        setHeaders(hdrs);
        setColMap(detected);
        setRows(data);
        setErrors([]);
        setStep('preview');
      } catch (err) {
        setErrors([`Error al leer el archivo: ${err.message}`]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    setStep('importing');
    const products = rows.map(r => rowToProduct(r, colMap)).filter(p => p.name);
    let done = 0;
    const errs = [];
    for (const p of products) {
      try {
        await onImport(p);
      } catch (e) {
        errs.push(`Error en "${p.name}": ${e.message}`);
      }
      done++;
      setProgress(Math.round((done / products.length) * 100));
    }
    setErrors(errs);
    setStep('done');
  };

  const mappedFields = Object.entries(COLUMN_MAP)
    .filter(([f]) => colMap[f])
    .map(([f, _]) => f);

  const previewRows = rows.slice(0, 5);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: 0, borderRadius: 'var(--border-radius-lg)', maxWidth: '900px', width: '95%', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: 'var(--border-radius-lg)', borderTopRightRadius: 'var(--border-radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet size={20} style={{ color: 'var(--accent-color)' }} />
            <h2 style={{ fontSize: '1.125rem' }}>Importar desde Excel / CSV</h2>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.375rem', border: 'none', boxShadow: 'none' }} onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '75vh' }}>

          {/* ── PASO 1: Subir archivo ── */}
          {step === 'upload' && (
            <div>
              <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>
                Sube un archivo <strong>Excel (.xlsx, .xls)</strong> o <strong>CSV</strong>. La primera fila debe ser el encabezado con los nombres de columna.<br />
                <br />
                <strong>Columnas reconocidas automáticamente:</strong> Descripción, Número de Inventario, Marca, Modelo, Serie, Proveedor, Tipo de Adquisición, Fecha de Adquisición, Responsable, Unidad Administrativa, Valor en Libros.
              </p>

              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '3rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#fafafa',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-color)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <Upload size={36} style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }} />
                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Arrastra aquí tu archivo o haz clic para seleccionar</div>
                <div className="text-sm text-muted">.xlsx · .xls · .csv</div>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              </div>

              {errors.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.875rem' }}>
                  {errors.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}

              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: 'var(--border-radius-md)', border: '1px solid #bae6fd', fontSize: '0.8rem', color: '#0369a1' }}>
                💡 <strong>¿Tienes un Word?</strong> Abre el documento en Word → <em>Archivo → Guardar como → Excel (.xlsx)</em> y luego súbelo aquí.
              </div>
            </div>
          )}

          {/* ── PASO 2: Vista previa y mapeo ── */}
          {step === 'preview' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{rows.length} filas detectadas</div>
                  <div className="text-sm text-muted">
                    Columnas reconocidas: <strong style={{ color: 'var(--accent-color)' }}>{mappedFields.length}</strong> de {Object.keys(COLUMN_MAP).length} posibles
                  </div>
                </div>
                <button className="btn btn-secondary text-sm" onClick={() => { setStep('upload'); setRows([]); }}>
                  ← Cambiar archivo
                </button>
              </div>

              {/* Columnas mapeadas */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Mapeo de Columnas
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.375rem' }}>
                  {Object.entries(COLUMN_MAP).map(([field, _]) => {
                    const col = colMap[field];
                    const labels = {
                      name: 'Descripción', sku: 'Nº Inventario', marca: 'Marca', modelo: 'Modelo',
                      serie: 'Serie', proveedor: 'Proveedor', tipoAdquisicion: 'Tipo Adquisición',
                      fechaAdquisicion: 'Fecha Adquisición', responsable: 'Responsable',
                      unidadAdministrativa: 'Unidad Administrativa', valorEnLibros: 'Valor en Libros',
                      c5_funcional: 'C5 Funcional', c5_no_funcional: 'C5 No func.',
                      sp_funcional: 'S.Pública Func.', sp_no_funcional: 'S.Pública No func.',
                      cerity_funcional: 'CERITY Func.', cerity_no_funcional: 'CERITY No func.',
                    };
                    return (
                      <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.78rem', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: col ? '#f0fdf4' : '#fafafa', border: `1px solid ${col ? '#86efac' : 'var(--border-color)'}` }}>
                        {col ? <CheckCircle size={12} style={{ color: 'var(--success-color)', flexShrink: 0 }} /> : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid #d1d5db', flexShrink: 0 }} />}
                        <span style={{ color: col ? '#15803d' : 'var(--text-secondary)', fontWeight: col ? 500 : 400 }}>
                          {labels[field]}
                          {col && <span style={{ fontWeight: 400, color: '#6b7280' }}> ← {col}</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vista previa de filas */}
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Vista previa (primeras {previewRows.length} filas)
              </div>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)' }}>
                <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      {headers.map(h => (
                        <th key={h} style={{ padding: '0.375rem 0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap', fontWeight: 600, color: Object.values(colMap).includes(h) ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                          {h}
                          {Object.values(colMap).includes(h) && <span style={{ marginLeft: 4, fontSize: '0.65rem', backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '1px 4px', borderRadius: 4 }}>✓</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {headers.map(h => (
                          <td key={h} style={{ padding: '0.375rem 0.5rem', whiteSpace: 'nowrap', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {String(row[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!colMap.name && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#fffbeb', color: '#b45309', borderRadius: 'var(--border-radius-sm)', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  No se detectó la columna <strong>Descripción</strong> (requerida). Verifica que el encabezado diga "Descripcion" o "Nombre".
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                <button
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={!colMap.name}
                  title={!colMap.name ? 'Se requiere la columna Descripción' : ''}
                >
                  Importar {rows.length} registros
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 3: Importando ── */}
          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }}>Importando registros...</div>
              <div style={{ width: '100%', height: '12px', backgroundColor: '#e5e7eb', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--accent-color)', borderRadius: '99px', transition: 'width 0.3s' }} />
              </div>
              <div className="text-sm text-muted">{progress}%</div>
            </div>
          )}

          {/* ── PASO 4: Completado ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <CheckCircle size={48} style={{ color: 'var(--success-color)', marginBottom: '1rem' }} />
              <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                ¡Importación completada!
              </div>
              <div className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
                {rows.length - errors.length} registros importados correctamente.
                {errors.length > 0 && ` ${errors.length} con error.`}
              </div>
              {errors.length > 0 && (
                <div style={{ textAlign: 'left', padding: '0.75rem', backgroundColor: 'var(--error-bg)', color: 'var(--error-color)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.8rem', marginBottom: '1rem', maxHeight: '150px', overflowY: 'auto' }}>
                  {errors.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}
              <button className="btn btn-primary" onClick={onClose}>Cerrar y ver catálogo</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
