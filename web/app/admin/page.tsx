import Link from 'next/link';
import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

export default function AdminDashboardPage() {
  requireAdmin();
  const app = getApp();
  const lowStock = app.inventoryService.listLowStock();
  const outOfStock = app.inventoryService.listOutOfStock();
  const recentAudit = app.auditService.recent(8);
  const productCount = app.productService.listProducts({ limit: 10000 }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-charcoal">Dashboard</h1>
        <p className="text-sm text-steel-grey">{productCount} products in catalog.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="border-[1.5px] border-brick/40 bg-brick/5 p-4 rounded-sm">
          <h2 className="font-display text-lg font-semibold text-brick">Out of stock ({outOfStock.length})</h2>
          {outOfStock.length === 0 ? (
            <p className="mt-2 text-sm text-steel-grey">Nothing is out of stock.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {outOfStock.slice(0, 8).map((p: { product_id: string; name: string; sku: string }) => (
                <li key={p.product_id} className="flex justify-between gap-2">
                  <span className="truncate">{p.name}</span>
                  <span className="font-data text-steel-grey shrink-0">{p.sku}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-[1.5px] border-gold/50 bg-gold/5 p-4 rounded-sm">
          <h2 className="font-display text-lg font-semibold text-gold">Low stock ({lowStock.length})</h2>
          {lowStock.length === 0 ? (
            <p className="mt-2 text-sm text-steel-grey">Nothing is running low.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {lowStock.slice(0, 8).map((p: { product_id: string; name: string; sku: string; quantity_on_hand: number; min_stock: number }) => (
                <li key={p.product_id} className="flex justify-between gap-2">
                  <span className="truncate">{p.name}</span>
                  <span className="font-data text-steel-grey shrink-0">
                    {p.quantity_on_hand} / min {p.min_stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-[1.5px] border-line bg-white p-4 rounded-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
          <h2 className="font-display text-lg font-semibold">Recent activity</h2>
          <Link href="/admin/stock-log" className="text-xs sm:text-sm text-rust font-medium hover:underline">
            Full stock log →
          </Link>
        </div>
        <ul className="divide-y divide-line text-sm">
          {recentAudit.map((a: { id: number; action: string; entity_type: string; created_at: string }) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="font-data text-xs sm:text-sm">{a.action}</span>
              <span className="text-xs text-steel-grey">{new Date(a.created_at).toLocaleString('en-IN')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
