'use client';

import React from 'react';
import type { Product, Unit } from '@/lib/types';
import seedProducts from '@/lib/core/src/seed/products.json';

interface ProductCardProps { product: Product; unit?: Unit; onOpen?: () => void; onWhatsApp?: () => void; onAddToCart?: () => void; onSelect?: (product: Product) => void; }

export default function ProductCard({ product, unit, onOpen, onWhatsApp, onAddToCart, onSelect }: ProductCardProps) {
  const seedMatch = (seedProducts as any[]).find((s) => s.sku === product?.sku);
  const imgUrl = (product as any)?.imageUrl || (product as any)?.image_url || seedMatch?.imageUrl || seedMatch?.image_url || null;
  const handleCardClick = () => onOpen ? onOpen() : onSelect?.(product);
  const unitLabel = unit?.abbreviation || 'pc';

  return (
    <article onClick={handleCardClick} className="group product-card flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_5px_20px_rgba(23,23,23,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(23,23,23,.12)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#ece9e3]">
        {imgUrl ? <img src={imgUrl} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center text-5xl">📦</div>}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2"><span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#15803d] shadow-sm">In stock</span><span className="rounded-full bg-[#171717]/80 px-2 py-1 font-data text-[9px] text-white backdrop-blur-sm">{product.sku}</span></div>
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="line-clamp-2 font-display text-lg font-bold leading-tight text-[#171717]">{product.name}</h3>
        {product.short_description && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">{product.short_description}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-black/6 pt-3.5">
          <div><div className="font-data text-[10px] font-bold uppercase text-slate-400">Starting from</div><div className="mt-0.5 text-lg font-extrabold text-[#171717]">₹{product.selling_price ?? (product as any).price ?? 0}<span className="ml-1 text-xs font-semibold text-slate-400">/ {unitLabel}</span></div></div>
          <div className="flex gap-1.5">
            <button type="button" onClick={(e) => { e.stopPropagation(); onWhatsApp?.(); }} className="grid h-9 w-9 place-items-center rounded-xl bg-[#15803d] text-white shadow-sm transition hover:scale-105" aria-label="WhatsApp inquiry">WA</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }} className="grid h-9 w-9 place-items-center rounded-xl bg-[#c62828] text-white shadow-sm transition hover:scale-105" aria-label="Add to cart">+</button>
          </div>
        </div>
      </div>
    </article>
  );
}
