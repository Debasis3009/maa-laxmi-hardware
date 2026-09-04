'use client';

export interface CartItem {
  key: string;
  name: string;
  sku: string;
  unit: string;
  quantity: number;
}

export default function CartDrawer({
  items,
  onClose,
  onRemove,
  onRequestQuote,
}: {
  items: CartItem[];
  onClose: () => void;
  onRemove: (key: string) => void;
  onRequestQuote: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#083358] to-[#0d4b82] p-4 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h2 className="font-display text-xl font-bold tracking-tight text-white">
              Selected Items ({items.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-all"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <span className="text-5xl mb-3 opacity-30">📦</span>
              <p className="font-display text-lg font-semibold text-slate-700">Your cart is empty</p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Browse products and add items to generate a bulk bill quote on WhatsApp.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="pr-3">
                  <p className="text-sm font-bold text-slate-800 leading-snug">{item.name}</p>
                  <p className="font-data mt-1 text-xs font-semibold text-slate-500">
                    <span className="rounded bg-white px-1.5 py-0.5 border border-slate-200 text-slate-600">
                      {item.sku}
                    </span>{' '}
                    &bull; {item.quantity} {item.unit}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.key)}
                  className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 active:scale-95 transition-all text-xs font-bold"
                  title="Remove item"
                >
                  ✕ Remove
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Bottom CTA */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-2">
          <button
            type="button"
            onClick={onRequestQuote}
            disabled={items.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <span>💬 Send WhatsApp Bulk Quote ({items.length})</span>
          </button>
          <p className="text-center text-[11px] text-slate-400">
            Sends list directly to store counter on WhatsApp for instant billing.
          </p>
        </div>
      </div>
    </div>
  );
}
