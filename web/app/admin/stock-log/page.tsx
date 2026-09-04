import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import type { StockTransactionRow } from '@/lib/types';

const TYPE_TONE: Record<string, string> = {
  sale: 'text-brick',
  damaged: 'text-brick',
  supplier_return: 'text-brick',
  purchase: 'text-steel-green',
  customer_return: 'text-steel-green',
  opening: 'text-steel-grey',
  adjustment: 'text-gold',
  correction: 'text-gold',
};

export default function AdminStockLogPage() {
  requireAdmin();
  const app = getApp();
  const rows = app.inventoryService.listRecentTransactions(200) as unknown as StockTransactionRow[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-semibold">Stock transaction log</h1>
        <p className="text-sm text-steel-grey">
          Every stock movement, in order. This is the immutable ledger — inventory counts are always derived
          from this, never edited directly.
        </p>
      </div>

      <div className="border-[1.5px] border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-[1.5px] border-line text-left text-xs uppercase tracking-wide text-steel-grey">
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Change</th>
              <th className="px-3 py-2">Balance after</th>
              <th className="px-3 py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line">
                <td className="px-3 py-2 text-steel-grey">{new Date(r.created_at).toLocaleString('en-IN')}</td>
                <td className="px-3 py-2">
                  {r.product_name}
                  {r.variant_id ? <span className="text-steel-grey"> ({(r as unknown as { variant_name?: string }).variant_name})</span> : null}
                </td>
                <td className={`px-3 py-2 font-medium ${TYPE_TONE[r.transaction_type] || ''}`}>
                  {r.transaction_type.replace(/_/g, ' ')}
                </td>
                <td className="px-3 py-2 font-data">{r.quantity_change > 0 ? `+${r.quantity_change}` : r.quantity_change}</td>
                <td className="px-3 py-2 font-data">{r.new_stock}</td>
                <td className="px-3 py-2 text-steel-grey">{r.reason || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-steel-grey">No stock movements yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
