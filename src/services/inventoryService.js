'use strict';
const { now, AppError } = require('../util');

// Transaction types and their sign convention (does this type add or remove stock)
const INBOUND_TYPES = new Set(['opening', 'purchase', 'customer_return']);
const OUTBOUND_TYPES = new Set(['sale', 'supplier_return', 'damaged']);
// 'adjustment', 'correction', 'transfer' can go either way — caller supplies the signed quantity.

function createInventoryService(db, auditService) {
  function _getOrCreateInventoryRow(productId, variantId) {
    let row = db.queryOne(
      `SELECT * FROM inventory WHERE product_id = ? AND (variant_id IS ? )`,
      [productId, variantId || null]
    );
    if (!row) {
      db.run(
        `INSERT INTO inventory (product_id, variant_id, quantity_on_hand, reserved_quantity, updated_at)
         VALUES (?, ?, 0, 0, ?)`,
        [productId, variantId || null, now()]
      );
      row = db.queryOne(`SELECT * FROM inventory WHERE product_id = ? AND (variant_id IS ?)`, [productId, variantId || null]);
    }
    return row;
  }

  /**
   * The ONLY sanctioned way to change stock. Every call inserts an immutable
   * ledger row (stock_transactions) and updates the materialized `inventory`
   * balance in the same DB transaction — they can never drift apart.
   *
   * @param {string} type one of the stock_transaction_type values
   * @param {number} quantity for inbound/outbound types, always a positive
   *        magnitude (the function applies the correct sign). For
   *        'adjustment'/'correction'/'transfer', pass a signed delta.
   */
  function recordStockTransaction({ productId, variantId = null, type, quantity, reason = null,
                                     referenceType = null, referenceId = null, performedBy = null }) {
    if (quantity === 0 || quantity === undefined || quantity === null) {
      throw new AppError('Quantity must be non-zero', 'INVALID_QUANTITY');
    }
    return db.transaction(() => {
      const invRow = _getOrCreateInventoryRow(productId, variantId);
      let signedChange;
      if (INBOUND_TYPES.has(type)) signedChange = Math.abs(quantity);
      else if (OUTBOUND_TYPES.has(type)) signedChange = -Math.abs(quantity);
      else signedChange = quantity; // adjustment / correction / transfer: caller controls sign

      const previousStock = invRow.quantity_on_hand;
      const newStock = previousStock + signedChange;

      if (newStock < 0 && !['adjustment', 'correction'].includes(type)) {
        throw new AppError(
          `Stock transaction would drive stock negative (current ${previousStock}, change ${signedChange}).`,
          'INSUFFICIENT_STOCK'
        );
      }

      db.run(`UPDATE inventory SET quantity_on_hand = ?, updated_at = ? WHERE id = ?`,
        [newStock, now(), invRow.id]);

      db.run(
        `INSERT INTO stock_transactions
           (product_id, variant_id, transaction_type, quantity_change, previous_stock, new_stock,
            reason, reference_type, reference_id, performed_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, variantId, type, signedChange, previousStock, newStock, reason, referenceType, referenceId, performedBy, now()]
      );

      auditService.log({
        userId: performedBy, action: 'stock.transaction', entityType: 'product', entityId: productId,
        before: { quantity_on_hand: previousStock }, after: { quantity_on_hand: newStock, type, reason },
      });

      return getStockStatus(productId, variantId);
    });
  }

  function reserveStock(productId, variantId, quantity) {
    const invRow = _getOrCreateInventoryRow(productId, variantId);
    const available = invRow.quantity_on_hand - invRow.reserved_quantity;
    if (quantity > available) {
      throw new AppError(`Only ${available} units are currently available.`, 'INSUFFICIENT_STOCK', { available });
    }
    db.run(`UPDATE inventory SET reserved_quantity = reserved_quantity + ?, updated_at = ? WHERE id = ?`,
      [quantity, now(), invRow.id]);
  }

  function releaseReservedStock(productId, variantId, quantity) {
    db.run(
      `UPDATE inventory SET reserved_quantity = MAX(0, reserved_quantity - ?), updated_at = ?
       WHERE product_id = ? AND (variant_id IS ?)`,
      [quantity, now(), productId, variantId || null]
    );
  }

  function getStockStatus(productId, variantId = null) {
    const row = db.queryOne(
      `SELECT i.*,
              COALESCE(v.min_stock, p.min_stock) as min_stock
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       LEFT JOIN product_variants v ON v.id = i.variant_id
       WHERE i.product_id = ? AND (i.variant_id IS ?)`,
      [productId, variantId || null]
    );
    if (!row) return { quantity_on_hand: 0, reserved_quantity: 0, available_quantity: 0, status: 'OUT_OF_STOCK' };
    const available = row.quantity_on_hand - row.reserved_quantity;
    let status = 'IN_STOCK';
    if (row.quantity_on_hand <= 0) status = 'OUT_OF_STOCK';
    else if (row.quantity_on_hand <= row.min_stock) status = 'LOW_STOCK';
    return { quantity_on_hand: row.quantity_on_hand, reserved_quantity: row.reserved_quantity, available_quantity: available, status };
  }

  function listLowStock() {
    return db.query(`
      SELECT p.id as product_id, p.name, p.sku, i.quantity_on_hand, p.min_stock, s.name as supplier_name
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      LEFT JOIN suppliers s ON s.id = p.supplier_id
      WHERE i.variant_id IS NULL AND p.deleted_at IS NULL
        AND i.quantity_on_hand > 0 AND i.quantity_on_hand <= p.min_stock
      ORDER BY i.quantity_on_hand ASC
    `);
  }

  function listOutOfStock() {
    return db.query(`
      SELECT p.id as product_id, p.name, p.sku, i.quantity_on_hand, s.name as supplier_name
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      LEFT JOIN suppliers s ON s.id = p.supplier_id
      WHERE i.variant_id IS NULL AND p.deleted_at IS NULL AND i.quantity_on_hand <= 0
      ORDER BY p.name
    `);
  }

  function transactionHistory(productId, variantId = null, limit = 50) {
    return db.query(
      `SELECT * FROM stock_transactions WHERE product_id = ? AND (variant_id IS ?)
       ORDER BY created_at DESC LIMIT ?`,
      [productId, variantId || null, limit]
    );
  }

  /** Cross-product ledger view for an admin "Stock Transaction Log" screen. */
  function listRecentTransactions(limit = 100) {
    return db.query(
      `SELECT st.*, p.name as product_name, p.sku as product_sku, v.name as variant_name
       FROM stock_transactions st
       JOIN products p ON p.id = st.product_id
       LEFT JOIN product_variants v ON v.id = st.variant_id
       ORDER BY st.created_at DESC LIMIT ?`,
      [limit]
    );
  }

  /**
   * Convenience for admin inline-edit UIs: caller supplies the desired
   * absolute stock count, this computes the signed delta and records it as
   * an 'adjustment' transaction. Still goes through recordStockTransaction —
   * still never a direct overwrite of the inventory row.
   */
  function adjustStockTo({ productId, variantId = null, newQuantity, reason, performedBy = null }) {
    const current = getStockStatus(productId, variantId).quantity_on_hand;
    const delta = newQuantity - current;
    if (delta === 0) return getStockStatus(productId, variantId);
    return recordStockTransaction({
      productId, variantId, type: 'adjustment', quantity: delta,
      reason: reason || 'Inline admin stock edit', performedBy,
    });
  }

  return {
    recordStockTransaction, reserveStock, releaseReservedStock, adjustStockTo,
    getStockStatus, listLowStock, listOutOfStock, transactionHistory, listRecentTransactions,
  };
}

module.exports = { createInventoryService };
