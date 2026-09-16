import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import type { StockTransactionRow } from '@/lib/types';

const TYPE_TONE: Record<string, string> = { sale: 'text-rose-700', damaged: 'text-rose-700', supplier_return: 'text-rose-700', purchase: 'text-emerald-700', customer_return: 'text-emerald-700', opening: 'text-slate-500', adjustment: 'text-amber-700', correction: 'text-amber-700' };

export default function AdminStockLogPage() {
  requireAdmin();
  const app = getApp();
  const rows = app.inventoryService.listRecentTransactions(200) as unknown as StockTransactionRow[];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#07527f]">Inventory history</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Stock transaction log</h1><p className="mt-1 max-w-3xl text-sm text-slate-500">Every stock movement in order. This immutable ledger is the source used to derive inventory counts.</p></section>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500"><th className="px-4 py-3">When</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Change</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">Reason</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/70"><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">{new Date(r.created_at).toLocaleString('en-IN')}</td><td className="px-4 py-3 font-medium text-slate-700">{r.product_name}{r.variant_id ? <span className="text-slate-400"> ({(r as unknown as { variant_name?: string }).variant_name})</span> : null}</td><td className={`px-4 py-3 font-bold capitalize ${TYPE_TONE[r.transaction_type] || 'text-slate-600'}`}>{r.transaction_type.replace(/_/g, ' ')}</td><td className="px-4 py-3 font-mono font-bold">{r.quantity_change > 0 ? `+${r.quantity_change}` : r.quantity_change}</td><td className="px-4 py-3 font-mono">{r.new_stock}</td><td className="px-4 py-3 text-slate-500">{r.reason || '—'}</td></tr>)}{rows.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">No stock movements yet.</td></tr>}</tbody></table></div>
      </div>
    </div>
  );
}
