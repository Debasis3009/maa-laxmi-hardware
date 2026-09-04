'use client';

import { useState } from 'react';
import { createProductAction } from '@/app/admin/products/actions';
import type { CategoryNode, Unit } from '@/lib/types';

export default function AddProductModal({
  categories,
  units,
}: {
  categories: CategoryNode[];
  units: Unit[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewImg, setPreviewImg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createProductAction(formData);
      setOpen(false);
      setPreviewImg('');
    } catch (err: any) {
      alert(err?.message || 'Failed to create product.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#083358] to-[#0d4b82] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:opacity-95 active:scale-95 transition-all"
      >
        <span>➕</span>
        <span>Add New Product</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">Add Counter Product</h3>
                <p className="text-xs text-slate-500">Add an item to the storefront catalog.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700">Product Name *</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. UltraTech Super Cement 50kg"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700">Category</label>
                  <select
                    name="categoryId"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 font-medium outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700">Unit</label>
                  <select
                    name="unitId"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 font-medium outline-none"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700">Selling Price (₹)</label>
                  <input
                    name="sellingPrice"
                    type="number"
                    step="0.01"
                    placeholder="385"
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 font-data font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700">MRP (₹)</label>
                  <input
                    name="mrp"
                    type="number"
                    step="0.01"
                    placeholder="420"
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 font-data font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700">Opening Stock</label>
                  <input
                    name="openingStock"
                    type="number"
                    defaultValue={10}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 font-data font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700">Image URL (Optional)</label>
                <input
                  name="imageUrl"
                  type="url"
                  placeholder="https://example.com/item.jpg"
                  value={previewImg}
                  onChange={(e) => setPreviewImg(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none"
                />
                {previewImg && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <img src={previewImg} alt="Preview" className="h-12 w-12 rounded object-cover" />
                    <span className="text-[11px] text-slate-500">Image preview</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
