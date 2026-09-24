'use client';
import {useMemo,useState} from 'react';
export default function BillingCustomer({customers}:{customers:any[]}){
 const [phone,setPhone]=useState(''); const [whatsapp,setWhatsapp]=useState(''); const match=useMemo(()=>customers.find(c=>String(c.phone||'').replace(/\D/g,'')===phone.replace(/\D/g,'')),[customers,phone]);
 return <section className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="font-bold">Customer details</h2><p className="mt-1 text-xs text-slate-500">Enter mobile number first. Existing customer details fill automatically; otherwise enter the new customer details for this bill.</p>
 <input type="hidden" name="customerId" value={match?.id||''}/>
 <div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-xs font-bold text-slate-600">Mobile number<input name="billingPhone" value={phone} onChange={e=>{setPhone(e.target.value);if(!whatsapp)setWhatsapp(e.target.value)}} placeholder="Enter mobile number" className="mt-1 w-full rounded-xl border p-3 text-sm"/></label><div className="flex items-end pb-3 text-sm font-bold">{phone&&(match?<span className="text-emerald-700">✓ Existing customer found</span>:<span className="text-amber-700">New customer — enter details below</span>)}</div></div>
 <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
  <label className="text-xs font-bold text-slate-600">Customer name<input name="billingName" key={'n'+(match?.id||'new')} defaultValue={match?.name||''} readOnly={!!match} required={!match} className="mt-1 w-full rounded-xl border p-3 text-sm read-only:bg-slate-50"/></label>
  <label className="text-xs font-bold text-slate-600">WhatsApp number<input name="billingWhatsapp" value={match?.phone||whatsapp} onChange={e=>setWhatsapp(e.target.value)} readOnly={!!match} placeholder="WhatsApp number" className="mt-1 w-full rounded-xl border p-3 text-sm read-only:bg-slate-50"/></label>
  <label className="text-xs font-bold text-slate-600">GSTIN<input name="customerGstin" key={'g'+(match?.id||'new')} defaultValue={match?.gstin||''} readOnly={!!match} placeholder="Optional" className="mt-1 w-full rounded-xl border p-3 text-sm read-only:bg-slate-50"/></label>
  <label className="text-xs font-bold text-slate-600 md:col-span-2">Address<input name="billingAddress" key={'a'+(match?.id||'new')} defaultValue={match?.address||''} readOnly={!!match} placeholder="Customer address" className="mt-1 w-full rounded-xl border p-3 text-sm read-only:bg-slate-50"/></label>
  <label className="text-xs font-bold text-slate-600">State<input name="billingState" key={'s'+(match?.id||'new')} defaultValue={match?.state||'West Bengal'} readOnly={!!match} className="mt-1 w-full rounded-xl border p-3 text-sm read-only:bg-slate-50"/></label>
 </div></section>
}