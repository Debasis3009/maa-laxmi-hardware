# MAA LAXMI HARDWARE private billing

A Next.js application backed by PostgreSQL for the shop's owner. Production runs on Vercel with Vercel Authentication enabled for **All Deployments**. Owner credentials and a single-use email OTP protect the application session as well.

## Billing and collections

- Choose an existing customer or enter a new/walk-in customer's details. Every invoice retains the original customer type, name, phone, address, state, WhatsApp number and optional GSTIN, even after a customer profile changes.
- Search products, enter quantities and rates, apply discounts and GST, receive full or partial payment, and print or save the invoice as PDF. Seller GSTIN is optional.
- Receive subsequent payments on either customer type's invoice. Customer collections settle opening balances and the oldest invoices, retain excess as advance, and apply advance to later invoices.
- View running customer ledgers, invoice search/history, daily and monthly sales and collections, outstanding dues and stock versus sales.
- Maintain products, prices and stock through the existing service and audit layers. Invoice issuance and payments use transactions, row locks and submission keys to protect against duplicate submissions and inconsistent balances.

## Run and verify

Use Node.js 24 and install from the lockfile:

```bash
cd web
npm ci
npm run build
npm start
```

Configure `DATABASE_URL` and `DB_ADAPTER=postgres` on the server. Email verification requires `AUTH_OTP_SECRET`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM` and `AUTH_OTP_EMAIL`. Use the existing owner account; never put database credentials or email API keys in client variables.

Apply `migrations/private_billing.sql` once to the existing PostgreSQL database before deploying. This additive migration enables RLS on public tables and revokes browser API access. The app connects through the server database connection. Existing records are preserved.

`npm run build:verified` runs 14 billing scenarios against the configured PostgreSQL database inside a transaction, checks that all fixtures were rolled back, and builds production assets with type checking. It requires an existing owner and product categories. Vercel runs this command for production builds. `npm run build` compiles without requiring a database connection.

`/api/health` performs a fresh PostgreSQL query and checks that the billing schema is ready. It is covered by deployment protection. Browser validation covers owner credentials and email OTP, both customer types, partial collections and settlement, invoice history, ledgers, mobile billing and A4 printing.

## Private operation

Keep Vercel Authentication configured for **All Deployments**. Do not add public domain exceptions or enable unauthenticated sharing. Production database and email settings belong only to the production environment; preview deployments need their own isolated configuration.

Sessions are opaque tokens checked against PostgreSQL. OTPs expire after five minutes, are single-use and attempt-limited, and have a server resend interval. Signing out or changing an owner's password revokes sessions. The application never displays the saved password.
