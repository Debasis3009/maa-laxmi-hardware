'use client';

export default function DeleteConfirmDialog({
  productName,
  onConfirm,
  onCancel,
  pending,
}: {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm border-[1.5px] border-line bg-white p-5">
        <h2 className="font-display text-xl font-semibold">Archive this product?</h2>
        <p className="mt-2 text-sm text-charcoal/80">
          <strong>{productName}</strong> will be hidden from the storefront and marked inactive. It is a soft
          delete — nothing is permanently removed, and the record stays in reports and past orders.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-sm border-[1.5px] border-line px-3 py-2 text-sm font-medium hover:border-charcoal/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-sm bg-brick px-3 py-2 text-sm font-medium text-paper hover:bg-brick/90 disabled:opacity-60"
          >
            {pending ? 'Archiving…' : 'Archive product'}
          </button>
        </div>
      </div>
    </div>
  );
}
