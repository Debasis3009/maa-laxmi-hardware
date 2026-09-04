'use client';

import { useMemo, useState } from 'react';
import type { Product, CategoryNode, Unit, Variant } from '@/lib/types';
import SearchBar from './SearchBar';
import CategoryChips from './CategoryChips';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import CartDrawer, { type CartItem } from './CartDrawer';
import { buildWhatsAppUrl, singleProductOrderMessage, bulkQuoteMessage } from '@/lib/whatsapp';

function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((n) => [n, ...flattenCategories(n.children || [])]);
}

export default function StorefrontClient({
  products,
  categories,
  units,
  businessName,
  whatsappNumber,
}: {
  products: Product[];
  categories: CategoryNode[];
  units: Unit[];
  businessName: string;
  whatsappNumber: string;
}) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const unitById = useMemo(() => new Map(units.map((u) => [u.id, u])), [units]);
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchesCategory = activeCategory === null || p.category_id === activeCategory;
      return matchesSearch && matchesCategory && p.is_active;
    });
  }, [products, search, activeCategory]);

  function addToCart(product: Product, variant: Variant | null, quantity: number) {
    const key = variant ? variant.id : product.id;
    const unit = unitById.get(variant ? variant.unit_id : product.unit_id);
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i));
      return [
        ...prev,
        {
          key,
          name: variant ? `${product.name} — ${variant.name}` : product.name,
          sku: variant ? variant.sku : product.sku,
          unit: unit?.abbreviation || 'pc',
          quantity,
        },
      ];
    });
    setOpenProduct(null);
    setCartOpen(true);
  }

  function whatsAppForProduct(product: Product, variant: Variant | null, quantity: number) {
    const unit = unitById.get(variant ? variant.unit_id : product.unit_id);
    const message = singleProductOrderMessage({
      businessName,
      productName: variant ? `${product.name} — ${variant.name}` : product.name,
      sku: variant ? variant.sku : product.sku,
      unit: unit?.name || 'Piece',
      quantity,
    });
    window.open(buildWhatsAppUrl(whatsappNumber, message), '_blank');
  }

  function requestBulkQuote() {
    const message = bulkQuoteMessage({ businessName, items: cart });
    window.open(buildWhatsAppUrl(whatsappNumber, message), '_blank');
  }

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-6">
      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-20 -mx-3 sm:mx-0 mb-5 bg-[#F7F6F3]/95 backdrop-blur-md px-3 sm:px-0 py-2 border-b sm:border-b-0 border-line/50 transition-all">
        <div className="flex items-center gap-2 sm:gap-4 justify-between">
          <div className="flex-1">
            <SearchBar
              products={products}
              value={search}
              onChange={setSearch}
              onPick={(p) => setOpenProduct(p)}
            />
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-1.5 shrink-0 rounded-md border border-line bg-white px-3.5 py-2 text-sm font-semibold shadow-xs hover:border-rust transition-all active:scale-95"
          >
            <span>Cart</span>
            {cart.length > 0 && (
              <span className="rounded-full bg-rust px-1.5 py-0.5 text-xs font-bold text-paper animate-pulse">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Categories on Mobile */}
        <div className="mt-3 overflow-x-auto no-scrollbar">
          <CategoryChips
            categories={flatCategories.filter((c) => !c.parent_id)}
            activeId={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>
      </div>

      {/* Product Catalog Grid: 2 cols on mobile, 3 cols on tablet, 4 cols on desktop */}
      {visibleProducts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-display text-lg text-steel-grey">No products found matching &ldquo;{search}&rdquo;</p>
          <button
            onClick={() => { setSearch(''); setActiveCategory(null); }}
            className="mt-3 text-sm font-medium text-rust hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {visibleProducts.map((p, idx) => (
            <div
              key={p.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
            >
              <ProductCard
                product={p}
                unit={unitById.get(p.unit_id)}
                onOpen={() => setOpenProduct(p)}
                onWhatsApp={() => whatsAppForProduct(p, null, 1)}
                onAddToCart={() => addToCart(p, null, 1)}
              />
            </div>
          ))}
        </div>
      )}

      {openProduct && (
        <ProductModal
          product={openProduct}
          unit={unitById.get(openProduct.unit_id)}
          onClose={() => setOpenProduct(null)}
          onWhatsApp={(variant, qty) => whatsAppForProduct(openProduct, variant, qty)}
          onAddToCart={(variant, qty) => addToCart(openProduct, variant, qty)}
        />
      )}

      {cartOpen && (
        <CartDrawer
          items={cart}
          onClose={() => setCartOpen(false)}
          onRemove={(key) => setCart((prev) => prev.filter((i) => i.key !== key))}
          onRequestQuote={requestBulkQuote}
        />
      )}
    </div>
  );
}
