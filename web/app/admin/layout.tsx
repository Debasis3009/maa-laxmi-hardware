import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, logoutAdmin } from '@/lib/session';
import InactivityLogout from '@/components/admin/InactivityLogout';

const NAV = [
  { href: '/admin', label: '📊 Dashboard' },
  { href: '/admin/products', label: '📦 Products & Inventory' },
  { href: '/admin/pricing', label: '🏷️ Bulk Pricing' },
  { href: '/admin/import', label: '📥 Bulk Import' },
  { href: '/admin/stock-log', label: '📋 Stock Log' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, user } = getSession();
  if (role !== 'ADMIN' || !user) {
    redirect('/login');
  }

  async function handleLogout() {
    'use server';
    await logoutAdmin();
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <InactivityLogout timeoutMs={5 * 60 * 1000} />

      {/* Admin Top Header */}
      <div className="border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Admin Session</span>
            <p className="font-display text-base font-bold text-slate-900">{user?.name || 'Store Admin'}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              5m Inactivity Guard
            </span>
            <form action={handleLogout}>
              <button
                type="submit"
                className="rounded-lg bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-100 active:scale-95 transition-all"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto flex flex-col md:flex-row max-w-6xl gap-5 px-3 sm:px-6 py-5">
        {/* Mobile Horizontal Pill Nav / Desktop Sidebar */}
        <aside className="w-full md:w-56 shrink-0">
          <nav className="flex items-center gap-2 overflow-x-auto pb-1 md:flex-col md:gap-1.5 md:pb-0">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:border-[#083358] hover:text-[#083358] active:scale-95 shadow-xs md:w-full transition-all"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content Area with Touch-Scroll Protection */}
        <main className="min-w-0 flex-1 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
