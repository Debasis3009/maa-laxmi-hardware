'use client';

import { useState, useTransition } from 'react';
import type { Product } from '@/lib/types';
import {
  updateProductPrice,
  updateProductStock,
  updateProductThreshold,
  toggleProductActive,
  archiveProduct,
} from '@/app/admin/products/actions';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const ROW_TONE: Record<Product['stock']['status'], string> = {
  OUT_OF_STOCK: 'bg-brick/5 border-l-4 border-l-brick',
  LOW_STOCK: 'bg-gold/5 border-l-4 border-l-gold',
  IN_STOCK: 'border-l-4 border-l-transparent',
};

export default function InventoryTable({ products }: { products: Product[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function withPending(id: string, fn: () => Promise<void>) {
    setPendingId(id);
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="border-[1.5px] border-line bg-white">
      {error && <p className="border-b border-brick/40 bg-brick/10 px-4 py-2 text-sm text-brick">{error}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-[1.5px] border-line text-left text-xs uppercase tracking-wide text-steel-grey">
            <th className="px-3 py-2">Product</th>
            <th className="px-3 py-2">SKU</th>
            <th className="px-3 py-2">Price (₹)</th>
            <th className="px-3 py-2">Stock</th>
            <th className="px-3 py-2">Low-stock at</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Active</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={`border-b border-line ${ROW_TONE[p.stock.status]}`}>
              <td className="px-3 py-2 font-medium">{p.name}</td>
              <td className="px-3 py-2 font-data text-steel-grey">{p.sku}</td>
              <td className="px-3 py-2">
                <EditableNumber
                  value={p.selling_price}
                  disabled={isPending && pendingId === p.id}
                  onCommit={(v) => withPending(p.id, () => updateProductPrice(p.id, v))}
                />
              </td>
              <td className="px-3 py-2">
                <EditableNumber
                  value={p.stock.quantity_on_hand}
                  disabled={isPending && pendingId === p.id}
                  onCommit={(v) => withPending(p.id, () => updateProductStock(p.id, v))}
                />
              </td>
              <td className="px-3 py-2">
                <EditableNumber
                  value={p.min_stock}
                  disabled={isPending && pendingId === p.id}
                  onCommit={(v) => withPending(p.id, () => updateProductThreshold(p.id, v))}
                />
              </td>
              <td className="px-3 py-2">
                <StatusPill status={p.stock.status} />
              </td>
              <td className="px-3 py-2">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!p.is_active}
                    disabled={isPending && pendingId === p.id}
                    onChange={(e) => withPending(p.id, () => toggleProductActive(p.id, e.target.checked))}
                  />
                  <span className="sr-only">Active</span>
                </label>
              </td>
              <td className="px-3 py-2 text-right">
                <button type="button" onClick={() => setArchiveTarget(p)} className="text-sm text-brick hover:underline">
                  Archive
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {archiveTarget && (
        <DeleteConfirmDialog
          productName={archiveTarget.name}
          pending={isPending}
          onCancel={() => setArchiveTarget(null)}
          onConfirm={() =>
            withPending(archiveTarget.id, async () => {
              await archiveProduct(archiveTarget.id);
              setArchiveTarget(null);
            })
          }
        />
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Product['stock']['status'] }) {
  const map = {
    IN_STOCK: 'text-steel-green',
    LOW_STOCK: 'text-gold',
    OUT_OF_STOCK: 'text-brick',
  } as const;
  return <span className={`text-xs font-semibold ${map[status]}`}>{status.replace(/_/g, ' ')}</span>;
}

/** A number cell that behaves as a normal-looking value until clicked, then becomes an input.
 * Commits on blur or Enter — this is the "inline editing" the spec asks for, without a separate edit mode toggle. */
function EditableNumber({
  value,
  disabled,
  onCommit,
}: {
  value: number;
  disabled?: boolean;
  onCommit: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (!editing) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
        className="font-data rounded-sm px-2 py-1 text-left hover:bg-paper disabled:opacity-50"
      >
        {value}
      </button>
    );
  }

  function commit() {
    setEditing(false);
    const parsed = Number(draft);
    if (!Number.isNaN(parsed) && parsed !== value) onCommit(parsed);
  }

  return (
    <input
      autoFocus
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') setEditing(false);
      }}
      className="font-data w-24 rounded-sm border-[1.5px] border-rust px-2 py-1 outline-none"
    />
  );
}
