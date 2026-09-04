import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, logoutAdmin } from '@/lib/session';
import InactivityLogout from '@/components/admin/InactivityLogout';

const NAV = [
  { href: '/admin', label: '📊 Dashboard' },
  { href: '/admin/products', label: '📦 Products & Stock' },
  { href: '/admin/pricing', label: '🏷️ Bulk Pricing' },
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

      {/* Admin Top Action Header */}
      <div className="border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Owner Portal</span>
            <p className="font-display text-base font-bold text-slate-900">{user?.name || 'Store Admin'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> 5m Inactivity Guard Active
            </span>
            <form action={handleLogout}>
              <button
                type="submit"
                className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-100 active:scale-95 transition-all"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto flex flex-col md:flex-row max-w-6xl gap-5 px-3 sm:px-6 py-5">
        {/* Mobile Horizontal Touch-Pill Navigation / Desktop Sidebar */}
        <aside className="w-full md:w-56 shrink-0">
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar md:flex-col md:gap-1 md:pb-0">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-700 active:scale-95 shadow-xs md:w-full transition-all"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content Area with Horizontal Touch-Scroll Protection */}
        <main className="min-w-0 flex-1 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
