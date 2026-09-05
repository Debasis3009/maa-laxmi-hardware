const fs = require('node:fs');
const path = require('node:path');

function seedSampleData(app, ownerUserId) {
  const { catalogService, productService } = app;

  // 1. Categories
  const building = catalogService.createCategory({ name: 'Building Materials' }, ownerUserId);
  const paints = catalogService.createCategory({ name: 'Paints & Primers' }, ownerUserId);
  const plumbing = catalogService.createCategory({ name: 'Pipes & Sanitary' }, ownerUserId);
  const electrical = catalogService.createCategory({ name: 'Electricals' }, ownerUserId);
  const tools = catalogService.createCategory({ name: 'Hardware & Tools' }, ownerUserId);

  const categoryMap = {
    'Building Materials': building.id,
    'Paints & Primers': paints.id,
    'Pipes & Sanitary': plumbing.id,
    'Electricals': electrical.id,
    'Hardware & Tools': tools.id,
  };

  // 2. Units mapping / fallback
  const existingUnits = Object.fromEntries(catalogService.listUnits().map((u) => [u.name.toLowerCase(), u.id]));
  function getOrCreateUnit(unitName) {
    const raw = (unitName || 'Piece').trim();
    const key = raw.toLowerCase();
    if (existingUnits[key]) return existingUnits[key];
    const created = catalogService.createUnit({ name: raw, symbol: raw.substring(0, 4) }, ownerUserId);
    existingUnits[key] = created.id;
    return created.id;
  }

  // 3. Supplier
  const supplier = catalogService.createSupplier({
    name: 'Maa Laxmi Central Stock Depo',
    phone: '9547512088',
    address: 'Nakrakonda, Birbhum, West Bengal',
  }, ownerUserId);

  // 4. Load products from products.json
  const candidates = [
    path.join(process.cwd(), 'web', 'data', 'products.json'),
    path.join(process.cwd(), 'data', 'products.json'),
    path.resolve(__dirname, '../../../../../data/products.json'),
  ];
  const jsonPath = candidates.find((p) => fs.existsSync(p));

  if (!jsonPath) {
    console.warn('products.json not found in candidate paths:', candidates);
    return;
  }

  const items = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  for (const item of items) {
    const catId = categoryMap[item.category] || building.id;
    const unitId = getOrCreateUnit(item.unit || 'Piece');

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
      supplierId: supplier.id,
      openingStock: item.stock || 50,
    }, ownerUserId);
  }
}

module.exports = { seedSampleData };
