import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const { createApp } = require('./core/src/app');
const { seedSampleData } = require('./core/src/seed/seed');

type CoreApp = ReturnType<typeof createApp>;
type Booted = { app: CoreApp; ownerId: string };
const g = globalThis as unknown as { __mlhBoot?: Promise<Booted> };

async function initializeSchema(app: CoreApp) {
 const marker=await app.db.queryOne("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='billing_customer_type'");
 if(!marker)throw new Error('Billing database upgrade is required. Apply migrations/private_billing.sql before deployment.');
}

async function boot(): Promise<Booted> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. This application is PostgreSQL-only.');
  const app = await createApp(process.env.DATABASE_URL);
  await initializeSchema(app);
  await app.bootstrap();

  let owner = (await app.userService.listUsers()).find((u: { role: string }) => u.role === 'owner');
  if (!owner) {
    const created = await app.userService.createUser({
      name: 'Sarat Dey',
      phone: 'Admin',
      password: process.env.ADMIN_BOOTSTRAP_PASSWORD || crypto.randomUUID(),
      roleName: 'owner',
    });
    owner = { id: created.id, role: 'owner' };
  }

  const productCount = (await app.productService.listProducts({ limit: 1 })).length;
  if (productCount === 0) await seedSampleData(app, owner.id);
  return { app, ownerId: owner.id };
}

function bootOnce(): Promise<Booted> {
  if (!g.__mlhBoot) g.__mlhBoot = boot().catch((err: unknown) => { g.__mlhBoot = undefined; throw err; });
  return g.__mlhBoot;
}
export async function getApp(): Promise<CoreApp> { return (await bootOnce()).app; }
export async function getOwnerId(): Promise<string> { return (await bootOnce()).ownerId; }
