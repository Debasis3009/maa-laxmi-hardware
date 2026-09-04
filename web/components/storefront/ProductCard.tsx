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
  const variants = product?.variants || [];
  const minVariantPrice = variants.length > 0
    ? Math.min(...variants.map((v) => v.selling_price || 0))
    : 0;

  const priceLabel = product?.has_variants && variants.length > 0
    ? `From ₹${minVariantPrice.toFixed(0)}`
    : `₹${(Number(product?.selling_price) || 0).toFixed(0)}`;

  const stockStatus = product?.stock?.status || 'IN_STOCK';

  return (
    <div className="group flex h-full flex-col justify-between rounded-md border border-line bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col p-3 sm:p-4 text-left focus:outline-none"
      >
        <div className="mb-1 flex w-full items-start justify-between gap-1">
          <StockBadge status={stockStatus} />
          <span className="font-data text-[10px] sm:text-xs text-steel-grey shrink-0">{product?.sku || ''}</span>
        </div>

        <h3 className="mt-1.5 font-display text-base sm:text-lg font-semibold leading-snug text-charcoal group-hover:text-rust transition-colors line-clamp-2">
          {product?.name || 'Item'}
        </h3>

        {product?.short_description && (
          <p className="mt-1 line-clamp-2 text-xs text-charcoal/70">
            {product.short_description}
          </p>
        )}

        <div className="mt-auto pt-3">
          <span className="font-data text-base sm:text-xl font-bold text-charcoal">
            {priceLabel}
          </span>
          {!product?.has_variants && unit && (
            <span className="text-xs text-steel-grey"> /{unit.abbreviation}</span>
          )}
        </div>
      </button>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 border-t border-line text-xs font-semibold">
        <button
          type="button"
          onClick={onWhatsApp}
          className="flex items-center justify-center gap-1 border-r border-line py-2.5 text-steel-green hover:bg-steel-green/10 active:scale-95 transition-all"
        >
          <span>WhatsApp</span>
        </button>
        <button
          type="button"
          onClick={onAddToCart}
          disabled={stockStatus === 'OUT_OF_STOCK' && !product?.quotation_enabled}
          className="flex items-center justify-center gap-1 py-2.5 text-rust hover:bg-rust/10 active:scale-95 transition-all disabled:cursor-not-allowed disabled:text-steel-grey disabled:hover:bg-transparent"
        >
          <span>{stockStatus === 'OUT_OF_STOCK' ? 'Quote' : 'Add'}</span>
        </button>
      </div>
    </div>
  );
}
