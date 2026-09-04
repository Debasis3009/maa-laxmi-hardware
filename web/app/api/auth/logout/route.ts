import { NextResponse } from 'next/server';
import { logoutAdmin } from '@/lib/session';

export async function POST() {
  await logoutAdmin();
  return NextResponse.json({ ok: true });
}
