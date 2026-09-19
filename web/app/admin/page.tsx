import Link from 'next/link';
import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

const cards = [
  { key: 'products', label: 'Products', tone: 'border-sky-200 bg-sky-50 text-[#07527f]', href: '/admin/products' },
  { key: 'low', label: 'Low stock', tone: 'border-amber-200 bg-amber-50 text-amber-800', href: '/admin/products' },
  { key: 'out', label: 'Out of stock', tone: 'border-rose-200 bg-rose-50 text-rose-700', href: '/admin/products' },
  { key: 'activity', label: 'Recent activity', tone: 'border-slate-200 bg-slate-50 text-slate-700', href: '/admin/stock-log' },
];

export default async function AdminDashboardPage() {
  await requireAdmin();
  const app = await getApp();
  const lowStock = await app.inventoryService.listLowStock();
  const outOfStock = await app.inventoryService.listOutOfStock();
  const recentAudit = await app.auditService.recent(8);
  const productCount = await app.productService.listProducts({ limit: 10000 }).length;
  const values: Record<string, number> = { products: productCount, low: lowStock.length, out: outOfStock.length, activity: recentAudit.length };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-[#062f50] p-5 text-white shadow-xl sm:p-7">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-400/10 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200">MAA LAXMI HARDWARE</p>
          <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin Dashboard</h1><p className="mt-1 max-w-2xl text-sm text-slate-200">Manage your catalogue, pricing and inventory from one place.</p></div>
            <Link href="/admin/products" className="inline-flex w-fit items-center rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#062f50] shadow-lg transition hover:bg-sky-50 active:scale-95">Manage products →</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => <Link key={card.key} href={card.href} className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${card.tone}`}><p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{card.label}</p><p className="mt-2 text-3xl font-black tracking-tight">{values[card.key]}</p></Link>)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5"><div><h2 className="text-base font-bold text-slate-900">Inventory alerts</h2><p className="mt-0.5 text-xs text-slate-500">Items that need attention.</p></div><Link href="/admin/products" className="text-xs font-bold text-[#07527f] hover:underline">Open inventory</Link></div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-rose-800">Out of stock</h3><span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-black text-rose-700">{outOfStock.length}</span></div>{outOfStock.length === 0 ? <p className="mt-4 text-xs text-slate-500">Nothing is out of stock.</p> : <ul className="mt-3 space-y-2">{outOfStock.slice(0, 6).map((p: { product_id: string; name: string; sku: string }) => <li key={p.product_id} className="flex items-center justify-between gap-2 text-xs"><span className="truncate font-medium text-slate-700">{p.name}</span><span className="shrink-0 font-mono text-[10px] text-slate-400">{p.sku}</span></li>)}</ul>}</div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-amber-900">Low stock</h3><span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">{lowStock.length}</span></div>{lowStock.length === 0 ? <p className="mt-4 text-xs text-slate-500">Nothing is running low.</p> : <ul className="mt-3 space-y-2">{lowStock.slice(0, 6).map((p: { product_id: string; name: string; quantity_on_hand: number; min_stock: number }) => <li key={p.product_id} className="flex items-center justify-between gap-2 text-xs"><span className="truncate font-medium text-slate-700">{p.name}</span><span className="shrink-0 font-mono text-[10px] text-slate-500">{p.quantity_on_hand} / {p.min_stock}</span></li>)}</ul>}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="text-base font-bold text-slate-900">Quick actions</h2><div className="mt-4 grid gap-2"><Link href="/admin/products" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:bg-sky-50">＋ Add or edit products</Link><Link href="/admin/pricing" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:bg-sky-50">₹ Update bulk pricing</Link><Link href="/admin/import" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:bg-sky-50">↓ Import products CSV</Link><Link href="/admin/stock-log" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:bg-sky-50">≡ Review stock log</Link></div></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5"><div><h2 className="text-base font-bold text-slate-900">Recent activity</h2><p className="mt-0.5 text-xs text-slate-500">Latest recorded admin actions.</p></div><Link href="/admin/stock-log" className="text-xs font-bold text-[#07527f] hover:underline">Full stock log →</Link></div><ul className="divide-y divide-slate-100">{recentAudit.map((a: { id: number; action: string; entity_type: string; created_at: string }) => <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-700">{a.action}</p><p className="text-[10px] uppercase tracking-wider text-slate-400">{a.entity_type}</p></div><time className="shrink-0 text-xs text-slate-400" dateTime={a.created_at}>{new Date(a.created_at).toLocaleString('en-IN')}</time></li>)}{recentAudit.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-400">No admin activity recorded yet.</li>}</ul></section>
    </div>
  );
}
