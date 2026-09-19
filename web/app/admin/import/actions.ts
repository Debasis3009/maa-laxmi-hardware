'use server';

import { revalidatePath } from 'next/cache';
import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

export async function validateImportCsv(csvText: string) {
  await requireAdmin();
  const app = await getApp();
  const rows = app.importService.parseCsv(csvText);
  return await app.importService.validateRows(rows);
}

export async function applyImportCsv(csvText: string, fileName: string) {
  const admin = await requireAdmin();
  const app = await getApp();
  const rows = app.importService.parseCsv(csvText);
  const result = await app.importService.runImport({ fileName, rows, apply: true, actingUserId: admin.id });
  revalidatePath('/admin/products');
  revalidatePath('/');
  return result;
}
