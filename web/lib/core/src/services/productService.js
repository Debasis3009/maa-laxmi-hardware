'use strict';
const { uuid, now, AppError } = require('../util');

function createProductService(db, { auditService, inventoryService, priceService }) {
  function _parseProduct(row) {
    if (!row) return null;
    return { ...row, tags: JSON.parse(row.tags || '[]'), specifications: JSON.parse(row.specifications || '{}') };
  }

  /**
   * Create a product. If `openingStock` is provided, it is recorded as a
   * proper 'opening' stock transaction — never written directly.
   */
  function createProduct(data, actingUserId = null) {
    if (!data.sku) throw new AppError('SKU is required', 'VALIDATION_ERROR');
    if (!data.name) throw new AppError('Product name is required', 'VALIDATION_ERROR');
    if (!data.categoryId) throw new AppError('Category is required', 'VALIDATION_ERROR');
    if (!data.unitId) throw new AppError('Unit is required', 'VALIDATION_ERROR');

    const existing = db.queryOne(`SELECT id FROM products WHERE sku = ?`, [data.sku]);
    if (existing) throw new AppError(`SKU ${data.sku} already exists`, 'DUPLICATE_SKU');

    const id = uuid();
    const ts = now();
    db.run(
      `INSERT INTO products (
         id, sku, barcode, name, brand_id, category_id, product_type, short_description, full_description,
         unit_id, purchase_price, mrp, retail_price, wholesale_price, dealer_price, selling_price,
         discount_percent, gst_rate, hsn_code, min_stock, max_stock, reorder_level, supplier_id,
         has_variants, is_featured, is_bestseller, is_new_arrival, is_active,
         online_purchase_enabled, quotation_enabled, whatsapp_order_enabled, allow_backorder,
         created_by, created_at, updated_at
       ) VALUES (?,?,?,?,?,?,?,?,?, ?,?,?,?,?,?,?, ?,?,?,?,?,?,?, ?,?,?,?,?, ?,?,?,?, ?,?,?)`,
      [
        id, data.sku, data.barcode || null, data.name, data.brandId || null, data.categoryId,
        data.productType || null, data.shortDescription || null, data.fullDescription || null,
        data.unitId, data.purchasePrice || 0, data.mrp || 0, data.retailPrice || null,
        data.wholesalePrice || null, data.dealerPrice || null, data.sellingPrice || 0,
        data.discountPercent || 0, data.gstRate || 0, data.hsnCode || null,
        data.minStock || 0, data.maxStock || null, data.reorderLevel || 0, data.supplierId || null,
        data.hasVariants ? 1 : 0, data.isFeatured ? 1 : 0, data.isBestseller ? 1 : 0, data.isNewArrival ? 1 : 0,
        data.isActive === false ? 0 : 1,
        data.onlinePurchaseEnabled === false ? 0 : 1, data.quotationEnabled === false ? 0 : 1,
        data.whatsappOrderEnabled === false ? 0 : 1, data.allowBackorder ? 1 : 0,
        actingUserId, ts, ts,
      ]
    );

    if (data.openingStock) {
      inventoryService.recordStockTransaction({
        productId: id, type: 'opening', quantity: data.openingStock,
        reason: 'Initial stock on product creation', performedBy: actingUserId,
      });
    }

    const product = getProductById(id);
    auditService.log({ userId: actingUserId, action: 'product.create', entityType: 'product', entityId: id, after: product });
    return product;
  }

  function getProductById(id) {
    const row = db.queryOne(`SELECT * FROM products WHERE id = ? AND deleted_at IS NULL`, [id]);
    if (!row) return null;
    const product = _parseProduct(row);
    product.variants = listVariants(id);
    product.stock = inventoryService.getStockStatus(id);
    return product;
  }

  function listProducts({ categoryId, brandId, isActive, search, limit = 100, offset = 0 } = {}) {
    const clauses = ['deleted_at IS NULL'];
    const params = [];
    if (categoryId) { clauses.push('category_id = ?'); params.push(categoryId); }
    if (brandId) { clauses.push('brand_id = ?'); params.push(brandId); }
    if (isActive !== undefined) { clauses.push('is_active = ?'); params.push(isActive ? 1 : 0); }
    if (search) { clauses.push('(name LIKE ? OR sku LIKE ? OR barcode LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    params.push(limit, offset);
    const rows = db.query(
      `SELECT * FROM products WHERE ${clauses.join(' AND ')} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      params
    );
    return rows.map((r) => {
      const p = _parseProduct(r);
      p.variants = listVariants(p.id);
      p.stock = inventoryService.getStockStatus(p.id);
      return p;
    });
  }

  function updateProduct(id, changes, actingUserId = null) {
    const before = getProductById(id);
    if (!before) throw new AppError('Product not found', 'NOT_FOUND');

    // Price fields are routed through priceService so every change is
    // recorded in price_history — never a silent overwrite.
    const priceFields = ['purchasePrice', 'mrp', 'retailPrice', 'wholesalePrice', 'dealerPrice', 'sellingPrice'];
    const fieldMap = {
      purchasePrice: 'purchase_price', mrp: 'mrp', retailPrice: 'retail_price', wholesalePrice: 'wholesale_price',
      dealerPrice: 'dealer_price', sellingPrice: 'selling_price', discountPercent: 'discount_percent',
      gstRate: 'gst_rate', hsnCode: 'hsn_code', name: 'name', brandId: 'brand_id', categoryId: 'category_id',
      shortDescription: 'short_description', fullDescription: 'full_description', minStock: 'min_stock',
      maxStock: 'max_stock', reorderLevel: 'reorder_level', supplierId: 'supplier_id', isFeatured: 'is_featured',
      isBestseller: 'is_bestseller', isNewArrival: 'is_new_arrival', isActive: 'is_active',
      onlinePurchaseEnabled: 'online_purchase_enabled', quotationEnabled: 'quotation_enabled',
      whatsappOrderEnabled: 'whatsapp_order_enabled', allowBackorder: 'allow_backorder', barcode: 'barcode',
    };

    for (const field of priceFields) {
      if (changes[field] !== undefined && changes[field] !== before[fieldMap[field]]) {
        priceService.changePrice({
          productId: id, priceField: fieldMap[field], newPrice: changes[field],
          reason: changes.priceChangeReason || 'Manual product edit', changedBy: actingUserId,
        });
      }
    }

    const setClauses = [];
    const params = [];
    for (const [jsKey, column] of Object.entries(fieldMap)) {
      if (changes[jsKey] !== undefined) {
        setClauses.push(`${column} = ?`);
        let val = changes[jsKey];
        if (typeof val === 'boolean') val = val ? 1 : 0;
        params.push(val);
      }
    }
    if (changes.tags) { setClauses.push('tags = ?'); params.push(JSON.stringify(changes.tags)); }
    if (changes.specifications) { setClauses.push('specifications = ?'); params.push(JSON.stringify(changes.specifications)); }

    if (setClauses.length) {
      setClauses.push('updated_at = ?');
      params.push(now(), id);
      db.run(`UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`, params);
    }

    const after = getProductById(id);
    auditService.log({ userId: actingUserId, action: 'product.update', entityType: 'product', entityId: id, before, after });
    return after;
  }

  function softDeleteProduct(id, actingUserId = null) {
    const before = getProductById(id);
    if (!before) throw new AppError('Product not found', 'NOT_FOUND');
    db.run(`UPDATE products SET deleted_at = ?, is_active = 0 WHERE id = ?`, [now(), id]);
    auditService.log({ userId: actingUserId, action: 'product.delete', entityType: 'product', entityId: id, before });
  }

  function duplicateProduct(id, overrides = {}, actingUserId = null) {
    const original = getProductById(id);
    if (!original) throw new AppError('Product not found', 'NOT_FOUND');
    const newSku = overrides.sku || `${original.sku}-COPY-${Date.now().toString().slice(-5)}`;
    return createProduct({
      sku: newSku, barcode: null, name: overrides.name || `${original.name} (Copy)`,
      brandId: original.brand_id, categoryId: original.category_id, productType: original.product_type,
      shortDescription: original.short_description, fullDescription: original.full_description,
      unitId: original.unit_id, purchasePrice: original.purchase_price, mrp: original.mrp,
      retailPrice: original.retail_price, wholesalePrice: original.wholesale_price,
      dealerPrice: original.dealer_price, sellingPrice: original.selling_price,
      discountPercent: original.discount_percent, gstRate: original.gst_rate, hsnCode: original.hsn_code,
      minStock: original.min_stock, maxStock: original.max_stock, reorderLevel: original.reorder_level,
      supplierId: original.supplier_id, isActive: false, // duplicates start disabled until reviewed
      openingStock: 0,
    }, actingUserId);
  }

  // ---- Variants -----------------------------------------------------------
  function addVariant(productId, data, actingUserId = null) {
    const product = getProductById(productId);
    if (!product) throw new AppError('Product not found', 'NOT_FOUND');
    const existing = db.queryOne(`SELECT id FROM product_variants WHERE sku = ?`, [data.sku]);
    if (existing) throw new AppError(`Variant SKU ${data.sku} already exists`, 'DUPLICATE_SKU');

    const id = uuid();
    const ts = now();
    db.run(
      `INSERT INTO product_variants (id, product_id, sku, barcode, name, attributes, unit_id,
         purchase_price, mrp, selling_price, weight, min_stock, max_stock, reorder_level, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, productId, data.sku, data.barcode || null, data.name, JSON.stringify(data.attributes || {}),
       data.unitId, data.purchasePrice || 0, data.mrp || 0, data.sellingPrice || 0, data.weight || null,
       data.minStock || 0, data.maxStock || null, data.reorderLevel || 0, ts, ts]
    );
    db.run(`UPDATE products SET has_variants = 1, updated_at = ? WHERE id = ?`, [ts, productId]);

    if (data.openingStock) {
      inventoryService.recordStockTransaction({
        productId, variantId: id, type: 'opening', quantity: data.openingStock,
        reason: 'Initial stock on variant creation', performedBy: actingUserId,
      });
    }
    const variant = db.queryOne(`SELECT * FROM product_variants WHERE id = ?`, [id]);
    auditService.log({ userId: actingUserId, action: 'variant.create', entityType: 'product_variant', entityId: id, after: variant });
    return { ...variant, attributes: JSON.parse(variant.attributes), stock: inventoryService.getStockStatus(productId, id) };
  }

  function listVariants(productId) {
    return db.query(`SELECT * FROM product_variants WHERE product_id = ? ORDER BY created_at`, [productId])
      .map((v) => ({ ...v, attributes: JSON.parse(v.attributes), stock: inventoryService.getStockStatus(productId, v.id) }));
  }

  return {
    createProduct, getProductById, listProducts, updateProduct, softDeleteProduct, duplicateProduct,
    addVariant, listVariants,
  };
}

module.exports = { createProductService };
