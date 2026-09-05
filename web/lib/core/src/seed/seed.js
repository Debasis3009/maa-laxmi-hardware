const productsData = require('./products.json');

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

  // 4. Insert catalog products
  for (const item of productsData) {
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
