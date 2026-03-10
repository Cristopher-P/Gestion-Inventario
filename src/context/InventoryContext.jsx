import { createContext, useContext, useState, useEffect } from 'react';
import { db, getInitialLocations } from '../db/database';

const InventoryContext = createContext();

export function useInventory() {
  return useContext(InventoryContext);
}

export function InventoryProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const allProducts = await db.products.toArray();
      const allTransactions = await db.transactions.orderBy('date').reverse().toArray();
      
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

  return (
    <InventoryContext.Provider value={{ 
      products, 
      transactions, 
      loading, 
      addProduct, 
      updateProduct, 
      deleteProduct, 
      addTransaction,
      refreshData,
      getTotalStock
    }}>
      {children}
    </InventoryContext.Provider>
  );
}
