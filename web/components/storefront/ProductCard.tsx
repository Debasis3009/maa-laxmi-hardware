'use client';

import type { Product, Unit } from '@/lib/types';
import StockBadge from './StockBadge';

export default function ProductCard({
  product,
  unit,
  onOpen,
  onAddToCart,
}: {
  product: Product;
  unit: Unit | undefined;
  onOpen: () => void;
  onWhatsApp?: () => void;
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
  const isOutOfStock = stockStatus === 'OUT_OF_STOCK';

  return (
    <div className="group relative flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md">
      {/* Clickable Card Body */}
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col text-left focus:outline-none"
      >
        <div className="mb-2 flex w-full items-start justify-between gap-1">
          <StockBadge status={stockStatus} />
          <span className="font-data text-[10px] sm:text-xs text-slate-400 shrink-0">
            {product?.sku || ''}
          </span>
        </div>

        <h3 className="font-display text-sm sm:text-base font-bold leading-snug text-slate-800 group-hover:text-[#083358] transition-colors line-clamp-2">
          {product?.name || 'Item'}
        </h3>

        {product?.short_description && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {product.short_description}
          </p>
        )}
      </button>

      {/* Footer: Counter Price & Quick Cart Button */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <div>
          <span className="font-data text-base sm:text-lg font-black text-slate-900">
            {priceLabel}
          </span>
          {!product?.has_variants && unit && (
            <span className="text-[11px] font-semibold text-slate-500"> /{unit.abbreviation}</span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (product?.has_variants) {
              onOpen();
            } else {
              onAddToCart();
            }
          }}
          disabled={isOutOfStock && !product?.quotation_enabled}
          aria-label="Add to Cart"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#083358] to-[#0d4b82] text-white shadow-sm hover:opacity-90 active:scale-90 transition-all disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-40"
          title={isOutOfStock ? 'Request Quote' : 'Add to Cart'}
        >
          <span className="text-base leading-none">🛒</span>
        </button>
      </div>
    </div>
  );
}
