/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shop, CustomerLedger, Product, MarketVisitInvoice, HawlatRecord, InventoryLog, PurchaseRecord, ExpenseRecord, AppSettings, ProductReturn, DistributorReturn, DamagedStock } from './types';

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
};

// Initial Seed Data in Bengali
const INITIAL_SHOPS: Shop[] = [
  { id: 's1', name: 'ভাই ভাই স্টোর', ownerName: 'বাবুল মিয়া', phone: '01711223344', address: 'চকবাজার, ঢাকা', due: 3500 },
  { id: 's2', name: 'মা বাবার দোয়া ট্রেডার্স', ownerName: 'আলমগীর হোসেন', phone: '01819887766', address: 'কারওয়ান বাজার, ঢাকা', due: 1200 },
  { id: 's3', name: 'বিসমিল্লাহ জেনারেল স্টোর', ownerName: 'মোঃ রাসেল', phone: '01911554433', address: 'মহাখালী, ঢাকা', due: 0 },
  { id: 's4', name: 'জনতা ডিপার্টমেন্টাল স্টোর', ownerName: 'সুজন দাস', phone: '01511229988', address: 'মিরপুর ১০, ঢাকা', due: 5000 },
  { id: 's5', name: 'সততা ডিপো', ownerName: 'রফিক উদ্দিন', phone: '01712345678', address: 'উত্তরা সেক্টর ৭, ঢাকা', due: 850 },
  { id: 's6', name: 'ফাতেমা সুপার শপ', ownerName: 'কামরুল ইসলাম', phone: '01612341234', address: 'মোহাম্মদপুর, ঢাকা', due: 0 },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'লাক্স সাবান ১০০ গ্রাম', category: 'প্রসাধন', purchasePrice: 42, sellingPrice: 50, sellingPriceCarton: 1100, piecesPerCarton: 24, stock: 120, minStockAlert: 20 },
  { id: 'p2', name: 'লাইফবয় সাবান ৭৫ গ্রাম', category: 'প্রসাধন', purchasePrice: 34, sellingPrice: 40, sellingPriceCarton: 900, piecesPerCarton: 24, stock: 180, minStockAlert: 30 },
  { id: 'p3', name: 'কোকা-কোলা ৫০০ মিলি', category: 'পানীয়', purchasePrice: 32, sellingPrice: 38, sellingPriceCarton: 420, piecesPerCarton: 12, stock: 15, minStockAlert: 25 }, // Low stock
  { id: 'p4', name: 'সেভেন আপ ২৫০ মিলি', category: 'পানীয়', purchasePrice: 18, sellingPrice: 22, sellingPriceCarton: 500, piecesPerCarton: 24, stock: 240, minStockAlert: 20 },
  { id: 'p5', name: 'প্রান ম্যাঙ্গো জুস ২০০ মিলি', category: 'পানীয়', purchasePrice: 16, sellingPrice: 20, sellingPriceCarton: 900, piecesPerCarton: 48, stock: 300, minStockAlert: 40 },
  { id: 'p6', name: 'রুচি চানাচুর ১৫০ গ্রাম', category: 'স্ন্যাক্স', purchasePrice: 28, sellingPrice: 35, sellingPriceCarton: 800, piecesPerCarton: 24, stock: 90, minStockAlert: 15 },
  { id: 'p7', name: 'চাকা ওয়াশিং পাউডার ১ কেজি', category: 'পরিষ্কারক', purchasePrice: 110, sellingPrice: 130, sellingPriceCarton: 1500, piecesPerCarton: 12, stock: 8, minStockAlert: 10 }, // Low stock
  { id: 'p8', name: 'তীর সয়াবিন তেল ২ লিটার', category: 'মুদি', purchasePrice: 320, sellingPrice: 350, sellingPriceCarton: 2000, piecesPerCarton: 6, stock: 45, minStockAlert: 12 },
  { id: 'p9', name: 'মিনিকেট চাল ২৫ কেজি', category: 'মুদি', purchasePrice: 1450, sellingPrice: 1600, sellingPriceCarton: 1600, piecesPerCarton: 1, stock: 15, minStockAlert: 5 },
  { id: 'p10', name: 'ডেটল এন্টিসেপ্টিক ৫০ মিলি', category: 'প্রসাধন', purchasePrice: 48, sellingPrice: 55, sellingPriceCarton: 1250, piecesPerCarton: 24, stock: 60, minStockAlert: 15 },
];

const INITIAL_LEDGER: CustomerLedger[] = [
  { id: 'l1', customerId: 's1', date: '2026-07-01', type: 'sales', amount: 5000, invoiceId: 'INV-1001', note: 'জুলাইয়ের প্রথম চালান' },
  { id: 'l2', customerId: 's1', date: '2026-07-03', type: 'payment', amount: 1500, note: 'আংশিক নগদ পরিশোধ' },
  { id: 'l3', customerId: 's2', date: '2026-07-02', type: 'sales', amount: 3200, invoiceId: 'INV-1002', note: 'মুদি মালামাল বিক্রয়' },
  { id: 'l4', customerId: 's2', date: '2026-07-05', type: 'payment', amount: 2000, note: 'বিকাশ পেমেন্ট' },
  { id: 'l5', customerId: 's4', date: '2026-07-04', type: 'sales', amount: 5000, invoiceId: 'INV-1003', note: 'পাইকারি সাবান ও জুস' },
  { id: 'l6', customerId: 's5', date: '2026-07-06', type: 'sales', amount: 1850, invoiceId: 'INV-1004', note: 'স্ন্যাক্স ও পানীয়' },
  { id: 'l7', customerId: 's5', date: '2026-07-07', type: 'payment', amount: 1000, note: 'ক্যাশ প্রদান' },
];

