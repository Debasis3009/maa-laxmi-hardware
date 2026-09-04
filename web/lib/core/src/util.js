'use strict';
const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Simple, dependency-free password hashing (scrypt, built into Node). */
function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(plain, stored) {
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(plain, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(check));
}

class AppError extends Error {
  constructor(message, code = 'APP_ERROR', details = null) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

module.exports = { uuid, now, slugify, hashPassword, verifyPassword, AppError };
