import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import InventoryTable from '@/components/admin/InventoryTable';
import type { Product } from '@/lib/types';

export default function AdminProductsPage() {
  requireAdmin();
  const app = getApp();
  const products = app.productService.listProducts({ limit: 1000 }) as unknown as Product[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-semibold">Products & inventory</h1>
        <p className="text-sm text-steel-grey">
          Click any price, stock, or threshold value to edit it inline. Changes write straight to the
          database through the Phase 1 service layer — price changes are logged to price history, stock
          changes are logged to the stock ledger.
        </p>
      </div>
      <InventoryTable products={products} />
    </div>
  );
}
