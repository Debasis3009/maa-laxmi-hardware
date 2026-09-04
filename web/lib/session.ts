import 'server-only';
import { cookies } from 'next/headers';
import { getApp, getOwnerId } from './db';

// ----------------------------------------------------------------------------
// Phase 2 uses a deliberately simple, cookie-based mock session so the
// storefront and admin UI can be built and demoed end to end. It reads real
// user rows from the Phase 1 `users`/`roles` tables (via userService), so
// swapping this for real authentication (password login, OTP, etc.) later
// means replacing `setRole`/`getSession` — every downstream permission check
// (`requireAdmin`) already goes through userService.hasPermission and needs
// no changes.
// ----------------------------------------------------------------------------

const COOKIE_NAME = 'mlh_session_role';
export type SessionRole = 'ADMIN' | 'CUSTOMER';

export function getSession(): { role: SessionRole; user: ReturnType<ReturnType<typeof getApp>['userService']['getUserById']> | null } {
  const role = (cookies().get(COOKIE_NAME)?.value as SessionRole) || 'CUSTOMER';
  if (role === 'ADMIN') {
    const app = getApp();
    const user = app.userService.getUserById(getOwnerId());
    return { role, user };
  }
  return { role: 'CUSTOMER', user: null };
}

/** Server Action: switch the mock session role. Real credential check is
 * intentionally out of scope for Phase 2 — see README "What's mocked". */
export async function setSessionRole(role: SessionRole) {
  'use server';
  cookies().set(COOKIE_NAME, role, { httpOnly: true, sameSite: 'lax', path: '/' });
}

/** Throws if the current session is not an admin. Call at the top of every
 * admin Server Action, not just in UI — Server Actions are callable
 * endpoints and must not rely on the page having hidden the button. */
export function requireAdmin() {
  const { role, user } = getSession();
  if (role !== 'ADMIN' || !user) {
    throw new Error('Not authorized: admin session required.');
  }
  return user;
}
