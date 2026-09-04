'use strict';
const { now } = require('../util');

function createAuditService(db) {
  return {
    log({ userId, action, entityType, entityId, before = null, after = null, ip = null }) {
      db.run(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, before_data, after_data, ip_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, action, entityType, String(entityId), before && JSON.stringify(before),
         after && JSON.stringify(after), ip, now()]
      );
    },
    listForEntity(entityType, entityId) {
      return db.query(
        `SELECT * FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC`,
        [entityType, String(entityId)]
      ).map(parseRow);
    },
    recent(limit = 50) {
      return db.query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?`, [limit]).map(parseRow);
    },
  };
}

function parseRow(row) {
  return {
    ...row,
    before_data: row.before_data ? JSON.parse(row.before_data) : null,
    after_data: row.after_data ? JSON.parse(row.after_data) : null,
  };
}

module.exports = { createAuditService };
