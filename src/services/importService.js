'use strict';
const { uuid, now } = require('../util');

// Column set matches the "BULK PRODUCT MANAGEMENT" spec. Excel import in the
// real app will parse .xlsx with SheetJS into this same array-of-objects
// shape and hand it to `validateRows` unchanged — the validator doesn't
// care whether the rows came from CSV or Excel.
const REQUIRED_COLUMNS = ['name', 'sku', 'category', 'unit', 'purchase_price', 'mrp', 'selling_price'];

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).filter(Boolean).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = cells[i]; });
    return row;
  });
}

function createImportService(db, { catalogService, productService }) {
  /**
   * Validate rows against catalog reality (does the category/unit exist?)
   * and basic data rules, WITHOUT writing anything to the DB.
   * Returns { valid: [...], invalid: [{row, errors}], duplicates: [...] }
   */
  function validateRows(rows) {
    const categories = new Map(catalogService.listCategoryTree().flatMap(flattenCat).map((c) => [c.name.toLowerCase(), c]));
    const units = new Map(catalogService.listUnits().map((u) => [u.name.toLowerCase(), u]));
    const existingSkus = new Set(db.query(`SELECT sku FROM products`).map((r) => r.sku));
    const seenInFile = new Set();

    const valid = [];
    const invalid = [];
    const duplicates = [];

    rows.forEach((row, idx) => {
      const errors = [];
      for (const col of REQUIRED_COLUMNS) {
        if (!row[col] || String(row[col]).trim() === '') errors.push(`Missing required field: ${col}`);
      }
      if (row.sku) {
        if (existingSkus.has(row.sku)) errors.push(`SKU already exists in database: ${row.sku}`);
        if (seenInFile.has(row.sku)) { duplicates.push({ line: idx + 2, sku: row.sku }); errors.push(`Duplicate SKU within file: ${row.sku}`); }
        seenInFile.add(row.sku);
      }
      if (row.category && !categories.has(String(row.category).toLowerCase())) errors.push(`Unknown category: ${row.category}`);
      if (row.unit && !units.has(String(row.unit).toLowerCase())) errors.push(`Unknown unit: ${row.unit}`);
      for (const numField of ['purchase_price', 'mrp', 'selling_price', 'stock', 'min_stock', 'max_stock']) {
        if (row[numField] !== undefined && row[numField] !== '' && isNaN(Number(row[numField]))) {
          errors.push(`${numField} must be a number, got "${row[numField]}"`);
        }
      }

      if (errors.length) invalid.push({ line: idx + 2, row, errors });
      else valid.push({ line: idx + 2, row, categoryId: categories.get(row.category.toLowerCase()).id, unitId: units.get(row.unit.toLowerCase()).id });
    });

    return { totalRows: rows.length, valid, invalid, duplicates };
  }

  function flattenCat(node) {
    return [node, ...(node.children || []).flatMap(flattenCat)];
  }

  /** Persist an import_batches record (traceability) and, if requested, apply the valid rows. */
  function runImport({ fileName, rows, apply = false, actingUserId = null }) {
    const { totalRows, valid, invalid } = validateRows(rows);
    const batchId = uuid();
    db.run(
      `INSERT INTO import_batches (id, file_name, imported_by, total_rows, valid_rows, invalid_rows, status, error_report, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [batchId, fileName, actingUserId, totalRows, valid.length, invalid.length,
       apply ? 'applied' : 'pending', JSON.stringify(invalid), now()]
    );

    let created = [];
    if (apply) {
      created = valid.map(({ row, categoryId, unitId }) =>
        productService.createProduct({
          sku: row.sku, name: row.name, categoryId, unitId,
          purchasePrice: Number(row.purchase_price), mrp: Number(row.mrp), sellingPrice: Number(row.selling_price),
          gstRate: row.gst ? Number(row.gst) : 0, minStock: row.min_stock ? Number(row.min_stock) : 0,
          maxStock: row.max_stock ? Number(row.max_stock) : null,
          openingStock: row.stock ? Number(row.stock) : 0,
        }, actingUserId)
      );
    }

    return { batchId, totalRows, validCount: valid.length, invalidCount: invalid.length, invalid, createdCount: created.length };
  }

  return { parseCsv, validateRows, runImport, REQUIRED_COLUMNS };
}

module.exports = { createImportService };
