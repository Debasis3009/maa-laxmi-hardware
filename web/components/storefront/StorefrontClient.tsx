'use client';

import { useMemo, useState } from 'react';
import type { Product, CategoryNode, Unit, Variant } from '@/lib/types';
import SearchBar from './SearchBar';
import CategoryChips from './CategoryChips';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import CartDrawer, { type CartItem } from './CartDrawer';
import { buildWhatsAppUrl, singleProductOrderMessage, bulkQuoteMessage } from '@/lib/whatsapp';

function flattenCategories(nodes: CategoryNode[]): CategoryNode[] { return nodes.flatMap((n) => [n, ...flattenCategories(n.children || [])]); }

export default function StorefrontClient({ products, categories, units, businessName, whatsappNumber }: { products: Product[]; categories: CategoryNode[]; units: Unit[]; businessName: string; whatsappNumber: string }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const unitById = useMemo(() => new Map(units.map((u) => [u.id, u])), [units]);
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) && (activeCategory === null || p.category_id === activeCategory) && p.is_active);
  }, [products, search, activeCategory]);

  function addToCart(product: Product, variant: Variant | null, quantity: number) {
    const key = variant ? variant.id : product.id;
    const unit = unitById.get(variant ? variant.unit_id : product.unit_id);
    setCart((prev) => { const existing = prev.find((i) => i.key === key); if (existing) return prev.map((i) => i.key === key ? { ...i, quantity: i.quantity + quantity } : i); return [...prev, { key, name: variant ? `${product.name} — ${variant.name}` : product.name, sku: variant ? variant.sku : product.sku, unit: unit?.abbreviation || 'pc', quantity }]; });
    setOpenProduct(null); setCartOpen(true);
  }
  function whatsAppForProduct(product: Product, variant: Variant | null, quantity: number) {
    const unit = unitById.get(variant ? variant.unit_id : product.unit_id);
    const message = singleProductOrderMessage({ businessName, productName: variant ? `${product.name} — ${variant.name}` : product.name, sku: variant ? variant.sku : product.sku, unit: unit?.name || 'Piece', quantity });
    window.open(buildWhatsAppUrl(whatsappNumber, message), '_blank');
  }
  function requestBulkQuote() { window.open(buildWhatsAppUrl(whatsappNumber, bulkQuoteMessage({ businessName, items: cart })), '_blank'); }

  return (
    <section id="products" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><div className="font-data text-[10px] font-bold uppercase tracking-[.2em] text-[#c62828]">CATALOGUE / READY STOCK</div><h2 className="mt-1 font-display text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">Build your project</h2><p className="mt-2 max-w-2xl text-sm text-slate-500">Browse current counter products, compare options and send a quantity request directly on WhatsApp.</p></div>
        <button type="button" onClick={() => setCartOpen(true)} className="self-start rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-extrabold shadow-sm transition hover:border-[#c62828] hover:text-[#c62828] lg:self-auto">Quote list {cart.length > 0 && <span className="ml-1 rounded-full bg-[#c62828] px-2 py-0.5 text-xs text-white">{cart.length}</span>}</button>
      </div>

      <div className="sticky top-[53px] z-20 mb-7 rounded-2xl border border-black/8 bg-[#f5f3ef]/95 p-2 shadow-sm backdrop-blur-md sm:top-[61px] sm:p-3">
        <div className="flex gap-2"><div className="min-w-0 flex-1"><SearchBar products={products} value={search} onChange={setSearch} onPick={(p) => setOpenProduct(p)} /></div><button type="button" onClick={() => setCartOpen(true)} className="hidden rounded-xl bg-[#171717] px-4 py-2 text-sm font-bold text-white sm:block">View Quote</button></div>
        <div className="mt-2 overflow-x-auto no-scrollbar"><CategoryChips categories={flatCategories.filter((c) => !c.parent_id)} activeId={activeCategory} onSelect={setActiveCategory} /></div>
      </div>

      {visibleProducts.length === 0 ? <div className="rounded-2xl border border-dashed border-black/15 bg-white px-6 py-20 text-center"><p className="font-display text-xl text-slate-500">No products found{search ? ` for “${search}”` : ''}.</p><button onClick={() => { setSearch(''); setActiveCategory(null); }} className="mt-3 text-sm font-bold text-[#c62828] hover:underline">Clear filters</button></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">{visibleProducts.map((p, idx) => <div key={p.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}><ProductCard product={p} unit={unitById.get(p.unit_id)} onOpen={() => setOpenProduct(p)} onWhatsApp={() => whatsAppForProduct(p, null, 1)} onAddToCart={() => addToCart(p, null, 1)} /></div>)}</div>}

      <div className="mt-12 overflow-hidden rounded-3xl bg-[#c62828] p-6 text-white shadow-[0_20px_60px_rgba(198,40,40,.2)] sm:p-9"><div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="font-data text-[10px] font-bold uppercase tracking-[.2em] text-amber-300">CONTRACTOR / BULK ENQUIRY</div><h3 className="mt-1 font-display text-3xl font-extrabold uppercase sm:text-4xl">Need a quantity quote?</h3><p className="mt-2 max-w-xl text-sm text-white/75">Add products to your quote list and send the full requirement to the store in one WhatsApp message.</p></div><button type="button" onClick={() => setCartOpen(true)} className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#c62828] shadow-sm transition hover:-translate-y-0.5">Open Quote List →</button></div></div>

      {openProduct && <ProductModal product={openProduct} unit={unitById.get(openProduct.unit_id)} onClose={() => setOpenProduct(null)} onWhatsApp={(variant, qty) => whatsAppForProduct(openProduct, variant, qty)} onAddToCart={(variant, qty) => addToCart(openProduct, variant, qty)} />}
      {cartOpen && <CartDrawer items={cart} onClose={() => setCartOpen(false)} onRemove={(key) => setCart((prev) => prev.filter((i) => i.key !== key))} onRequestQuote={requestBulkQuote} />}
    </section>
  );
}
