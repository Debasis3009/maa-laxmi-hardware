import { redirect } from 'next/navigation';
import { getApp, getOwnerId } from '@/lib/db';
import { getSession } from '@/lib/session';

async function saveCredential(formData: FormData) {
  'use server';
  const session = await getSession();
  if (session.role !== 'ADMIN') redirect('/login');
  const first = String(formData.get('newCredential') || '');
  const second = String(formData.get('confirmCredential') || '');
  if (first.length < 8 || first !== second) redirect('/admin/security?error=invalid');
  const app = await getApp();
  await app.userService.changePassword(await getOwnerId(), first, await getOwnerId());
  redirect('/admin/security?saved=1');
}

export default async function SecurityPage({ searchParams }: { searchParams?: { saved?: string; error?: string } }) {
  const session = await getSession();
  if (session.role !== 'ADMIN') redirect('/admin');
  return <section className="mx-auto max-w-xl space-y-5">
    <header><p className="text-xs font-bold uppercase tracking-[.18em] text-[#07527f]">Security</p><h1 className="mt-1 text-2xl font-black">Admin Access</h1><p className="mt-2 text-sm text-slate-500">Create or replace your private sign-in credential. The value is hashed before storage and cannot be viewed from this page.</p></header>
    {searchParams?.saved && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Your sign-in credential was updated successfully.</div>}
    {searchParams?.error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">Both entries must match and contain at least 8 characters.</div>}
    <form action={saveCredential} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">New password<input type="password" name="newCredential" required minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm font-normal normal-case outline-none focus:border-[#07527f]" /></label>
      <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">Confirm password<input type="password" name="confirmCredential" required minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm font-normal normal-case outline-none focus:border-[#07527f]" /></label>
      <p className="text-xs text-slate-500">Use at least 8 characters. Your password is never displayed after saving.</p>
      <button type="submit" className="w-full rounded-xl bg-[#07527f] py-3 text-sm font-bold text-white hover:bg-[#063f61]">Save Password</button>
    </form>
  </section>;
}