const INITIAL_INVOICES: MarketVisitInvoice[] = [
  {
    id: 'INV-1001',
    date: '2026-07-01',
    marketName: 'চকবাজার ও সংলগ্ন এলাকা',
    totalAmount: 5000,
    totalPaid: 1500,
    totalDue: 3500,
    entries: [
      {
        customerId: 's1',
        customerName: 'ভাই ভাই স্টোর',
        items: [
          { productId: 'p1', productName: 'লাক্স সাবান ১০০ গ্রাম', quantity: 50, price: 50 },
          { productId: 'p8', productName: 'তীর সয়াবিন তেল ২ লিটার', quantity: 10, price: 350 }
        ],
        totalAmount: 5000,
        paidAmount: 1500,
        dueAmount: 3500,
        status: 'partial'
      }
    ]
  },
  {
    id: 'INV-1002',
    date: '2026-07-02',
    marketName: 'কারওয়ান বাজার তেজগাঁও',
    totalAmount: 3200,
    totalPaid: 2000,
    totalDue: 1200,
    entries: [
      {
        customerId: 's2',
        customerName: 'মা বাবার দোয়া ট্রেডার্স',
        items: [
          { productId: 'p6', productName: 'রুচি চানাচুর ১৫০ গ্রাম', quantity: 40, price: 35 },
          { productId: 'p5', productName: 'প্রান ম্যাঙ্গো জুস ২০০ মিলি', quantity: 90, price: 20 }
        ],
        totalAmount: 3200,
        paidAmount: 2000,
        dueAmount: 1200,
        status: 'partial'
      }
    ]
  }
];

const INITIAL_HAWLAT: HawlatRecord[] = [
  { id: 'h1', date: '2026-06-25', type: 'borrow_cash', amount: 50000, note: 'ব্যবসা সম্প্রসারণের জন্য নগদ হাওলাত' },
  { id: 'h2', date: '2026-06-28', type: 'borrow_product', amount: 16000, productId: 'p9', productName: 'মিনিকেট চাল ২৫ কেজি', quantity: 10, note: 'চাল সংকটের কারণে ধার নেয়া' },
  { id: 'h3', date: '2026-07-04', type: 'return_cash', amount: 20000, note: 'নগদ হাওলাত আংশিক পরিশোধ' },
  { id: 'h4', date: '2026-07-08', type: 'return_product', amount: 8000, productId: 'p9', productName: 'মিনিকেট চাল ২৫ কেজি', quantity: 5, note: '৫ বস্তা চাল ফেরত' },
];

const INITIAL_INVENTORY_LOGS: InventoryLog[] = [
  { id: 'iv1', date: '2026-06-20', productId: 'p1', productName: 'লাক্স সাবান ১০০ গ্রাম', type: 'stock_in', quantity: 150, note: 'নতুন সাপ্লাই' },
  { id: 'iv2', date: '2026-07-01', productId: 'p1', productName: 'লাক্স সাবান ১০০ গ্রাম', type: 'sale', quantity: 50, note: 'চালান নং INV-1001' },
];

const INITIAL_PURCHASES: PurchaseRecord[] = [
  {
    id: 'PUR-5001',
    date: '2026-06-20',
    supplierName: 'ইউনিলিভার বাংলাদেশ',
    items: [
      { productId: 'p1', productName: 'লাক্স সাবান ১০০ গ্রাম', quantity: 150, price: 42 },
      { productId: 'p2', productName: 'লাইফবয় সাবান ৭৫ গ্রাম', quantity: 200, price: 34 }
    ],
    totalAmount: 13100,
    paidAmount: 10000,
    dueAmount: 3100
  }
];

const INITIAL_EXPENSES: ExpenseRecord[] = [
  { id: 'ex1', date: '2026-07-01', category: 'ভ্যান ভাড়া / যাতায়াত', amount: 1200, note: 'বাজার ভিজিট খরচ' },
  { id: 'ex2', date: '2026-07-05', category: 'দোকান ভাড়া', amount: 8000, note: 'জুলাই মাসের গুদাম ঘর ভাড়া' },
  { id: 'ex3', date: '2026-07-08', category: 'বিদ্যুৎ বিল', amount: 1500, note: 'জুলাই বিদ্যুৎ বিল' },
];

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
  getReturns: () => getLocal<ProductReturn[]>(KEYS.RETURNS, []),
  getDistReturns: () => getLocal<DistributorReturn[]>(KEYS.DIST_RETURNS, []),
  getDamagedStocks: () => getLocal<DamagedStock[]>(KEYS.DAMAGED, []),

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
  }
};
