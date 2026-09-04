'use strict';
const { now, slugify, AppError } = require('../util');

function createCatalogService(db, auditService) {
  // ---- Units ----------------------------------------------------------
  const STANDARD_UNITS = [
    ['Piece', 'pc'], ['Box', 'box'], ['Packet', 'pkt'], ['Kilogram', 'kg'], ['Gram', 'g'],
    ['Litre', 'l'], ['Millilitre', 'ml'], ['Meter', 'm'], ['Feet', 'ft'], ['Set', 'set'],
    ['Roll', 'roll'], ['Bundle', 'bundle'], ['Bag', 'bag'], ['Pair', 'pair'], ['Dozen', 'dozen'],
  ];
  function seedStandardUnits() {
    for (const [name, abbr] of STANDARD_UNITS) {
      if (!db.queryOne(`SELECT id FROM units WHERE name = ?`, [name])) {
        db.run(`INSERT INTO units (name, abbreviation, is_custom, created_at) VALUES (?, ?, 0, ?)`,
          [name, abbr, now()]);
      }
    }
  }
  function createUnit(name, abbreviation, actingUserId = null) {
    db.run(`INSERT INTO units (name, abbreviation, is_custom, created_at) VALUES (?, ?, 1, ?)`,
      [name, abbreviation, now()]);
    const unit = db.queryOne(`SELECT * FROM units WHERE name = ?`, [name]);
    auditService.log({ userId: actingUserId, action: 'unit.create', entityType: 'unit', entityId: unit.id, after: unit });
    return unit;
  }
  function listUnits() { return db.query(`SELECT * FROM units ORDER BY name`); }

  // ---- Brands -----------------------------------------------------------
  function createBrand({ name, logoUrl = null }, actingUserId = null) {
    const slug = slugify(name);
    db.run(`INSERT INTO brands (name, slug, logo_url, created_at) VALUES (?, ?, ?, ?)`, [name, slug, logoUrl, now()]);
    const brand = db.queryOne(`SELECT * FROM brands WHERE slug = ?`, [slug]);
    auditService.log({ userId: actingUserId, action: 'brand.create', entityType: 'brand', entityId: brand.id, after: brand });
    return brand;
  }
  function listBrands({ activeOnly = false } = {}) {
    return db.query(`SELECT * FROM brands ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY sort_order, name`);
  }
  function setBrandActive(id, isActive, actingUserId = null) {
    db.run(`UPDATE brands SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    auditService.log({ userId: actingUserId, action: isActive ? 'brand.enable' : 'brand.disable', entityType: 'brand', entityId: id });
  }

  // ---- Suppliers ----------------------------------------------------------
  function createSupplier(data, actingUserId = null) {
    db.run(
      `INSERT INTO suppliers (name, contact_person, phone, email, address, gstin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.contactPerson || null, data.phone || null, data.email || null, data.address || null, data.gstin || null, now()]
    );
    const supplier = db.queryOne(`SELECT * FROM suppliers WHERE rowid = last_insert_rowid()`);
    auditService.log({ userId: actingUserId, action: 'supplier.create', entityType: 'supplier', entityId: supplier.id, after: supplier });
    return supplier;
  }
  function listSuppliers({ activeOnly = false } = {}) {
    return db.query(`SELECT * FROM suppliers ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY name`);
  }

  // ---- Categories (self-referencing = category + subcategory in one table) --
  function createCategory({ name, parentId = null, imageUrl = null }, actingUserId = null) {
    const slug = slugify(parentId ? `${parentId}-${name}` : name);
    db.run(
      `INSERT INTO categories (parent_id, name, slug, image_url, created_at) VALUES (?, ?, ?, ?, ?)`,
      [parentId, name, slug, imageUrl, now()]
    );
    const cat = db.queryOne(`SELECT * FROM categories WHERE slug = ?`, [slug]);
    auditService.log({ userId: actingUserId, action: 'category.create', entityType: 'category', entityId: cat.id, after: cat });
    return cat;
  }

  function listCategoryTree({ activeOnly = false } = {}) {
    const rows = db.query(`SELECT * FROM categories ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY sort_order, name`);
    const byId = new Map(rows.map((r) => [r.id, { ...r, children: [] }]));
    const roots = [];
    for (const r of byId.values()) {
      if (r.parent_id && byId.has(r.parent_id)) byId.get(r.parent_id).children.push(r);
      else if (!r.parent_id) roots.push(r);
    }
    return roots;
  }

  function setCategoryActive(id, isActive, actingUserId = null) {
    db.run(`UPDATE categories SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    auditService.log({ userId: actingUserId, action: isActive ? 'category.enable' : 'category.disable', entityType: 'category', entityId: id });
  }

  function deleteCategory(id, actingUserId = null) {
    const inUse = db.queryOne(`SELECT COUNT(*) as c FROM products WHERE category_id = ? AND deleted_at IS NULL`, [id]);
    if (inUse.c > 0) throw new AppError('Cannot delete a category that has active products. Disable it instead.', 'CATEGORY_IN_USE');
    const child = db.queryOne(`SELECT COUNT(*) as c FROM categories WHERE parent_id = ?`, [id]);
    if (child.c > 0) throw new AppError('Cannot delete a category that has subcategories.', 'CATEGORY_HAS_CHILDREN');
    db.run(`DELETE FROM categories WHERE id = ?`, [id]);
    auditService.log({ userId: actingUserId, action: 'category.delete', entityType: 'category', entityId: id });
  }

  function reorderCategories(orderedIds, actingUserId = null) {
    orderedIds.forEach((id, idx) => db.run(`UPDATE categories SET sort_order = ? WHERE id = ?`, [idx, id]));
    auditService.log({ userId: actingUserId, action: 'category.reorder', entityType: 'category', entityId: 'bulk', after: orderedIds });
  }

  return {
    seedStandardUnits, createUnit, listUnits,
    createBrand, listBrands, setBrandActive,
    createSupplier, listSuppliers,
    createCategory, listCategoryTree, setCategoryActive, deleteCategory, reorderCategories,
  };
}

module.exports = { createCatalogService };
