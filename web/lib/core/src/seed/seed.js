const productsData = require('./products.json');

function seedSampleData(app, ownerUserId) {
  const { catalogService, productService, db } = app;

  // 1. Idempotent Category Helper
  function getOrCreateCategory(name, parentId = null) {
    const existing = db.queryOne(`SELECT id FROM categories WHERE name = ?`, [name]);
    if (existing) return existing.id;
    try {
      const created = catalogService.createCategory({ name, parentId }, ownerUserId);
      return created.id;
    } catch {
      const fallback = db.queryOne(`SELECT id FROM categories WHERE name = ?`, [name]);
      return fallback ? fallback.id : null;
    }
  }

  const buildingId = getOrCreateCategory('Building Materials');
  const paintsId = getOrCreateCategory('Paints & Primers');
  const plumbingId = getOrCreateCategory('Pipes & Sanitary');
  const electricalId = getOrCreateCategory('Electricals');
  const toolsId = getOrCreateCategory('Hardware & Tools');

  const categoryMap = {
    'Building Materials': buildingId,
    'Paints & Primers': paintsId,
    'Pipes & Sanitary': plumbingId,
    'Electricals': electricalId,
    'Hardware & Tools': toolsId,
  };

  // 2. Idempotent Unit Helper (createUnit signature: name, abbreviation, actingUserId)
  function getOrCreateUnit(unitName) {
    const raw = (unitName || 'Piece').trim();
    const existing = db.queryOne(`SELECT id FROM units WHERE LOWER(name) = LOWER(?)`, [raw]);
    if (existing) return existing.id;
    try {
      const abbr = raw.slice(0, 4);
      const created = catalogService.createUnit(raw, abbr, ownerUserId);
      return created.id;
    } catch {
      const fallback = db.queryOne(`SELECT id FROM units WHERE LOWER(name) = LOWER(?)`, [raw]);
      return fallback ? fallback.id : 1;
    }
  }

  // 3. Idempotent Supplier Helper
  let supplier = db.queryOne(`SELECT id FROM suppliers WHERE phone = ?`, ['9547512088']);
  if (!supplier) {
    try {
      supplier = catalogService.createSupplier({
        name: 'Maa Laxmi Central Stock Depo',
        phone: '9547512088',
        address: 'Nakrakonda, Birbhum, West Bengal',
      }, ownerUserId);
    } catch {
      supplier = db.queryOne(`SELECT id FROM suppliers LIMIT 1`);
    }
  }

  // 4. Insert catalog products safely
  for (const item of productsData) {
    const existingProduct = db.queryOne(`SELECT id FROM products WHERE sku = ?`, [item.sku]);
    if (existingProduct) continue;

    const catId = categoryMap[item.category] || buildingId;
    const unitId = getOrCreateUnit(item.unit || 'Piece');

    try {
      productService.createProduct({
        sku: item.sku,
        name: item.name,
        categoryId: catId,
        unitId: unitId,
        purchasePrice: Math.round(item.price * 0.85),
        mrp: Math.round(item.price * 1.15),
        sellingPrice: item.price,
        gstRate: 18,
        shortDescription: item.description || null,
        supplierId: supplier?.id || null,
        openingStock: item.stock || 50,
      }, ownerUserId);
    } catch (err) {
      console.error(`Failed to insert product ${item.sku}:`, err.message);
    }
  }
}

module.exports = { seedSampleData };
