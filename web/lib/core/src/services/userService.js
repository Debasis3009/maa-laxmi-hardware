'use strict';
const { uuid, now, hashPassword, verifyPassword, AppError } = require('../util');

// Default role set the owner gets out of the box. Owner can add more roles
// and adjust permissions from Admin > Staff & Roles — nothing here is
// hard-coded into the UI, it's just sensible seed data.
const DEFAULT_ROLES = [
  { name: 'owner', description: 'Full access to everything', permissions: { '*': true }, is_system_role: true },
  { name: 'manager', description: 'Manage products, inventory, orders, reports', permissions: {
      'products.manage': true, 'inventory.manage': true, 'orders.manage': true,
      'quotations.manage': true, 'reports.view': true, 'suppliers.manage': true,
    }, is_system_role: false },
  { name: 'cashier', description: 'POS billing and order status only', permissions: {
      'orders.manage': true, 'pos.use': true,
    }, is_system_role: false },
  { name: 'staff', description: 'View-only catalog and stock', permissions: {
      'products.view': true, 'inventory.view': true,
    }, is_system_role: false },
];

function createUserService(db, auditService) {
  function ensureDefaultRoles() {
    for (const r of DEFAULT_ROLES) {
      const existing = db.queryOne(`SELECT id FROM roles WHERE name = ?`, [r.name]);
      if (!existing) {
        db.run(
          `INSERT INTO roles (name, description, permissions, is_system_role, created_at) VALUES (?, ?, ?, ?, ?)`,
          [r.name, r.description, JSON.stringify(r.permissions), r.is_system_role ? 1 : 0, now()]
        );
      }
    }
  }

  function getRoleByName(name) {
    const row = db.queryOne(`SELECT * FROM roles WHERE name = ?`, [name]);
    return row && { ...row, permissions: JSON.parse(row.permissions) };
  }

  function createUser({ name, email, phone, password, roleName }, actingUserId = null) {
    const role = getRoleByName(roleName);
    if (!role) throw new AppError(`Unknown role: ${roleName}`, 'ROLE_NOT_FOUND');
    const id = uuid();
    const ts = now();
    db.run(
      `INSERT INTO users (id, name, email, phone, password_hash, role_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [id, name, email || null, phone || null, hashPassword(password), role.id, ts, ts]
    );
    auditService.log({ userId: actingUserId, action: 'user.create', entityType: 'user', entityId: id,
      after: { name, email, phone, role: roleName } });
    return getUserById(id);
  }

  function getUserById(id) {
    const row = db.queryOne(`SELECT u.*, r.name as role_name, r.permissions as role_permissions
                              FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`, [id]);
    if (!row) return null;
    const { password_hash, ...safe } = row;
    return { ...safe, role_permissions: JSON.parse(safe.role_permissions) };
  }

  function authenticate(emailOrPhone, password) {
    const row = db.queryOne(
      `SELECT * FROM users WHERE (email = ? OR phone = ?) AND is_active = 1`,
      [emailOrPhone, emailOrPhone]
    );
    if (!row) throw new AppError('Invalid credentials', 'AUTH_FAILED');
    if (!verifyPassword(password, row.password_hash)) throw new AppError('Invalid credentials', 'AUTH_FAILED');
    db.run(`UPDATE users SET last_login_at = ? WHERE id = ?`, [now(), row.id]);
    return getUserById(row.id);
  }

  function hasPermission(user, permission) {
    if (!user) return false;
    const perms = user.role_permissions || {};
    return !!(perms['*'] || perms[permission]);
  }

  function listUsers() {
    return db.query(`SELECT u.id, u.name, u.email, u.phone, u.is_active, r.name as role
                      FROM users u JOIN roles r ON r.id = u.role_id ORDER BY u.created_at`);
  }

  return { ensureDefaultRoles, getRoleByName, createUser, getUserById, authenticate, hasPermission, listUsers };
}

module.exports = { createUserService, DEFAULT_ROLES };
