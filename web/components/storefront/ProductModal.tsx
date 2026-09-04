'use client';

import { useState } from 'react';
import type { Product, Unit, Variant } from '@/lib/types';
import StockBadge from './StockBadge';

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

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || null;
  const stock = selectedVariant ? selectedVariant.stock : product.stock;
  const price = selectedVariant ? selectedVariant.selling_price : product.selling_price;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto border-[1.5px] border-line bg-white sm:rounded-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b-[1.5px] border-line p-4">
          <div>
            <h2 className="font-display text-2xl font-semibold leading-tight">{product.name}</h2>
            <p className="font-data text-xs text-steel-grey">SKU {selectedVariant ? selectedVariant.sku : product.sku}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl leading-none text-steel-grey hover:text-charcoal">
            ×
          </button>
        </div>

        <div className="space-y-4 p-4">
          {product.short_description && <p className="text-sm text-charcoal/80">{product.short_description}</p>}

          {product.has_variants && (
            <div>
              <label className="mb-1 block text-sm font-medium">Choose size / pack</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`rounded-sm border-[1.5px] px-3 py-1.5 text-sm ${
                      v.id === selectedVariantId ? 'border-rust bg-rust text-paper' : 'border-line hover:border-rust/60'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="font-data text-2xl font-semibold">
              ₹{price.toFixed(0)}
              {unit && <span className="text-sm text-steel-grey"> / {unit.abbreviation}</span>}
            </span>
            <StockBadge status={stock.status} />
          </div>

          <div>
            <label htmlFor="qty" className="mb-1 block text-sm font-medium">
              Quantity
            </label>
            <input
              id="qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-28 rounded-sm border-[1.5px] border-line px-3 py-2 text-sm outline-none focus:border-rust"
            />
            {stock.status !== 'OUT_OF_STOCK' && quantity > stock.available_quantity && (
              <p className="mt-1 text-sm text-brick">Only {stock.available_quantity} units are currently available.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t-[1.5px] border-line p-4">
          <button
            type="button"
            onClick={() => onWhatsApp(selectedVariant, quantity)}
            className="rounded-sm border-[1.5px] border-steel-green px-3 py-2.5 text-sm font-medium text-steel-green hover:bg-steel-green/5"
          >
            Order on WhatsApp
          </button>
          <button
            type="button"
            onClick={() => onAddToCart(selectedVariant, quantity)}
            disabled={stock.status === 'OUT_OF_STOCK' ? !product.quotation_enabled : quantity > stock.available_quantity}
            className="rounded-sm bg-rust px-3 py-2.5 text-sm font-medium text-paper hover:bg-rust-dark disabled:cursor-not-allowed disabled:bg-steel-grey"
          >
            {stock.status === 'OUT_OF_STOCK' ? 'Request quote' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
