-- ============================================================================
-- MAA LAXMI HARDWARE — PLATFORM DATABASE SCHEMA
-- Phase 1: Auth/Roles, Catalog, Inventory, Pricing, Audit, Settings
-- Target engine: PostgreSQL 14+
-- ============================================================================
-- Design principles enforced by this schema:
-- 1. Stock is NEVER overwritten directly. `inventory` is a materialized
--    balance that can only be changed by inserting a row into
--    `stock_transactions`. Application code must never UPDATE
--    inventory.quantity_on_hand directly except through the transaction path.
-- 2. Every price change is recorded in `price_history`.
-- 3. Every mutating admin action is recorded in `audit_logs`.
-- 4. Categories are self-referencing so "Category > Subcategory" is one
--    table, arbitrarily deep, not two hard-coded levels.
-- 5. Products and variants are separate: a product with no variants sells
--    directly; a product with variants sells only through its variants.
-- 6. Business-wide configurable values (WhatsApp number, delivery rules,
--    invoice prefix, etc.) live in `business_settings`, never in code.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. ROLES & USERS  (staff / admin side — customer accounts are a separate
--    table added in the storefront phase, kept out of this table on purpose
--    so a compromised customer account can never inherit admin permissions)
-- ----------------------------------------------------------------------------

CREATE TABLE roles (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,           -- e.g. 'owner', 'manager', 'cashier', 'staff'
    description     TEXT,
    permissions     JSONB NOT NULL DEFAULT '{}',    -- e.g. {"products.edit": true, "orders.view": true}
    is_system_role  BOOLEAN NOT NULL DEFAULT false, -- true for 'owner' — cannot be deleted
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           CITEXT UNIQUE,
    phone           TEXT UNIQUE,
    password_hash   TEXT NOT NULL,
    role_id         INTEGER NOT NULL REFERENCES roles(id),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Note: CITEXT requires `CREATE EXTENSION citext;` — falls back to TEXT + lower(email) index if unavailable.

-- ----------------------------------------------------------------------------
-- 2. BUSINESS SETTINGS  (key/value store the owner edits from Admin > Settings)
-- ----------------------------------------------------------------------------

CREATE TABLE business_settings (
    key             TEXT PRIMARY KEY,      -- e.g. 'whatsapp_number', 'invoice_prefix', 'delivery_rules'
    value           JSONB NOT NULL,
    description     TEXT,
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. CATALOG: UNITS, BRANDS, SUPPLIERS, CATEGORIES
-- ----------------------------------------------------------------------------

CREATE TABLE units (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,      -- 'Piece', 'Box', 'Kg', ...
    abbreviation    TEXT NOT NULL,             -- 'pc', 'box', 'kg'
    is_custom       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE brands (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,
    slug            TEXT NOT NULL UNIQUE,
    logo_url        TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE suppliers (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    contact_person  TEXT,
    phone           TEXT,
    email           TEXT,
    address         TEXT,
    gstin           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Self-referencing: parent_id NULL = top-level category, else it's a subcategory.
CREATE TABLE categories (
    id              SERIAL PRIMARY KEY,
    parent_id       INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    image_url       TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (parent_id, name)
);

-- ----------------------------------------------------------------------------
-- 4. PRODUCTS & VARIANTS
-- ----------------------------------------------------------------------------

CREATE TABLE products (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku                     TEXT NOT NULL UNIQUE,
    barcode                 TEXT UNIQUE,
    name                    TEXT NOT NULL,
    brand_id                INTEGER REFERENCES brands(id),
    category_id             INTEGER NOT NULL REFERENCES categories(id),
    product_type            TEXT,               -- free-text classification, e.g. 'Pipe', 'Paint'
    short_description       TEXT,
    full_description        TEXT,

    unit_id                 INTEGER NOT NULL REFERENCES units(id),

    -- Pricing (kept on the product for non-variant products; variants override)
    purchase_price          NUMERIC(12,2) NOT NULL DEFAULT 0,
    mrp                     NUMERIC(12,2) NOT NULL DEFAULT 0,
    retail_price            NUMERIC(12,2),
    wholesale_price         NUMERIC(12,2),
    dealer_price            NUMERIC(12,2),
    selling_price           NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_percent        NUMERIC(5,2) NOT NULL DEFAULT 0,
    gst_rate                NUMERIC(5,2) NOT NULL DEFAULT 0,
    hsn_code                TEXT,

    -- Physical attributes
    weight                  NUMERIC(10,3),
    length                  NUMERIC(10,3),
    width                   NUMERIC(10,3),
    height                  NUMERIC(10,3),
    size                    TEXT,
    color                   TEXT,
    material                TEXT,
    model_number            TEXT,
    manufacturer            TEXT,
    warranty                TEXT,
    tags                    JSONB NOT NULL DEFAULT '[]',
    specifications          JSONB NOT NULL DEFAULT '{}',

    -- Inventory thresholds (actual stock lives in `inventory`)
    min_stock               NUMERIC(12,3) NOT NULL DEFAULT 0,
    max_stock               NUMERIC(12,3),
    reorder_level           NUMERIC(12,3) NOT NULL DEFAULT 0,

    -- Business flags
    supplier_id             INTEGER REFERENCES suppliers(id),
    has_variants            BOOLEAN NOT NULL DEFAULT false,
    is_featured             BOOLEAN NOT NULL DEFAULT false,
    is_bestseller           BOOLEAN NOT NULL DEFAULT false,
    is_new_arrival          BOOLEAN NOT NULL DEFAULT false,
    is_active               BOOLEAN NOT NULL DEFAULT true,
    online_purchase_enabled BOOLEAN NOT NULL DEFAULT true,
    quotation_enabled       BOOLEAN NOT NULL DEFAULT true,
    whatsapp_order_enabled  BOOLEAN NOT NULL DEFAULT true,
    allow_backorder         BOOLEAN NOT NULL DEFAULT false,

    created_by              UUID REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ            -- soft delete
);

CREATE TABLE product_images (
    id              SERIAL PRIMARY KEY,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    is_main         BOOLEAN NOT NULL DEFAULT false,
    sort_order      INTEGER NOT NULL DEFAULT 0
);

-- A variant represents a concrete sellable unit, e.g. "PVC Pipe — 1 inch x 3m".
-- If a product has variants, the product-level price/stock fields are ignored
-- by application logic in favour of the variant's own values.
CREATE TABLE product_variants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku             TEXT NOT NULL UNIQUE,
    barcode         TEXT UNIQUE,
    name            TEXT NOT NULL,          -- e.g. '1 inch x 3 metre'
    attributes      JSONB NOT NULL DEFAULT '{}', -- {"diameter": "1 inch", "length": "3 metre"}
    unit_id         INTEGER NOT NULL REFERENCES units(id),
    purchase_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
    mrp             NUMERIC(12,2) NOT NULL DEFAULT 0,
    selling_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
    weight          NUMERIC(10,3),
    min_stock       NUMERIC(12,3) NOT NULL DEFAULT 0,
    max_stock       NUMERIC(12,3),
    reorder_level   NUMERIC(12,3) NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. INVENTORY — materialized balance + immutable transaction ledger
-- ----------------------------------------------------------------------------

-- One row per (product) or (product, variant). Never written to directly by
-- application code — only `record_stock_transaction()` (see below) may
-- change quantity_on_hand, and it does so in the same DB transaction as the
-- ledger insert, so balance and history can never drift apart.
CREATE TABLE inventory (
    id                  SERIAL PRIMARY KEY,
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id          UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity_on_hand    NUMERIC(14,3) NOT NULL DEFAULT 0,
    reserved_quantity   NUMERIC(14,3) NOT NULL DEFAULT 0,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, variant_id)
);

CREATE TYPE stock_transaction_type AS ENUM (
    'opening', 'purchase', 'sale', 'customer_return',
    'supplier_return', 'damaged', 'adjustment', 'correction', 'transfer'
);

CREATE TABLE stock_transactions (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          UUID NOT NULL REFERENCES products(id),
    variant_id          UUID REFERENCES product_variants(id),
    transaction_type    stock_transaction_type NOT NULL,
    quantity_change      NUMERIC(14,3) NOT NULL,   -- signed: +in, -out
    previous_stock      NUMERIC(14,3) NOT NULL,
    new_stock           NUMERIC(14,3) NOT NULL,
    reason              TEXT,
    reference_type      TEXT,                      -- 'purchase_order', 'sales_order', 'manual', ...
    reference_id        TEXT,
    performed_by        UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_tx_product ON stock_transactions(product_id, variant_id, created_at);

-- ----------------------------------------------------------------------------
-- 6. PRICE HISTORY
-- ----------------------------------------------------------------------------

CREATE TABLE price_history (
    id              BIGSERIAL PRIMARY KEY,
    product_id      UUID NOT NULL REFERENCES products(id),
    variant_id      UUID REFERENCES product_variants(id),
    price_field     TEXT NOT NULL,      -- 'purchase_price' | 'mrp' | 'selling_price' | ...
    old_price       NUMERIC(12,2),
    new_price       NUMERIC(12,2) NOT NULL,
    changed_by      UUID REFERENCES users(id),
    reason          TEXT,               -- e.g. 'Bulk update: +5% Electrical category'
    batch_id        UUID,               -- groups rows from one bulk-update operation
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_price_history_product ON price_history(product_id, created_at);

-- ----------------------------------------------------------------------------
-- 7. AUDIT LOG — every mutating admin action
-- ----------------------------------------------------------------------------

CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID REFERENCES users(id),
    action          TEXT NOT NULL,          -- 'product.create', 'product.update', 'stock.adjust', ...
    entity_type     TEXT NOT NULL,
    entity_id       TEXT NOT NULL,
    before_data     JSONB,
    after_data      JSONB,
    ip_address      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at);

-- ----------------------------------------------------------------------------
-- 8. BULK IMPORT BATCHES (for traceability of CSV/Excel imports)
-- ----------------------------------------------------------------------------

CREATE TABLE import_batches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name       TEXT NOT NULL,
    imported_by     UUID REFERENCES users(id),
    total_rows      INTEGER NOT NULL,
    valid_rows      INTEGER NOT NULL,
    invalid_rows    INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending', -- pending | applied | cancelled
    error_report    JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Helper view: current stock status per product/variant (IN_STOCK / LOW_STOCK / OUT_OF_STOCK)
-- ----------------------------------------------------------------------------

CREATE VIEW stock_status_view AS
SELECT
    i.product_id,
    i.variant_id,
    i.quantity_on_hand,
    i.reserved_quantity,
    (i.quantity_on_hand - i.reserved_quantity) AS available_quantity,
    COALESCE(v.min_stock, p.min_stock) AS min_stock,
    CASE
        WHEN i.quantity_on_hand <= 0 THEN 'OUT_OF_STOCK'
        WHEN i.quantity_on_hand <= COALESCE(v.min_stock, p.min_stock) THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END AS stock_status
FROM inventory i
JOIN products p ON p.id = i.product_id
LEFT JOIN product_variants v ON v.id = i.variant_id;
