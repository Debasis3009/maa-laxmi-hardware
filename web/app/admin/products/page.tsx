import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import InventoryTable from '@/components/admin/InventoryTable';
import AddProductModal from '@/components/admin/AddProductModal';
import type { Product, CategoryNode, Unit } from '@/lib/types';

export default async function AdminProductsPage() {
  await requireAdmin();
  const app = await getApp();
  const products = (JSON.parse(JSON.stringify(await app.productService.listProducts({ limit: 1000 }) || []))) as unknown as Product[];
  const categories = (JSON.parse(JSON.stringify(await app.catalogService.listCategoryTree({ activeOnly: true }) || []))) as unknown as CategoryNode[];
  const units = (JSON.parse(JSON.stringify(await app.catalogService.listUnits() || []))) as unknown as Unit[];

  const activeCount = products.filter((p) => p.is_active).length;
  const inactiveCount = products.length - activeCount;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#07527f]">Catalogue control</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Products & Inventory</h1><p className="mt-1 text-sm text-slate-500">Manage products, prices and stock without leaving the admin panel.</p></div>
          <AddProductModal categories={categories} units={units} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{products.length} total</span><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">{activeCount} active</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-500">{inactiveCount} inactive</span></div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Inventory table</p><p className="text-[11px] text-slate-400">Swipe horizontally on small screens</p></div>
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}><div className="min-w-[680px]"><InventoryTable products={products} /></div></div>
      </div>
    </div>
  );
}
