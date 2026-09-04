'use client';

export interface CartItem {
  key: string; // productId or variantId
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
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/50" onClick={onClose}>
      <div className="flex h-full w-full max-w-sm flex-col border-l-[1.5px] border-line bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b-[1.5px] border-line p-4">
          <h2 className="font-display text-xl font-semibold">Your cart</h2>
          <button type="button" onClick={onClose} aria-label="Close cart" className="text-2xl leading-none text-steel-grey hover:text-charcoal">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="text-sm text-steel-grey">Your cart is empty. Add products to request a bulk quote.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.key} className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="font-data text-xs text-steel-grey">
                      {item.sku} · {item.quantity} {item.unit}
                    </p>
                  </div>
                  <button type="button" onClick={() => onRemove(item.key)} className="text-sm text-brick hover:underline">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t-[1.5px] border-line p-4">
          <button
            type="button"
            onClick={onRequestQuote}
            disabled={items.length === 0}
            className="w-full rounded-sm bg-steel-green px-3 py-2.5 text-sm font-medium text-paper hover:bg-steel-green/90 disabled:cursor-not-allowed disabled:bg-steel-grey"
          >
            Request bulk quote on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
