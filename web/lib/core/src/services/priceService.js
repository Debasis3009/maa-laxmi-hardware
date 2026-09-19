'use strict';
const { uuid, now, AppError } = require('../util');

const ALLOWED_PRICE_FIELDS = ['purchase_price', 'mrp', 'retail_price', 'wholesale_price', 'dealer_price', 'selling_price'];

async function createPriceService(db, auditService) {
  /** Change one price field on one product and record history. Never a silent overwrite. */
  async function changePrice({ productId, priceField, newPrice, reason, changedBy = null, batchId = null }) {
    if (!ALLOWED_PRICE_FIELDS.includes(priceField)) throw new AppError(`Invalid price field: ${priceField}`, 'VALIDATION_ERROR');
    const product = await db.queryOne(`SELECT id, ${priceField} as old_price FROM products WHERE id = ?`, [productId]);
    if (!product) throw new AppError('Product not found', 'NOT_FOUND');

    await db.run(`UPDATE products SET ${priceField} = ?, updated_at = ? WHERE id = ?`, [newPrice, now(), productId]);
    await db.run(
      `INSERT INTO price_history (product_id, price_field, old_price, new_price, changed_by, reason, batch_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, priceField, product.old_price, newPrice, changedBy, reason, batchId, now()]
    );
    return { productId, priceField, oldPrice: product.old_price, newPrice };
  }

  /**
   * Build a preview of a bulk price update WITHOUT applying it.
   * filter: { categoryId?, brandId?, productIds? }
   * change: { mode: 'percent'|'flat'|'set', value: number, priceField?: string }
   */
  async function previewBulkUpdate(filter, change) {
    const priceField = change.priceField || 'selling_price';
    const products = _resolveFilteredProducts(filter);
    const rows = products.map((p) => {
      const oldPrice = p[priceField];
      const newPrice = _applyChange(oldPrice, change);
      return { productId: p.id, sku: p.sku, name: p.name, oldPrice, newPrice: Math.round(newPrice * 100) / 100 };
    });
    const avgOld = rows.length ? rows.reduce((s, r) => s + r.oldPrice, 0) / rows.length : 0;
    const avgNew = rows.length ? rows.reduce((s, r) => s + r.newPrice, 0) / rows.length : 0;
    return {
      priceField, affectedCount: rows.length,
      averageOldPrice: Math.round(avgOld * 100) / 100, averageNewPrice: Math.round(avgNew * 100) / 100,
      rows,
    };
  }

  /** Apply a previously-previewed bulk update. Every row gets a price_history entry tagged with the same batch_id. */
  async function applyBulkUpdate(filter, change, { reason, changedBy = null } = {}) {
    const preview = previewBulkUpdate(filter, change);
    const batchId = uuid();
    db.transaction(() => {
      for (const row of preview.rows) {
        changePrice({
          productId: row.productId, priceField: preview.priceField, newPrice: row.newPrice,
          reason: reason || `Bulk update (${change.mode} ${change.value})`, changedBy, batchId,
        });
      }
    });
    await auditService.log({
      userId: changedBy, action: 'price.bulk_update', entityType: 'price_batch', entityId: batchId,
      after: { filter, change, affectedCount: preview.affectedCount },
    });
    return { batchId, ...preview };
  }

  async function _applyChange(oldPrice, change) {
    if (change.mode === 'percent') return oldPrice * (1 + change.value / 100);
    if (change.mode === 'flat') return oldPrice + change.value;
    if (change.mode === 'set') return change.value;
    throw new AppError(`Unknown bulk update mode: ${change.mode}`, 'VALIDATION_ERROR');
  }

  async function _resolveFilteredProducts(filter = {}) {
    const clauses = ['deleted_at IS NULL'];
    const params = [];
    if (filter.categoryId) {
      // "By category" includes all subcategories underneath it, e.g. updating
      // "Hardware" also reaches products filed under "Hand Tools".
      const descendantIds = await db.query(
        `WITH RECURSIVE cat_tree(id) AS (
           SELECT id FROM categories WHERE id = ?
           UNION ALL
           SELECT c.id FROM categories c JOIN cat_tree t ON c.parent_id = t.id
         ) SELECT id FROM cat_tree`,
        [filter.categoryId]
      ).map((r) => r.id);
      clauses.push(`category_id IN (${descendantIds.map(() => '?').join(',')})`);
      params.push(...descendantIds);
    }
    if (filter.brandId) { clauses.push('brand_id = ?'); params.push(filter.brandId); }
    if (filter.productIds && filter.productIds.length) {
      clauses.push(`id IN (${filter.productIds.map(() => '?').join(',')})`);
      params.push(...filter.productIds);
    }
    return await db.query(`SELECT * FROM products WHERE ${clauses.join(' AND ')}`, params);
  }

  async function history(productId, limit = 50) {
    return await db.query(`SELECT * FROM price_history WHERE product_id = ? ORDER BY created_at DESC LIMIT ?`, [productId, limit]);
  }

  return { changePrice, previewBulkUpdate, applyBulkUpdate, history };
}

module.exports = { createPriceService };
