import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const { createApp } = require('./core/src/app');
const { seedSampleData } = require('./core/src/seed/seed');

type CoreApp = ReturnType<typeof createApp>;
type Booted = { app: CoreApp; ownerId: string };
const g = globalThis as unknown as { __mlhBoot?: Promise<Booted> };

async function initializeSchema(app: CoreApp) {
  const exists = await app.db.queryOne("SELECT to_regclass('public.roles') AS name");
  if (!exists?.name) {
    const schemaPath = path.join(process.cwd(), 'schema', 'schema.postgres.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await app.db.raw.query(schema);
  } else {
    // Phase-2 tables use idempotent DDL so existing Phase-1 databases upgrade safely.
    const billingMarker = await app.db.queryOne("SELECT to_regclass('public.customers') AS name");
    if (!billingMarker?.name) {
      const schemaPath = path.join(process.cwd(), 'schema', 'schema.postgres.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      const phase2 = schema.slice(schema.indexOf('-- 9. CUSTOMERS'));
      if (phase2) await app.db.raw.query(phase2);
    }
  }
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
