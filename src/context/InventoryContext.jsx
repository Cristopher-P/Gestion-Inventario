import { createContext, useContext, useState, useEffect } from 'react';
import { db, getInitialLocations } from '../db/database';

const InventoryContext = createContext();

export function useInventory() {
  return useContext(InventoryContext);
}

export function InventoryProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const allProducts = await db.products.toArray();
      const allTransactions = await db.transactions.orderBy('date').reverse().toArray();
      const allAudits = await db.audits.orderBy('date').reverse().toArray();
      
      allProducts.reverse(); // Reverse so latest added appear first

      // Backward compatibility mapping for old v1 products
      const mappedProducts = allProducts.map(p => {
        if (p.locations === undefined) {
             // It's an old v1 product with just 'stock'
             const locs = getInitialLocations();
             locs['C5'].funcional = p.stock || 0; // Migrate old stock arbitrarily to C5 
             return { ...p, locations: locs };
        }
        return p;
      });

      setProducts(mappedProducts);
      setTransactions(allTransactions);
      setAudits(allAudits);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshData = async () => {
    await loadData();
  };

  const addProduct = async (productData) => {
    try {
      const newProduct = {
        name: productData.name || '',
        sku: productData.sku || '',                          // Número de Inventario
        marca: productData.marca || '',
        modelo: productData.modelo || '',
        serie: productData.serie || '',                      // Número de serie
        proveedor: productData.proveedor || '',
        tipoAdquisicion: productData.tipoAdquisicion || 'COMPRA',
        fechaAdquisicion: productData.fechaAdquisicion || '',
        responsable: productData.responsable || '',          // Responsable del Resguardo
        unidadAdministrativa: productData.unidadAdministrativa || '',
        valorEnLibros: productData.valorEnLibros || 0,
        photo: productData.photo || null,
        locations: productData.locations || getInitialLocations(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.products.add(newProduct);
      await loadData();
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (id, updates) => {
    try {
      await db.products.update(id, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      await loadData();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await db.products.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  // Centralized transaction logic for Multi-Site
  const addTransaction = async (productId, type, quantity, reason, dateString, location, condition = 'funcional', targetLocation = null) => {
    const qty = Number(quantity);
    if (!qty || qty <= 0) throw new Error("La cantidad debe ser mayor a 0");
    if (!location) throw new Error("Sede requerida");

    try {
      const product = await db.products.get(productId);
      if (!product) throw new Error("Equipo no encontrado");

      // Backward compatibility auto-migrate on fly
      const locs = product.locations || getInitialLocations();
      
      if (type === 'ENTRADA') {
        locs[location][condition] += qty;
      } 
      else if (type === 'SALIDA') {
        if (locs[location][condition] < qty) throw new Error(`Stock insuficiente en ${location} (${condition})`);
        locs[location][condition] -= qty;
      }
      else if (type === 'TRANSFERENCIA') {
        if (!targetLocation) throw new Error("Se requiere una sede de destino");
        if (locs[location][condition] < qty) throw new Error(`Stock insuficiente en ${location} para transferir`);
        
        locs[location][condition] -= qty;
        locs[targetLocation][condition] += qty;
      }
      else if (type === 'CAMBIO_ESTADO') {
        const targetCondition = condition === 'funcional' ? 'no_funcional' : 'funcional';
        if (locs[location][condition] < qty) throw new Error(`No hay suficientes equipos ${condition}s en ${location}`);
        
        locs[location][condition] -= qty;
        locs[location][targetCondition] += qty;
      }

      await db.products.update(productId, { locations: locs, updatedAt: new Date().toISOString() });
      
      const newTx = {
        productId,
        productName: product.name,
        type,
        quantity: qty,
        location,
        targetLocation, // Only for transfers
        condition,
        reason: reason || '',
        date: dateString || new Date().toISOString()
      };
      
      await db.transactions.add(newTx);
      await loadData();
    } catch (error) {
      console.error('Error in transaction:', error);
      throw error;
    }
  };

  // Helper to calculate total abstract stock across all locations
  const getTotalStock = (product) => {
      const p = product;
      if (!p.locations) return p.stock || 0; // fallback v1
      let total = 0;
      for (const loc in p.locations) {
          total += p.locations[loc].funcional + p.locations[loc].no_funcional;
      }
      return total;
  };

  // Genera N ítems individuales: una fila por unidad de producto en inventario
  const startAudit = async () => {
    try {
      const newAudit = {
        date: new Date().toISOString(),
        location: 'Global',
        status: 'in_progress'
      };
      const auditId = await db.audits.add(newAudit);
      
      const currentProducts = await db.products.toArray();
      const auditItemsToAdd = [];
      
      for (const product of currentProducts) {
        const locs = product.locations || getInitialLocations();
        
        // Por cada unidad existente en cada sede y condición, generamos un ítem individual
        for (const loc of Object.keys(locs)) {
          const funcional = locs[loc].funcional || 0;
          const noFuncional = locs[loc].no_funcional || 0;
          
          for (let i = 0; i < funcional; i++) {
            auditItemsToAdd.push({
              auditId,
              productId: product.id,
              originalLocation: loc,
              originalCondition: 'funcional',  // condición original en sistema
              unitIndex: i,
              status: null  // null = sin revisar, 'found_ok', 'found_damaged', 'missing'
            });
          }
          for (let i = 0; i < noFuncional; i++) {
            auditItemsToAdd.push({
              auditId,
              productId: product.id,
              originalLocation: loc,
              originalCondition: 'no_funcional',
              unitIndex: i,
              status: null
            });
          }
        }
      }
      
      if (auditItemsToAdd.length > 0) {
        await db.audit_items.bulkAdd(auditItemsToAdd);
      }
      
      await loadData();
      return auditId;
    } catch (error) {
      console.error('Error starting audit:', error);
      throw error;
    }
  };

  const getAuditItems = async (auditId) => {
    return await db.audit_items.where('auditId').equals(Number(auditId)).toArray();
  };

  // Guarda el estado de cada ítem individual (found_ok / found_damaged / missing / null)
  const saveAuditProgress = async (itemsUpdates) => {
    try {
      await db.transaction('rw', db.audit_items, async () => {
        for (const update of itemsUpdates) {
          await db.audit_items.update(update.id, { status: update.status });
        }
      });
    } catch (error) {
      console.error('Error saving audit progress:', error);
      throw error;
    }
  };

  // Al finalizar: compara lo que había en el sistema vs lo revisado y genera ajustes
  const finishAudit = async (auditId) => {
    try {
      const parsedAuditId = Number(auditId);
      const audit = await db.audits.get(parsedAuditId);
      if (!audit) throw new Error('Auditoría no encontrada');
      
      const items = await db.audit_items.where('auditId').equals(parsedAuditId).toArray();
      
      // Agrupar por productId para calcular diferencias
      const byProduct = {};
      for (const item of items) {
        if (!byProduct[item.productId]) byProduct[item.productId] = [];
        byProduct[item.productId].push(item);
      }
      
      await db.transaction('rw', db.products, db.transactions, db.audits, async () => {
        for (const [productId, unitItems] of Object.entries(byProduct)) {
          const product = await db.products.get(Number(productId));
          if (!product) continue;
          
          const locs = product.locations || getInitialLocations();
          
          // Conteos globales para el registro de ajuste
          const totalExpected = unitItems.length;
          const countFound    = unitItems.filter(i => i.status === 'found_ok' || i.status === 'found_damaged').length;
          const netDiff       = countFound - totalExpected;
          
          // Resetear todas las sedes a 0 para este producto
          for (const loc of Object.keys(locs)) {
            locs[loc].funcional    = 0;
            locs[loc].no_funcional = 0;
          }
          
          // Reconstruir el stock respetando la sede y condición original de cada unidad
          for (const unit of unitItems) {
            const loc = unit.originalLocation;
            if (!locs[loc]) continue; // sede desconocida, saltar
            
            if (unit.status === 'found_ok') {
              locs[loc].funcional += 1;
            } else if (unit.status === 'found_damaged') {
              locs[loc].no_funcional += 1;
            }
            // missing / null → no se suma → queda en 0 (dado de baja)
          }
          
          await db.products.update(product.id, { locations: locs, updatedAt: new Date().toISOString() });
          
          // Registrar ajuste sólo si hubo diferencia neta
          if (netDiff !== 0) {
            await db.transactions.add({
              productId: product.id,
              productName: product.name,
              type: netDiff > 0 ? 'ENTRADA' : 'SALIDA',
              quantity: Math.abs(netDiff),
              location: 'Global',
              targetLocation: null,
              condition: 'funcional',
              reason: `Ajuste de Auditoría #${audit.id} (${netDiff > 0 ? 'Sobrante' : 'Faltante'}: ${Math.abs(netDiff)} uds)`,
              date: new Date().toISOString()
            });
          }
        }
        
        await db.audits.update(parsedAuditId, { status: 'completed' });
      });
      
      await loadData();
    } catch (error) {
      console.error('Error finishing audit:', error);
      throw error;
    }
  };


  return (
    <InventoryContext.Provider value={{ 
      products, 
      transactions,
      audits,
      loading, 
      addProduct, 
      updateProduct, 
      deleteProduct, 
      addTransaction,
      refreshData,
      getTotalStock,
      startAudit,
      getAuditItems,
      saveAuditProgress,
      finishAudit
    }}>
      {children}
    </InventoryContext.Provider>
  );
}
