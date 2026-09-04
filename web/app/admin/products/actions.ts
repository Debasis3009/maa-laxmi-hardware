'use server';

import { revalidatePath } from 'next/cache';
import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

/** Inline price edit. Routed through priceService so it lands in price_history — never a silent overwrite. */
export async function updateProductPrice(productId: string, newPrice: number) {
  const admin = requireAdmin();
  if (Number.isNaN(newPrice) || newPrice < 0) throw new Error('Price must be a non-negative number.');
  const app = getApp();
  app.priceService.changePrice({
    productId, priceField: 'selling_price', newPrice, reason: 'Inline admin edit', changedBy: admin.id,
  });
  revalidatePath('/admin/products');
  revalidatePath('/');
}

/** Inline stock count edit. Computed as a signed delta and recorded as an 'adjustment' ledger entry — never a direct overwrite. */
export async function updateProductStock(productId: string, newQuantity: number) {
  const admin = requireAdmin();
  if (Number.isNaN(newQuantity) || newQuantity < 0) throw new Error('Stock count must be a non-negative number.');
  const app = getApp();
  app.inventoryService.adjustStockTo({
    productId, newQuantity, reason: 'Inline admin stock edit', performedBy: admin.id,
  });
  revalidatePath('/admin/products');
  revalidatePath('/admin/stock-log');
  revalidatePath('/');
}

/** Inline low-stock threshold edit. */
export async function updateProductThreshold(productId: string, minStock: number) {
  const admin = requireAdmin();
  if (Number.isNaN(minStock) || minStock < 0) throw new Error('Threshold must be a non-negative number.');
  const app = getApp();
  app.productService.updateProduct(productId, { minStock }, admin.id);
  revalidatePath('/admin/products');
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  const admin = requireAdmin();
  const app = getApp();
  app.productService.updateProduct(productId, { isActive }, admin.id);
  revalidatePath('/admin/products');
  revalidatePath('/');
}

export async function archiveProduct(productId: string) {
  const admin = requireAdmin();
  const app = getApp();
  app.productService.softDeleteProduct(productId, admin.id);
  revalidatePath('/admin/products');
  revalidatePath('/');
}
