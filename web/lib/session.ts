import 'server-only';
import { cookies } from 'next/headers';
import { getApp, getOwnerId } from './db';
const COOKIE_NAME='mlh_session_role';
export type SessionRole='ADMIN'|'WORKER'|'CUSTOMER';
export async function getSession(): Promise<{role:SessionRole;user:any|null}> {
  const role=(cookies().get(COOKIE_NAME)?.value as SessionRole)||'CUSTOMER';
  if(role==='ADMIN'||role==='WORKER'){
    const app=await getApp();
    const user=await app.userService.getUserById(await getOwnerId());
    return {role,user};
  }
  return {role:'CUSTOMER',user:null};
}
export async function logoutAdmin(){'use server';cookies().set(COOKIE_NAME,'CUSTOMER',{httpOnly:true,sameSite:'lax',path:'/',maxAge:0});}
export async function requireAdmin(){const{role,user}=await getSession();if(role!=='ADMIN'||!user)throw new Error('Not authorized: admin session required.');return user;}
export async function requireStaff(){const{role,user}=await getSession();if(!['ADMIN','WORKER'].includes(role)||!user)throw new Error('Not authorized: staff session required.');return{role,user};}
