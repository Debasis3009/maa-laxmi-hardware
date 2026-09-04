import { getApp } from '@/lib/db';
import StorefrontClient from '@/components/storefront/StorefrontClient';
import type { Product, CategoryNode, Unit } from '@/lib/types';

export default function HomePage() {
  const app = getApp();
  const products = JSON.parse(JSON.stringify(app.productService.listProducts({ isActive: true, limit: 500 }))) as unknown as Product[];
  const categories = JSON.parse(JSON.stringify(app.catalogService.listCategoryTree({ activeOnly: true }))) as unknown as CategoryNode[];
  const units = JSON.parse(JSON.stringify(app.catalogService.listUnits())) as unknown as Unit[];
  const settings = JSON.parse(JSON.stringify(app.settingsService.getAll()));


  return (
    <div>
      <section className="border-b-[1.5px] border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="font-display text-4xl font-semibold leading-[1.05] sm:text-5xl">
            {settings.business_name}
          </h1>
          <p className="mt-3 max-w-xl text-charcoal/80">
            Quality hardware, building materials, paints, sanitary and electrical products —
            in stock at our Nakrakonda counter, ready for pickup or WhatsApp order.
          </p>
        </div>
      </section>

      <StorefrontClient
        products={products}
        categories={categories}
        units={units}
        businessName={settings.business_name}
        whatsappNumber={settings.whatsapp_number}
      />
    </div>
  );
}
