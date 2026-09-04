import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import BulkPriceModal from '@/components/admin/BulkPriceModal';
import type { CategoryNode, Brand } from '@/lib/types';

function flatten(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children || [])]);
}

export default function AdminPricingPage() {
  requireAdmin();
  const app = getApp();
  const categories = flatten(app.catalogService.listCategoryTree() as unknown as CategoryNode[]);
  const brands = app.catalogService.listBrands() as unknown as Brand[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-semibold">Bulk pricing</h1>
        <p className="text-sm text-steel-grey">Update prices across a whole category or brand at once, with a preview before anything is saved.</p>
      </div>
      <BulkPriceModal categories={categories} brands={brands} />
    </div>
  );
}
