'use server';

import { cookies } from 'next/headers';
import { randomInt, createHmac, timingSafeEqual } from 'node:crypto';
import { getApp } from '@/lib/db';

const COOKIE_NAME = 'mlh_session_role';
const OTP_COOKIE = 'mlh_pending_otp';
const RESET_COOKIE = 'mlh_reset_verified';
const VERIFY_PHONE = process.env.AUTH_WHATSAPP_NUMBER || '919932667908';
const VERIFY_EMAIL = process.env.AUTH_OTP_EMAIL || 'debasisdey.30@gmail.com';
const OTP_SECRET = process.env.AUTH_OTP_SECRET || process.env.ADMIN_BOOTSTRAP_PASSWORD || '';
type OtpChannel = 'WHATSAPP' | 'EMAIL';
type Role = 'ADMIN' | 'WORKER';

function sign(value: string) { return createHmac('sha256', OTP_SECRET).update(value).digest('base64url'); }
function encodePending(role: Role, otp: string, channel: OtpChannel) {
  if (!OTP_SECRET) throw new Error('OTP security secret is not configured.');
  const payload = Buffer.from(JSON.stringify({ role, channel, otpHash: sign(otp), expires: Date.now() + 5 * 60 * 1000 })).toString('base64url');
  return payload + '.' + sign(payload);
}
function decodePending(value?: string) {
  try {
    if (!OTP_SECRET || !value) return null;
    const [payload, signature] = value.split('.');
    const expected = sign(payload);
    if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as { role: Role; channel: OtpChannel; otpHash: string; expires: number };
  } catch { return null; }
}
function validOtp(pending: { otpHash: string }, code: string) {
  const actual = sign(String(code).trim());
  return actual.length === pending.otpHash.length && timingSafeEqual(Buffer.from(actual), Buffer.from(pending.otpHash));
}
async function sendWhatsAppOtp(otp: string, purpose: string) {
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const template = process.env.META_WHATSAPP_AUTH_TEMPLATE;
  if (phoneNumberId && token && template) {
    const r = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, { method:'POST', headers:{'content-type':'application/json',authorization:`Bearer ${token}`}, body:JSON.stringify({ messaging_product:'whatsapp', to:VERIFY_PHONE, type:'template', template:{name:template,language:{code:process.env.META_WHATSAPP_TEMPLATE_LANGUAGE||'en_US'},components:[{type:'body',parameters:[{type:'text',text:otp}]},{type:'button',sub_type:'url',index:'0',parameters:[{type:'text',text:otp}]}]} }), cache:'no-store' });
    if (!r.ok) throw new Error('WhatsApp Cloud API rejected the OTP message.');
    return;
  }
  const webhook = process.env.WHATSAPP_OTP_WEBHOOK_URL;
  if (!webhook) throw new Error('WhatsApp verification is not configured yet.');
  const r = await fetch(webhook,{method:'POST',headers:{'content-type':'application/json',...(process.env.WHATSAPP_OTP_WEBHOOK_TOKEN?{authorization:`Bearer ${process.env.WHATSAPP_OTP_WEBHOOK_TOKEN}`}:{})},body:JSON.stringify({to:VERIFY_PHONE,code:otp,message:`MAA LAXMI HARDWARE ${purpose} code: ${otp}. Valid for 5 minutes.`}),cache:'no-store'});
  if(!r.ok) throw new Error('Could not send WhatsApp verification code.');
}
async function sendEmailOtp(otp: string, purpose: string) {
  const key=process.env.RESEND_API_KEY;
  const from=process.env.AUTH_EMAIL_FROM;
  if(!key||!from) throw new Error('Email OTP is not configured yet.');
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${key}`},body:JSON.stringify({from,to:[VERIFY_EMAIL],subject:`MAA LAXMI HARDWARE ${purpose} verification code`,text:`Your verification code is ${otp}. It expires in 5 minutes. If you did not request this, ignore this email.`}),cache:'no-store'});
  if(!r.ok) throw new Error('Could not send email verification code.');
}

export async function loginWithCredentials(formData: FormData): Promise<{ error?: string; otpRequired?: boolean; devCode?: string }> {
  const role = String(formData.get('role') || 'ADMIN').toUpperCase() as Role;
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');
  if (!['ADMIN', 'WORKER'].includes(role)) return { error: 'Please select a valid role.' };

  try {
    const app = await getApp();
    const user = await app.userService.authenticate(username, password);
    const isOwner = user.role_name === 'owner';
    if ((role === 'ADMIN' && !isOwner) || (role === 'WORKER' && isOwner)) return { error: 'Invalid User ID or Password.' };
  } catch { return { error: 'Invalid User ID or Password.' }; }

  // Credentials are valid. Store only the verified role for five minutes;
  // generate/send the OTP only after the user explicitly chooses a channel.
  cookies().set(OTP_COOKIE, encodePending(role, '', 'EMAIL'), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 300 });
  return { otpRequired: true };
}

export async function requestLoginOtp(channel: OtpChannel): Promise<{ error?: string; sent?: boolean }> {
  if (!['WHATSAPP','EMAIL'].includes(channel)) return { error: 'Invalid verification method.' };
  const current = decodePending(cookies().get(OTP_COOKIE)?.value);
  if (!current || current.expires < Date.now()) return { error: 'Login verification expired. Please enter your credentials again.' };
  const otp = String(randomInt(100000, 1000000));
  try {
    cookies().set(OTP_COOKIE, encodePending(current.role, otp, channel), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 300 });
    if (channel === 'EMAIL') await sendEmailOtp(otp, 'sign in'); else await sendWhatsAppOtp(otp, 'sign in');
    return { sent: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not send verification code.' };
  }
}

export async function requestAdminPasswordReset(channel: OtpChannel = 'WHATSAPP'): Promise<{ error?: string; otpRequired?: boolean; devCode?: string }> {
  if (!['WHATSAPP','EMAIL'].includes(channel)) return { error:'Invalid verification method.' };
  const otp=String(randomInt(100000,1000000));
  try {
    cookies().set(OTP_COOKIE,encodePending('ADMIN',otp,channel),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:300});
    if(channel==='EMAIL') await sendEmailOtp(otp,'password reset'); else await sendWhatsAppOtp(otp,'password reset');
    return {otpRequired:true};
  } catch(e){ cookies().set(OTP_COOKIE,'',{httpOnly:true,path:'/',maxAge:0}); return {error:e instanceof Error?e.message:'Could not send verification code.'}; }
}

export async function verifyAdminResetOtp(code: string): Promise<{ error?: string; verified?: boolean }> {
  const pending = decodePending(cookies().get(OTP_COOKIE)?.value);
  if (!pending || pending.role !== 'ADMIN' || pending.expires < Date.now()) return { error: 'Verification code expired. Please start again.' };
  if (!validOtp(pending, code)) return { error: 'Incorrect verification code.' };
  cookies().set(RESET_COOKIE, 'yes', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 300 });
  cookies().set(OTP_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return { verified: true };
}

export async function resetAdminPassword(formData: FormData): Promise<{ error?: string; saved?: boolean }> {
  if (cookies().get(RESET_COOKIE)?.value !== 'yes') return { error: 'WhatsApp verification is required.' };
  const password = String(formData.get('password') || '');
  const confirm = String(formData.get('confirm') || '');
  if (password.length < 8) return { error: 'Password must contain at least 8 characters.' };
  if (password !== confirm) return { error: 'Passwords do not match.' };
  const app = await getApp();
  const owner = await app.userService.getOwner();
  if (!owner) return { error: 'Administrator account is unavailable.' };
  await app.userService.changePassword(owner.id, password, owner.id);
  cookies().set(RESET_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return { saved: true };
}

export async function verifyLoginOtp(code: string): Promise<{ error?: string; role?: Role }> {
  const pending = decodePending(cookies().get(OTP_COOKIE)?.value);
  if (!pending || pending.expires < Date.now()) return { error: 'Verification code expired. Please sign in again.' };
  if (!validOtp(pending, code)) return { error: 'Incorrect verification code.' };
  cookies().set(COOKIE_NAME, pending.role, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 5 });
  cookies().set(OTP_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return { role: pending.role };
}

export async function logoutAdmin(): Promise<void> {
  cookies().set(COOKIE_NAME, 'CUSTOMER', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  cookies().set(OTP_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}
