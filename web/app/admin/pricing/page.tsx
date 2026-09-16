import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import BulkPriceModal from '@/components/admin/BulkPriceModal';
import type { CategoryNode, Brand } from '@/lib/types';

function flatten(nodes: CategoryNode[]): CategoryNode[] { return nodes.flatMap((n) => [n, ...flatten(n.children || [])]); }

export default function AdminPricingPage() {
  requireAdmin();
  const app = getApp();
  const categories = flatten(app.catalogService.listCategoryTree() as unknown as CategoryNode[]);
  const brands = app.catalogService.listBrands() as unknown as Brand[];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#07527f]">Pricing control</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Bulk pricing</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Update prices across a category or brand with a preview before anything is saved.</p></section>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><BulkPriceModal categories={categories} brands={brands} /></div>
    </div>
  );
}
