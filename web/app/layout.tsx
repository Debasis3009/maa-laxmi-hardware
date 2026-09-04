import type { Metadata } from 'next';
import { Barlow_Condensed, Source_Sans_3, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { getApp } from '@/lib/db';
import { getSession } from '@/lib/session';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--barlow-condensed',
});
const sourceSans = Source_Sans_3({ subsets: ['latin'], variable: '--source-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--jetbrains-mono' });

export const metadata: Metadata = {
  title: 'Maa Laxmi Hardware — Nakrakonda, Birbhum',
  description:
    'Hardware, building materials, paints, sanitary and electrical products from Maa Laxmi Hardware, Nakrakonda, Birbhum.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getApp().settingsService.getAll();
  const { role } = getSession();

  return (
    <html lang="en" className={`${barlowCondensed.variable} ${sourceSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body flex min-h-screen flex-col bg-paper text-charcoal">
        <header className="border-b-[1.5px] border-line bg-charcoal text-paper">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="font-display text-2xl font-semibold leading-none tracking-tight">
              {settings.business_name || 'Maa Laxmi Hardware'}
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <a href={`tel:${settings.phone_numbers?.[0]}`} className="hidden rounded border border-paper/30 px-3 py-1.5 hover:bg-paper/10 sm:block">
                Call {settings.phone_numbers?.[0]}
              </a>
              {role === 'ADMIN' ? (
                <Link href="/admin" className="rounded bg-rust px-3 py-1.5 font-medium hover:bg-rust-dark">
                  Admin dashboard
                </Link>
              ) : (
                <Link href="/login" className="rounded border border-paper/30 px-3 py-1.5 hover:bg-paper/10">
                  Staff login
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t-[1.5px] border-line bg-charcoal text-paper/80">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm">
            <p className="font-display text-lg text-paper">{settings.business_name}</p>
            <p>Proprietor: {settings.proprietor_name}</p>
            <p>
              {settings.address?.line1}, {settings.address?.district}, {settings.address?.state} —{' '}
              {settings.address?.pincode}
            </p>
            <p>Phone: {settings.phone_numbers?.join(' / ')}</p>
            <p className="mt-2 text-paper/60">
              {settings.business_hours?.mon_sat} (Mon–Sat) · {settings.business_hours?.sun} (Sun)
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
