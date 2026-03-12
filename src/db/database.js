// database.js — Supabase version
// Dexie/IndexedDB is no longer used. This file now exports shared constants
// and thin Supabase helper wrappers so the rest of the app stays compatible.

export const LOCATIONS = ['C5', 'Seguridad Pública', 'CERITY'];

export const getInitialLocations = () => ({
  'C5':                 { funcional: 0, no_funcional: 0 },
  'Seguridad Pública':  { funcional: 0, no_funcional: 0 },
  'CERITY':             { funcional: 0, no_funcional: 0 },
});
