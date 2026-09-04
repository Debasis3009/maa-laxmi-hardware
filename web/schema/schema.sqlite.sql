-- ============================================================================
-- LOCAL VERIFICATION SCHEMA (SQLite dialect)
-- Structurally identical to schema.postgres.sql — same tables, same columns,
-- same relationships, same "no direct stock writes" rule. Differences are
-- purely syntactic, required because this sandbox has no network access to
-- install PostgreSQL:
--   - UUID          -> TEXT (app generates uuids in JS, same as pgcrypto would)
--   - JSONB         -> TEXT (app stores/parses JSON strings)
--   - ENUM          -> TEXT + CHECK constraint
--   - SERIAL        -> INTEGER PRIMARY KEY AUTOINCREMENT
--   - TIMESTAMPTZ   -> TEXT (ISO 8601, app-generated)
-- Do not deploy this file. It exists only so Phase 1 logic can be executed
-- and proven correct in this environment. Production uses schema.postgres.sql.
-- ============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE roles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL UNIQUE,
    description     TEXT,
    permissions     TEXT NOT NULL DEFAULT '{}',
    is_system_role  INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL
);

CREATE TABLE users (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    email           TEXT UNIQUE,
    phone           TEXT UNIQUE,
    password_hash   TEXT NOT NULL,
    role_id         INTEGER NOT NULL REFERENCES roles(id),
    is_active       INTEGER NOT NULL DEFAULT 1,
    last_login_at   TEXT,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

CREATE TABLE business_settings (
    key             TEXT PRIMARY KEY,
    value           TEXT NOT NULL,
    description     TEXT,
    updated_by      TEXT REFERENCES users(id),
    updated_at      TEXT NOT NULL
);

CREATE TABLE units (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL UNIQUE,
    abbreviation    TEXT NOT NULL,
    is_custom       INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL
);

CREATE TABLE brands (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL UNIQUE,
    slug            TEXT NOT NULL UNIQUE,
    logo_url        TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL
);

CREATE TABLE suppliers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    contact_person  TEXT,
    phone           TEXT,
    email           TEXT,
    address         TEXT,
    gstin           TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL
);

CREATE TABLE categories (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id       INTEGER REFERENCES categories(id),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    image_url       TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL,
    UNIQUE (parent_id, name)
);

CREATE TABLE products (
    id                      TEXT PRIMARY KEY,
    sku                     TEXT NOT NULL UNIQUE,
    barcode                 TEXT UNIQUE,
    name                    TEXT NOT NULL,
    brand_id                INTEGER REFERENCES brands(id),
    category_id             INTEGER NOT NULL REFERENCES categories(id),
    product_type            TEXT,
    short_description       TEXT,
    full_description        TEXT,
    unit_id                 INTEGER NOT NULL REFERENCES units(id),
    purchase_price          REAL NOT NULL DEFAULT 0,
    mrp                     REAL NOT NULL DEFAULT 0,
    retail_price            REAL,
    wholesale_price         REAL,
    dealer_price            REAL,
    selling_price           REAL NOT NULL DEFAULT 0,
    discount_percent        REAL NOT NULL DEFAULT 0,
    gst_rate                REAL NOT NULL DEFAULT 0,
    hsn_code                TEXT,
    weight                  REAL, length REAL, width REAL, height REAL,
    size TEXT, color TEXT, material TEXT, model_number TEXT, manufacturer TEXT, warranty TEXT,
    tags                    TEXT NOT NULL DEFAULT '[]',
    specifications          TEXT NOT NULL DEFAULT '{}',
    min_stock               REAL NOT NULL DEFAULT 0,
    max_stock               REAL,
    reorder_level           REAL NOT NULL DEFAULT 0,
    supplier_id             INTEGER REFERENCES suppliers(id),
    has_variants            INTEGER NOT NULL DEFAULT 0,
    is_featured             INTEGER NOT NULL DEFAULT 0,
    is_bestseller           INTEGER NOT NULL DEFAULT 0,
    is_new_arrival          INTEGER NOT NULL DEFAULT 0,
    is_active               INTEGER NOT NULL DEFAULT 1,
    online_purchase_enabled INTEGER NOT NULL DEFAULT 1,
    quotation_enabled       INTEGER NOT NULL DEFAULT 1,
    whatsapp_order_enabled  INTEGER NOT NULL DEFAULT 1,
    allow_backorder         INTEGER NOT NULL DEFAULT 0,
    created_by              TEXT REFERENCES users(id),
    created_at              TEXT NOT NULL,
    updated_at              TEXT NOT NULL,
    deleted_at              TEXT
);

CREATE TABLE product_images (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id      TEXT NOT NULL REFERENCES products(id),
    url             TEXT NOT NULL,
    is_main         INTEGER NOT NULL DEFAULT 0,
    sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE product_variants (
    id              TEXT PRIMARY KEY,
    product_id      TEXT NOT NULL REFERENCES products(id),
    sku             TEXT NOT NULL UNIQUE,
    barcode         TEXT UNIQUE,
    name            TEXT NOT NULL,
    attributes      TEXT NOT NULL DEFAULT '{}',
    unit_id         INTEGER NOT NULL REFERENCES units(id),
    purchase_price  REAL NOT NULL DEFAULT 0,
    mrp             REAL NOT NULL DEFAULT 0,
    selling_price   REAL NOT NULL DEFAULT 0,
    weight          REAL,
    min_stock       REAL NOT NULL DEFAULT 0,
    max_stock       REAL,
    reorder_level   REAL NOT NULL DEFAULT 0,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

CREATE TABLE inventory (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id          TEXT NOT NULL REFERENCES products(id),
    variant_id          TEXT REFERENCES product_variants(id),
    quantity_on_hand    REAL NOT NULL DEFAULT 0,
    reserved_quantity   REAL NOT NULL DEFAULT 0,
    updated_at          TEXT NOT NULL,
    UNIQUE (product_id, variant_id)
);

CREATE TABLE stock_transactions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id          TEXT NOT NULL REFERENCES products(id),
    variant_id          TEXT REFERENCES product_variants(id),
    transaction_type    TEXT NOT NULL CHECK (transaction_type IN
                          ('opening','purchase','sale','customer_return',
                           'supplier_return','damaged','adjustment','correction','transfer')),
    quantity_change     REAL NOT NULL,
    previous_stock      REAL NOT NULL,
    new_stock           REAL NOT NULL,
    reason              TEXT,
    reference_type      TEXT,
    reference_id        TEXT,
    performed_by        TEXT REFERENCES users(id),
    created_at          TEXT NOT NULL
);

CREATE TABLE price_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id      TEXT NOT NULL REFERENCES products(id),
    variant_id      TEXT REFERENCES product_variants(id),
    price_field     TEXT NOT NULL,
    old_price       REAL,
    new_price       REAL NOT NULL,
    changed_by      TEXT REFERENCES users(id),
    reason          TEXT,
    batch_id        TEXT,
    created_at      TEXT NOT NULL
);

CREATE TABLE audit_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT REFERENCES users(id),
    action          TEXT NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       TEXT NOT NULL,
    before_data     TEXT,
    after_data      TEXT,
    ip_address      TEXT,
    created_at      TEXT NOT NULL
);

CREATE TABLE import_batches (
    id              TEXT PRIMARY KEY,
    file_name       TEXT NOT NULL,
    imported_by     TEXT REFERENCES users(id),
    total_rows      INTEGER NOT NULL,
    valid_rows      INTEGER NOT NULL,
    invalid_rows    INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    error_report    TEXT,
    created_at      TEXT NOT NULL
);
