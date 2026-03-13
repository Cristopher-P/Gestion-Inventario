import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { Menu, Settings, LogOut } from 'lucide-react';

export default function Topbar({ toggleSidebar }) {
  const { logout } = useAuth();
  const { addProduct, addTransaction, refreshData } = useInventory();
  
  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          className="btn btn-secondary mobile-toggle topbar-sidebar-toggle" 
          onClick={toggleSidebar}
          style={{ padding: '0.375rem' }}
        >
          <Menu size={18} />
        </button>
        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>/ Sistema de Control Interno</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn" style={{ padding: '0.375rem', color: 'var(--text-secondary)' }} onClick={async () => {
          const accion = window.prompt(
            'Opciones de datos de prueba (SUPABASE):\n\n' +
            '1 → Borrar TODOS los datos del inventario\n' +
            '2 → Inyectar datos de muestra (como en hoja física)\n\n' +
            'Escribe 1 o 2:'
          );

          if (accion === '1') {
            if (window.confirm('⚠️ ¿Borrar absolutamente todos los productos, movimientos y auditorías en la NUBE? Esta acción no se puede deshacer.')) {
              const { supabase } = await import('../lib/supabase.js');
              await supabase.from('products').delete().neq('id', 0);
              await supabase.from('transactions').delete().neq('id', 0);
              await supabase.from('audits').delete().neq('id', 0);
              alert('Base de datos de Supabase limpiada. Recargando...');
              window.location.reload();
            }
          } else if (accion === '2') {
            if (!window.confirm('¿Inyectar registros de muestra en la NUBE?')) return;

            const LOCS = { 'C5': { funcional: 0, no_funcional: 0 }, 'Seguridad Pública': { funcional: 0, no_funcional: 0 }, 'CERITY': { funcional: 0, no_funcional: 0 } };
            
            const muestras = [
              { name: 'ESCRITORIO DE MADERA COLOR NOGAL, 3 GAVETAS', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0000734 055', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'ARCHIVERO DE ENCINO NATURAL 1/2 CANEVÁS', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0000741 713', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'LOCKER COLOR VERDE BANCO PINIENTA DE 4 C S/N', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0004458 4636', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'LOCKER COLOR VERDE BANCO PINIENTA DE 4 C S/N', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0004464 4638', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'SILLA DE MADERA COLOR CAFE', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0000467 4651', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'SILLA DE MADERA COLOR CAFE PARA SERVICIO DE 4 C S/N', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0004878 4665', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'GABINETE METALICO COLOR GRIS', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0004881 4665', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'ARCHIVERO RURAL DE 4 GAVETAS EN MADERA', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5191-0000399 W.28', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '1999-02-14', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'C5', func: 1, noFunc: 0 },
              { name: 'AIRE ACONDICIONADO MINISPLIT 12000 BTU/B', marca: 'ELECTRONICA Y LINEA BLANCA', modelo: 'F-108', serie: 'S/N', sku: '5131-0013487 19311', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '2011-03-18', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0.50, loc: 'Seguridad Pública', func: 1, noFunc: 0 },
              { name: 'SILLA DE PIEL NEGRA CON CROMO', marca: 'S/M', modelo: 'S/M', serie: 'S/N', sku: '5151-0015503 20928', tipoAdquisicion: 'COMPRA', proveedor: 'S/N', fechaAdquisicion: '2013-01-21', responsable: 'CARLOS GONZALEZ CRESPO', unidadAdministrativa: 'DIRECCIÓN DE SEGURIDAD PÚBLICA', valorEnLibros: 0, loc: 'Seguridad Pública', func: 1, noFunc: 0 },
            ];

            for (const m of muestras) {
              const locs = JSON.parse(JSON.stringify(LOCS));
              locs[m.loc].funcional = m.func;
              locs[m.loc].no_funcional = m.noFunc;
              
              await addProduct({
                ...m,
                locations: locs,
                photo: null
              });
            }
            alert('Datos de muestra inyectados en Supabase. Recargando...');
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
