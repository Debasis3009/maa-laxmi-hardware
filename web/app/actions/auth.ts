'use server';

import { cookies } from 'next/headers';
import { randomInt, createHmac, timingSafeEqual } from 'node:crypto';
import { getApp } from '@/lib/db';
import {createSession,tokenHash,logoutAdmin as endSession} from '@/lib/session';

const COOKIE_NAME = 'mlh_session_role';
const OTP_COOKIE = 'mlh_pending_otp';
const RESET_COOKIE = 'mlh_reset_verified';
const VERIFY_PHONE = process.env.AUTH_WHATSAPP_NUMBER || '919932667908';
const VERIFY_EMAIL = process.env.AUTH_OTP_EMAIL || 'debasisdey.30@gmail.com';
const OTP_SECRET = process.env.AUTH_OTP_SECRET || process.env.ADMIN_BOOTSTRAP_PASSWORD || '';
type OtpChannel = 'WHATSAPP' | 'EMAIL';
type Role = 'ADMIN' | 'WORKER';

function sign(value: string) { return createHmac('sha256', OTP_SECRET).update(value).digest('base64url'); }
async function createChallenge(userId: string, purpose: string) {
  const app=await getApp();
  const row=await app.db.queryOne('INSERT INTO auth_otp_challenges(user_id,channel,destination,otp_hash,expires_at,purpose) VALUES(?,?,?,?,?,?) RETURNING id',[userId,'email',VERIFY_EMAIL,'',new Date(Date.now()+300000).toISOString(),purpose]);
  cookies().set(OTP_COOKIE,row.id,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:300});
}
async function consumeChallenge(code: string, purpose: string) {
  const id=cookies().get(OTP_COOKIE)?.value;
  if(!id||!/^[-a-f0-9]{36}$/.test(id)||!OTP_SECRET) return {error:'Verification expired. Please start again.'};
  const app=await getApp();
  return app.db.transaction(async()=>{
    const c=await app.db.queryOne('SELECT * FROM auth_otp_challenges WHERE id=? FOR UPDATE',[id]);
    if(!c||c.purpose!==purpose||c.consumed_at||new Date(c.expires_at).getTime()<Date.now()||c.attempts>=c.max_attempts||!c.otp_hash)return {error:'Verification expired. Please start again.'};
    const hash=sign(code.trim());
    await app.db.run('UPDATE auth_otp_challenges SET attempts=attempts+1 WHERE id=?',[id]);
    if(!/^[0-9]{6}$/.test(code)||hash.length!==c.otp_hash.length||!timingSafeEqual(Buffer.from(hash),Buffer.from(c.otp_hash)))return {error:'Incorrect verification code.'};
    await app.db.run('UPDATE auth_otp_challenges SET consumed_at=now() WHERE id=?',[id]);
    cookies().set(OTP_COOKIE,'',{httpOnly:true,path:'/',maxAge:0});
    return {userId:c.user_id};
  });
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

export async function loginWithCredentials(formData: FormData): Promise<{error?:string;otpRequired?:boolean}> {
 try {
  const app=await getApp();const user=await app.userService.authenticate(String(formData.get('username')||'').trim(),String(formData.get('password')||''));
  if(user.role_name!=='owner')return {error:'Owner access is required.'};
  await createChallenge(user.id,'login');return {otpRequired:true};
 }catch{return {error:'Invalid User ID or Password.'};}
}
export async function requestLoginOtp(channel: OtpChannel):Promise<{error?:string;sent?:boolean}>{
 if(!['EMAIL','WHATSAPP'].includes(channel)||!OTP_SECRET)return {error:'Verification is unavailable.'};
 const id=cookies().get(OTP_COOKIE)?.value;
 if(!id||!/^[-a-f0-9]{36}$/.test(id))return {error:'Verification expired. Please start again.'};
 const app=await getApp();
 return app.db.transaction(async()=>{
  const c=await app.db.queryOne('SELECT * FROM auth_otp_challenges WHERE id=? FOR UPDATE',[id]);
  if(!c||c.consumed_at||new Date(c.expires_at).getTime()<Date.now()||c.attempts>=c.max_attempts)return {error:'Verification expired. Please start again.'};
  await app.db.queryOne('SELECT pg_advisory_xact_lock(hashtext(?))',[`mlh-otp-${c.user_id}`]);
  const recent=await app.db.queryOne("SELECT id FROM auth_otp_challenges WHERE user_id=? AND sent_at>now()-interval '60 seconds' LIMIT 1",[c.user_id]);
  if(recent)return {error:'Please wait one minute before resending.'};
  const otp=String(randomInt(100000,1000000));
  try {if(channel==='EMAIL')await sendEmailOtp(otp,c.purpose==='reset'?'password reset':'sign in');else await sendWhatsAppOtp(otp,'sign in');}
  catch(e){return {error:e instanceof Error?e.message:'Could not send code.'};}
  await app.db.run('UPDATE auth_otp_challenges SET otp_hash=?,channel=?,sent_at=now() WHERE id=?',[sign(otp),channel.toLowerCase(),id]);return {sent:true};
 });
}
export async function requestAdminPasswordReset(channel:OtpChannel='EMAIL'):Promise<{error?:string;otpRequired?:boolean}>{
 const app=await getApp(),owner=await app.userService.getOwner();if(!owner)return {error:'Administrator unavailable.'};
 // Keep the last challenge to enforce the same resend interval.
 const id=cookies().get(OTP_COOKIE)?.value;
 const current=id&&/^[-a-f0-9]{36}$/.test(id)?await app.db.queryOne("SELECT id FROM auth_otp_challenges WHERE id=? AND purpose='reset' AND consumed_at IS NULL AND expires_at>now()",[id]):null;
 if(!current)await createChallenge(owner.id,'reset');const r=await requestLoginOtp(channel);return r.error?{error:r.error}:{otpRequired:true};
}
export async function verifyAdminResetOtp(code:string):Promise<{error?:string;verified?:boolean}>{
 const r=await consumeChallenge(code,'reset');if(r.error)return {error:r.error};await createSession(r.userId,'reset');return {verified:true};
}
export async function resetAdminPassword(formData:FormData):Promise<{error?:string;saved?:boolean}>{
 const token=cookies().get(RESET_COOKIE)?.value;if(!token)return {error:'Email verification is required.'};
 const password=String(formData.get('password')||'');if(password.length<8||password!==String(formData.get('confirm')||''))return {error:'Both passwords must match and contain at least 8 characters.'};
 const app=await getApp();return app.db.transaction(async()=>{
  const session=await app.db.queryOne("SELECT * FROM auth_sessions WHERE session_token_hash=? AND purpose='reset' AND revoked_at IS NULL AND expires_at>now() FOR UPDATE",[tokenHash(token)]);
  if(!session)return {error:'Verification expired. Please start again.'};
  await app.userService.changePassword(session.user_id,password,session.user_id);
  await app.db.run('UPDATE auth_sessions SET revoked_at=now() WHERE user_id=?',[session.user_id]);
  cookies().set(RESET_COOKIE,'',{httpOnly:true,path:'/',maxAge:0});return {saved:true};
 });
}
export async function verifyLoginOtp(code:string):Promise<{error?:string;role?:Role}>{
 const r=await consumeChallenge(code,'login');if(r.error)return {error:r.error};await createSession(r.userId);return {role:'ADMIN'};
}
export async function logoutAdmin():Promise<void>{await endSession();cookies().set(OTP_COOKIE,'',{httpOnly:true,path:'/',maxAge:0});}
