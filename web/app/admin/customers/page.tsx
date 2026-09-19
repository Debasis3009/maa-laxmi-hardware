import { revalidatePath } from 'next/cache';
import { getApp, getOwnerId } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

async function addCustomer(formData: FormData) {
  'use server';
  const app=await getApp(); await requireAdmin();
  await app.customerBillingService.createCustomer({
    name:String(formData.get('name')||''),phone:String(formData.get('phone')||''),email:String(formData.get('email')||''),
    address:String(formData.get('address')||''),gstin:String(formData.get('gstin')||''),state:String(formData.get('state')||'West Bengal'),
    openingBalance:Number(formData.get('openingBalance')||0),creditLimit:String(formData.get('creditLimit')||''),notes:String(formData.get('notes')||'')
  },await getOwnerId());
  revalidatePath('/admin/customers'); revalidatePath('/admin');
}

export default async function CustomersPage(){
  await requireAdmin(); const app=await getApp(); const customers=await app.customerBillingService.listCustomers();
  return <div className="space-y-5">
    <section className="rounded-2xl bg-[#062f50] p-5 text-white"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200">Phase 2 · Customer Management</p><h1 className="mt-1 text-2xl font-black">Customers & Ledger</h1><p className="mt-1 text-sm text-slate-200">Customer profiles, GST details and outstanding dues.</p></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">Add customer</h2><form action={addCustomer} className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <input name="name" required placeholder="Customer name *" className="rounded-xl border p-3 text-sm"/><input name="phone" placeholder="Phone" className="rounded-xl border p-3 text-sm"/><input name="email" type="email" placeholder="Email" className="rounded-xl border p-3 text-sm"/>
      <input name="gstin" placeholder="GSTIN" className="rounded-xl border p-3 text-sm"/><input name="state" defaultValue="West Bengal" placeholder="State" className="rounded-xl border p-3 text-sm"/><input name="openingBalance" type="number" step="0.01" placeholder="Opening due ₹" className="rounded-xl border p-3 text-sm"/>
      <input name="creditLimit" type="number" step="0.01" placeholder="Credit limit ₹" className="rounded-xl border p-3 text-sm"/><input name="address" placeholder="Address" className="rounded-xl border p-3 text-sm md:col-span-2"/><textarea name="notes" placeholder="Notes" className="rounded-xl border p-3 text-sm lg:col-span-3"/>
      <button className="rounded-xl bg-[#07527f] px-4 py-3 text-sm font-bold text-white hover:bg-[#063f60]">+ Save customer</button>
    </form></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b px-5 py-4"><h2 className="font-bold">Customer ledger</h2><p className="text-xs text-slate-500">{customers.length} active customers</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">GSTIN</th><th className="px-5 py-3 text-right">Opening</th><th className="px-5 py-3 text-right">Invoice due</th></tr></thead><tbody className="divide-y">{customers.map((c:any)=><tr key={c.id}><td className="px-5 py-3 font-semibold">{c.name}</td><td className="px-5 py-3">{c.phone||'—'}</td><td className="px-5 py-3 font-mono text-xs">{c.gstin||'—'}</td><td className="px-5 py-3 text-right">₹{Number(c.opening_balance||0).toFixed(2)}</td><td className="px-5 py-3 text-right font-bold text-rose-700">₹{Number(c.invoice_due||0).toFixed(2)}</td></tr>)}{customers.length===0&&<tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No customers yet.</td></tr>}</tbody></table></div></section>
  </div>;
}
