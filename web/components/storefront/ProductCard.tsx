'use client';

import type { Product, Unit } from '@/lib/types';
import StockBadge from './StockBadge';

export default function ProductCard({
  product,
  unit,
  onOpen,
  onWhatsApp,
  onAddToCart,
}: {
  product: Product;
  unit: Unit | undefined;
  onOpen: () => void;
  onWhatsApp: () => void;
  onAddToCart: () => void;
}) {
  const priceLabel = product.has_variants
    ? `From ₹${Math.min(...product.variants.map((v) => v.selling_price)).toFixed(0)}`
    : `₹${product.selling_price.toFixed(0)}`;

  return (
    <div className="flex flex-col border-[1.5px] border-line bg-white">
      <button type="button" onClick={onOpen} className="flex flex-1 flex-col p-4 text-left">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold leading-tight">{product.name}</h3>
        </div>
        <p className="font-data text-xs text-steel-grey">SKU {product.sku}</p>
        {product.short_description && (
          <p className="mt-2 line-clamp-2 text-sm text-charcoal/80">{product.short_description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-data text-lg font-semibold">
            {priceLabel}
            {!product.has_variants && unit && <span className="text-sm text-steel-grey"> / {unit.abbreviation}</span>}
          </span>
          <StockBadge status={product.stock.status} />
        </div>
      </button>
      <div className="grid grid-cols-2 border-t-[1.5px] border-line text-sm font-medium">
        <button
          type="button"
          onClick={onWhatsApp}
          className="border-r-[1.5px] border-line px-3 py-2.5 text-steel-green hover:bg-steel-green/5"
        >
          WhatsApp order
        </button>
        <button
          type="button"
          onClick={onAddToCart}
          disabled={product.stock.status === 'OUT_OF_STOCK' && !product.quotation_enabled}
          className="px-3 py-2.5 text-rust hover:bg-rust/5 disabled:cursor-not-allowed disabled:text-steel-grey disabled:hover:bg-transparent"
        >
          {product.stock.status === 'OUT_OF_STOCK' ? 'Request quote' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}
