import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import InventoryTable from '@/components/admin/InventoryTable';
import AddProductModal from '@/components/admin/AddProductModal';
import type { Product, CategoryNode, Unit } from '@/lib/types';

export default function AdminProductsPage() {
  requireAdmin();
  const app = getApp();
  const products = (JSON.parse(JSON.stringify(app.productService.listProducts({ limit: 1000 }) || []))) as unknown as Product[];
  const categories = (JSON.parse(JSON.stringify(app.catalogService.listCategoryTree({ activeOnly: true }) || []))) as unknown as CategoryNode[];
  const units = (JSON.parse(JSON.stringify(app.catalogService.listUnits() || []))) as unknown as Unit[];

  return (
    <div className="space-y-4">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-white p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">Products & Inventory</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Swipe sideways on phone to view all columns. Tap prices or stock to edit inline.
          </p>
        </div>
        <AddProductModal categories={categories} units={units} />
      </div>

      {/* Touch-Scrollable Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="min-w-[680px]">
            <InventoryTable products={products} />
          </div>
        </div>
      </div>
    </div>
  );
}
