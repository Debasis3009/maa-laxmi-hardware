'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithCredentials } from '@/lib/session';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await loginWithCredentials(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/admin');
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="border-[1.5px] border-line bg-white p-6 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-charcoal">Admin Login</h1>
        <p className="mt-1 text-xs text-charcoal/70">
          Enter credentials to access Maa Laxmi Hardware dashboard.
        </p>

        {error && (
          <div className="mt-4 rounded border border-rust/40 bg-rust/10 p-2.5 text-xs text-rust">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/80">
              User ID
            </label>
            <input
              type="text"
              name="username"
              required
              autoComplete="username"
              placeholder="Enter User ID"
              className="mt-1.5 w-full border-[1.5px] border-line px-3 py-2 text-sm outline-none focus:border-rust"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/80">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="Enter Password"
              className="mt-1.5 w-full border-[1.5px] border-line px-3 py-2 text-sm outline-none focus:border-rust"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-sm bg-rust py-2.5 text-sm font-medium text-paper hover:bg-rust-dark disabled:opacity-50"
          >
            {isPending ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
