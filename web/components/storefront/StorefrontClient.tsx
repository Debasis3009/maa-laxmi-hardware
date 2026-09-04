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
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          products={products}
          value={search}
          onChange={setSearch}
          onPick={(p) => setOpenProduct(p)}
        />
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="self-start rounded-sm border-[1.5px] border-line bg-white px-4 py-2 text-sm font-medium hover:border-rust/60 sm:self-auto"
        >
          Cart {cart.length > 0 && <span className="ml-1 rounded-full bg-rust px-1.5 py-0.5 text-xs text-paper">{cart.length}</span>}
        </button>
      </div>

      <div className="mb-6">
        <CategoryChips categories={flatCategories.filter((c) => !c.parent_id)} activeId={activeCategory} onSelect={setActiveCategory} />
      </div>

      {visibleProducts.length === 0 ? (
        <p className="py-16 text-center text-steel-grey">No products match your search. Try a different name or SKU.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              unit={unitById.get(p.unit_id)}
              onOpen={() => setOpenProduct(p)}
              onWhatsApp={() => whatsAppForProduct(p, null, 1)}
              onAddToCart={() => addToCart(p, null, 1)}
            />
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
