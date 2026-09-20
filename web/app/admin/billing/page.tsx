import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { createBill } from './actions';
import InvoiceItems from './InvoiceItems';

export default async function BillingPage(){
  await requireAdmin(); const app=await getApp(); const customers=await app.customerBillingService.listCustomers(); const products=await app.customerBillingService.getProducts();
  return <div className="space-y-5">
    <section className="rounded-2xl bg-[#062f50] p-5 text-white"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200">Phase 2 · GST Billing</p><h1 className="mt-1 text-2xl font-black">Create Tax Invoice</h1><p className="mt-1 text-sm text-slate-200">Bill registered customers or one-time walk-in customers without saving a customer profile.</p></section>
    <form action={createBill} className="space-y-5">
      <section className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="font-bold">Customer type</h2><div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border p-4"><label className="text-xs font-bold text-slate-600">Existing customer<select name="customerId" className="mt-1 w-full rounded-xl border p-3 text-sm"><option value="">— None / use new walk-in customer —</option>{customers.map((c:any)=><option key={c.id} value={c.id}>{c.name}{c.phone?` · ${c.phone}`:''}</option>)}</select></label><p className="mt-2 text-xs text-slate-500">Use this for customers whose dues/ledger you want to track.</p></div>
        <div className="rounded-xl border p-4"><p className="text-xs font-bold text-slate-600">New / walk-in customer — not saved</p><div className="mt-2 grid gap-2 sm:grid-cols-3"><input name="walkInName" placeholder="Customer name (optional)" className="rounded-lg border p-2.5 text-sm"/><input name="walkInPhone" placeholder="Phone (optional)" className="rounded-lg border p-2.5 text-sm"/><input name="customerGstin" placeholder="Customer GSTIN (optional)" className="rounded-lg border p-2.5 text-sm"/></div><p className="mt-2 text-xs text-slate-500">For full-payment or small counter bills. No customer profile will be created.</p></div>
      </div><div className="mt-4 grid gap-3 md:grid-cols-3"><label className="text-xs font-bold text-slate-600">Our GSTIN<input name="sellerGstin" placeholder="Enter MAA LAXMI HARDWARE GSTIN" className="mt-1 w-full rounded-xl border p-3 text-sm"/></label><label className="text-xs font-bold text-slate-600">Invoice date<input name="invoiceDate" type="date" defaultValue={new Date().toISOString().slice(0,10)} className="mt-1 w-full rounded-xl border p-3 text-sm"/></label><label className="text-xs font-bold text-slate-600">Payment method<select name="paymentMethod" className="mt-1 w-full rounded-xl border p-3 text-sm"><option>CASH</option><option>UPI</option><option>BANK</option><option>CARD</option><option>CREDIT</option></select></label></div></section>
      <InvoiceItems products={products}/>
      <section className="grid gap-3 rounded-2xl border bg-white p-5 shadow-sm md:grid-cols-3"><label className="text-xs font-bold text-slate-600">Amount paid<input name="paid" type="number" min="0" step="0.01" defaultValue="0" className="mt-1 w-full rounded-xl border p-3 text-sm"/></label><label className="text-xs font-bold text-slate-600">Payment reference<input name="paymentReference" placeholder="UPI/transaction ref" className="mt-1 w-full rounded-xl border p-3 text-sm"/></label><label className="text-xs font-bold text-slate-600">Notes<textarea name="notes" className="mt-1 w-full rounded-xl border p-3 text-sm"/></label></section>
      <button className="w-full rounded-xl bg-[#07527f] px-5 py-3.5 text-sm font-black text-white shadow-lg hover:bg-[#063f60]">Create GST Invoice →</button>
    </form>
  </div>;
}
