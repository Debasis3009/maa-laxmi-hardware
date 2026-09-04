'use server';

import { revalidatePath } from 'next/cache';
import { getApp } from '@/lib/db';
import { requireAdmin } from '@/lib/session';

export async function createProductAction(formData: FormData) {
  const admin = requireAdmin();
  const app = getApp();

  const name = (formData.get('name') as string)?.trim();
  const sku = (formData.get('sku') as string)?.trim() || `MLH-${Date.now().toString().slice(-6)}`;
  const categoryId = (formData.get('categoryId') as string)?.trim();
  const unitId = (formData.get('unitId') as string)?.trim();
  const purchasePrice = Number(formData.get('purchasePrice')) || 0;
  const sellingPrice = Number(formData.get('sellingPrice')) || 0;
  const mrp = Number(formData.get('mrp')) || sellingPrice;
  const openingStock = Number(formData.get('openingStock')) || 0;
  const minStock = Number(formData.get('minStock')) || 5;
  const imageUrl = (formData.get('imageUrl') as string)?.trim() || null;
  const description = (formData.get('description') as string)?.trim() || null;

  if (!name) throw new Error('Product name is required.');

  const suppliers = app.catalogService.listSuppliers();
  const brands = app.catalogService.listBrands();
  const supplierId = suppliers[0]?.id;
  const brandId = brands[0]?.id;

  const product = app.productService.createProduct(
    {
      sku,
      name,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      unitId: unitId || undefined,
      purchasePrice,
      sellingPrice,
      mrp,
      gstRate: 18,
      minStock,
      reorderLevel: minStock * 2,
      supplierId: supplierId || undefined,
      openingStock,
      imageUrl,
      shortDescription: description,
    },
    admin.id
  );

  revalidatePath('/admin/products');
  revalidatePath('/');
  return { success: true, productId: product.id };
}

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
