import type { Metadata } from 'next';
import { Barlow_Condensed, Source_Sans_3, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { getApp } from '@/lib/db';
import { getSession } from '@/lib/session';
import BrandLogo from '@/components/BrandLogo';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--barlow-condensed',
});
const sourceSans = Source_Sans_3({ subsets: ['latin'], variable: '--source-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--jetbrains-mono' });

export const metadata: Metadata = {
  title: 'Maa Laxmi Hardware — The Best Choice For Your Dream Home',
  description:
    'Quality building materials, sanitary fittings, paints, and electrical items at Nakrakonda counter.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getApp().settingsService.getAll();
  const { role } = getSession();

  return (
    <html lang="en" className={`${barlowCondensed.variable} ${sourceSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body flex min-h-screen flex-col bg-[#F8FAFC] text-slate-800">
        {/* Brand Deep Navy Bar */}
        <header className="sticky top-0 z-30 border-b border-[#05223c] bg-[#083358] text-white shadow-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3.5 sm:px-6 py-2.5">
            <Link href="/" className="text-white hover:opacity-95 transition-opacity">
              <BrandLogo className="h-8 sm:h-9 w-auto text-white" />
            </Link>

            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
              <a
                href={`tel:${settings.phone_numbers?.[0] || '9547512088'}`}
                className="hidden sm:flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 hover:bg-white/20 transition-all text-white"
              >
                <span>📞</span>
                <span>Call Store</span>
              </a>

              {role === 'ADMIN' ? (
                <Link
                  href="/admin"
                  className="rounded-full bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 text-slate-950 font-bold shadow-xs transition-all active:scale-95"
                >
                  Admin Portal
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full border border-white/40 px-3 py-1.5 hover:bg-white/10 text-white/90 transition-all"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Cohesive Footer */}
        <footer className="border-t border-[#05223c] bg-[#083358] text-white/80">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-6">
              <div className="text-white">
                <BrandLogo className="h-7 w-auto text-white" />
              </div>
              <p className="text-amber-300 font-semibold text-xs uppercase tracking-wider">
                Proprietor: {settings.proprietor_name || 'Subhasis Dey'}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-white/75 leading-relaxed">
              <div>
                <p className="font-semibold text-white">Counter Location</p>
                <p>{settings.address?.line1 || 'Nakrakonda'}, {settings.address?.district || 'Birbhum'}, {settings.address?.state || 'West Bengal'} — {settings.address?.pincode || '731125'}</p>
                <p className="mt-1 text-white">Phone: {settings.phone_numbers?.join(' / ') || '9547512088 / 7679911927'}</p>
              </div>
              <div className="sm:text-right">
                <p className="font-semibold text-white">Store Hours</p>
                <p>8:00 AM – 8:00 PM (Mon–Sat)</p>
                <p>9:00 AM – 2:00 PM (Sun)</p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
