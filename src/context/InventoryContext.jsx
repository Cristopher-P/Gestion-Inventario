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
      // productData may optionally bring initial location counts, otherwise use zeros
      const newProduct = {
        name: productData.name,
        sku: productData.sku || '',
        description: productData.description || '',
        category: productData.category || 'General',
        image: productData.image || null,
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

  const startAudit = async (location) => {
    try {
      const newAudit = {
        date: new Date().toISOString(),
        location,
        status: 'in_progress'
      };
      const auditId = await db.audits.add(newAudit);
      
      const currentProducts = await db.products.toArray();
      const auditItemsToAdd = [];
      
      for (const product of currentProducts) {
        const locs = product.locations || getInitialLocations();
        const funcional = locs[location]?.funcional || 0;
        const no_funcional = locs[location]?.no_funcional || 0;
        
        auditItemsToAdd.push({
          auditId,
          productId: product.id,
          expectedFuncional: funcional,
          expectedNoFuncional: no_funcional,
          countedFuncional: null,
          countedNoFuncional: null
        });
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

  const saveAuditProgress = async (itemsUpdates) => {
    try {
      await db.transaction('rw', db.audit_items, async () => {
        for (const update of itemsUpdates) {
          await db.audit_items.update(update.id, {
            countedFuncional: update.countedFuncional,
            countedNoFuncional: update.countedNoFuncional
          });
        }
      });
    } catch (error) {
      console.error('Error saving audit progress:', error);
      throw error;
    }
  };

  const finishAudit = async (auditId) => {
    try {
      const parsedAuditId = Number(auditId);
      const audit = await db.audits.get(parsedAuditId);
      if (!audit) throw new Error("Auditoría no encontrada");
      
      const items = await db.audit_items.where('auditId').equals(parsedAuditId).toArray();
      
      await db.transaction('rw', db.products, db.transactions, db.audits, async () => {
        for (const item of items) {
          const cFuncional = item.countedFuncional !== null ? item.countedFuncional : item.expectedFuncional;
          const cNoFuncional = item.countedNoFuncional !== null ? item.countedNoFuncional : item.expectedNoFuncional;
          
          let diffFuncional = cFuncional - item.expectedFuncional;
          let diffNoFuncional = cNoFuncional - item.expectedNoFuncional;
          
          if (diffFuncional !== 0 || diffNoFuncional !== 0) {
            const product = await db.products.get(item.productId);
            if (product) {
               const locs = product.locations || getInitialLocations();
               
               locs[audit.location].funcional += diffFuncional;
               locs[audit.location].no_funcional += diffNoFuncional;
               
               await db.products.update(product.id, { locations: locs, updatedAt: new Date().toISOString() });
               
               const createTx = async (diff, condition) => {
                  if (diff === 0) return;
                  const type = diff > 0 ? 'ENTRADA' : 'SALIDA';
                  const qty = Math.abs(diff);
                  
                  await db.transactions.add({
                    productId: product.id,
                    productName: product.name,
                    type,
                    quantity: qty,
                    location: audit.location,
                    targetLocation: null,
                    condition,
                    reason: `Ajuste de Auditoría #${audit.id}`,
                    date: new Date().toISOString()
                  });
               };
               
               await createTx(diffFuncional, 'funcional');
               await createTx(diffNoFuncional, 'no_funcional');
            }
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
