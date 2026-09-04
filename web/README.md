# Maa Laxmi Hardware — Phase 2: Next.js Storefront + Admin Dashboard

Built directly on the Phase 1 database schema and service layer — nothing
here bypasses it. Every mutation in the Admin UI calls the same
`priceService` / `inventoryService` / `productService` / `importService`
functions that Phase 1's verification script exercised, so price history,
the stock ledger, and audit logging all keep working exactly as before.

## ⚠️ Same sandbox limitation as Phase 1, please read first

This container still has **no internet access**, so I could not run
`npm install` here — meaning I could not start the actual Next.js dev
server or do a full `next build` in this conversation. What I could and did
verify here:

1. **The database wiring is real and tested.** Every Server Action
   (`app/admin/*/actions.ts`) is a thin wrapper that calls straight into
   the Phase 1 services. I wrote a standalone script that calls those exact
   same service functions with the same arguments the actions use — inline
   price edit, inline stock edit (via `adjustStockTo`, still ledger-based,
   never a direct overwrite), threshold edit, active toggle, archive,
   bulk price preview + apply, CSV validate + import, and the dashboard/
   stock-log queries. **All 13 checks pass.**
2. **Every `.ts`/`.tsx` file was syntax/reference-checked** with the
   TypeScript compiler (no bundler, since `next`/`tailwindcss`/`@types/*`
   aren't installable offline here). This catches typos, broken imports,
   and wrong prop/argument names — none were found. The only TS errors
   that came back were all attributable to missing type packages that
   `npm install` provides (`@types/node`, `@types/react`, `tailwindcss`,
   `next`'s bundled types) — not real code defects.
3. **What I could not do here**: actually render a page, click a button in
   a browser, or run `next build`/`next dev`. Please run `npm install &&
   npm run dev` on your machine (or CI) as the first real end-to-end check,
   and treat that as the actual acceptance test.

Also: still no poster images were attached to this conversation, so no
uploaded branding assets are used — the design tokens below were chosen
from your written brief (orange/gold/green/charcoal, no clutter, sharp
corners, no generic SaaS look).

## What's mocked (by design, called out so nothing is mistaken for finished)

- **Auth**: `lib/session.ts` is a cookie-based role switch (ADMIN/CUSTOMER),
  not password/OTP login. It reads a real owner user row from the Phase 1
  `users` table, so replacing it with real credential checking later is a
  contained change — every permission check already goes through
  `requireAdmin()`.
- **Cart / bulk quote**: in-memory React state (`StorefrontClient.tsx`),
  cleared on page reload. It builds a WhatsApp message from the cart
  contents rather than writing to a `quotations` table — that table doesn't
  exist yet (it's a later phase in your original spec). This is clearly a
  bridge, not the full quotation system.
- **Search**: client-side filtering over the loaded catalog (fine at hundreds
  of SKUs). At larger catalogs this becomes a server action hitting a real
  `WHERE name LIKE / SKU LIKE` query — the same query `productService.
  listProducts({ search })` already supports server-side.
- **DB adapter**: defaults to the Phase 1 SQLite harness via `DB_ADAPTER=
  sqlite` so `npm run dev` works with zero setup. Flipping to Postgres for
  production means implementing `lib/core/src/db/postgres-adapter.js`
  against the same three-method interface as `sqlite-adapter.js` — no
  service file changes.

## How to run for real (on a machine with internet)

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
# open http://localhost:3000        (storefront)
# open http://localhost:3000/login  (switch to Admin, then /admin)
```

First run seeds an owner user (phone 9547512088) and the same `(SAMPLE)`
catalog from Phase 1 into `data/dev.sqlite`. Delete that file to reset.

## Folder structure

```
web/
  app/
    layout.tsx, page.tsx        <- root layout + storefront home
    login/page.tsx              <- mock ADMIN/CUSTOMER session switch
    admin/
      layout.tsx                <- RBAC gate + nav (redirects to /login if not admin)
      page.tsx                  <- dashboard: low/out-of-stock, recent activity
      products/page.tsx + actions.ts   <- inventory CRUD table + its Server Actions
      pricing/page.tsx + actions.ts    <- bulk price tool + its Server Actions
      import/page.tsx + actions.ts     <- CSV importer + its Server Actions
      stock-log/page.tsx        <- immutable stock ledger view
  components/
    storefront/  <- SearchBar, CategoryChips, ProductCard, ProductModal, CartDrawer, StockBadge
    admin/       <- InventoryTable, DeleteConfirmDialog, BulkPriceModal, CsvImportDropzone
  lib/
    db.ts        <- server-only singleton wiring Next.js to the Phase 1 core
    session.ts   <- mock RBAC session
    whatsapp.ts  <- WhatsApp message builders
    types.ts     <- TS types describing what the Phase 1 services return
    core/        <- Phase 1 schema + services, vendored UNMODIFIED except one
                    real bug fix (see below), so this stays one source of truth
  tailwind.config.ts, next.config.js, package.json, .env.example
```

## One real bug found and fixed while wiring Phase 2

The Phase 1 SQLite adapter re-ran `CREATE TABLE` on every `createDb()` call.
That was invisible in Phase 1 because the verification script only ever
used an in-memory database (fresh every run). Phase 2 needs a real
file-backed dev database that survives server restarts — running the schema
twice against an existing file throws "table already exists". Fixed in
`lib/core/src/db/sqlite-adapter.js` to check for an already-initialized database
first. Re-ran the full Phase 1 test suite afterward — still 21/21 passing —
plus a new check that a file-backed DB survives being closed and reopened.

## Suggested next phase

**Phase 3: real checkout + order management + quotations** — turn the cart
into an actual order (new `orders`/`order_items` tables), replace the
WhatsApp-only bulk quote with a stored `quotations` table + PDF generation,
and wire delivery/pickup selection to the `business_settings.delivery`
config that's already sitting there unused by the UI. Also a good time to
add real authentication once you're ready to move off the mock session.
