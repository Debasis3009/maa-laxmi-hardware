'use strict';
/**
 * PostgreSQL adapter for production.
 * Async by design: PostgreSQL I/O cannot safely emulate node:sqlite's
 * synchronous API. Services migrated to PostgreSQL must await these methods.
 */
const { Pool } = require('pg');

function qmarksToPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => '$' + (++i));
}

function createPostgresDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL is required for PostgreSQL.');
  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.PG_POOL_MAX || 5),
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  const adapt = (sql) => qmarksToPg(sql);

  return {
    dialect: 'postgres',
    async query(sql, params = []) {
      const r = await pool.query(adapt(sql), params);
      return r.rows;
    },
    async queryOne(sql, params = []) {
      const r = await pool.query(adapt(sql), params);
      return r.rows[0];
    },
    async run(sql, params = []) {
      const r = await pool.query(adapt(sql), params);
      return { changes: r.rowCount || 0, rows: r.rows };
    },
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const tx = {
          dialect: 'postgres',
          query: async (sql, params = []) => (await client.query(adapt(sql), params)).rows,
          queryOne: async (sql, params = []) => (await client.query(adapt(sql), params)).rows[0],
          run: async (sql, params = []) => {
            const r = await client.query(adapt(sql), params);
            return { changes: r.rowCount || 0, rows: r.rows };
          },
        };
        const result = await fn(tx);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
    async close() { await pool.end(); },
    raw: pool,
  };
}

module.exports = { createPostgresDb };
