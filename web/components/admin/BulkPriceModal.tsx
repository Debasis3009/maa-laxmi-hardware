'use client';

import { useState } from 'react';
import type { CategoryNode, Brand } from '@/lib/types';
import { previewBulkPrice, applyBulkPrice, type BulkPriceFilter, type BulkPriceChange } from '@/app/admin/pricing/actions';

interface PreviewRow { productId: string; sku: string; name: string; oldPrice: number; newPrice: number }
interface PreviewResult {
  priceField: string;
  affectedCount: number;
  averageOldPrice: number;
  averageNewPrice: number;
  rows: PreviewRow[];
}

export default function BulkPriceModal({ categories, brands }: { categories: CategoryNode[]; brands: Brand[] }) {
  const [filterType, setFilterType] = useState<'category' | 'brand'>('category');
  const [categoryId, setCategoryId] = useState<number | ''>(categories[0]?.id ?? '');
  const [brandId, setBrandId] = useState<number | ''>(brands[0]?.id ?? '');
  const [mode, setMode] = useState<BulkPriceChange['mode']>('percent');
  const [value, setValue] = useState('5');
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ batchId: string; affectedCount: number } | null>(null);

  function buildFilter(): BulkPriceFilter {
    return filterType === 'category' ? { categoryId: Number(categoryId) } : { brandId: Number(brandId) };
  }

  async function handlePreview() {
    setBusy(true);
    setError(null);
    setApplied(null);
    try {
      const numericValue = Number(value);
      if (Number.isNaN(numericValue)) throw new Error('Enter a valid number.');
      const result = await previewBulkPrice(buildFilter(), { mode, value: numericValue });
      setPreview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleApply() {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      const numericValue = Number(value);
      const result = await applyBulkPrice(buildFilter(), { mode, value: numericValue }, reason || `Bulk update (${mode} ${value})`);
      setApplied(result);
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-[1.5px] border-line bg-white p-5">
      <h2 className="font-display text-xl font-semibold">Bulk price update</h2>
      <p className="mt-1 text-sm text-steel-grey">
        Update selling price by category or brand. Nothing is applied until you confirm the preview below.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Apply to</label>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as 'category' | 'brand');
                setPreview(null);
              }}
              className="rounded-sm border-[1.5px] border-line px-2 py-2 text-sm"
            >
              <option value="category">Category</option>
              <option value="brand">Brand</option>
            </select>
            {filterType === 'category' ? (
              <select
                value={categoryId}
                onChange={(e) => { setCategoryId(Number(e.target.value)); setPreview(null); }}
                className="flex-1 rounded-sm border-[1.5px] border-line px-2 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <select
                value={brandId}
                onChange={(e) => { setBrandId(Number(e.target.value)); setPreview(null); }}
                className="flex-1 rounded-sm border-[1.5px] border-line px-2 py-2 text-sm"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
          </div>
          <p className="mt-1 text-xs text-steel-grey">Category updates also reach its subcategories.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Change</label>
          <div className="flex gap-2">
            <select
              value={mode}
              onChange={(e) => { setMode(e.target.value as BulkPriceChange['mode']); setPreview(null); }}
              className="rounded-sm border-[1.5px] border-line px-2 py-2 text-sm"
            >
              <option value="percent">Increase/decrease %</option>
              <option value="flat">Increase/decrease ₹</option>
              <option value="set">Set exact price</option>
            </select>
            <input
              type="number"
              value={value}
              onChange={(e) => { setValue(e.target.value); setPreview(null); }}
              className="w-28 rounded-sm border-[1.5px] border-line px-2 py-2 text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-steel-grey">Use a negative number to decrease.</p>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-brick">{error}</p>}
      {applied && (
        <p className="mt-3 border-[1.5px] border-steel-green/40 bg-steel-green/5 px-3 py-2 text-sm text-steel-green">
          Applied — {applied.affectedCount} products updated (batch {applied.batchId.slice(0, 8)}).
        </p>
      )}

      {!preview ? (
        <button
          type="button"
          onClick={handlePreview}
          disabled={busy}
          className="mt-4 rounded-sm border-[1.5px] border-charcoal px-4 py-2 text-sm font-medium hover:bg-charcoal hover:text-paper disabled:opacity-50"
        >
          {busy ? 'Calculating…' : 'Review changes'}
        </button>
      ) : (
        <div className="mt-4">
          <p className="text-sm">
            <strong>{preview.affectedCount} products selected.</strong> Average old price ₹{preview.averageOldPrice} →
            new average ₹{preview.averageNewPrice}.
          </p>
          <div className="mt-2 max-h-64 overflow-y-auto border-[1.5px] border-line">
            <table className="w-full text-sm">
              <thead className="bg-paper text-left text-xs uppercase text-steel-grey">
                <tr>
                  <th className="px-2 py-1.5">Product</th>
                  <th className="px-2 py-1.5">SKU</th>
                  <th className="px-2 py-1.5">Old</th>
                  <th className="px-2 py-1.5">New</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.productId} className="border-t border-line font-data">
                    <td className="px-2 py-1.5 font-body">{r.name}</td>
                    <td className="px-2 py-1.5">{r.sku}</td>
                    <td className="px-2 py-1.5">₹{r.oldPrice}</td>
                    <td className="px-2 py-1.5">₹{r.newPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="mt-3 block text-sm font-medium">Reason (optional, kept in price history)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Seasonal price revision"
            className="mt-1 w-full rounded-sm border-[1.5px] border-line px-2 py-2 text-sm"
          />

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setPreview(null)} className="rounded-sm border-[1.5px] border-line px-4 py-2 text-sm font-medium">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={busy}
              className="rounded-sm bg-rust px-4 py-2 text-sm font-medium text-paper hover:bg-rust-dark disabled:opacity-50"
            >
              {busy ? 'Applying…' : 'Confirm update'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
