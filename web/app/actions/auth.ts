'use server';

import { cookies } from 'next/headers';
import { randomInt } from 'node:crypto';
import { getApp } from '@/lib/db';

const COOKIE_NAME = 'mlh_session_role';
const OTP_COOKIE = 'mlh_pending_otp';
const VERIFY_PHONE = process.env.AUTH_WHATSAPP_NUMBER || '919932667908';
type Role = 'ADMIN' | 'WORKER';

function encodePending(role: Role, otp: string) {
  return Buffer.from(JSON.stringify({ role, otp, expires: Date.now() + 5 * 60 * 1000 })).toString('base64url');
}
function decodePending(value?: string) {
  try { return JSON.parse(Buffer.from(value || '', 'base64url').toString()) as { role: Role; otp: string; expires: number }; }
  catch { return null; }
}

export async function loginWithCredentials(formData: FormData): Promise<{ error?: string; otpRequired?: boolean; devCode?: string }> {
  const role = String(formData.get('role') || 'ADMIN').toUpperCase() as Role;
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');
  if (!['ADMIN', 'WORKER'].includes(role)) return { error: 'Please select a valid role.' };

  try {
    const user = getApp().userService.authenticate(username, password);
    const isOwner = user.role_name === 'owner';
    if ((role === 'ADMIN' && !isOwner) || (role === 'WORKER' && isOwner)) return { error: 'Invalid User ID or Password.' };
  } catch { return { error: 'Invalid User ID or Password.' }; }

  const otp = String(randomInt(100000, 1000000));
  cookies().set(OTP_COOKIE, encodePending(role, otp), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 300 });
  const webhook = process.env.WHATSAPP_OTP_WEBHOOK_URL;
  if (webhook) {
    try {
      const r = await fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json', ...(process.env.WHATSAPP_OTP_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.WHATSAPP_OTP_WEBHOOK_TOKEN}` } : {}) }, body: JSON.stringify({ to: VERIFY_PHONE, code: otp, message: `MAA LAXMI HARDWARE verification code: ${otp}. Valid for 5 minutes.` }), cache: 'no-store' });
      if (!r.ok) return { error: 'Could not send WhatsApp verification code. Please try again.' };
    } catch { return { error: 'Could not send WhatsApp verification code. Please try again.' }; }
  }
  return { otpRequired: true, ...(!webhook && process.env.NODE_ENV !== 'production' ? { devCode: otp } : {}) };
}

export async function verifyLoginOtp(code: string): Promise<{ error?: string; role?: Role }> {
  const pending = decodePending(cookies().get(OTP_COOKIE)?.value);
  if (!pending || pending.expires < Date.now()) return { error: 'Verification code expired. Please sign in again.' };
  if (String(code).trim() !== pending.otp) return { error: 'Incorrect verification code.' };
  cookies().set(COOKIE_NAME, pending.role, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 5 });
  cookies().set(OTP_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return { role: pending.role };
}

export async function logoutAdmin(): Promise<void> {
  cookies().set(COOKIE_NAME, 'CUSTOMER', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  cookies().set(OTP_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}
