'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getApp, getOwnerId } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
export async function createBill(formData: FormData) {
 await requireAdmin(); const app=await getApp(); const items:any[]=[];
 const ids=formData.getAll('productId'),qty=formData.getAll('qty'),price=formData.getAll('price'),discount=formData.getAll('discount'),gst=formData.getAll('gst');
 for(let i=0;i<ids.length;i++){const productId=String(ids[i]||'');if(!productId)continue;const product=await app.customerBillingService.getProduct(productId);if(!product)throw new Error('Product not found.');items.push({productId,productName:product.name,sku:product.sku,hsnCode:product.hsn_code,quantity:Number(qty[i]||1),unitPrice:Number(price[i]||product.selling_price),discount:Number(discount[i]||0),gstRate:Number(gst[i]||product.gst_rate||0)});}
 const customerId=String(formData.get('customerId')||'')||null;const sellerGstin=String(formData.get('sellerGstin')||'').trim();const customerGstin=String(formData.get('customerGstin')||'').trim();const rawNotes=String(formData.get('notes')||'').trim();const meta=[sellerGstin&&`Seller GSTIN: ${sellerGstin}`,customerGstin&&`Customer GSTIN: ${customerGstin}`,rawNotes].filter(Boolean).join(' | ');
 const invoice=await app.customerBillingService.createInvoice({customerId,walkInName:customerId?null:String(formData.get('walkInName')||'').trim(),walkInPhone:customerId?null:String(formData.get('walkInPhone')||'').trim(),invoiceDate:String(formData.get('invoiceDate')||''),items,paid:Number(formData.get('paid')||0),paymentMethod:String(formData.get('paymentMethod')||'CASH'),paymentReference:String(formData.get('paymentReference')||''),notes:meta},await getOwnerId());
 revalidatePath('/admin');revalidatePath('/admin/billing');revalidatePath('/admin/customers');redirect(`/admin/billing/${invoice.id}`);
}