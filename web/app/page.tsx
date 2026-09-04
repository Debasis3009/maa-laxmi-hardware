import { getApp } from '@/lib/db';
import StorefrontClient from '@/components/storefront/StorefrontClient';
import type { Product, CategoryNode, Unit } from '@/lib/types';

export default function HomePage() {
  const app = getApp();

  const products = (JSON.parse(JSON.stringify(app.productService.listProducts({ isActive: true, limit: 500 }) || []))) as unknown as Product[];
  const categories = (JSON.parse(JSON.stringify(app.catalogService.listCategoryTree({ activeOnly: true }) || []))) as unknown as CategoryNode[];
  const units = (JSON.parse(JSON.stringify(app.catalogService.listUnits() || []))) as unknown as Unit[];
  const settings = (JSON.parse(JSON.stringify(app.settingsService.getAll() || {}))) as Record<string, string>;

  const businessName = settings?.business_name || 'Maa Laxmi Hardware';
  const whatsappNumber = settings?.whatsapp_number || '919932667908';

  return (
    <div className="min-h-screen">
      {/* Modern Hero Section */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-white via-white to-amber-50/20 py-8 md:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rust/20 bg-rust/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rust">
              <span className="h-2 w-2 rounded-full bg-rust animate-ping" />
              Counter Open &bull; Instant Delivery
            </span>

            <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-charcoal">
              {businessName}
            </h1>

            <p className="mt-2 sm:mt-3 max-w-2xl text-sm sm:text-base text-charcoal/80 leading-relaxed">
              Building materials, sanitary fittings, paints, and electrical supplies. Direct retail counter in Nakrakonda or instant booking via WhatsApp.
            </p>

            {/* Quick Trust Highlights */}
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs sm:text-sm font-medium text-steel-grey">
              <span className="flex items-center gap-1.5 rounded-md bg-white border border-line px-2.5 py-1 shadow-xs">
                📍 Nakrakonda Counter
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-white border border-line px-2.5 py-1 shadow-xs">
                💬 WhatsApp Billing
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-white border border-line px-2.5 py-1 shadow-xs">
                ⚡ Ready Stock
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog View */}
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
