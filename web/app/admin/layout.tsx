import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, logoutAdmin } from '@/lib/session';
import InactivityLogout from '@/components/admin/InactivityLogout';
import BrandLogo from '@/components/BrandLogo';
const NAV=[
 {href:'/admin',label:'Dashboard',icon:'▦'},
 {href:'/admin/billing',label:'Create Bill',icon:'₹'},
 {href:'/admin/customers',label:'Customers & Ledger',icon:'♙'},
 {href:'/admin/payments',label:'Payments',icon:'₹'},
 {href:'/admin/reports',label:'Sales & Reports',icon:'▥'},
 {href:'/admin/products',label:'Products & Inventory',icon:'▤'},
 {href:'/admin/pricing',label:'Bulk Pricing',icon:'₹'},
 {href:'/admin/import',label:'Bulk Import',icon:'↓'},
 {href:'/admin/stock-log',label:'Stock Log',icon:'≡'},
];
export default function AdminLayout({children}:{children:React.ReactNode}){
 const {role,user}=getSession(); if(role!=='ADMIN'||!user) redirect('/login');
 async function handleLogout(){'use server';await logoutAdmin();redirect('/login');}
 return <div className="min-h-screen bg-[#eef3f6] text-slate-900"><InactivityLogout timeoutMs={5*60*1000}/><div className="flex min-h-screen flex-col lg:flex-row"><aside className="w-full shrink-0 bg-[#062f50] text-white lg:fixed lg:inset-y-0 lg:w-64"><div className="flex h-full flex-col"><div className="border-b border-white/10 p-4"><div className="rounded-xl bg-[#dfeaed] p-2 shadow-lg"><BrandLogo variant="dark" className="h-12 w-auto max-w-full"/></div><div className="mt-3 px-1"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200/70">Store Control</p><p className="mt-1 text-sm font-semibold">MAA LAXMI HARDWARE</p></div></div><nav className="flex gap-2 overflow-x-auto p-3 lg:block lg:space-y-1 lg:overflow-visible" aria-label="Admin navigation">{NAV.map(item=><Link key={item.href} href={item.href} className="group flex min-w-max items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/10 hover:bg-white/10 hover:text-white lg:w-full"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-xs text-sky-100" aria-hidden="true">{item.icon}</span>{item.label}</Link>)}</nav><div className="mt-auto hidden border-t border-white/10 p-4 lg:block"><Link href="/" className="mb-3 flex items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-sky-100 hover:bg-white/10">View storefront →</Link><div className="rounded-xl bg-white/5 p-3"><p className="text-[10px] uppercase tracking-wider text-sky-200/60">Signed in as</p><p className="mt-1 truncate text-sm font-semibold">{user.name||'Store Admin'}</p><span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/> Secure session · 5m guard</span></div></div></div></aside><div className="flex min-w-0 flex-1 flex-col lg:ml-64"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#0b4b76]">Admin panel</p><p className="truncate text-sm font-semibold text-slate-700">Manage catalogue, billing, customers and stock</p></div><div className="flex items-center gap-2"><span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 sm:inline-flex">● Secure session</span><form action={handleLogout}><button type="submit" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">Sign Out</button></form></div></div></header><main className="w-full flex-1 overflow-x-hidden"><div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</div></main></div></div></div>;
}
