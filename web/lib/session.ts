import 'server-only';
import { cookies } from 'next/headers';
import { getApp, getOwnerId } from './db';

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

export async function loginWithCredentials(formData: FormData): Promise<{ error?: string }> {
  'use server';
  const username = (formData.get('username') as string)?.trim();
  const password = (formData.get('password') as string)?.trim();

  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD || 'MaaLaxmi@2026';

  if (!username || !password) {
    return { error: 'Please enter both User ID and Password.' };
  }

  if (username !== expectedUser || password !== expectedPass) {
    return { error: 'Invalid User ID or Password.' };
  }

  // 5-minute inactivity session limit
  cookies().set(COOKIE_NAME, 'ADMIN', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5,
  });

  return {};
}

export async function logoutAdmin() {
  'use server';
  cookies().set(COOKIE_NAME, 'CUSTOMER', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function requireAdmin() {
  const { role, user } = getSession();
  if (role !== 'ADMIN' || !user) {
    throw new Error('Not authorized: admin session required.');
  }
  return user;
}
