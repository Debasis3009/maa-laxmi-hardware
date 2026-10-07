'use server';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {getApp} from '@/lib/db';
import {requireAdmin} from '@/lib/session';
export async function createBill(_state:{error?:string},formData:FormData):Promise<{error?:string}>{
 let id:string;
 try{
  const admin=await requireAdmin(),app=await getApp();const items=[];
  const ids=formData.getAll('productId'),qty=formData.getAll('qty'),price=formData.getAll('price'),discount=formData.getAll('discount'),gst=formData.getAll('gst');
  if(!ids.length||ids.some(x=>!String(x)))throw new Error('Choose a product for every invoice line.');
  for(let i=0;i<ids.length;i++)items.push({productId:String(ids[i]),quantity:Number(qty[i]),unitPrice:Number(price[i]),discount:Number(discount[i]),gstRate:Number(gst[i])});
  const mode=String(formData.get('customerMode'));if(!['existing','new'].includes(mode))throw new Error('Choose a customer type.');const customerId=mode==='existing'?String(formData.get('customerId')||''):null;if(mode==='existing'&&!customerId)throw new Error('Choose an existing customer.');
  const s=(name:string)=>String(formData.get(name)||'').trim();
  const invoice=await app.customerBillingService.createInvoice({customerId,walkInName:s('billingName'),walkInPhone:s('billingPhone'),walkInWhatsapp:s('billingWhatsapp'),walkInAddress:s('billingAddress'),walkInState:s('billingState'),walkInGstin:s('customerGstin'),sellerGstin:s('sellerGstin'),invoiceDate:s('invoiceDate'),items,paid:Number(formData.get('paid')||0),paymentMethod:s('paymentMethod'),paymentReference:s('paymentReference'),notes:s('notes'),requestKey:s('requestKey'),useAdvance:formData.has('useAdvance')},admin.id);id=invoice.id;
 }catch(e){return {error:e instanceof Error?e.message:'Could not create invoice. Please try again.'};}
 for(const path of ['/admin','/admin/billing','/admin/customers','/admin/payments','/admin/reports','/admin/products','/admin/stock-log','/'])revalidatePath(path);
 redirect(`/admin/billing/${id}`);
}
