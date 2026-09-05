'use client';

import React from 'react';
import type { Product, Unit } from '@/lib/types';
import seedProducts from '@/lib/core/src/seed/products.json';

interface ProductCardProps {
  product: Product;
  unit?: Unit;
  onOpen?: () => void;
  onWhatsApp?: () => void;
  onAddToCart?: () => void;
  onSelect?: (product: Product) => void;
}

export default function ProductCard({
  product,
  unit,
  onOpen,
  onWhatsApp,
  onAddToCart,
  onSelect,
}: ProductCardProps) {
  const seedMatch = (seedProducts as any[]).find((s) => s.sku === product?.sku);
  const imgUrl =
    (product as any)?.imageUrl ||
    (product as any)?.image_url ||
    seedMatch?.imageUrl ||
    seedMatch?.image_url ||
    null;

  const handleCardClick = () => {
    if (onOpen) onOpen();
    else if (onSelect) onSelect(product);
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) onAddToCart();
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onWhatsApp) {
      onWhatsApp();
    } else {
      const text = encodeURIComponent('Hi, I want to inquire about: ' + product.name + ' (' + product.sku + ')');
      window.open('https://wa.me/919932667908?text=' + text, '_blank');
    }
  };

  const unitLabel = unit?.abbreviation || 'pc';

  return (
    <div
      onClick={handleCardClick}
      className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md cursor-pointer"
    >
      <div>
        <div className="relative mb-3 flex h-40 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={product.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <span className="text-4xl">📦</span>
          )}
          <span className="absolute bottom-2 left-2 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            In stock
          </span>
          <span className="absolute bottom-2 right-2 text-[10px] text-slate-400 font-mono">
            {product.sku}
          </span>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 leading-snug">
          {product.name}
        </h3>
        {product.short_description && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {product.short_description}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
        <div>
          <span className="text-xs text-slate-400 font-normal">₹</span>
          <span className="text-base font-bold text-slate-900 ml-0.5">
            {product.selling_price ?? (product as any).price ?? 0}
          </span>
          <span className="text-xs text-slate-400 ml-1">/ {unitLabel}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleWhatsAppClick}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
            title="WhatsApp Inquiry"
          >
            💬
          </button>
          <button
            type="button"
            onClick={handleCartClick}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-700 text-white hover:bg-sky-800 transition"
            title="Add to Cart"
          >
            🛒
          </button>
        </div>
      </div>
    </div>
  );
}
