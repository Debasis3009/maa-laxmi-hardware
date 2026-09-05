import 'server-only';
import path from 'node:path';
import fs from 'node:fs';

const { createApp } = require('./core/src/app');
const { seedSampleData } = require('./core/src/seed/seed');

type CoreApp = ReturnType<typeof createApp>;

const g = globalThis as unknown as { __mlhApp?: CoreApp; __mlhOwnerId?: string };

function boot(): { app: CoreApp; ownerId: string } {
  if (g.__mlhApp && g.__mlhOwnerId) {
    return { app: g.__mlhApp, ownerId: g.__mlhOwnerId };
  }

  const dbDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
  const dbFile = path.join(dbDir, 'dev.sqlite');
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  const app = createApp(process.env.NODE_ENV === 'test' ? ':memory:' : dbFile);
  app.bootstrap();

  let owner = app.userService.listUsers().find((u: { role: string }) => u.role === 'owner');
  if (!owner) {
    const created = app.userService.createUser({
      name: 'Sarat Dey',
      phone: '9547512088',
      password: 'ChangeMe123!',
      roleName: 'owner',
    });
    owner = { id: created.id } as { id: string; role: string };
  }

  // Ensure catalog is populated if products table has zero items
  const productCount = app.productService.listProducts({ limit: 1 }).length;
  if (productCount === 0) {
    seedSampleData(app, owner.id);
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
