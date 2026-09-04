'use server';

import { revalidatePath } from 'next/cache';
import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

export interface BulkPriceFilter {
  categoryId?: number;
  brandId?: number;
}
export interface BulkPriceChange {
  mode: 'percent' | 'flat' | 'set';
  value: number;
}

export async function previewBulkPrice(filter: BulkPriceFilter, change: BulkPriceChange) {
  requireAdmin();
  const app = getApp();
  return app.priceService.previewBulkUpdate(filter, change);
}

export async function applyBulkPrice(filter: BulkPriceFilter, change: BulkPriceChange, reason: string) {
  const admin = requireAdmin();
  const app = getApp();
  const result = app.priceService.applyBulkUpdate(filter, change, { reason, changedBy: admin.id });
  revalidatePath('/admin/products');
  revalidatePath('/admin/stock-log');
  revalidatePath('/');
  return result;
}
