import Dexie from 'dexie';

export const db = new Dexie('InventoryDB');

// Version 3: Inventory Audits
db.version(3).stores({
  products: '++id, name, sku, category, *locations', // locations will be an object holding counts per site
  transactions: '++id, productId, type, date',
  audits: '++id, date, location, status', // status: 'in_progress', 'completed'
  audit_items: '++id, auditId, productId, [auditId+productId]' // Compound index to easily fetch items by audit and product
});

// Utility to initialize default locations object for a new product
export const getInitialLocations = () => ({
  'C5': { funcional: 0, no_funcional: 0 },
  'Seguridad Pública': { funcional: 0, no_funcional: 0 },
  'CERITY': { funcional: 0, no_funcional: 0 }
});

export const LOCATIONS = ['C5', 'Seguridad Pública', 'CERITY'];
