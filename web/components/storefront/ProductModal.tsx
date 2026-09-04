'use client';

import { useState } from 'react';
import type { Product, Unit, Variant } from '@/lib/types';
import StockBadge from './StockBadge';

function getCategoryIcon(name: string = '') {
  const n = name.toLowerCase();
  if (n.includes('paint')) return '🎨';
  if (n.includes('pipe') || n.includes('fitting') || n.includes('pvc') || n.includes('tap')) return '🚰';
  if (n.includes('cement') || n.includes('sand') || n.includes('tmt') || n.includes('rod')) return '🧱';
  if (n.includes('wire') || n.includes('light') || n.includes('switch') || n.includes('fan')) return '⚡';
  return '🔧';
}

export default function ProductModal({
  product,
  unit,
  onClose,
  onWhatsApp,
  onAddToCart,
}: {
  product: Product;
  unit: Unit | undefined;
  onClose: () => void;
  onWhatsApp: (variant: Variant | null, quantity: number) => void;
  onAddToCart: (variant: Variant | null, quantity: number) => void;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.has_variants && product.variants[0] ? product.variants[0].id : null
  );
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId) || null;
  const stock = selectedVariant ? selectedVariant.stock : product.stock;
  const price = selectedVariant ? selectedVariant.selling_price : product.selling_price;
  const icon = getCategoryIcon(product.name);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:items-center sm:p-4 transition-all"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#083358] to-[#0d4b82] p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl backdrop-blur-sm border border-white/20">
                {icon}
              </span>
              <div>
                <span className="font-data text-xs font-semibold uppercase tracking-wider text-amber-300">
                  SKU {selectedVariant ? selectedVariant.sku : product.sku}
                </span>
                <h2 className="font-display text-2xl font-bold leading-tight text-white mt-0.5">
                  {product.name}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="space-y-5 p-5">
          {product.short_description && (
            <p className="text-sm leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
              {product.short_description}
            </p>
          )}

          {/* Variant Selector */}
          {product.has_variants && product.variants?.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Size / Pack
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = v.id === selectedVariantId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`rounded-lg px-3.5 py-2 text-xs font-bold tracking-wide transition-all shadow-xs ${
                        isSelected
                          ? 'bg-[#083358] text-white ring-2 ring-blue-500/30 shadow-md'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                      }`}
                    >
                      {v.name} &bull; ₹{Number(v.selling_price).toFixed(0)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price & Stock Status Banner */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Store Counter Price</p>
              <div className="flex items-baseline gap-1">
                <span className="font-data text-2xl font-black text-slate-900">
                  ₹{Number(price || 0).toFixed(0)}
                </span>
                {unit && (
                  <span className="text-xs font-semibold text-slate-500">/{unit.abbreviation}</span>
                )}
              </div>
            </div>
            <StockBadge status={stock?.status || 'IN_STOCK'} />
          </div>

          {/* Quantity Selector with Tactile -/+ buttons */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Quantity
            </label>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white shadow-xs p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 active:scale-95 text-lg font-bold"
                >
                  &minus;
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-14 text-center font-data text-base font-bold text-slate-900 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 active:scale-95 text-lg font-bold"
                >
                  &#43;
                </button>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {unit?.name || 'Unit(s)'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50/80 p-4">
          <button
            type="button"
            onClick={() => onWhatsApp(selectedVariant, quantity)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <span>💬 WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => onAddToCart(selectedVariant, quantity)}
            disabled={stock?.status === 'OUT_OF_STOCK' && !product.quotation_enabled}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#083358] px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-[#0b487c] active:scale-95 transition-all disabled:opacity-40 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            <span>{stock?.status === 'OUT_OF_STOCK' ? 'Request Quote' : '🛒 Add to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
