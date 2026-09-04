function seedSampleData(app, ownerUserId) {
  const { catalogService, productService } = app;

  // 1. Categories
  const building = catalogService.createCategory({ name: 'Building Materials' }, ownerUserId);
  const cementCat = catalogService.createCategory({ name: 'Cement & Concrete', parentId: building.id }, ownerUserId);
  const steelCat = catalogService.createCategory({ name: 'TMT Steel & Rods', parentId: building.id }, ownerUserId);

  const paints = catalogService.createCategory({ name: 'Paints & Primers' }, ownerUserId);
  const emulsionCat = catalogService.createCategory({ name: 'Wall Emulsions', parentId: paints.id }, ownerUserId);
  const enamelCat = catalogService.createCategory({ name: 'Enamels & Distempers', parentId: paints.id }, ownerUserId);

  const plumbing = catalogService.createCategory({ name: 'Pipes & Sanitary' }, ownerUserId);
  const cpvcCat = catalogService.createCategory({ name: 'CPVC Pipes & Fittings', parentId: plumbing.id }, ownerUserId);
  const tapsCat = catalogService.createCategory({ name: 'Bath Fittings & Taps', parentId: plumbing.id }, ownerUserId);

  const electrical = catalogService.createCategory({ name: 'Electricals' }, ownerUserId);
  const wireCat = catalogService.createCategory({ name: 'House Wires & Cables', parentId: electrical.id }, ownerUserId);
  const switchCat = catalogService.createCategory({ name: 'Modular Switches', parentId: electrical.id }, ownerUserId);

  const tools = catalogService.createCategory({ name: 'Hardware & Tools' }, ownerUserId);
  const handTools = catalogService.createCategory({ name: 'Hand Tools', parentId: tools.id }, ownerUserId);
  const fasteners = catalogService.createCategory({ name: 'Fasteners & Screws', parentId: tools.id }, ownerUserId);

  // 2. Brands & Suppliers
  const brandAsian = catalogService.createBrand({ name: 'Asian Paints' }, ownerUserId);
  const brandUltra = catalogService.createBrand({ name: 'UltraTech' }, ownerUserId);
  const brandAstral = catalogService.createBrand({ name: 'Astral' }, ownerUserId);
  const brandFinolex = catalogService.createBrand({ name: 'Finolex' }, ownerUserId);
  const brandTaparia = catalogService.createBrand({ name: 'Taparia' }, ownerUserId);
  const brandTata = catalogService.createBrand({ name: 'Tata Tiscon' }, ownerUserId);

  const supplier = catalogService.createSupplier({
    name: 'Maa Laxmi Central Stock Depo',
    phone: '9547512088',
    address: 'Nakrakonda, Birbhum, West Bengal',
  }, ownerUserId);

  const units = Object.fromEntries(catalogService.listUnits().map((u) => [u.name, u.id]));

  // 3. Products: Cement & Steel
  productService.createProduct({
    sku: 'CEM-ULTRA-50KG',
    name: 'UltraTech Super Cement 50kg',
    categoryId: cementCat.id,
    brandId: brandUltra.id,
    unitId: units['Bag'],
    purchasePrice: 350,
    mrp: 420,
    sellingPrice: 385,
    gstRate: 28,
    minStock: 50,
    reorderLevel: 80,
    supplierId: supplier.id,
    openingStock: 250,
  }, ownerUserId);

  productService.createProduct({
    sku: 'TMT-TATA-500D',
    name: 'Tata Tiscon 550D TMT Rebar (12mm)',
    categoryId: steelCat.id,
    brandId: brandTata.id,
    unitId: units['Piece'],
    purchasePrice: 620,
    mrp: 750,
    sellingPrice: 690,
    gstRate: 18,
    minStock: 40,
    reorderLevel: 60,
    supplierId: supplier.id,
    openingStock: 180,
  }, ownerUserId);

  // 4. Products: Paints & Primer
  const apexPaint = productService.createProduct({
    sku: 'PNT-APEX-EXT',
    name: 'Asian Paints Apex Weatherproof Exterior Emulsion',
    categoryId: emulsionCat.id,
    brandId: brandAsian.id,
    unitId: units['Litre'],
    purchasePrice: 0,
    mrp: 0,
    sellingPrice: 0,
    gstRate: 18,
    hasVariants: true,
    supplierId: supplier.id,
  }, ownerUserId);

  productService.addVariant(apexPaint.id, {
    sku: 'PNT-APEX-1L',
    name: '1 Litre Pack',
    attributes: { pack: '1L' },
    unitId: units['Litre'],
    purchasePrice: 280,
    mrp: 375,
    sellingPrice: 340,
    minStock: 10,
    openingStock: 45,
  }, ownerUserId);

  productService.addVariant(apexPaint.id, {
    sku: 'PNT-APEX-4L',
    name: '4 Litre Bucket',
    attributes: { pack: '4L' },
    unitId: units['Litre'],
    purchasePrice: 1020,
    mrp: 1420,
    sellingPrice: 1280,
    minStock: 8,
    openingStock: 30,
  }, ownerUserId);

  productService.addVariant(apexPaint.id, {
    sku: 'PNT-APEX-20L',
    name: '20 Litre Drum',
    attributes: { pack: '20L' },
    unitId: units['Litre'],
    purchasePrice: 4600,
    mrp: 6200,
    sellingPrice: 5650,
    minStock: 4,
    openingStock: 15,
  }, ownerUserId);

  productService.createProduct({
    sku: 'PNT-PRIMER-10L',
    name: 'Asian Paints TruCare Exterior Wall Primer 10L',
    categoryId: emulsionCat.id,
    brandId: brandAsian.id,
    unitId: units['Litre'],
    purchasePrice: 1100,
    mrp: 1550,
    sellingPrice: 1390,
    gstRate: 18,
    minStock: 6,
    reorderLevel: 10,
    supplierId: supplier.id,
    openingStock: 22,
  }, ownerUserId);

  // 5. Products: Astral CPVC & Sanitary
  const cpvcPipe = productService.createProduct({
    sku: 'PIPE-AST-CPVC',
    name: 'Astral CPVC PRO High-Pressure Pipe (3 Metre)',
    categoryId: cpvcCat.id,
    brandId: brandAstral.id,
    unitId: units['Piece'],
    purchasePrice: 0,
    mrp: 0,
    sellingPrice: 0,
    gstRate: 18,
    hasVariants: true,
    supplierId: supplier.id,
  }, ownerUserId);

  productService.addVariant(cpvcPipe.id, {
    sku: 'PIPE-CPVC-0.75IN',
    name: '3/4 inch (20mm) x 3M SDR 11',
    attributes: { size: '3/4 inch' },
    unitId: units['Piece'],
    purchasePrice: 180,
    mrp: 265,
    sellingPrice: 235,
    minStock: 25,
    openingStock: 120,
  }, ownerUserId);

  productService.addVariant(cpvcPipe.id, {
    sku: 'PIPE-CPVC-1IN',
    name: '1 inch (25mm) x 3M SDR 11',
    attributes: { size: '1 inch' },
    unitId: units['Piece'],
    purchasePrice: 290,
    mrp: 410,
    sellingPrice: 365,
    minStock: 20,
    openingStock: 90,
  }, ownerUserId);

  productService.createProduct({
    sku: 'SAN-PTMT-BIBCOCK',
    name: 'PTMT Long Body Water Tap (1/2 inch)',
    categoryId: tapsCat.id,
    brandId: brandAstral.id,
    unitId: units['Piece'],
    purchasePrice: 110,
    mrp: 180,
    sellingPrice: 150,
    gstRate: 18,
    minStock: 15,
    reorderLevel: 25,
    supplierId: supplier.id,
    openingStock: 75,
  }, ownerUserId);

  // 6. Products: Electricals
  productService.createProduct({
    sku: 'ELE-FINO-1.5SQ',
    name: 'Finolex Flame Retardant Copper Wire 1.5 sq mm (90m)',
    categoryId: wireCat.id,
    brandId: brandFinolex.id,
    unitId: units['Piece'],
    purchasePrice: 1650,
    mrp: 2300,
    sellingPrice: 1980,
    gstRate: 18,
    minStock: 8,
    reorderLevel: 15,
    supplierId: supplier.id,
    openingStock: 35,
  }, ownerUserId);

  productService.createProduct({
    sku: 'ELE-FINO-2.5SQ',
    name: 'Finolex FR PVC Insulated Copper Wire 2.5 sq mm (90m)',
    categoryId: wireCat.id,
    brandId: brandFinolex.id,
    unitId: units['Piece'],
    purchasePrice: 2600,
    mrp: 3550,
    sellingPrice: 3100,
    gstRate: 18,
    minStock: 6,
    reorderLevel: 12,
    supplierId: supplier.id,
    openingStock: 28,
  }, ownerUserId);

  productService.createProduct({
    sku: 'ELE-MOD-SWITCH-6A',
    name: 'Anchor Roma 1 Way 6A Modular Switch (White)',
    categoryId: switchCat.id,
    brandId: brandFinolex.id,
    unitId: units['Piece'],
    purchasePrice: 22,
    mrp: 45,
    sellingPrice: 35,
    gstRate: 18,
    minStock: 50,
    reorderLevel: 100,
    supplierId: supplier.id,
    openingStock: 300,
  }, ownerUserId);

  // 7. Products: Tools & Fasteners
  productService.createProduct({
    sku: 'TOOL-TAP-HAMMER',
    name: 'Taparia Steel Claw Hammer with Rubber Grip (450g)',
    categoryId: handTools.id,
    brandId: brandTaparia.id,
    unitId: units['Piece'],
    purchasePrice: 260,
    mrp: 390,
    sellingPrice: 330,
    gstRate: 18,
    minStock: 6,
    reorderLevel: 10,
    supplierId: supplier.id,
    openingStock: 25,
  }, ownerUserId);

  productService.createProduct({
    sku: 'TOOL-TAP-PLIER',
    name: 'Taparia 8-inch Insulated Combination Pliers',
    categoryId: handTools.id,
    brandId: brandTaparia.id,
    unitId: units['Piece'],
    purchasePrice: 230,
    mrp: 340,
    sellingPrice: 290,
    gstRate: 18,
    minStock: 10,
    reorderLevel: 15,
    supplierId: supplier.id,
    openingStock: 40,
  }, ownerUserId);
}

module.exports = { seedSampleData };
