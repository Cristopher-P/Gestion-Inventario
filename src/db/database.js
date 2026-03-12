import Dexie from 'dexie';

export const db = new Dexie('InventoryDB');

// Version 3: Inventory Audits (legacy — kept for migration)
db.version(3).stores({
  products: '++id, name, sku, category, *locations',
  transactions: '++id, productId, type, date',
  audits: '++id, date, location, status',
  audit_items: '++id, auditId, productId, [auditId+productId]'
});

// Version 4: New fields matching physical inventory sheets
db.version(4).stores({
  products: '++id, name, sku, marca, responsable, unidadAdministrativa, *locations',
  transactions: '++id, productId, type, date',
  audits: '++id, date, location, status',
  audit_items: '++id, auditId, productId, [auditId+productId]'
});

// Utility to initialize default locations object for a new product
export const getInitialLocations = () => ({
  'C5': { funcional: 0, no_funcional: 0 },
  'Seguridad Pública': { funcional: 0, no_funcional: 0 },
  'CERITY': { funcional: 0, no_funcional: 0 }
});

export const LOCATIONS = ['C5', 'Seguridad Pública', 'CERITY'];
