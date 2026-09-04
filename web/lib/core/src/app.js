'use strict';
const { createDb } = require('./db/sqlite-adapter');
const { createAuditService } = require('./services/auditService');
const { createUserService } = require('./services/userService');
const { createSettingsService } = require('./services/settingsService');
const { createCatalogService } = require('./services/catalogService');
const { createInventoryService } = require('./services/inventoryService');
const { createPriceService } = require('./services/priceService');
const { createProductService } = require('./services/productService');
const { createImportService } = require('./services/importService');

function createApp(dbFile = ':memory:') {
  const db = createDb(dbFile);

  const auditService = createAuditService(db);
  const userService = createUserService(db, auditService);
  const settingsService = createSettingsService(db, auditService);
  const catalogService = createCatalogService(db, auditService);
  const inventoryService = createInventoryService(db, auditService);
  const priceService = createPriceService(db, auditService);
  const productService = createProductService(db, { auditService, inventoryService, priceService });
  const importService = createImportService(db, { catalogService, productService });

  function bootstrap() {
    userService.ensureDefaultRoles();
    settingsService.seedDefaults();
    catalogService.seedStandardUnits();
  }

  return {
    db, auditService, userService, settingsService, catalogService,
    inventoryService, priceService, productService, importService, bootstrap,
  };
}

module.exports = { createApp };
