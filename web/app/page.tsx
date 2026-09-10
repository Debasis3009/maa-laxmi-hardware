export const dynamic = 'force-dynamic';
export const revalidate = 0;
import seedProducts from '@/lib/core/src/seed/products.json';
import { getApp } from '@/lib/db';
import StorefrontClient from '@/components/storefront/StorefrontClient';
import type { Product, CategoryNode, Unit } from '@/lib/types';

export default function HomePage() {
  const app = getApp();
  const rawProducts = JSON.parse(JSON.stringify(app.productService.listProducts({ isActive: true, limit: 500 }) || [])) as (Product & { imageUrl?: string; image_url?: string })[];
  const imageMap = new Map<string, string>();
  for (const item of seedProducts as any[]) if (item.sku && (item.imageUrl || item.image_url)) imageMap.set(item.sku, item.imageUrl || item.image_url);
  const products = rawProducts.map((p) => ({ ...p, imageUrl: imageMap.get(p.sku) || p.imageUrl || p.image_url || null, image_url: imageMap.get(p.sku) || p.image_url || p.imageUrl || null })) as Product[];
  const categories = JSON.parse(JSON.stringify(app.catalogService.listCategoryTree({ activeOnly: true }) || [])) as CategoryNode[];
  const units = JSON.parse(JSON.stringify(app.catalogService.listUnits() || [])) as Unit[];
  const settings = JSON.parse(JSON.stringify(app.settingsService.getAll() || {})) as Record<string, any>;
  const businessName = settings.business_name || 'Maa Laxmi Hardware';
  const whatsappNumber = settings.whatsapp_number || '919932667908';

  return (
    <div className="min-h-screen">
      <section className="hero-construction relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(135deg, transparent 0 55%, rgba(245,158,11,.5) 55% 56%, transparent 56%), linear-gradient(25deg, transparent 0 72%, rgba(198,40,40,.45) 72% 73%, transparent 73%)' }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="animate-fade-in-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-300 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Direct Counter • Ready Stock
            </div>
            <h1 className="font-display max-w-3xl text-5xl font-extrabold uppercase leading-[.92] tracking-tight text-white sm:text-7xl">Quality materials.<br /><span className="text-amber-400">Stronger projects.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">{businessName} supplies cement, TMT bars, paints, sanitary, electrical and essential hardware for builders, contractors and homeowners.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#products" className="rounded-xl bg-[#c62828] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(198,40,40,.3)] transition hover:-translate-y-0.5 hover:bg-[#991b1b]">Browse Products</a>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="rounded-xl bg-[#15803d] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(21,128,61,.25)] transition hover:-translate-y-0.5 hover:bg-[#166534]">Get a WhatsApp Quote</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-xs font-bold text-white/60"><span>✓ Verified counter stock</span><span>✓ Bulk quotation support</span><span>✓ Local delivery</span></div>
          </div>

          <div className="hero-product-stage hidden min-h-[390px] lg:block" aria-hidden="true">
            <div className="steel-orb" />
            <div className="tmt-stack"><i /><i /><i /><i /></div>
            <div className="cement-bag"><span>MAA LAXMI</span><strong>CEMENT</strong><small>BUILD STRONG</small></div>
            <div className="hero-tag">BUILD WITH CONFIDENCE</div>
          </div>
        </div>
      </section>

      <section id="about" className="border-b border-black/5 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-black/5 sm:grid-cols-4">
          {[['01','Trusted local counter','Serving Nakrakonda & nearby projects'],['02','Quality-first','Reliable brands and verified stock'],['03','Bulk orders','Fast quotation for contractors'],['04','WhatsApp support','Enquire before you visit']].map(([n,t,d]) => <div key={n} className="bg-white px-4 py-5 sm:px-6"><span className="font-data text-[10px] font-bold text-[#c62828]">{n}</span><h2 className="mt-1 font-display text-base font-bold uppercase sm:text-lg">{t}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{d}</p></div>)}
        </div>
      </section>

      <StorefrontClient products={products} categories={categories} units={units} businessName={businessName} whatsappNumber={whatsappNumber} />
    </div>
  );
}
