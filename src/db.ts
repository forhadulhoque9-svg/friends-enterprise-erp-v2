/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shop, CustomerLedger, Product, MarketVisitInvoice, HawlatRecord, InventoryLog, PurchaseRecord, ExpenseRecord, AppSettings, ProductReturn, DistributorReturn, DamagedStock, Company, CompanyLedgerEntry } from './types';

// Storage Keys
const KEYS = {
  SHOPS: 'fe_erp_shops',
  LEDGER: 'fe_erp_ledger',
  PRODUCTS: 'fe_erp_products',
  INVOICES: 'fe_erp_invoices',
  HAWLAT: 'fe_erp_hawlat',
  INVENTORY: 'fe_erp_inventory',
  PURCHASES: 'fe_erp_purchases',
  EXPENSES: 'fe_erp_expenses',
  SETTINGS: 'fe_erp_settings',
  RETURNS: 'fe_erp_returns',
  DIST_RETURNS: 'fe_erp_dist_returns',
  DAMAGED: 'fe_erp_damaged',
  COMPANIES: 'fe_erp_companies',
  COMPANY_LEDGER: 'fe_erp_company_ledger',
};

// Initial Seed Data in Bengali
const INITIAL_SHOPS: Shop[] = [];
const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_LEDGER: CustomerLedger[] = [];
const INITIAL_INVOICES: MarketVisitInvoice[] = [];
const INITIAL_PURCHASES: PurchaseRecord[] = [];
const INITIAL_EXPENSES: ExpenseRecord[] = [];
const INITIAL_HAWLAT: HawlatRecord[] = [];
const INITIAL_INVENTORY: InventoryLog[] = [];
const INITIAL_INVENTORY_LOGS: InventoryLog[] = INITIAL_INVENTORY;
const INITIAL_RETURNS: ProductReturn[] = [];
const INITIAL_DIST_RETURNS: DistributorReturn[] = [];
const INITIAL_DAMAGED: DamagedStock[] = [];

const INITIAL_SETTINGS: AppSettings = {
  appLockPin: '1234',
  isAppLockEnabled: false,
  isFingerprintEnabled: false,
  businessName: 'ফ্রেন্ডস এন্টারপ্রাইজ (Friends Enterprise)',
  proprietorName: 'ফরহাদুল হক (Forhadul Hoque)',
};

// Generic State Helper
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

