import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getInitialLocations } from '../db/database';

const InventoryContext = createContext();

export function useInventory() {
  return useContext(InventoryContext);
}

export function InventoryProvider({ children }) {
  const [products, setProducts]         = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [audits, setAudits]             = useState([]);
  const [loading, setLoading]           = useState(true);

  // ── Map Supabase snake_case → camelCase the app expects ──
  const mapProduct = (p) => ({
    id:                   p.id,
    name:                 p.name || '',
    sku:                  p.sku || '',
    marca:                p.marca || '',
    modelo:               p.modelo || '',
    serie:                p.serie || '',
    proveedor:            p.proveedor || '',
    tipoAdquisicion:      p.tipo_adquisicion || 'COMPRA',
    fechaAdquisicion:     p.fecha_adquisicion || '',
    responsable:          p.responsable || '',
    unidadAdministrativa: p.unidad_administrativa || '',
    valorEnLibros:        p.valor_en_libros || 0,
    photo:                p.photo_url || null,
    locations:            p.locations || getInitialLocations(),
    createdAt:            p.created_at,
  });

  const mapAudit = (a) => ({
    id:       a.id,
    date:     a.date,
    location: a.location,
    status:   a.status,
    name:     a.name,
  });

  // ── Load all data ──
  const loadData = async () => {
    try {
      const [{ data: prods }, { data: txs }, { data: auds }] = await Promise.all([
        supabase.from('products').select('*').order('id', { ascending: false }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('audits').select('*').order('date', { ascending: false }),
      ]);

      setProducts((prods || []).map(mapProduct));
      setTransactions(txs || []);
      setAudits((auds || []).map(mapAudit));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);
  const refreshData = () => loadData();

  // ── Upload image to Supabase Storage, return public URL ──
  const uploadPhoto = async (base64DataUrl) => {
    if (!base64DataUrl || !base64DataUrl.startsWith('data:')) return base64DataUrl;

    try {
      // Convert base64 → Blob
      const [header, data] = base64DataUrl.split(',');
      const mime = header.match(/:(.*?);/)[1];
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });

      const fileName = `product_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, blob, { contentType: mime, upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Error uploading image, storing as base64 fallback:', err);
      return base64DataUrl; // fallback: keep base64
    }
  };

  // ── Products CRUD ──
  const addProduct = async (productData) => {
    try {
      const photoUrl = await uploadPhoto(productData.photo);

      const { error } = await supabase.from('products').insert([{
        name:                  productData.name || '',
        sku:                   productData.sku || '',
        marca:                 productData.marca || '',
        modelo:                productData.modelo || '',
        serie:                 productData.serie || '',
        proveedor:             productData.proveedor || '',
        tipo_adquisicion:      productData.tipoAdquisicion || 'COMPRA',
        fecha_adquisicion:     productData.fechaAdquisicion || '',
        responsable:           productData.responsable || '',
        unidad_administrativa: productData.unidadAdministrativa || '',
        valor_en_libros:       productData.valorEnLibros || 0,
        photo_url:             photoUrl,
        locations:             productData.locations || getInitialLocations(),
      }]);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (id, updates) => {
    try {
      const photoUrl = await uploadPhoto(updates.photo);

      const { error } = await supabase.from('products').update({
        name:                  updates.name,
        sku:                   updates.sku,
        marca:                 updates.marca,
        modelo:                updates.modelo,
        serie:                 updates.serie,
        proveedor:             updates.proveedor,
        tipo_adquisicion:      updates.tipoAdquisicion,
        fecha_adquisicion:     updates.fechaAdquisicion,
        responsable:           updates.responsable,
        unidad_administrativa: updates.unidadAdministrativa,
        valor_en_libros:       updates.valorEnLibros,
        photo_url:             photoUrl,
        locations:             updates.locations,
      }).eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  // ── Transactions ──
  const addTransaction = async (productId, type, quantity, reason, dateString, location, condition = 'funcional', targetLocation = null) => {
    const qty = Number(quantity);
    if (!qty || qty <= 0) throw new Error('La cantidad debe ser mayor a 0');
    if (!location)        throw new Error('Sede requerida');

    try {
      // Fetch current product
      const { data: prodArr, error: fetchErr } = await supabase.from('products').select('*').eq('id', productId).single();
      if (fetchErr) throw fetchErr;
      const product = mapProduct(prodArr);
      const locs    = { ...product.locations };

      if (type === 'ENTRADA') {
        locs[location][condition] += qty;
      } else if (type === 'SALIDA') {
        if (locs[location][condition] < qty) throw new Error(`Stock insuficiente en ${location} (${condition})`);
        locs[location][condition] -= qty;
      } else if (type === 'TRANSFERENCIA') {
        if (!targetLocation) throw new Error('Se requiere una sede de destino');
        if (locs[location][condition] < qty) throw new Error(`Stock insuficiente en ${location}`);
        locs[location][condition]       -= qty;
        locs[targetLocation][condition] += qty;
      } else if (type === 'CAMBIO_ESTADO') {
        const target = condition === 'funcional' ? 'no_funcional' : 'funcional';
        if (locs[location][condition] < qty) throw new Error(`No hay suficientes equipos ${condition}s en ${location}`);
        locs[location][condition] -= qty;
        locs[location][target]    += qty;
      }

      const { error: updateErr } = await supabase.from('products').update({ locations: locs }).eq('id', productId);
      if (updateErr) throw updateErr;

      const { error: txErr } = await supabase.from('transactions').insert([{
        product_id:    productId,
        product_name:  product.name,
        type,
        quantity:      qty,
        location,
        target_location: targetLocation,
        condition,
        reason:        reason || '',
        date:          dateString || new Date().toISOString(),
      }]);
      if (txErr) throw txErr;

      await loadData();
    } catch (error) {
      console.error('Error in transaction:', error);
      throw error;
    }
  };

  const getTotalStock = (product) => {
    if (!product.locations) return product.stock || 0;
    let total = 0;
    for (const loc in product.locations) {
      total += (product.locations[loc].funcional || 0) + (product.locations[loc].no_funcional || 0);
    }
    return total;
  };

  // ── Audits ──
  const startAudit = async () => {
    try {
      const { data: auditArr, error: auditErr } = await supabase
        .from('audits')
        .insert([{ date: new Date().toISOString(), location: 'Global', status: 'in_progress' }])
        .select();
      if (auditErr) throw auditErr;
      const auditId = auditArr[0].id;

      const { data: prods, error: prodsErr } = await supabase.from('products').select('*');
      if (prodsErr) throw prodsErr;

      const items = [];
      for (const p of prods) {
        const locs = p.locations || getInitialLocations();
        for (const loc of Object.keys(locs)) {
          for (let i = 0; i < (locs[loc].funcional || 0); i++) {
            items.push({ audit_id: auditId, product_id: p.id, product_name: p.name, product_sku: p.sku, product_marca: p.marca, product_responsable: p.responsable, original_location: loc, original_condition: 'funcional', unit_index: i, status: null });
          }
          for (let i = 0; i < (locs[loc].no_funcional || 0); i++) {
            items.push({ audit_id: auditId, product_id: p.id, product_name: p.name, product_sku: p.sku, product_marca: p.marca, product_responsable: p.responsable, original_location: loc, original_condition: 'no_funcional', unit_index: i, status: null });
          }
        }
      }

      if (items.length > 0) {
        const { error: itemsErr } = await supabase.from('audit_items').insert(items);
        if (itemsErr) throw itemsErr;
      }

      await loadData();
      return auditId;
    } catch (error) {
      console.error('Error starting audit:', error);
      throw error;
    }
  };

  const getAuditItems = async (auditId) => {
    const { data, error } = await supabase
      .from('audit_items')
      .select('*')
      .eq('audit_id', Number(auditId));
    if (error) throw error;

    // Map snake_case → camelCase as expected by ActiveAudit.jsx
    return (data || []).map(item => ({
      id:                 item.id,
      auditId:            item.audit_id,
      productId:          item.product_id,
      productName:        item.product_name,
      productSku:         item.product_sku,
      productMarca:       item.product_marca,
      productResponsable: item.product_responsable,
      originalLocation:   item.original_location,
      originalCondition:  item.original_condition,
      unitSeq:            item.unit_seq ?? item.unit_index,
      status:             item.status,
    }));
  };

  const saveAuditProgress = async (itemsUpdates) => {
    try {
      await Promise.all(
        itemsUpdates.map(u =>
          supabase.from('audit_items').update({ status: u.status }).eq('id', u.id)
        )
      );
    } catch (error) {
      console.error('Error saving audit progress:', error);
      throw error;
    }
  };

  const finishAudit = async (auditId) => {
    try {
      const parsedId = Number(auditId);
      const { data: items, error: itemsErr } = await supabase.from('audit_items').select('*').eq('audit_id', parsedId);
      if (itemsErr) throw itemsErr;

      // Group by product_id
      const byProduct = {};
      for (const item of items) {
        if (!byProduct[item.product_id]) byProduct[item.product_id] = [];
        byProduct[item.product_id].push(item);
      }

      for (const [productId, unitItems] of Object.entries(byProduct)) {
        const { data: prodArr } = await supabase.from('products').select('*').eq('id', Number(productId)).single();
        if (!prodArr) continue;

        const locs = prodArr.locations || getInitialLocations();
        const totalExpected = unitItems.length;
        const countFound    = unitItems.filter(i => i.status === 'found_ok' || i.status === 'found_damaged').length;
        const netDiff       = countFound - totalExpected;

        // Reset all locations to 0
        for (const loc of Object.keys(locs)) { locs[loc].funcional = 0; locs[loc].no_funcional = 0; }

        // Rebuild from audit results
        for (const unit of unitItems) {
          const loc = unit.original_location;
          if (!locs[loc]) continue;
          if (unit.status === 'found_ok')      locs[loc].funcional    += 1;
          else if (unit.status === 'found_damaged') locs[loc].no_funcional += 1;
        }

        await supabase.from('products').update({ locations: locs }).eq('id', Number(productId));

        if (netDiff !== 0) {
          await supabase.from('transactions').insert([{
            product_id:   Number(productId),
            product_name: prodArr.name,
            type:         netDiff > 0 ? 'ENTRADA' : 'SALIDA',
            quantity:     Math.abs(netDiff),
            location:     'Global',
            condition:    'funcional',
            reason:       `Ajuste de Auditoría #${auditId} (${netDiff > 0 ? 'Sobrante' : 'Faltante'}: ${Math.abs(netDiff)} uds)`,
            date:         new Date().toISOString(),
          }]);
        }
      }

      await supabase.from('audits').update({ status: 'completed' }).eq('id', parsedId);
      await loadData();
    } catch (error) {
      console.error('Error finishing audit:', error);
      throw error;
    }
  };

  return (
    <InventoryContext.Provider value={{
      products, transactions, audits, loading,
      addProduct, updateProduct, deleteProduct,
      addTransaction, refreshData, getTotalStock,
      startAudit, getAuditItems, saveAuditProgress, finishAudit,
    }}>
      {children}
    </InventoryContext.Provider>
  );
}
