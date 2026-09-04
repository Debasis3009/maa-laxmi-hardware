import { redirect } from 'next/navigation';
import { setSessionRole, getSession } from '@/lib/session';

export default function LoginPage() {
  const { role } = getSession();

  async function loginAsAdmin() {
    'use server';
    await setSessionRole('ADMIN');
    redirect('/admin');
  }

  async function loginAsCustomer() {
    'use server';
    await setSessionRole('CUSTOMER');
    redirect('/');
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl font-semibold">Staff sign-in</h1>
      <p className="mt-2 text-sm text-charcoal/70">
        Phase 2 demo session switch — current session: <strong>{role}</strong>. Real password/OTP
        login replaces this before going live (see README, &ldquo;What&rsquo;s mocked&rdquo;).
      </p>

      <form action={loginAsAdmin} className="mt-6">
        <button type="submit" className="w-full rounded-sm bg-rust px-4 py-2.5 text-sm font-medium text-paper hover:bg-rust-dark">
          Continue as Admin (Sarat Dey)
        </button>
      </form>

      <form action={loginAsCustomer} className="mt-3">
        <button type="submit" className="w-full rounded-sm border-[1.5px] border-line px-4 py-2.5 text-sm font-medium hover:border-rust/60">
          Continue as Customer
        </button>
      </form>
    </div>
  );
}
