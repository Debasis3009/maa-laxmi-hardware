import seedProducts from '@/lib/core/src/seed/products.json';
import { getApp } from '@/lib/db';
import StorefrontClient from '@/components/storefront/StorefrontClient';
import type { Product, CategoryNode, Unit } from '@/lib/types';

export default function HomePage() {
  const app = getApp();

  const rawProducts = (JSON.parse(JSON.stringify(app.productService.listProducts({ isActive: true, limit: 500 }) || []))) as unknown as (Product & { imageUrl?: string; image_url?: string })[];
  const imageMap = new Map<string, string>();
  for (const item of (seedProducts as any[])) {
    if (item.sku && (item.imageUrl || item.image_url)) {
      imageMap.set(item.sku, item.imageUrl || item.image_url);
    }
  }
  const products = rawProducts.map((p) => ({
    ...p,
    imageUrl: imageMap.get(p.sku) || (p as any).imageUrl || (p as any).image_url || null,
    image_url: imageMap.get(p.sku) || (p as any).image_url || (p as any).imageUrl || null,
  })) as unknown as Product[];
  const categories = (JSON.parse(JSON.stringify(app.catalogService.listCategoryTree({ activeOnly: true }) || []))) as unknown as CategoryNode[];
  const units = (JSON.parse(JSON.stringify(app.catalogService.listUnits() || []))) as unknown as Unit[];
  const settings = (JSON.parse(JSON.stringify(app.settingsService.getAll() || {}))) as Record<string, string>;

  const businessName = settings?.business_name || 'Maa Laxmi Hardware';
  const whatsappNumber = settings?.whatsapp_number || '919932667908';

  return (
    <div className="min-h-screen">
      {/* Brand Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#083358] via-[#0b487c] to-[#041c33] py-9 sm:py-14 text-white shadow-md">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="animate-fade-in-up space-y-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-200 backdrop-blur-sm shadow-xs">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              Direct Counter Ready &bull; Fast Delivery
            </span>

            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white">
              {businessName}
            </h1>

            <p className="font-display text-sm sm:text-base font-bold uppercase tracking-widest text-amber-300">
              The Best Choice For Your Dream Home
            </p>

            <p className="max-w-2xl text-xs sm:text-sm text-slate-200 leading-relaxed pt-1">
              Cement, TMT bars, Asian/Berger paints, sanitary pipes, and electrical supplies. Verified counter stock at Nakrakonda with instant WhatsApp bookings.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-3 text-xs font-semibold">
              <span className="flex items-center gap-1 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-white">
                📍 Nakrakonda Counter
              </span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500 text-white px-3 py-1 shadow-xs">
                💬 WhatsApp Order Active
              </span>
              <span className="flex items-center gap-1 rounded-full bg-amber-400 text-slate-950 px-3 py-1 shadow-xs">
                ⚡ Ready Stock
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <StorefrontClient
        products={products || []}
        categories={categories || []}
        units={units || []}
        businessName={businessName}
        whatsappNumber={whatsappNumber}
      />
    </div>
  );
}
