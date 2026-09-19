'use strict';
const { createPostgresDb } = require('./db/postgres-adapter');
const { createAuditService } = require('./services/auditService');
const { createUserService } = require('./services/userService');
const { createSettingsService } = require('./services/settingsService');
const { createCatalogService } = require('./services/catalogService');
const { createInventoryService } = require('./services/inventoryService');
const { createPriceService } = require('./services/priceService');
const { createProductService } = require('./services/productService');
const { createImportService } = require('./services/importService');
const { createCustomerBillingService } = require('./services/customerBillingService');

async function createApp(connectionString = process.env.DATABASE_URL) {
  const db = createPostgresDb(connectionString);
  const auditService = createAuditService(db);
  const userService = createUserService(db, auditService);
  const settingsService = createSettingsService(db, auditService);
  const catalogService = createCatalogService(db, auditService);
  const inventoryService = await createInventoryService(db, auditService);
  const priceService = await createPriceService(db, auditService);
  const productService = await createProductService(db, { auditService, inventoryService, priceService });
  const importService = await createImportService(db, { catalogService, productService });
  const customerBillingService = await createCustomerBillingService(db, auditService);

  async function bootstrap() {
    await userService.ensureDefaultRoles();
    await settingsService.seedDefaults();
    await catalogService.seedStandardUnits();
  }

  return {
    db, auditService, userService, settingsService, catalogService,
    inventoryService, priceService, productService, importService,
    customerBillingService, bootstrap,
  };
}
module.exports = { createApp };
