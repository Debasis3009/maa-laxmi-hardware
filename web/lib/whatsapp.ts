/**
 * Builds a wa.me deep link that opens WhatsApp with a pre-filled message.
 * The store's WhatsApp number comes from business_settings at call sites —
 * never hard-code it at more than one place.
 */
export function buildWhatsAppUrl(phoneDigits: string, message: string): string {
  const digitsOnly = phoneDigits.replace(/[^\d]/g, '');
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

export function singleProductOrderMessage(opts: {
  businessName: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
}): string {
  const { businessName, productName, sku, unit, quantity } = opts;
  return [
    `Hello ${businessName},`,
    ``,
    `I am interested in:`,
    ``,
    `Product: ${productName}`,
    `SKU: ${sku}`,
    `Unit: ${unit}`,
    `Quantity: ${quantity}`,
    ``,
    `Please confirm availability and price.`,
  ].join('\n');
}

export function bulkQuoteMessage(opts: {
  businessName: string;
  items: { name: string; sku: string; unit: string; quantity: number }[];
}): string {
  const { businessName, items } = opts;
  const lines = items.map((i) => `- ${i.name} (${i.sku}) — ${i.quantity} ${i.unit}`);
  return [
    `Hello ${businessName},`,
    ``,
    `I would like a quotation for:`,
    ``,
    ...lines,
    ``,
    `Please share pricing and availability.`,
  ].join('\n');
}
