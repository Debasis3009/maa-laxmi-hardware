import {NextResponse} from 'next/server';
import {getApp} from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(){try{const app=await getApp();await app.db.queryOne('SELECT 1 ok');return NextResponse.json({ok:true,database:'postgresql',billingReady:true},{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({ok:false},{status:503,headers:{'Cache-Control':'no-store'}});}}
