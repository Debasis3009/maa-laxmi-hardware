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

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <div>
          <span className="font-data text-base sm:text-lg font-black text-slate-900">
            {priceLabel}
          </span>
          {!product?.has_variants && unit?.abbreviation && (
            <span className="text-[11px] font-semibold text-slate-500"> /{unit.abbreviation}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onWhatsApp && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onWhatsApp();
              }}
              aria-label="Inquire on WhatsApp"
              title="Chat on WhatsApp"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs hover:bg-emerald-600 active:scale-90 transition-all"
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c4.55 0 8.25 3.7 8.25 8.24 0 2.2-.86 4.28-2.42 5.83a8.19 8.19 0 0 1-5.83 2.42c-1.48 0-2.93-.39-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.39c0-4.54 3.7-8.24 8.25-8.24zm4.8 11.59c-.26-.13-1.54-.76-1.78-.85-.24-.09-.41-.13-.59.13-.17.26-.68.85-.83 1.02-.15.18-.31.2-.57.07-.26-.13-1.11-.41-2.11-1.3-.78-.7-1.31-1.56-1.46-1.82-.15-.26-.02-.4.11-.53.12-.12.26-.31.39-.46.13-.15.17-.26.26-.44.09-.17.04-.33-.02-.46-.07-.13-.59-1.42-.81-1.95-.21-.51-.43-.44-.59-.45-.15-.01-.33-.01-.5-.01s-.46.07-.7.33c-.24.26-.92.9-.92 2.2 0 1.3 1.02 2.56 1.17 2.75.15.2 2.01 3.07 4.88 4.31.68.3 1.22.47 1.63.6.69.22 1.31.19 1.8.12.55-.08 1.54-.63 1.76-1.24.22-.61.22-1.13.15-1.24-.06-.11-.23-.18-.49-.31z" />
              </svg>
            </button>
          )}

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
            title={isOutOfStock ? 'Request Quote' : 'Add to Cart'}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#083358] to-[#0d4b82] text-white shadow-xs hover:opacity-90 active:scale-90 transition-all disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-40"
          >
            <span className="text-sm leading-none">🛒</span>
          </button>
        </div>
      </div>
    </div>
  );
}
