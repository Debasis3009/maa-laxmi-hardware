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
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
        <p className="text-sm text-steel-grey">{productCount} products in catalog.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="border-[1.5px] border-brick/40 bg-brick/5 p-4">
          <h2 className="font-display text-lg font-semibold text-brick">Out of stock ({outOfStock.length})</h2>
          {outOfStock.length === 0 ? (
            <p className="mt-2 text-sm text-steel-grey">Nothing is out of stock.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {outOfStock.slice(0, 8).map((p: { product_id: string; name: string; sku: string }) => (
                <li key={p.product_id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="font-data text-steel-grey">{p.sku}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-[1.5px] border-gold/50 bg-gold/5 p-4">
          <h2 className="font-display text-lg font-semibold text-gold">Low stock ({lowStock.length})</h2>
          {lowStock.length === 0 ? (
            <p className="mt-2 text-sm text-steel-grey">Nothing is running low.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {lowStock.slice(0, 8).map((p: { product_id: string; name: string; sku: string; quantity_on_hand: number; min_stock: number }) => (
                <li key={p.product_id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="font-data text-steel-grey">
                    {p.quantity_on_hand} / min {p.min_stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-[1.5px] border-line bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent activity</h2>
          <Link href="/admin/stock-log" className="text-sm text-rust hover:underline">
            Full stock log →
          </Link>
        </div>
        <ul className="mt-2 divide-y divide-line text-sm">
          {recentAudit.map((a: { id: number; action: string; entity_type: string; created_at: string }) => (
            <li key={a.id} className="flex justify-between py-1.5">
              <span className="font-data">{a.action}</span>
              <span className="text-steel-grey">{new Date(a.created_at).toLocaleString('en-IN')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
