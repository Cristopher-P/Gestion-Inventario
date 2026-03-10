import Dexie from 'dexie';

export const db = new Dexie('InventoryDB');

// Version 2: Multi-location tracking
db.version(2).stores({
  products: '++id, name, sku, category, *locations', // locations will be an object holding counts per site
  transactions: '++id, productId, type, date' 
});

// Utility to initialize default locations object for a new product
export const getInitialLocations = () => ({
  'C5': { funcional: 0, no_funcional: 0 },
  'Seguridad Pública': { funcional: 0, no_funcional: 0 },
  'CERITY': { funcional: 0, no_funcional: 0 }
});

export const LOCATIONS = ['C5', 'Seguridad Pública', 'CERITY'];
