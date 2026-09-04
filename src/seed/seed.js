'use strict';
// ============================================================================
// SAMPLE DATA — for demonstrating the platform only.
// No real product, price, brand, or stock figures were provided for Maa
// Laxmi Hardware, so everything below is clearly fictional placeholder data
// the owner will replace via Admin > Products (or bulk CSV import) once the
// storefront phase is built. Do not treat any number here as real.
// ============================================================================

function seedSampleData(app, ownerUserId) {
  const { catalogService, productService } = app;

  const hardware = catalogService.createCategory({ name: 'Hardware' }, ownerUserId);
  const handTools = catalogService.createCategory({ name: 'Hand Tools', parentId: hardware.id }, ownerUserId);
  const fasteners = catalogService.createCategory({ name: 'Fasteners', parentId: hardware.id }, ownerUserId);

  const paints = catalogService.createCategory({ name: 'Paints' }, ownerUserId);
  const interiorPaint = catalogService.createCategory({ name: 'Interior Paint', parentId: paints.id }, ownerUserId);

  const pipes = catalogService.createCategory({ name: 'Pipes & Fittings' }, ownerUserId);
  const pvcPipes = catalogService.createCategory({ name: 'PVC Pipes', parentId: pipes.id }, ownerUserId);

  const brand = catalogService.createBrand({ name: '(SAMPLE) Generic Brand' }, ownerUserId);
  const supplier = catalogService.createSupplier({
    name: '(SAMPLE) Local Distributor', phone: '0000000000', address: 'Sample supplier address',
  }, ownerUserId);

  const units = Object.fromEntries(catalogService.listUnits().map((u) => [u.name, u.id]));

  // A simple, non-variant product
  const hammer = productService.createProduct({
    sku: 'SAMPLE-HAM-001', name: '(SAMPLE) Claw Hammer', categoryId: handTools.id, brandId: brand.id,
    unitId: units['Piece'], purchasePrice: 150, mrp: 250, sellingPrice: 220, gstRate: 18,
    minStock: 10, reorderLevel: 15, supplierId: supplier.id, openingStock: 40,
  }, ownerUserId);

  const cementBag = productService.createProduct({
    sku: 'SAMPLE-CEM-001', name: '(SAMPLE) Cement Bag 50kg', categoryId: hardware.id, brandId: brand.id,
    unitId: units['Bag'], purchasePrice: 340, mrp: 400, sellingPrice: 380, gstRate: 28,
    minStock: 20, reorderLevel: 30, supplierId: supplier.id, openingStock: 8, // intentionally low, to demo LOW_STOCK
  }, ownerUserId);

  const paint = productService.createProduct({
    sku: 'SAMPLE-PNT-001', name: '(SAMPLE) Interior Emulsion Paint', categoryId: interiorPaint.id, brandId: brand.id,
    unitId: units['Litre'], purchasePrice: 180, mrp: 260, sellingPrice: 240, gstRate: 18,
    minStock: 5, reorderLevel: 10, supplierId: supplier.id, openingStock: 0, // intentionally zero, to demo OUT_OF_STOCK
  }, ownerUserId);

  // A variant product: PVC Pipe sold as several size/length combinations
  const pvcPipe = productService.createProduct({
    sku: 'SAMPLE-PVC-000', name: '(SAMPLE) PVC Pipe', categoryId: pvcPipes.id, brandId: brand.id,
    unitId: units['Piece'], purchasePrice: 0, mrp: 0, sellingPrice: 0, gstRate: 18,
    hasVariants: true, supplierId: supplier.id,
  }, ownerUserId);

  productService.addVariant(pvcPipe.id, {
    sku: 'SAMPLE-PVC-1IN-3M', name: '1 inch x 3 metre', attributes: { diameter: '1 inch', length: '3 metre' },
    unitId: units['Piece'], purchasePrice: 90, mrp: 140, sellingPrice: 130, minStock: 15, openingStock: 60,
  }, ownerUserId);

  productService.addVariant(pvcPipe.id, {
    sku: 'SAMPLE-PVC-2IN-6M', name: '2 inch x 6 metre', attributes: { diameter: '2 inch', length: '6 metre' },
    unitId: units['Piece'], purchasePrice: 220, mrp: 320, sellingPrice: 300, minStock: 10, openingStock: 5,
  }, ownerUserId);

  return { hammer, cementBag, paint, pvcPipe, categories: { hardware, handTools, fasteners, paints, interiorPaint, pipes, pvcPipes }, brand, supplier };
}

module.exports = { seedSampleData };
