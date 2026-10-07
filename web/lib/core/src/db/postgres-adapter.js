'use strict';
const { Pool } = require('pg');
const {randomBytes}=require('node:crypto');
const { AsyncLocalStorage } = require('node:async_hooks');
const txStore = new AsyncLocalStorage();

function qmarksToPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => '$' + (++i));
}
function normalizeSql(sql) {
  return qmarksToPg(sql)
    .replace(/COLLATE NOCASE/gi, '')
    .replace(/date\(([^)]+)\)/gi, 'CAST($1 AS date)');
}

function createPostgresDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL is required. SQLite fallback has been removed.');
  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.PG_POOL_MAX || 5),
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });
  const executor = () => txStore.getStore() || pool;
  return {
    dialect: 'postgres',
    async query(sql, params = []) { return (await executor().query(normalizeSql(sql), params)).rows; },
    async queryOne(sql, params = []) { return (await executor().query(normalizeSql(sql), params)).rows[0]; },
    async run(sql, params = []) { const r=await executor().query(normalizeSql(sql), params); return {changes:r.rowCount||0,rows:r.rows}; },
    async transaction(fn) {
      if (txStore.getStore()) {
        const client=txStore.getStore(),name='mlh_'+randomBytes(8).toString('hex');
        await client.query('SAVEPOINT '+name);
        try{const result=await fn();await client.query('RELEASE SAVEPOINT '+name);return result;}
        catch(err){await client.query('ROLLBACK TO SAVEPOINT '+name);await client.query('RELEASE SAVEPOINT '+name);throw err;}
      }
      const client=await pool.connect();
      try {
        await client.query('BEGIN');
        const result=await txStore.run(client, fn);
        await client.query('COMMIT');
        return result;
      } catch(err) { await client.query('ROLLBACK'); throw err; }
      finally { client.release(); }
    },
    async close(){await pool.end();},
    raw:pool,
  };
}
module.exports={createPostgresDb};
