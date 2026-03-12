import { useAuth } from '../context/AuthContext';
import { Menu, Settings, LogOut } from 'lucide-react';

export default function Topbar({ toggleSidebar }) {
  const { logout } = useAuth();
  
  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          className="btn btn-secondary mobile-toggle" 
          onClick={toggleSidebar}
          style={{ padding: '0.375rem' }}
        >
          <Menu size={18} />
        </button>
        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>/ Sistema de Control Interno</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn" style={{ padding: '0.375rem', color: 'var(--text-secondary)' }} onClick={async () => {
          const { db } = await import('../db/database.js');

          const accion = window.prompt(
            'Opciones de datos de prueba:\n\n' +
            '1 → Borrar TODOS los datos del inventario\n' +
            '2 → Inyectar datos de muestra (como en hoja física)\n\n' +
            'Escribe 1 o 2:'
          );

          if (accion === '1') {
            if (window.confirm('⚠️ ¿Borrar absolutamente todos los productos, movimientos y auditorías? Esta acción no se puede deshacer.')) {
              await db.products.clear();
              await db.transactions.clear();
              await db.audits.clear();
              await db.audit_items.clear();
              alert('Base de datos limpiada. Recargando...');
              window.location.reload();
            }
          } else if (accion === '2') {
            if (!window.confirm('¿Inyectar registros de muestra basados en las hojas físicas de inventario?')) return;

            const LOCS = { 'C5': { funcional: 0, no_funcional: 0 }, 'Seguridad Pública': { funcional: 0, no_funcional: 0 }, 'CERITY': { funcional: 0, no_funcional: 0 } };
            const cloneLocs = () => JSON.parse(JSON.stringify(LOCS));

            const muestras = [
              { name: 'ESCRITORIO DE MADERA COLOR NOGAL, 3 GAVETAS', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0000734 055', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'ARCHIVERO DE ENCINO NATURAL 1/2 CANEVÁS', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0000741 713', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'LOCKER COLOR VERDE BANCO PINIENTA DE 4 C S/N', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0004458 4636', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'LOCKER COLOR VERDE BANCO PINIENTA DE 4 C S/N', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0004464 4638', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'SILLA DE MADERA COLOR CAFE', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0000467 4651', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'SILLA DE MADERA COLOR CAFE PARA SERVICIO DE 4 C S/N', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0004878 4665', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'GABINETE METALICO COLOR GRIS', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0004881 4665', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'ARCHIVERO RURAL DE 4 GAVETAS EN MADERA', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0000399 W.28', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              // Página 7
              { name: 'AIRE ACONDICIONADO MINISPLIT 12000 BTU/B F-108', marca: 'ELECTRONICA Y LINEA BLANCA', modelo: 'F-108', serie: 'S/N', sku: '5131-0013487 19311', tipoAdquisicion: 'COMPRA', proveedor: 'ELECTRONICA Y LINEA BLANCA, S.A. DE C.V.', fechaAdquisicion: '2011-03-18', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0.50, loc: 'Seguridad Pública', func: 1, noFunc: 0 },
              { name: 'SILLA DE PIEL NEGRA CON CROMO', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5151-0015503 20928', tipoAdquisicion: 'COMPRA', proveedor: 'JOSE LUIS MENA VICENCIO', fechaAdquisicion: '2013-01-21', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'Seguridad Pública', func: 1, noFunc: 0 },
              { name: 'POSTE PARA CAMARA 9 MTS INST. Y SOPORTE', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5151-0014985 20922', tipoAdquisicion: 'COMPRA', proveedor: 'JOSE LUIS MENA VICENCIO', fechaAdquisicion: '2013-01-21', responsable: 'JOSE LUIS MENA VICENCIO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'Seguridad Pública', func: 6, noFunc: 0 },
              { name: 'POSTE PARA CAMARA 9 MTS INST. Y SOPORTE', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5151-0014992 20922', tipoAdquisicion: 'COMPRA', proveedor: 'JOSE LUIS MENA VICENCIO', fechaAdquisicion: '2013-01-21', responsable: 'JOSE LUIS MENA VICENCIO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'Seguridad Pública', func: 6, noFunc: 0 },
              { name: 'POSTE PARA CAMARA 9 MTS INST. Y SOPORTE', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5151-0014999 20923', tipoAdquisicion: 'COMPRA', proveedor: 'JOSE LUIS MENA VICENCIO', fechaAdquisicion: '2013-01-21', responsable: 'JOSE LUIS MENA VICENCIO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'Seguridad Pública', func: 6, noFunc: 0 },
              { name: 'POSTE PARA CAMARA 9 MTS INST. Y SOPORTE', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5151-0015500 20925', tipoAdquisicion: 'COMPRA', proveedor: 'JOSE LUIS MENA VICENCIO', fechaAdquisicion: '2013-01-21', responsable: 'JOSE LUIS MENA VICENCIO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'Seguridad Pública', func: 6, noFunc: 0 },
              { name: 'POSTE PARA CAMARA 9 MTS INST. Y SOPORTE', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5151-0015502 20926', tipoAdquisicion: 'COMPRA', proveedor: 'JOSE LUIS MENA VICENCIO', fechaAdquisicion: '2013-01-21', responsable: 'JOSE LUIS MENA VICENCIO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'Seguridad Pública', func: 6, noFunc: 0 },
              { name: 'POSTER DESTINE JET V700 24K B-PAT', marca: 'HP', modelo: 'V700 24K', serie: '0446', tipoAdquisicion: 'COMPRA', proveedor: 'REIVAMA TRUJILLO RODRIGUEZ', fechaAdquisicion: '2011-10-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0.10, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'INC311HD824', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5131-0014825 20904', tipoAdquisicion: 'COMPRA', proveedor: 'REIVAMA TRUJILLO RODRIGUEZ', fechaAdquisicion: '2012-12-01', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
            ];

            for (const m of muestras) {
              const locs = cloneLocs();
              locs[m.loc].funcional = m.func;
              locs[m.loc].no_funcional = m.noFunc;
              const id = await db.products.add({
                name: m.name, sku: m.sku || '', marca: m.marca || '', modelo: m.modelo || '',
                serie: m.serie || '', proveedor: m.proveedor || '',
                tipoAdquisicion: m.tipoAdquisicion || 'COMPRA',
                fechaAdquisicion: m.fechaAdquisicion || '',
                responsable: m.responsable || '', unidadAdministrativa: m.unidadAdministrativa || '',
                valorEnLibros: m.valorEnLibros || 0, photo: null, locations: locs,
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
              });
              await db.transactions.add({
                productId: id, productName: m.name, type: 'ENTRADA',
                quantity: m.func + m.noFunc, location: m.loc,
                condition: 'funcional', targetLocation: null,
                reason: m.tipoAdquisicion, date: new Date(m.fechaAdquisicion || Date.now()).toISOString()
              });
            }
            alert('Datos de muestra inyectados. Recargando...');
            window.location.reload();
          }
        }}>
          <Settings size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--accent-color)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}>
            AD
          </div>
          <span className="text-sm d-sm-block" style={{ fontWeight: 500, display: 'none' }}>Admin</span>
          <button 
            className="btn" 
            style={{ padding: '0.375rem', marginLeft: '0.5rem', color: 'var(--error-color)' }}
            onClick={logout}
            title="Cerrar Sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
