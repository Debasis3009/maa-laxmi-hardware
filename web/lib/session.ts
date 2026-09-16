import 'server-only';
import {cookies} from 'next/headers';import {getApp,getOwnerId} from './db';
const COOKIE_NAME='mlh_session_role';export type SessionRole='ADMIN'|'WORKER'|'CUSTOMER';
export function getSession():{role:SessionRole;user:ReturnType<ReturnType<typeof getApp>['userService']['getUserById']>|null}{const role=(cookies().get(COOKIE_NAME)?.value as SessionRole)||'CUSTOMER';if(role==='ADMIN'||role==='WORKER'){const user=getApp().userService.getUserById(getOwnerId());return{role,user};}return{role:'CUSTOMER',user:null};}
export async function logoutAdmin(){'use server';cookies().set(COOKIE_NAME,'CUSTOMER',{httpOnly:true,sameSite:'lax',path:'/',maxAge:0});}
export function requireAdmin(){const{role,user}=getSession();if(role!=='ADMIN'||!user)throw new Error('Not authorized: admin session required.');return user;}
export function requireStaff(){const{role,user}=getSession();if(!['ADMIN','WORKER'].includes(role)||!user)throw new Error('Not authorized: staff session required.');return{role,user};}
