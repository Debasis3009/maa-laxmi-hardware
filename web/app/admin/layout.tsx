import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, logoutAdmin } from '@/lib/session';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products & Inventory' },
  { href: '/admin/pricing', label: 'Bulk Pricing' },
  { href: '/admin/import', label: 'Bulk Import' },
  { href: '/admin/stock-log', label: 'Stock Log' },
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
    <div className="mx-auto flex flex-col md:flex-row max-w-6xl gap-6 px-4 py-6">
      <aside className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-line pb-4 md:pb-0 md:pr-4">
        <p className="mb-1 text-xs uppercase tracking-wide text-steel-grey">Signed in as</p>
        <p className="mb-4 font-medium text-charcoal">{user?.name}</p>
        <nav className="flex flex-wrap md:flex-col gap-1 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-sm px-2.5 py-1.5 hover:bg-white border md:border-none border-line/60">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={handleLogout} className="mt-4 md:mt-6">
          <button type="submit" className="text-sm font-medium text-rust hover:underline">
            Exit admin session
          </button>
        </form>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
