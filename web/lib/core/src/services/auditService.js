'use strict';
const { now } = require('../util');

function createAuditService(db) {
  return {
    async log({ userId, action, entityType, entityId, before = null, after = null, ip = null }) {
      await db.run(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, before_data, after_data, ip_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, action, entityType, String(entityId), before && JSON.stringify(before),
         after && JSON.stringify(after), ip, now()]
      );
    },
    async listForEntity(entityType, entityId) {
      return (await db.query(
        `SELECT * FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC`,
        [entityType, String(entityId)]
      )).map(parseRow);
    },
    async recent(limit = 50) {
      return (await db.query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?`, [limit])).map(parseRow);
    },
  };
}

function parseRow(row) {
  return {
    ...row,
    before_data: typeof row.before_data === 'string' ? JSON.parse(row.before_data) : (row.before_data || null),
    after_data: typeof row.after_data === 'string' ? JSON.parse(row.after_data) : (row.after_data || null),
  };
}

module.exports = { createAuditService };
