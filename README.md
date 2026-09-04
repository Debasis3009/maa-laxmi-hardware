# Maa Laxmi Hardware — Platform Foundation (Phase 1)

> **Phase 2 (Next.js storefront + Admin dashboard) is now built on top of this.**
> See `web/README.md` for that phase; this document covers Phase 1 only.

Business: **Maa Laxmi Hardware**, Prop. Sarat Dey, Nakrakonda, Birbhum, West Bengal 731125
Phones: 9547512088 / 7679911927

This is Phase 1 of the full platform: **database schema + core business logic**
for authentication/roles, product/category/brand/supplier catalog, inventory
with a transaction ledger, price management with history, bulk CSV import,
audit logging, and business settings. Everything downstream (storefront,
cart, checkout, orders, quotations, invoices, POS, reports, WhatsApp
ordering, AI assistant) will be built on top of this same database and these
same services — nothing here is throwaway.

## ⚠️ Two honest limitations of this sandbox (read before reviewing)

1. **No internet access in this container.** I could not install PostgreSQL,
   Prisma, or npm packages here. `schema/schema.postgres.sql` is the real,
   production-target schema — that's what your hosting/Supabase project will
   run. To actually *execute and verify* the logic in this sandbox, I built
   a local harness on Node's built-in `node:sqlite` (zero install, ships with
   Node 22+). `schema/schema.sqlite.sql` is a syntactic translation of the
   same schema (UUID→TEXT, JSONB→TEXT, etc. — see comments in that file).
   All service code (`src/services/*.js`) talks to a small `db` adapter
   interface, not to SQLite directly — swapping in a real Postgres adapter
   later (using `pg`) means writing one new file, not touching any service.

2. **No poster images were actually attached to this conversation.** Branding
   below uses only the text facts you provided (name, proprietor, address,
   phones). Please attach the posters and I'll fold in the visual identity
   (colors, logo, imagery) when we build the storefront UI phase.

All product names, prices, and stock counts in the seed data are prefixed
`(SAMPLE)` and are placeholders — no real inventory or pricing was provided,
so none was invented as if real.

## What's implemented and verified in Phase 1

| Area | What it does |
|---|---|
| **Auth & Roles** | Password hashing (scrypt), role-based permissions (`owner`, `manager`, `cashier`, `staff`), owner can create more roles/staff without code changes |
| **Business Settings** | Key/value store for WhatsApp number, delivery rules, invoice/quotation numbering, business hours — all editable at runtime, nothing hard-coded |
| **Categories** | Self-referencing table = unlimited category/subcategory depth in one place; create/disable/reorder; cannot delete a category still in use |
| **Brands, Suppliers, Units** | Full CRUD; 15 standard units seeded, admin can add custom units |
| **Products** | Full field set from your spec (pricing tiers, GST/HSN, physical attributes, tags/specs as JSON, business flags); create/update/soft-delete/duplicate |
| **Variants** | A product can have independent variants (e.g. PVC Pipe → "1 inch × 3 m", "2 inch × 6 m"), each with its own SKU, price, and stock |
| **Inventory** | Stock is **never overwritten directly** — every change is a `stock_transactions` row (opening/purchase/sale/return/damaged/adjustment), and the running balance is derived from that ledger in the same DB transaction. Overselling is blocked at the data layer, not just the UI. |
| **Stock status** | IN_STOCK / LOW_STOCK / OUT_OF_STOCK computed automatically from `min_stock`; Low Stock and Out of Stock dashboard queries |
| **Pricing** | Single price change with full history; bulk update by category (including subcategories) or brand, by percent/flat/set, with a **preview before apply** and a batch ID tying every affected row's history together |
| **Bulk import** | CSV parsed and validated (missing fields, unknown category/unit, duplicate SKU — in-file and against the DB) **before** anything is written; invalid rows never touch the database; import batches are logged for traceability. Validator is format-agnostic — the real app's Excel importer (SheetJS) will feed it the same row shape. |
| **Audit log** | Every create/update/delete/price-change/stock-change is recorded with before/after state and who did it |

## How to run the verification yourself

```bash
cd maalaxmi-hardware
node --experimental-sqlite scripts/run-demo.js
```

This seeds sample data and runs 21 assertions against real logic (not
mocked): role permissions, login/failed login, category nesting, delete
protection, stock math including a blocked oversell, low-stock detection,
bulk price update math cross-checked against its own preview, CSV validation
catching three different bad-row types, and audit trail completeness. Current
run: **all 21 checks pass**. Output is verbose on purpose so you can see the
actual before/after values, not just ✅/❌.

## Project layout

```
schema/
  schema.postgres.sql   <- canonical production schema (Postgres 14+)
  schema.sqlite.sql     <- same schema, SQLite dialect, for local verification only
src/
  db/sqlite-adapter.js  <- local dev DB adapter (swap for a pg adapter in production)
  util.js               <- uuid/timestamps/slugify/password hashing
  services/
    auditService.js
    userService.js       <- roles, users, auth
    settingsService.js   <- business settings key/value store
    catalogService.js    <- units, brands, suppliers, categories
    productService.js    <- products + variants CRUD
    inventoryService.js  <- stock transactions, stock status, low/out-of-stock
    priceService.js      <- single + bulk price updates, price history
    importService.js     <- CSV/Excel-shape bulk import validation
  seed/seed.js            <- SAMPLE data only
  app.js                  <- composition root, wires everything together
scripts/run-demo.js       <- end-to-end verification script
```

## What I did *not* invent

No real products, brands, prices, stock levels, GST rates, or business
claims. Everything demonstrable in the seed data is tagged `(SAMPLE)`. When
we get to real data entry, you'll either type products into the Admin UI
(Phase 2+) or hand me an actual price list / stock register to import via
the bulk CSV importer already built above.

## Suggested next phase

**Phase 2: Admin UI (Next.js) on top of this exact schema/services** — product
table with search/filter/bulk actions, category manager, inventory dashboard
with low-stock alerts, bulk price update screen with the preview shown above,
CSV import wizard. This phase will also be the first place we can actually
use the poster branding once you attach it.

Let me know if you want me to proceed to Phase 2, or adjust anything in this
foundation first (e.g. add a permission you need, change the stock formula,
add more default roles).
