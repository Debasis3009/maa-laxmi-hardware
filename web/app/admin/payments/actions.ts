'use server';
import {getApp} from '@/lib/db';
import {requireAdmin} from '@/lib/session';
import {revalidatePath} from 'next/cache';
export async function collectPayment(_state:{error?:string;success?:string},form:FormData):Promise<{error?:string;success?:string}>{
 try{const user=await requireAdmin(),app=await getApp();await app.customerBillingService.recordPayment({customerId:String(form.get('customerId')||'')||null,invoiceId:String(form.get('invoiceId')||'')||null,amount:Number(form.get('amount')),method:String(form.get('method')||'CASH'),reference:String(form.get('reference')||''),notes:String(form.get('notes')||''),requestKey:String(form.get('requestKey')||'')},user.id);}catch(e){return {error:e instanceof Error?e.message:'Payment could not be saved.'};}
 for(const p of ['/admin','/admin/payments','/admin/customers','/admin/reports','/admin/billing'])revalidatePath(p,'layout');return {success:'Payment saved. The balance is updated.'};
}
