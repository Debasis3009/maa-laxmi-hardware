'use strict';
/**
 * DB adapter — local/dev implementation backed by Node's built-in `node:sqlite`.
 *
 * Every service in src/services/ talks ONLY to this interface (query, run, tx).
 * A production `postgres-adapter.js` implementing the exact same three
 * methods (using `pg`) can be dropped in later with zero changes to any
 * service file. That is the whole point of this layer.
 */
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

function createDb(filename = ':memory:') {
  const db = new DatabaseSync(filename);

  // Only run the schema on a fresh database. A file-backed dev DB persists
  // across restarts, so re-running CREATE TABLE on an already-initialized
  // file would fail with "table already exists". :memory: DBs are always
  // fresh, so this only matters for the file-backed case.
  const alreadyInitialized = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'roles'`)
    .get();
  if (!alreadyInitialized) {
    const schema = fs.readFileSync(
   path.join(process.cwd(), 'schema', 'schema.sqlite.sql')

    );
    db.exec(schema);
  }

  return {
    /** SELECT ... -> array of row objects */
    query(sql, params = []) {
      return db.prepare(sql).all(...params);
    },
    /** SELECT ... expecting exactly one row (or undefined) */
    queryOne(sql, params = []) {
      return db.prepare(sql).get(...params);
    },
    /** INSERT/UPDATE/DELETE -> { changes, lastInsertRowid } */
    run(sql, params = []) {
      return db.prepare(sql).run(...params);
    },
    /** Run a function inside a transaction; rolls back on throw */
    transaction(fn) {
      db.exec('BEGIN');
      try {
        const result = fn();
        db.exec('COMMIT');
        return result;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
    raw: db,
  };
}

module.exports = { createDb };
