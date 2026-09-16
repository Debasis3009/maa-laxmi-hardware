'use client';
export default function PrintButton(){ return <button type="button" onClick={()=>window.print()} className="rounded-xl border px-4 py-2 text-sm font-bold print:hidden">Print / Save PDF</button>; }