export const db = {
  // Read Lists
  getShops: () => getLocal<Shop[]>(KEYS.SHOPS, INITIAL_SHOPS),
  getProducts: () => {
    const prods = getLocal<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return prods.map(p => ({
      ...p,
      piecesPerCarton: p.piecesPerCarton || 24,
      sellingPriceCarton: p.sellingPriceCarton || (p.sellingPrice * (p.piecesPerCarton || 24))
    }));
  },
  getLedgers: () => getLocal<CustomerLedger[]>(KEYS.LEDGER, INITIAL_LEDGER),
  getInvoices: () => getLocal<MarketVisitInvoice[]>(KEYS.INVOICES, INITIAL_INVOICES),
  getHawlats: () => getLocal<HawlatRecord[]>(KEYS.HAWLAT, INITIAL_HAWLAT),
  getInventoryLogs: () => getLocal<InventoryLog[]>(KEYS.INVENTORY, INITIAL_INVENTORY_LOGS),
  getPurchases: () => getLocal<PurchaseRecord[]>(KEYS.PURCHASES, INITIAL_PURCHASES),
  getExpenses: () => getLocal<ExpenseRecord[]>(KEYS.EXPENSES, INITIAL_EXPENSES),
  getSettings: () => getLocal<AppSettings>(KEYS.SETTINGS, INITIAL_SETTINGS),
  getReturns: () => getLocal<ProductReturn[]>(KEYS.RETURNS, INITIAL_RETURNS),
  getDistReturns: () => getLocal<DistributorReturn[]>(KEYS.DIST_RETURNS, INITIAL_DIST_RETURNS),
  getDamagedStocks: () => getLocal<DamagedStock[]>(KEYS.DAMAGED, INITIAL_DAMAGED),
  getCompanies: () => getLocal<Company[]>(KEYS.COMPANIES, []),
  getCompanyLedgers: () => getLocal<CompanyLedgerEntry[]>(KEYS.COMPANY_LEDGER, []),

  // Save Lists
  saveShops: (shops: Shop[]) => setLocal(KEYS.SHOPS, shops),
  saveProducts: (products: Product[]) => setLocal(KEYS.PRODUCTS, products),
  saveLedgers: (ledger: CustomerLedger[]) => setLocal(KEYS.LEDGER, ledger),
  saveInvoices: (invoices: MarketVisitInvoice[]) => setLocal(KEYS.INVOICES, invoices),
  saveHawlats: (hawlats: HawlatRecord[]) => setLocal(KEYS.HAWLAT, hawlats),
  saveInventoryLogs: (logs: InventoryLog[]) => setLocal(KEYS.INVENTORY, logs),
  savePurchases: (purchases: PurchaseRecord[]) => setLocal(KEYS.PURCHASES, purchases),
  saveExpenses: (expenses: ExpenseRecord[]) => setLocal(KEYS.EXPENSES, expenses),
  saveSettings: (settings: AppSettings) => setLocal(KEYS.SETTINGS, settings),
  saveReturns: (returns: ProductReturn[]) => setLocal(KEYS.RETURNS, returns),
  saveDistReturns: (distReturns: DistributorReturn[]) => setLocal(KEYS.DIST_RETURNS, distReturns),
  saveDamagedStocks: (damaged: DamagedStock[]) => setLocal(KEYS.DAMAGED, damaged),
  saveCompanies: (companies: Company[]) => setLocal(KEYS.COMPANIES, companies),
  saveCompanyLedgers: (ledger: CompanyLedgerEntry[]) => setLocal(KEYS.COMPANY_LEDGER, ledger),

  // DB Backup-Restore Utils
  exportDatabase: (): string => {
    const data = {
      shops: db.getShops(),
      products: db.getProducts(),
      ledgers: db.getLedgers(),
      invoices: db.getInvoices(),
      hawlats: db.getHawlats(),
      inventoryLogs: db.getInventoryLogs(),
      purchases: db.getPurchases(),
      expenses: db.getExpenses(),
      settings: db.getSettings(),
      returns: db.getReturns(),
      distReturns: db.getDistReturns(),
      damagedStocks: db.getDamagedStocks(),
      companies: db.getCompanies(),
      companyLedgers: db.getCompanyLedgers(),
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  },

  importDatabase: (base64Str: string): boolean => {
    try {
      const decoded = decodeURIComponent(escape(atob(base64Str)));
      const data = JSON.parse(decoded);
      if (data.shops) db.saveShops(data.shops);
      if (data.products) db.saveProducts(data.products);
      if (data.ledgers) db.saveLedgers(data.ledgers);
      if (data.invoices) db.saveInvoices(data.invoices);
      if (data.hawlats) db.saveHawlats(data.hawlats);
      if (data.inventoryLogs) db.saveInventoryLogs(data.inventoryLogs);
      if (data.purchases) db.savePurchases(data.purchases);
      if (data.expenses) db.saveExpenses(data.expenses);
      if (data.settings) db.saveSettings(data.settings);
      if (data.returns) db.saveReturns(data.returns);
      if (data.distReturns) db.saveDistReturns(data.distReturns);
      if (data.damagedStocks) db.saveDamagedStocks(data.damagedStocks);
      if (data.companies) db.saveCompanies(data.companies);
      if (data.companyLedgers) db.saveCompanyLedgers(data.companyLedgers);
      return true;
    } catch (e) {
      console.error('Backup Import failed:', e);
      return false;
    }
  },

  resetToDefault: () => {
    localStorage.removeItem(KEYS.SHOPS);
    localStorage.removeItem(KEYS.PRODUCTS);
    localStorage.removeItem(KEYS.LEDGER);
    localStorage.removeItem(KEYS.INVOICES);
    localStorage.removeItem(KEYS.HAWLAT);
    localStorage.removeItem(KEYS.INVENTORY);
    localStorage.removeItem(KEYS.PURCHASES);
    localStorage.removeItem(KEYS.EXPENSES);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.RETURNS);
    localStorage.removeItem(KEYS.DIST_RETURNS);
    localStorage.removeItem(KEYS.DAMAGED);
    localStorage.removeItem(KEYS.COMPANIES);
    localStorage.removeItem(KEYS.COMPANY_LEDGER);
  }
};
