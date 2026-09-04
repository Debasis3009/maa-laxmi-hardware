'use server';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'mlh_session_role';

export async function loginWithCredentials(formData: FormData): Promise<{ error?: string }> {
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

  cookies().set(COOKIE_NAME, 'ADMIN', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return {};
}

export async function logoutAdmin(): Promise<void> {
  cookies().set(COOKIE_NAME, 'CUSTOMER', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
