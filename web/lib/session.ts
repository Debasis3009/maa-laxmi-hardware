import {cookies} from 'next/headers';
import {createHash,randomBytes} from 'node:crypto';
import {getApp} from './db';
export const COOKIE_NAME='mlh_session_role';
export type SessionRole='ADMIN'|'WORKER'|'CUSTOMER';
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
export async function createSession(userId:string,purpose='login'){
 const token=randomBytes(32).toString('base64url'),app=await getApp();
 const seconds=purpose==='reset'?300:8*60*60;
 await app.db.run('INSERT INTO auth_sessions(user_id,session_token_hash,expires_at,purpose) VALUES(?,?,?,?)',[userId,tokenHash(token),new Date(Date.now()+seconds*1000).toISOString(),purpose]);
 cookies().set(purpose==='reset'?'mlh_reset_verified':COOKIE_NAME,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:seconds});
}
export async function getSession():Promise<{role:SessionRole;user:any|null}>{
 const token=cookies().get(COOKIE_NAME)?.value;
 if(!token||token.length<40)return {role:'CUSTOMER',user:null};
 const app=await getApp();const s=await app.db.queryOne("SELECT user_id FROM auth_sessions WHERE session_token_hash=? AND purpose='login' AND revoked_at IS NULL AND expires_at>now()",[tokenHash(token)]);
 const user=s?await app.userService.getUserById(s.user_id):null;
 if(!user?.is_active)return {role:'CUSTOMER',user:null};
 return {role:user.role_name==='owner'?'ADMIN':'WORKER',user};
}
export async function logoutAdmin(){'use server';const token=cookies().get(COOKIE_NAME)?.value;if(token&&token.length>=40){const app=await getApp();await app.db.run('UPDATE auth_sessions SET revoked_at=now() WHERE session_token_hash=?',[tokenHash(token)]);}cookies().set(COOKIE_NAME,'',{httpOnly:true,sameSite:'lax',path:'/',maxAge:0});}
export async function requireAdmin(){const {role,user}=await getSession();if(role!=='ADMIN'||!user)throw new Error('Not authorized: admin session required.');return user;}
export async function requireStaff(){const {role,user}=await getSession();if(!['ADMIN','WORKER'].includes(role)||!user)throw new Error('Not authorized: staff session required.');return {role,user};}
