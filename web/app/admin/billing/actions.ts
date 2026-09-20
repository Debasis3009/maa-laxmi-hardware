'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getApp, getOwnerId } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
export async function createBill(formData: FormData) {
  await requireAdmin(); const app=await getApp(); const items:any[]=[];
  for(let i=0;i<5;i++){
    const productId=String(formData.get(`productId${i}`)||''); if(!productId) continue;
    const product=await app.customerBillingService.getProduct(productId); if(!product) throw new Error('Product not found.');
    items.push({productId,productName:product.name,sku:product.sku,hsnCode:product.hsn_code,quantity:Number(formData.get(`qty${i}`)||1),unitPrice:Number(formData.get(`price${i}`)||product.selling_price),discount:Number(formData.get(`discount${i}`)||0),gstRate:Number(formData.get(`gst${i}`)||product.gst_rate||0)});
  }
  const customerId=String(formData.get('customerId')||'')||null;
  const invoice=await app.customerBillingService.createInvoice({customerId,walkInName:customerId?null:String(formData.get('walkInName')||'').trim(),walkInPhone:customerId?null:String(formData.get('walkInPhone')||'').trim(),invoiceDate:String(formData.get('invoiceDate')||''),items,paid:Number(formData.get('paid')||0),paymentMethod:String(formData.get('paymentMethod')||'CASH'),paymentReference:String(formData.get('paymentReference')||''),notes:String(formData.get('notes')||'')},await getOwnerId());
  revalidatePath('/admin'); revalidatePath('/admin/billing'); revalidatePath('/admin/customers'); redirect(`/admin/billing/${invoice.id}`);
}
