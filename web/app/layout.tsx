import type { Metadata } from 'next';
import { Barlow_Condensed, Source_Sans_3, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { getApp } from '@/lib/db';
import { getSession } from '@/lib/session';
import BrandLogo from '@/components/BrandLogo';

const barlowCondensed = Barlow_Condensed({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--barlow-condensed' });
const sourceSans = Source_Sans_3({ subsets: ['latin'], variable: '--source-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--jetbrains-mono' });

export const metadata: Metadata = {
  title: 'Maa Laxmi Hardware — Quality Materials. Stronger Projects.',
  description: 'Cement, TMT bars, paints, sanitary, electrical and construction supplies from Maa Laxmi Hardware, Nakrakonda.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getApp().settingsService.getAll();
  const { role } = getSession();
  const phone = settings.phone_numbers?.[0] || '9547512088';

  return (
    <html lang="en" className={`${barlowCondensed.variable} ${sourceSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body flex min-h-screen flex-col bg-[#f5f3ef] text-[#171717]">
        <div className="bg-[#171717] text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-[11px] font-semibold tracking-wide sm:px-6">
            <span>NAKRAKONDA • BIRBHUM • WEST BENGAL</span>
            <span className="hidden sm:inline">DIRECT COUNTER • READY STOCK • FAST DELIVERY</span>
          </div>
        </div>

        <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="shrink-0" aria-label="Maa Laxmi Hardware home">
              <BrandLogo className="h-9 w-auto sm:h-10" />
            </Link>

            <nav className="hidden items-center gap-7 text-sm font-bold lg:flex" aria-label="Main navigation">
              <Link href="/" className="transition hover:text-[#c62828]">Home</Link>
              <a href="#products" className="transition hover:text-[#c62828]">Products</a>
              <a href="#about" className="transition hover:text-[#c62828]">Why Us</a>
              <a href="#contact" className="transition hover:text-[#c62828]">Contact</a>
            </nav>

            <div className="flex items-center gap-2">
              <a href={`tel:${phone}`} className="hidden rounded-xl border border-black/10 px-3 py-2 text-sm font-bold hover:border-[#c62828] hover:text-[#c62828] sm:inline-flex">Call Store</a>
              <a href={`https://wa.me/919932667908`} target="_blank" rel="noreferrer" className="rounded-xl bg-[#15803d] px-3.5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#166534]">WhatsApp</a>
              {role === 'ADMIN' ? (
                <Link href="/admin" className="hidden rounded-xl bg-[#c62828] px-3.5 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-[#991b1b] md:inline-flex">Admin Portal</Link>
              ) : (
                <Link href="/login" className="hidden rounded-xl border border-[#c62828] px-3 py-2 text-sm font-bold text-[#c62828] hover:bg-[#c62828] hover:text-white md:inline-flex">Admin</Link>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer id="contact" className="border-t-4 border-[#c62828] bg-[#171717] text-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
              <div>
                <BrandLogo className="h-10 w-auto brightness-0 invert" />
                <p className="mt-4 max-w-md text-sm leading-6 text-white/65">Reliable building materials and hardware supplies for homes, contractors and construction projects.</p>
              </div>
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-wide">Visit Us</h2>
                <p className="mt-3 text-sm leading-6 text-white/70">{settings.address?.line1 || 'Nakrakonda'}, {settings.address?.district || 'Birbhum'}, {settings.address?.state || 'West Bengal'} — {settings.address?.pincode || '731125'}</p>
              </div>
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-wide">Store Hours</h2>
                <p className="mt-3 text-sm text-white/70">8:00 AM – 8:00 PM (Mon–Sat)</p>
                <p className="text-sm text-white/70">9:00 AM – 2:00 PM (Sun)</p>
                <p className="mt-2 text-sm font-bold text-white">{settings.phone_numbers?.join(' / ') || '9547512088 / 7679911927'}</p>
              </div>
            </div>
            <div className="mt-8 border-t border-white/10 pt-5 text-xs text-white/45">© {new Date().getFullYear()} {settings.business_name || 'Maa Laxmi Hardware'}. Proprietor: {settings.proprietor_name || 'Subhasis Dey'}.</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
