'use strict';
const { createApp } = require('../src/app');
const { seedSampleData } = require('../src/seed/seed');

function section(title) {
  console.log('\n' + '='.repeat(78));
  console.log(title);
  console.log('='.repeat(78));
}

function assert(cond, msg) {
  if (!cond) { console.error('❌ ASSERTION FAILED: ' + msg); process.exitCode = 1; }
  else console.log('✅ ' + msg);
}

function main() {
  const app = createApp();
  app.bootstrap();

  section('1. AUTH & ROLES');
  const owner = app.userService.createUser({
    name: 'Sarat Dey', phone: '9547512088', password: 'ChangeMe123!', roleName: 'owner',
  });
  console.log('Created owner user:', { id: owner.id, name: owner.name, role: owner.role_name });
  assert(app.userService.hasPermission(owner, 'anything.at.all'), 'owner role has wildcard permission');

  const staff = app.userService.createUser({
    name: '(SAMPLE) Staff Member', phone: '9000000000', password: 'staffpass', roleName: 'staff',
  }, owner.id);
  assert(!app.userService.hasPermission(staff, 'products.manage'), 'staff role cannot manage products');
  assert(app.userService.hasPermission(staff, 'products.view'), 'staff role can view products');

  const authed = app.userService.authenticate('9547512088', 'ChangeMe123!');
  assert(authed.id === owner.id, 'owner can authenticate with correct password');
  let authFailed = false;
  try { app.userService.authenticate('9547512088', 'wrongpassword'); } catch (e) { authFailed = true; }
  assert(authFailed, 'wrong password is rejected');

  section('2. BUSINESS SETTINGS (owner-editable, not hard-coded)');
  console.log('WhatsApp number:', app.settingsService.get('whatsapp_number'));
  console.log('Delivery config:', app.settingsService.get('delivery'));
  app.settingsService.set('delivery', { ...app.settingsService.get('delivery'), free_delivery_threshold: 2500 }, owner.id);
  assert(app.settingsService.get('delivery').free_delivery_threshold === 2500, 'owner can change delivery settings at runtime');

  section('3. CATALOG: categories, brands, suppliers, units');
  const { hammer, cementBag, paint, pvcPipe, categories, brand } = seedSampleData(app, owner.id);
  const tree = app.catalogService.listCategoryTree();
  console.log('Category tree:', JSON.stringify(tree.map((c) => ({ name: c.name, children: c.children.map((x) => x.name) })), null, 2));
  assert(tree.find((c) => c.name === 'Hardware').children.some((c) => c.name === 'Hand Tools'), 'subcategory nests under parent category');

  let deleteBlocked = false;
  try { app.catalogService.deleteCategory(categories.handTools.id, owner.id); } catch (e) { deleteBlocked = true; }
  assert(deleteBlocked, 'cannot delete a category that has active products (data integrity rule enforced)');

  section('4. PRODUCTS & VARIANTS');
  console.log('Simple product:', { sku: hammer.sku, name: hammer.name, stock: hammer.stock });
  assert(hammer.stock.status === 'IN_STOCK', 'hammer with 40 units vs min 10 is IN_STOCK');
  assert(cementBag.stock.status === 'LOW_STOCK', 'cement bag with 8 units vs min 20 is LOW_STOCK');
  assert(paint.stock.status === 'OUT_OF_STOCK', 'paint with 0 opening stock is OUT_OF_STOCK');

  const pvcWithVariants = app.productService.getProductById(pvcPipe.id);
  console.log('Variant product:', pvcWithVariants.name, '-> variants:',
    pvcWithVariants.variants.map((v) => ({ sku: v.sku, name: v.name, stock: v.stock })));
  assert(pvcWithVariants.variants.length === 2, 'PVC Pipe product has 2 independent variants');
  assert(pvcWithVariants.variants[1].stock.status === 'LOW_STOCK', '2-inch variant (5 units vs min 10) is LOW_STOCK independent of the 1-inch variant');

  let dupBlocked = false;
  try { app.productService.createProduct({ sku: hammer.sku, name: 'x', categoryId: categories.hardware.id, unitId: 1 }); }
  catch (e) { dupBlocked = true; }
  assert(dupBlocked, 'duplicate SKU is rejected on create');

  const hammerCopy = app.productService.duplicateProduct(hammer.id, {}, owner.id);
  assert(hammerCopy.sku !== hammer.sku && hammerCopy.is_active === 0, 'duplicate creates a new inactive product with a new SKU');

  section('5. INVENTORY — stock only moves through recorded transactions');
  const beforeSale = app.inventoryService.getStockStatus(hammer.id);
  app.inventoryService.recordStockTransaction({
    productId: hammer.id, type: 'sale', quantity: 5, reason: 'POS sale #demo-1', performedBy: owner.id,
  });
  const afterSale = app.inventoryService.getStockStatus(hammer.id);
  console.log(`Hammer stock before sale: ${beforeSale.quantity_on_hand}, after selling 5: ${afterSale.quantity_on_hand}`);
  assert(afterSale.quantity_on_hand === beforeSale.quantity_on_hand - 5, 'sale transaction reduces stock by exactly the sold quantity');

  let oversellBlocked = false;
  try {
    app.inventoryService.recordStockTransaction({ productId: paint.id, type: 'sale', quantity: 3, performedBy: owner.id });
  } catch (e) { oversellBlocked = true; console.log('Overselling blocked with message:', e.message); }
  assert(oversellBlocked, 'cannot sell more than available stock (no overselling, matches checkout requirement)');

  app.inventoryService.recordStockTransaction({
    productId: paint.id, type: 'purchase', quantity: 24, reason: 'Goods received from supplier', performedBy: owner.id,
  });
  assert(app.inventoryService.getStockStatus(paint.id).status === 'IN_STOCK', 'receiving purchase stock brings product back to IN_STOCK');

  const history = app.inventoryService.transactionHistory(hammer.id);
  console.log('Hammer stock ledger:', history.map((h) => ({ type: h.transaction_type, change: h.quantity_change, new_stock: h.new_stock })));
  assert(history.length === 2, 'every stock movement is preserved in the immutable ledger (opening + sale)');

  const lowStock = app.inventoryService.listLowStock();
  const outOfStock = app.inventoryService.listOutOfStock();
  console.log('Low stock dashboard:', lowStock.map((p) => p.name));
  console.log('Out of stock dashboard:', outOfStock.map((p) => p.name));
  assert(lowStock.some((p) => p.sku === cementBag.sku), 'cement bag correctly appears on the Low Stock dashboard');

  section('6. PRICE MANAGEMENT — single change + bulk update with preview');
  const priceChange = app.priceService.changePrice({
    productId: hammer.id, priceField: 'selling_price', newPrice: 235, reason: 'Manual reprice', changedBy: owner.id,
  });
  console.log('Single price change:', priceChange);
  assert(app.productService.getProductById(hammer.id).selling_price === 235, 'single price change is applied');
  assert(app.priceService.history(hammer.id).length === 1, 'price change recorded in price_history');

  const preview = app.priceService.previewBulkUpdate({ categoryId: categories.hardware.id }, { mode: 'percent', value: 5 });
  console.log('Bulk update PREVIEW (not yet applied):', preview);
  assert(preview.affectedCount >= 1, 'bulk preview finds matching products');
  const beforeApplyPrice = app.productService.getProductById(hammer.id).selling_price;

  const applied = app.priceService.applyBulkUpdate({ categoryId: categories.hardware.id }, { mode: 'percent', value: 5 },
    { reason: '(SAMPLE) Seasonal +5% on Hardware', changedBy: owner.id });
  const afterApplyPrice = app.productService.getProductById(hammer.id).selling_price;
  console.log(`Hammer selling price before bulk update: ${beforeApplyPrice}, after +5%: ${afterApplyPrice}`);
  assert(Math.abs(afterApplyPrice - beforeApplyPrice * 1.05) < 0.01, 'bulk +5% update applies correctly and matches preview math');
  assert(app.priceService.history(hammer.id).length === 2, 'bulk update adds a second price_history row (full trail preserved)');

  section('7. BULK CSV IMPORT — validation before write');
  const csv = [
    'name,sku,category,unit,purchase_price,mrp,selling_price,gst,stock,min_stock',
    '(SAMPLE) Screwdriver Set,SAMPLE-SDS-001,Hand Tools,Piece,120,200,180,18,25,5',
    '(SAMPLE) Bad Row Missing Price,SAMPLE-BAD-001,Hand Tools,Piece,,200,180,18,25,5',
    '(SAMPLE) Unknown Category,SAMPLE-CAT-001,Not A Real Category,Piece,50,80,70,18,10,2',
    `(SAMPLE) Duplicate Existing SKU,${hammer.sku},Hand Tools,Piece,50,80,70,18,10,2`,
  ].join('\n');
  const rows = app.importService.parseCsv(csv);
  const validation = app.importService.validateRows(rows);
  console.log(`Import validation: ${validation.valid.length} valid, ${validation.invalid.length} invalid out of ${validation.totalRows}`);
  console.log('Invalid rows detail:', JSON.stringify(validation.invalid, null, 2));
  assert(validation.valid.length === 1, 'exactly one row passes validation (the well-formed one)');
  assert(validation.invalid.length === 3, 'missing field, unknown category, and duplicate SKU are all caught before any DB write');

  const result = app.importService.runImport({ fileName: 'sample-import.csv', rows, apply: true, actingUserId: owner.id });
  console.log('Import applied:', result);
  assert(result.createdCount === 1, 'only the valid row was actually created; bad rows never touched the database');

  section('8. AUDIT LOG — every mutating action left a trail');
  const recentAudit = app.auditService.recent(10);
  console.log(`Most recent ${recentAudit.length} audit entries:`, recentAudit.map((a) => a.action));
  assert(recentAudit.some((a) => a.action === 'price.bulk_update'), 'bulk price update is audited');
  assert(recentAudit.some((a) => a.action === 'stock.transaction'), 'stock transactions are audited');
  assert(recentAudit.some((a) => a.action === 'product.create'), 'product creation is audited');

  section('DONE');
  if (process.exitCode === 1) {
    console.log('\n❌ One or more checks FAILED — see above.');
  } else {
    console.log('\n✅ All Phase 1 checks passed. Schema + business logic verified end to end.');
  }
}

main();
