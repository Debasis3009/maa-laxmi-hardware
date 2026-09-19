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
  function decodeValue(value) {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return value;
    try { return JSON.parse(trimmed); } catch { return value; }
  }
  async function seedDefaults() {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = await db.queryOne(`SELECT key FROM business_settings WHERE key = ?`, [key]);
      if (!existing) {
        await db.run(`INSERT INTO business_settings (key, value, updated_at) VALUES (?, ?, ?)`,
          [key, JSON.stringify(value), now()]);
      }
    }
  }

  async function get(key) {
    const row = await db.queryOne(`SELECT * FROM business_settings WHERE key = ?`, [key]);
    return row ? decodeValue(row.value) : undefined;
  }

  async function getAll() {
    const rows = await db.query(`SELECT * FROM business_settings`);
    const out = {};
    for (const r of rows) out[r.key] = decodeValue(r.value);
    return out;
  }

  async function set(key, value, actingUserId = null) {
    const before = await get(key);
    const existing = await db.queryOne(`SELECT key FROM business_settings WHERE key = ?`, [key]);
    if (existing) {
      await db.run(`UPDATE business_settings SET value = ?, updated_by = ?, updated_at = ? WHERE key = ?`,
        [JSON.stringify(value), actingUserId, now(), key]);
    } else {
      await db.run(`INSERT INTO business_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?)`,
        [key, JSON.stringify(value), actingUserId, now()]);
    }
    await auditService.log({ userId: actingUserId, action: 'settings.update', entityType: 'business_settings',
      entityId: key, before, after: value });
    return value;
  }

  return { seedDefaults, get, getAll, set, DEFAULT_SETTINGS };
}

module.exports = { createSettingsService };
