import type { StockStatus } from '@/lib/types';

const STYLES: Record<StockStatus, { label: string; classes: string }> = {
  IN_STOCK: { label: 'In stock', classes: 'bg-steel-green/10 text-steel-green border-steel-green/40' },
  LOW_STOCK: { label: 'Low stock', classes: 'bg-gold/10 text-gold border-gold/50' },
  OUT_OF_STOCK: { label: 'Out of stock', classes: 'bg-brick/10 text-brick border-brick/40' },
};

export default function StockBadge({ status }: { status: StockStatus }) {
  const s = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium ${s.classes}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {s.label}
    </span>
  );
}
