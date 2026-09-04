'use strict';
const { now } = require('../util');

// Sensible defaults the owner can change from Admin > Settings without
// touching code. Nothing business-specific is hard-coded elsewhere.
const DEFAULT_SETTINGS = {
  business_name: 'Maa Laxmi Hardware',
  proprietor_name: 'Sarat Dey',
  address: { line1: 'Nakrakonda', district: 'Birbhum', state: 'West Bengal', pincode: '731125', country: 'India' },
  phone_numbers: ['9547512088', '7679911927'],
  whatsapp_number: '919547512088',
  invoice_prefix: 'MLH-INV',
  quotation_prefix: 'MLH-QUO',
  invoice_next_number: 1,
  quotation_next_number: 1,
  gst_registered: false,
  delivery: {
    enabled: true,
    pincodes: ['731125'],
    free_delivery_threshold: 2000,
    flat_delivery_charge: 100,
  },
  business_hours: { mon_sat: '8:00 AM - 8:00 PM', sun: '9:00 AM - 2:00 PM' },
};

function createSettingsService(db, auditService) {
  function seedDefaults() {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = db.queryOne(`SELECT key FROM business_settings WHERE key = ?`, [key]);
      if (!existing) {
        db.run(`INSERT INTO business_settings (key, value, updated_at) VALUES (?, ?, ?)`,
          [key, JSON.stringify(value), now()]);
      }
    }
  }

  function get(key) {
    const row = db.queryOne(`SELECT * FROM business_settings WHERE key = ?`, [key]);
    return row ? JSON.parse(row.value) : undefined;
  }

  function getAll() {
    const rows = db.query(`SELECT * FROM business_settings`);
    const out = {};
    for (const r of rows) out[r.key] = JSON.parse(r.value);
    return out;
  }

  function set(key, value, actingUserId = null) {
    const before = get(key);
    const existing = db.queryOne(`SELECT key FROM business_settings WHERE key = ?`, [key]);
    if (existing) {
      db.run(`UPDATE business_settings SET value = ?, updated_by = ?, updated_at = ? WHERE key = ?`,
        [JSON.stringify(value), actingUserId, now(), key]);
    } else {
      db.run(`INSERT INTO business_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?)`,
        [key, JSON.stringify(value), actingUserId, now()]);
    }
    auditService.log({ userId: actingUserId, action: 'settings.update', entityType: 'business_settings',
      entityId: key, before, after: value });
    return value;
  }

  return { seedDefaults, get, getAll, set, DEFAULT_SETTINGS };
}

module.exports = { createSettingsService };
