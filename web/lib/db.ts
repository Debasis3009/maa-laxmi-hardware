import 'server-only';
import path from 'node:path';
import fs from 'node:fs';

// The Phase 1 core (schema + services) is vendored unmodified at
// lib/core/{schema,src}. We require it as CommonJS since that's how it was
// written and verified in Phase 1 — no rewrite, no behavior drift.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createApp } = require('./core/src/app');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { seedSampleData } = require('./core/src/seed/seed');

type CoreApp = ReturnType<typeof createApp>;

// A module-level singleton. Next.js may reload this module on every request
// in dev; globalThis survives hot-reload so we don't reopen the DB file or
// re-seed on every request.
const g = globalThis as unknown as { __mlhApp?: CoreApp; __mlhOwnerId?: string };

function boot(): { app: CoreApp; ownerId: string } {
  if (g.__mlhApp && g.__mlhOwnerId) {
    return { app: g.__mlhApp, ownerId: g.__mlhOwnerId };
  }

  const adapter = process.env.DB_ADAPTER || 'sqlite';
  if (adapter === 'postgres') {
    // Production path. Implement lib/core/src/db/postgres-adapter.js with the
    // same { query, queryOne, run, transaction } interface as
    // sqlite-adapter.js, point lib/core/src/app.js's createDb() at it, and
    // this file needs no changes — that's the point of the adapter boundary.
    throw new Error(
      'DB_ADAPTER=postgres is selected but no postgres-adapter.js has been wired in yet. ' +
        'See lib/core/src/db/sqlite-adapter.js for the interface to implement, then update ' +
        'lib/core/src/app.js createDb() to select it.'
    );
  }

   const dbDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
  const dbFile = path.join(dbDir, 'dev.sqlite');
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  const app = createApp(process.env.NODE_ENV === 'test' ? ':memory:' : dbFile);
  app.bootstrap();

  // Seed an owner account + sample catalog once, on first boot only.
  let owner = app.userService.listUsers().find((u: { role: string }) => u.role === 'owner');
  if (!owner) {
    const created = app.userService.createUser({
      name: 'Sarat Dey',
      phone: '9547512088',
      password: 'ChangeMe123!', // Phase 2 mock only — replace with real auth before going live.
      roleName: 'owner',
    });
    seedSampleData(app, created.id);
    owner = { id: created.id } as { id: string; role: string };
  }

  g.__mlhApp = app;
  g.__mlhOwnerId = (owner as { id: string }).id;
  return { app, ownerId: g.__mlhOwnerId };
}

export function getApp(): CoreApp {
  return boot().app;
}

export function getOwnerId(): string {
  return boot().ownerId;
}
