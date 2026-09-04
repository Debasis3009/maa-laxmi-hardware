'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';

export default function SearchBar({
  products,
  value,
  onChange,
  onPick,
}: {
  products: Product[];
  value: string;
  onChange: (v: string) => void;
  onPick: (product: Product) => void;
}) {
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 6);
  }, [products, value]);

  return (
    <div className="relative w-full max-w-md">
      <label htmlFor="catalog-search" className="sr-only">
        Search products by name or SKU
      </label>
      <input
        id="catalog-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        placeholder="Search products or SKU…"
        className="w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2 text-sm outline-none focus:border-rust"
      />
      {focused && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-sm border-[1.5px] border-line bg-white shadow-sm">
          {suggestions.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-paper"
              >
                <span>{p.name}</span>
                <span className="font-data text-xs text-steel-grey">{p.sku}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
