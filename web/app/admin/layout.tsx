import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, setSessionRole } from '@/lib/session';

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

  async function logout() {
    'use server';
    await setSessionRole('CUSTOMER');
    redirect('/');
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
      <aside className="w-56 shrink-0">
        <p className="mb-3 text-xs uppercase tracking-wide text-steel-grey">Signed in as</p>
        <p className="mb-4 font-medium">{user?.name}</p>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-sm px-2 py-1.5 hover:bg-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-6">
          <button type="submit" className="text-sm text-brick hover:underline">
            Exit admin session
          </button>
        </form>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
