export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Stock {
  quantity_on_hand: number;
  reserved_quantity: number;
  available_quantity: number;
  status: StockStatus;
}

export interface Variant {
  id: string;
  product_id: string;
  sku: string;
  barcode: string | null;
  name: string;
  attributes: Record<string, string>;
  unit_id: number;
  purchase_price: number;
  mrp: number;
  selling_price: number;
  min_stock: number;
  is_active: number;
  stock: Stock;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  brand_id: number | null;
  category_id: number;
  short_description: string | null;
  unit_id: number;
  purchase_price: number;
  mrp: number;
  selling_price: number;
  gst_rate: number;
  min_stock: number;
  reorder_level: number;
  has_variants: number;
  is_active: number;
  online_purchase_enabled: number;
  quotation_enabled: number;
  whatsapp_order_enabled: number;
  updated_at: string;
  variants: Variant[];
  stock: Stock;
}

export interface CategoryNode {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  is_active: number;
  sort_order: number;
  children: CategoryNode[];
}

export interface Unit {
  id: number;
  name: string;
  abbreviation: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  is_active: number;
}

export interface StockTransactionRow {
  id: number;
  product_id: string;
  variant_id: string | null;
  transaction_type: string;
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  performed_by: string | null;
  created_at: string;
  product_name?: string;
  product_sku?: string;
}
