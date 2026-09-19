'use strict';
const { now, slugify, AppError } = require('../util');

function createCatalogService(db, auditService) {
  // ---- Units ----------------------------------------------------------
  const STANDARD_UNITS = [
    ['Piece', 'pc'], ['Box', 'box'], ['Packet', 'pkt'], ['Kilogram', 'kg'], ['Gram', 'g'],
    ['Litre', 'l'], ['Millilitre', 'ml'], ['Meter', 'm'], ['Feet', 'ft'], ['Set', 'set'],
    ['Roll', 'roll'], ['Bundle', 'bundle'], ['Bag', 'bag'], ['Pair', 'pair'], ['Dozen', 'dozen'],
  ];
  async function seedStandardUnits() {
    for (const [name, abbr] of STANDARD_UNITS) {
      if (!await db.queryOne(`SELECT id FROM units WHERE name = ?`, [name])) {
        await db.run(`INSERT INTO units (name, abbreviation, is_custom, created_at) VALUES (?, ?, false, ?)`,
          [name, abbr, now()]);
      }
    }
  }
  async function createUnit(name, abbreviation, actingUserId = null) {
    await db.run(`INSERT INTO units (name, abbreviation, is_custom, created_at) VALUES (?, ?, true, ?)`,
      [name, abbreviation, now()]);
    const unit = await db.queryOne(`SELECT * FROM units WHERE name = ?`, [name]);
    await auditService.log({ userId: actingUserId, action: 'unit.create', entityType: 'unit', entityId: unit.id, after: unit });
    return unit;
  }
  async function listUnits() { return await db.query(`SELECT * FROM units ORDER BY name`); }

  // ---- Brands -----------------------------------------------------------
  async function createBrand({ name, logoUrl = null }, actingUserId = null) {
    const slug = slugify(name);
    await db.run(`INSERT INTO brands (name, slug, logo_url, created_at) VALUES (?, ?, ?, ?)`, [name, slug, logoUrl, now()]);
    const brand = await db.queryOne(`SELECT * FROM brands WHERE slug = ?`, [slug]);
    await auditService.log({ userId: actingUserId, action: 'brand.create', entityType: 'brand', entityId: brand.id, after: brand });
    return brand;
  }
  async function listBrands({ activeOnly = false } = {}) {
    return await db.query(`SELECT * FROM brands ${activeOnly ? 'WHERE is_active = true' : ''} ORDER BY sort_order, name`);
  }
  async function setBrandActive(id, isActive, actingUserId = null) {
    await db.run(`UPDATE brands SET is_active = ? WHERE id = ?`, [!!isActive, id]);
    await auditService.log({ userId: actingUserId, action: isActive ? 'brand.enable' : 'brand.disable', entityType: 'brand', entityId: id });
  }

  // ---- Suppliers ----------------------------------------------------------
  async function createSupplier(data, actingUserId = null) {
    await db.run(
      `INSERT INTO suppliers (name, contact_person, phone, email, address, gstin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.contactPerson || null, data.phone || null, data.email || null, data.address || null, data.gstin || null, now()]
    );
    const supplier = await db.queryOne(`SELECT * FROM suppliers WHERE phone IS NOT DISTINCT FROM ? ORDER BY id DESC LIMIT 1`, [data.phone || null]);
    await auditService.log({ userId: actingUserId, action: 'supplier.create', entityType: 'supplier', entityId: supplier.id, after: supplier });
    return supplier;
  }
  async function listSuppliers({ activeOnly = false } = {}) {
    return await db.query(`SELECT * FROM suppliers ${activeOnly ? 'WHERE is_active = true' : ''} ORDER BY name`);
  }

  // ---- Categories (self-referencing = category + subcategory in one table) --
  async function createCategory({ name, parentId = null, imageUrl = null }, actingUserId = null) {
    const slug = slugify(parentId ? `${parentId}-${name}` : name);
    await db.run(
      `INSERT INTO categories (parent_id, name, slug, image_url, created_at) VALUES (?, ?, ?, ?, ?)`,
      [parentId, name, slug, imageUrl, now()]
    );
    const cat = await db.queryOne(`SELECT * FROM categories WHERE slug = ?`, [slug]);
    await auditService.log({ userId: actingUserId, action: 'category.create', entityType: 'category', entityId: cat.id, after: cat });
    return cat;
  }

  async function listCategoryTree({ activeOnly = false } = {}) {
    const rows = await db.query(`SELECT * FROM categories ${activeOnly ? 'WHERE is_active = true' : ''} ORDER BY sort_order, name`);
    const byId = new Map(rows.map((r) => [r.id, { ...r, children: [] }]));
    const roots = [];
    for (const r of byId.values()) {
      if (r.parent_id && byId.has(r.parent_id)) byId.get(r.parent_id).children.push(r);
      else if (!r.parent_id) roots.push(r);
    }
    return roots;
  }

  async function setCategoryActive(id, isActive, actingUserId = null) {
    await db.run(`UPDATE categories SET is_active = ? WHERE id = ?`, [!!isActive, id]);
    await auditService.log({ userId: actingUserId, action: isActive ? 'category.enable' : 'category.disable', entityType: 'category', entityId: id });
  }

  async function deleteCategory(id, actingUserId = null) {
    const inUse = await db.queryOne(`SELECT COUNT(*) as c FROM products WHERE category_id = ? AND deleted_at IS NULL`, [id]);
    if (inUse.c > 0) throw new AppError('Cannot delete a category that has active products. Disable it instead.', 'CATEGORY_IN_USE');
    const child = await db.queryOne(`SELECT COUNT(*) as c FROM categories WHERE parent_id = ?`, [id]);
    if (child.c > 0) throw new AppError('Cannot delete a category that has subcategories.', 'CATEGORY_HAS_CHILDREN');
    await db.run(`DELETE FROM categories WHERE id = ?`, [id]);
    await auditService.log({ userId: actingUserId, action: 'category.delete', entityType: 'category', entityId: id });
  }

  async function reorderCategories(orderedIds, actingUserId = null) {
    for (const [idx, id] of orderedIds.entries()) await db.run(`UPDATE categories SET sort_order = ? WHERE id = ?`, [idx, id]);
    await auditService.log({ userId: actingUserId, action: 'category.reorder', entityType: 'category', entityId: 'bulk', after: orderedIds });
  }

  return {
    seedStandardUnits, createUnit, listUnits,
    createBrand, listBrands, setBrandActive,
    createSupplier, listSuppliers,
    createCategory, listCategoryTree, setCategoryActive, deleteCategory, reorderCategories,
  };
}

module.exports = { createCatalogService };
