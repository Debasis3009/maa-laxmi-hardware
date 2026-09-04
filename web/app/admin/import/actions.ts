'use server';

import { revalidatePath } from 'next/cache';
import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

export async function validateImportCsv(csvText: string) {
  requireAdmin();
  const app = getApp();
  const rows = app.importService.parseCsv(csvText);
  return app.importService.validateRows(rows);
}

export async function applyImportCsv(csvText: string, fileName: string) {
  const admin = requireAdmin();
  const app = getApp();
  const rows = app.importService.parseCsv(csvText);
  const result = app.importService.runImport({ fileName, rows, apply: true, actingUserId: admin.id });
  revalidatePath('/admin/products');
  revalidatePath('/');
  return result;
}
