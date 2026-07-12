/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Menu, 
  X, 
  TrendingUp, 
  UserCheck, 
  Package, 
  ShoppingBag, 
  HelpCircle, 
  ShieldCheck, 
  Database, 
  Maximize2, 
  Minimize2,
  Lock,
  Unlock,
  Fingerprint,
  RotateCcw,
  LayoutDashboard,
  Users,
  Box,
  BadgeCent,
  Layers,
  History,
  TrendingDown,
  FileBarChart,
  Settings,
  Battery,
  Wifi,
  Building
} from 'lucide-react';

import { db } from './db';
import { Shop, Product, CustomerLedger, MarketVisitInvoice, HawlatRecord, InventoryLog, PurchaseRecord, ExpenseRecord, AppSettings, ProductReturn, DistributorReturn, DamagedStock, Company, CompanyLedgerEntry } from './types';

// Screen Components
import Dashboard from './components/Dashboard';
import CustomerManagement from './components/CustomerManagement';
import ProductManagement from './components/ProductManagement';
import SalesInvoice from './components/SalesInvoice';
import DistributorManagement from './components/DistributorManagement';
import InventoryManagement from './components/InventoryManagement';
import PurchaseManagement from './components/PurchaseManagement';
import Reports from './components/Reports';
import SettingsPage from './components/SettingsPage';
import CompanyManagement from './components/CompanyManagement';

export default function App() {
  // Offline State variables
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ledgers, setLedgers] = useState<CustomerLedger[]>([]);
  const [invoices, setInvoices] = useState<MarketVisitInvoice[]>([]);
  const [hawlats, setHawlats] = useState<HawlatRecord[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [returns, setReturns] = useState<ProductReturn[]>([]);
  const [distReturns, setDistReturns] = useState<DistributorReturn[]>([]);
  const [damagedStocks, setDamagedStocks] = useState<DamagedStock[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyLedgers, setCompanyLedgers] = useState<CompanyLedgerEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // App Lock security state
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Navigation state
  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false); // Toggle true for tablet mode/false for phone frame simulator

  // Real-time Clock for Android status bar
  const [timeStr, setTimeStr] = useState('');

  // Load Database values on Mount
  useEffect(() => {
    setShops(db.getShops());
    setProducts(db.getProducts());
    setLedgers(db.getLedgers());
    setInvoices(db.getInvoices());
    setHawlats(db.getHawlats());
    setInventoryLogs(db.getInventoryLogs());
    setPurchases(db.getPurchases());
    setExpenses(db.getExpenses());
    setReturns(db.getReturns());
    setDistReturns(db.getDistReturns());
    setDamagedStocks(db.getDamagedStocks());
    setCompanies(db.getCompanies());
    setCompanyLedgers(db.getCompanyLedgers());
    
    const loadedSettings = db.getSettings();
    setSettings(loadedSettings);
    
    // If PIN app lock is disabled, unlock immediately
    if (!loadedSettings.isAppLockEnabled) {
      setIsLocked(false);
    }

    // Update real-time clock
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync state functions
  const saveShopsState = (newShops: Shop[]) => {
    setShops(newShops);
    db.saveShops(newShops);
  };

  const saveProductsState = (newProds: Product[]) => {
    setProducts(newProds);
    db.saveProducts(newProds);
  };

  const saveLedgersState = (newLeds: CustomerLedger[]) => {
    setLedgers(newLeds);
    db.saveLedgers(newLeds);
  };

  const saveInvoicesState = (newInvs: MarketVisitInvoice[]) => {
    setInvoices(newInvs);
    db.saveInvoices(newInvs);
  };

  const saveHawlatsState = (newHaws: HawlatRecord[]) => {
    setHawlats(newHaws);
    db.saveHawlats(newHaws);
  };

  const saveInventoryLogsState = (newLogs: InventoryLog[]) => {
    setInventoryLogs(newLogs);
    db.saveInventoryLogs(newLogs);
  };

  const savePurchasesState = (newPurch: PurchaseRecord[]) => {
    setPurchases(newPurch);
    db.savePurchases(newPurch);
  };

  const saveExpensesState = (newExp: ExpenseRecord[]) => {
    setExpenses(newExp);
    db.saveExpenses(newExp);
  };

  const saveReturnsState = (newRet: ProductReturn[]) => {
    setReturns(newRet);
    db.saveReturns(newRet);
  };

  const saveDistReturnsState = (newDistRet: DistributorReturn[]) => {
    setDistReturns(newDistRet);
    db.saveDistReturns(newDistRet);
  };

  const saveDamagedStocksState = (newDam: DamagedStock[]) => {
    setDamagedStocks(newDam);
    db.saveDamagedStocks(newDam);
  };

  const saveCompaniesState = (newComp: Company[]) => {
    setCompanies(newComp);
    db.saveCompanies(newComp);
  };

  const saveCompanyLedgersState = (newLeds: CompanyLedgerEntry[]) => {
    setCompanyLedgers(newLeds);
    db.saveCompanyLedgers(newLeds);
  };

  const saveSettingsState = (newSet: AppSettings) => {
    setSettings(newSet);
    db.saveSettings(newSet);
  };

  // --- CONTROLLERS ---
  
  // 1. Add Shop
  const handleAddShop = (shopData: Omit<Shop, 'id'>) => {
    const newId = `s${Date.now()}`;
    const newShop: Shop = { id: newId, ...shopData };
    const updatedShops = [...shops, newShop];
    saveShopsState(updatedShops);

    // If there was starting due, post to ledger
    if (shopData.due > 0) {
      const newLedger: CustomerLedger = {
        id: `l${Date.now()}`,
        customerId: newId,
        date: new Date().toISOString().split('T')[0],
        type: 'sales',
        amount: shopData.due,
        note: 'প্রারম্ভিক বকেয়া ব্যালেন্স'
      };
      saveLedgersState([...ledgers, newLedger]);
    }
  };

  // 2. Edit Shop
  const handleEditShop = (updatedShop: Shop) => {
    const updated = shops.map(s => s.id === updatedShop.id ? updatedShop : s);
    saveShopsState(updated);
  };

  // 3. Delete Shop
  const handleDeleteShop = (shopId: string) => {
    const updated = shops.filter(s => s.id !== shopId);
    saveShopsState(updated);
    // Remove ledger trails
    saveLedgersState(ledgers.filter(l => l.customerId !== shopId));
  };

  // 4. Accept payment transaction manually from customer
  const handleAcceptPayment = (customerId: string, amount: number, note: string, date: string) => {
    // 1. Decrement Shop outstanding due
    const updatedShops = shops.map(s => {
      if (s.id === customerId) {
        return { ...s, due: Math.max(s.due - amount, 0) };
      }
      return s;
    });
    saveShopsState(updatedShops);

    // 2. Append payment record to Ledger
    const newLedger: CustomerLedger = {
      id: `l${Date.now()}`,
      customerId,
      date,
      type: 'payment',
      amount,
      note: note || 'নগদ বকেয়া জমা'
    };
    saveLedgersState([newLedger, ...ledgers]);
  };

  // 5. Create integrated Market Visit Sales Invoice
  const handleCreateInvoice = (invoiceData: Omit<MarketVisitInvoice, 'id'>) => {
    const newId = `INV-${1000 + invoices.length + 1}`;
    const newInvoice: MarketVisitInvoice = { id: newId, ...invoiceData };
    
    // Save invoice
    saveInvoicesState([newInvoice, ...invoices]);

    // Track state modifications for batch updates
    let tempShops = [...shops];
    let tempLedgers = [...ledgers];
    let tempProducts = [...products];
    let tempLogs = [...inventoryLogs];

    // Post individual sales to each shop's ledger & decrement inventory stock levels
    invoiceData.entries.forEach(entry => {
      // Find shop to add dues
      tempShops = tempShops.map(s => {
        if (s.id === entry.customerId) {
          return { ...s, due: s.due + entry.dueAmount };
        }
        return s;
      });

      // Post transaction to Shop's due ledger
      const newLedgerEntry: CustomerLedger = {
        id: `l${Date.now()}-${entry.customerId}`,
        customerId: entry.customerId,
        date: invoiceData.date,
        type: 'sales',
        amount: entry.totalAmount,
        invoiceId: newId,
        note: `মার্কেট ভিজিট চালান (${newInvoice.marketName})`
      };
      tempLedgers.unshift(newLedgerEntry);

      // If they paid partially or fully, log the payment adjustment
      if (entry.paidAmount > 0) {
        const payLedgerEntry: CustomerLedger = {
          id: `l${Date.now()}-pay-${entry.customerId}`,
          customerId: entry.customerId,
          date: invoiceData.date,
          type: 'payment',
          amount: entry.paidAmount,
          invoiceId: newId,
          note: `চালান গ্রহণের সময় তাৎক্ষণিক পরিশোধ`
        };
        tempLedgers.unshift(payLedgerEntry);
      }

      // Decrement warehouse stock for sold products (including free bonus)
      entry.items.forEach(item => {
        const totalQty = item.quantity + (item.freeQuantity || 0);
        tempProducts = tempProducts.map(p => {
          if (p.id === item.productId) {
            return { ...p, stock: Math.max(p.stock - totalQty, 0) };
          }
          return p;
        });

        // Add inventory audit trail
        tempLogs.unshift({
          id: `iv-${Date.now()}-${item.productId}`,
          date: invoiceData.date,
          productId: item.productId,
          productName: item.productName,
          type: 'sale',
          quantity: totalQty,
          note: `চালান নং ${newId} (${entry.customerName})${item.freeQuantity ? ` (ফ্রি বোনাস: ${item.freeQuantity} পিস)` : ''}`
        });
      });
    });

    // Save batched modifications
    saveShopsState(tempShops);
    saveLedgersState(tempLedgers);
    saveProductsState(tempProducts);
    saveInventoryLogsState(tempLogs);
  };

  // 6. Products Addition & pricing adjustments
  const handleAddProduct = (prodData: Omit<Product, 'id'>) => {
    const newId = `p${Date.now()}`;
    const newProd: Product = { id: newId, ...prodData };
    saveProductsState([...products, newProd]);
  };

  const handleEditProduct = (updatedProd: Product) => {
    saveProductsState(products.map(p => p.id === updatedProd.id ? updatedProd : p));
  };

  // 7. Manual Inventory adjust (Stock In / Stock Out)
  const handleAdjustStock = (productId: string, type: 'stock_in' | 'stock_out', quantity: number, note: string, date: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    // Update stock count
    const updated = products.map(p => {
      if (p.id === productId) {
        const nextStock = type === 'stock_in' ? p.stock + quantity : Math.max(p.stock - quantity, 0);
        return { ...p, stock: nextStock };
      }
      return p;
    });
    saveProductsState(updated);

    // Save Audit log
    const newLog: InventoryLog = {
      id: `iv-${Date.now()}`,
      date,
      productId,
      productName: prod.name,
      type,
      quantity,
      note
    };
    saveInventoryLogsState([newLog, ...inventoryLogs]);
  };

  // 7a. Register Product Customer Return (গ্রাহক ফেরত)
  const handleRegisterCustomerReturn = (returnData: Omit<ProductReturn, 'id'>, adjustDue: boolean) => {
    const newId = `RET-${Date.now()}`;
    const newReturn: ProductReturn = { id: newId, ...returnData };
    saveReturnsState([newReturn, ...returns]);

    let tempProducts = [...products];
    let tempShops = [...shops];
    let tempLedgers = [...ledgers];
    let tempLogs = [...inventoryLogs];

    // If condition is "good", add back to active sellable stock
    if (returnData.type === 'good') {
      tempProducts = tempProducts.map(p => {
        if (p.id === returnData.productId) {
          return { ...p, stock: p.stock + returnData.quantity };
        }
        return p;
      });
    }

    // If user chose to adjust customer due
    if (adjustDue && returnData.refundAmount > 0) {
      tempShops = tempShops.map(s => {
        if (s.id === returnData.customerId) {
          return { ...s, due: Math.max(s.due - returnData.refundAmount, 0) };
        }
        return s;
      });

      // Append payment/credit note to Ledger
      tempLedgers.unshift({
        id: `l-ret-${Date.now()}`,
        customerId: returnData.customerId,
        date: returnData.date,
        type: 'payment',
        amount: returnData.refundAmount,
        note: `পণ্য ফেরত সমন্বয়: ${returnData.productName} (${returnData.quantity} পিস)`
      });
    }

    // Append to inventory logs
    tempLogs.unshift({
      id: `iv-ret-${Date.now()}`,
      date: returnData.date,
      productId: returnData.productId,
      productName: returnData.productName,
      type: 'customer_return',
      quantity: returnData.quantity,
      note: `কাস্টমার ফেরত (${returnData.customerName})${returnData.type === 'damaged' ? ' - নষ্ট পণ্য' : ''}`
    });

    saveProductsState(tempProducts);
    saveShopsState(tempShops);
    saveLedgersState(tempLedgers);
    saveInventoryLogsState(tempLogs);
  };

  // 7b. Register Distributor Return (ডিস্ট্রিবিউটর ফেরত)
  const handleRegisterDistributorReturn = (dReturnData: Omit<DistributorReturn, 'id'>) => {
    const newId = `DRET-${Date.now()}`;
    const newReturn: DistributorReturn = { id: newId, ...dReturnData };
    saveDistReturnsState([newReturn, ...distReturns]);

    // Reduce active stock
    const updatedProducts = products.map(p => {
      if (p.id === dReturnData.productId) {
        return { ...p, stock: Math.max(p.stock - dReturnData.quantity, 0) };
      }
      return p;
    });
    saveProductsState(updatedProducts);

    // Append to inventory logs
    const newLog: InventoryLog = {
      id: `iv-dret-${Date.now()}`,
      date: dReturnData.date,
      productId: dReturnData.productId,
      productName: dReturnData.productName,
      type: 'distributor_return',
      quantity: dReturnData.quantity,
      note: `ডিস্ট্রিবিউটর ফেরত (${dReturnData.supplierName})`
    };
    saveInventoryLogsState([newLog, ...inventoryLogs]);
  };

  // 7c. Register Damaged Stock (ড্যামেজ স্টক রাইট-অফ)
  const handleRegisterDamagedStock = (damagedData: Omit<DamagedStock, 'id'>) => {
    const newId = `DAM-${Date.now()}`;
    const newDamaged: DamagedStock = { id: newId, ...damagedData };
    saveDamagedStocksState([newDamaged, ...damagedStocks]);

    // Reduce active stock
    const updatedProducts = products.map(p => {
      if (p.id === damagedData.productId) {
        return { ...p, stock: Math.max(p.stock - damagedData.quantity, 0) };
      }
      return p;
    });
    saveProductsState(updatedProducts);

    // Append to inventory logs
    const newLog: InventoryLog = {
      id: `iv-dam-${Date.now()}`,
      date: damagedData.date,
      productId: damagedData.productId,
      productName: damagedData.productName,
      type: 'damaged',
      quantity: damagedData.quantity,
      note: `ড্যামেজ পণ্য সনাক্তকরণ (${damagedData.actionTaken === 'written_off' ? 'রাইট-অফ' : 'ফেরত প্রক্রিয়াধীন'})`
    };
    saveInventoryLogsState([newLog, ...inventoryLogs]);
  };

  // 8. Register Supplier Purchase Entry
  const handleRegisterPurchase = (purchaseData: Omit<PurchaseRecord, 'id'>) => {
    const newId = `PUR-${5000 + purchases.length + 1}`;
    const newPurchase: PurchaseRecord = { id: newId, ...purchaseData };
    savePurchasesState([newPurchase, ...purchases]);

    // Restock all purchased products in warehouse
    let tempProducts = [...products];
    let tempLogs = [...inventoryLogs];

    purchaseData.items.forEach(item => {
      tempProducts = tempProducts.map(p => {
        if (p.id === item.productId) {
          return { ...p, stock: p.stock + item.quantity };
        }
        return p;
      });

      tempLogs.unshift({
        id: `iv-p-${Date.now()}-${item.productId}`,
        date: purchaseData.date,
        productId: item.productId,
        productName: item.productName,
        type: 'purchase',
        quantity: item.quantity,
        note: `ক্রয় এন্ট্রি ${newId} (${purchaseData.supplierName})`
      });
    });

    saveProductsState(tempProducts);
    saveInventoryLogsState(tempLogs);
  };

  // --- Company Management Handlers ---
  const handleAddCompany = (companyData: Omit<Company, 'id'>) => {
    const newId = `c-${Date.now()}`;
    const newCompany: Company = { id: newId, ...companyData };
    saveCompaniesState([newCompany, ...companies]);

    if (companyData.openingDue > 0) {
      const openingEntry: CompanyLedgerEntry = {
        id: `cl-op-${Date.now()}`,
        companyId: newId,
        date: new Date().toISOString().split('T')[0],
        type: 'opening',
        amount: companyData.openingDue,
        note: 'প্রারম্ভিক বকেয়া দেনা'
      };
      saveCompanyLedgersState([openingEntry, ...companyLedgers]);
    }
  };

  const handleEditCompany = (updatedCompany: Company) => {
    const nextComp = companies.map(c => c.id === updatedCompany.id ? updatedCompany : c);
    saveCompaniesState(nextComp);
  };

  const handleDeleteCompany = (id: string) => {
    const nextComp = companies.filter(c => c.id !== id);
    saveCompaniesState(nextComp);

    const nextLeds = companyLedgers.filter(l => l.companyId !== id);
    saveCompanyLedgersState(nextLeds);

    const nextProducts = products.map(p => p.companyId === id ? { ...p, companyId: undefined } : p);
    saveProductsState(nextProducts);
  };

  const handleAddCompanyLedgerEntry = (entryData: Omit<CompanyLedgerEntry, 'id' | 'currentBalance' | 'previousDue'>) => {
    const newId = `cl-${Date.now()}`;
    const newEntry: CompanyLedgerEntry = { id: newId, ...entryData };
    saveCompanyLedgersState([newEntry, ...companyLedgers]);
  };

  const handleDeleteCompanyLedgerEntry = (id: string) => {
    const nextLeds = companyLedgers.filter(l => l.id !== id);
    saveCompanyLedgersState(nextLeds);
  };

  // 9. Register Hawlat record (Borrow/Return cash or products)
  const handleRegisterHawlat = (recordData: Omit<HawlatRecord, 'id'>) => {
    const newId = `h${Date.now()}`;
    const newHawlat: HawlatRecord = { id: newId, ...recordData };
    saveHawlatsState([newHawlat, ...hawlats]);

    // If borrowing/returning product on credit, adjust stock accordingly!
    if (recordData.productId && recordData.quantity) {
      let tempProducts = [...products];
      let tempLogs = [...inventoryLogs];

      tempProducts = tempProducts.map(p => {
        if (p.id === recordData.productId) {
          // Borrow product = Stock IN. Return product = Stock OUT.
          const isAdd = recordData.type === 'borrow_product';
          const nextStock = isAdd ? p.stock + recordData.quantity! : Math.max(p.stock - recordData.quantity!, 0);
          return { ...p, stock: nextStock };
        }
        return p;
      });

      tempLogs.unshift({
        id: `iv-h-${Date.now()}`,
        date: recordData.date,
        productId: recordData.productId,
        productName: recordData.productName!,
        type: recordData.type === 'borrow_product' ? 'stock_in' : 'stock_out',
        quantity: recordData.quantity,
        note: `হাওলাত লেজার সমন্বয়: ${recordData.note || ''}`
      });

      saveProductsState(tempProducts);
      saveInventoryLogsState(tempLogs);
    }
  };

  // Security App lock PIN handler
  const handlePinSubmit = (digit: string) => {
    if (!settings) return;
    const nextPin = pinInput + digit;
    setPinInput(nextPin);
    setPinError(false);

    if (nextPin.length === 4) {
      if (nextPin === settings.appLockPin) {
        setIsLocked(false);
        setPinInput('');
      } else {
        setPinError(true);
        setPinInput('');
        // Trigger vibration look
        setTimeout(() => setPinError(false), 500);
      }
    }
  };

  const handleFingerprintUnlockSim = () => {
    if (!settings?.isFingerprintEnabled) return;
    // Scan simulation
    setIsLocked(false);
  };

  // App Layout Renderer based on chosen screen
  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return (
          <Dashboard 
            shops={shops} 
            products={products} 
            invoices={invoices} 
            expenses={expenses} 
            companies={companies}
            companyLedgers={companyLedgers}
          />
        );
      case 'customers':
        return (
          <CustomerManagement 
            shops={shops} 
            ledgers={ledgers} 
            onAddShop={handleAddShop} 
            onEditShop={handleEditShop} 
            onDeleteShop={handleDeleteShop}
            onAcceptPayment={handleAcceptPayment}
          />
        );
      case 'products':
        return (
          <ProductManagement 
            products={products} 
            companies={companies}
            onAddProduct={handleAddProduct} 
            onEditProduct={handleEditProduct} 
          />
        );
      case 'company-management':
        return (
          <CompanyManagement
            companies={companies}
            companyLedgers={companyLedgers}
            products={products}
            onAddCompany={handleAddCompany}
            onEditCompany={handleEditCompany}
            onDeleteCompany={handleDeleteCompany}
            onAddLedgerEntry={handleAddCompanyLedgerEntry}
            onDeleteLedgerEntry={handleDeleteCompanyLedgerEntry}
          />
        );
      case 'sales':
        return (
          <SalesInvoice 
            shops={shops} 
            products={products} 
            invoices={invoices} 
            onCreateInvoice={handleCreateInvoice} 
          />
        );
      case 'hawlat':
        return (
          <DistributorManagement 
            products={products} 
            hawlats={hawlats} 
            onAddHawlat={handleRegisterHawlat} 
          />
        );
      case 'inventory':
        return (
          <InventoryManagement 
            products={products} 
            shops={shops}
            inventoryLogs={inventoryLogs} 
            onAdjustStock={handleAdjustStock} 
            returns={returns}
            distReturns={distReturns}
            damagedStocks={damagedStocks}
            onAddCustomerReturn={handleRegisterCustomerReturn}
            onAddDistributorReturn={handleRegisterDistributorReturn}
            onAddDamagedStock={handleRegisterDamagedStock}
          />
        );
      case 'purchase':
        return (
          <PurchaseManagement 
            products={products} 
            purchases={purchases} 
            onAddPurchase={handleRegisterPurchase} 
          />
        );
      case 'reports':
        return (
          <Reports 
            shops={shops} 
            products={products} 
            invoices={invoices} 
            expenses={expenses} 
            purchases={purchases} 
          />
        );
      case 'settings':
        return (
          <SettingsPage 
            settings={settings!} 
            onSaveSettings={saveSettingsState} 
            onExportDatabase={db.exportDatabase} 
            onImportDatabase={db.importDatabase} 
            onResetDatabase={db.resetToDefault} 
          />
        );
      default:
        return <Dashboard shops={shops} products={products} invoices={invoices} expenses={expenses} />;
    }
  };

  // Sidebar Menu list
  const menuItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'customers', label: 'দোকান ও কাস্টমার', icon: Users },
    { id: 'products', label: 'পণ্য তালিকা', icon: Box },
    { id: 'company-management', label: 'কোম্পানি ম্যানেজমেন্ট', icon: Building },
    { id: 'sales', label: 'বিক্রয় (মার্কেট ভিজিট)', icon: ShoppingBag },
    { id: 'hawlat', label: 'ডিস্ট্রিবিউটর হাওলাত', icon: Layers },
    { id: 'inventory', label: 'ইনভেন্টরি স্টক', icon: History },
    { id: 'purchase', label: 'ক্রয় এন্ট্রি (Purchase)', icon: BadgeCent },
    { id: 'reports', label: 'রিপোর্ট সমূহ', icon: FileBarChart },
    { id: 'settings', label: 'সেটিংস ও নিরাপত্তা', icon: Settings },
  ];

  const getScreenTitle = () => {
    return menuItems.find(item => item.id === activeScreen)?.label || 'ফ্রেন্ডস এন্টারপ্রাইজ';
  };

  if (!settings) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-sans text-xs relative overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-80 h-80 bg-blue-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-96 h-96 bg-purple-500 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
        <div className="text-center space-y-4 z-10 bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-xl">
          <RotateCcw className="w-8 h-8 animate-spin mx-auto text-blue-400" />
          <p className="text-sm font-semibold tracking-wide text-slate-200">ফ্রেন্ডস এন্টারপ্রাইজ ERP ডেটাবেস প্রস্তুত হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // APP LOCK PORTAL SCREEN
  if (isLocked) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] text-white flex flex-col justify-between items-center p-6 select-none relative overflow-hidden">
        {/* Abstract decorative background */}
        <div className="absolute top-[-100px] left-[-100px] w-80 h-80 bg-blue-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-96 h-96 bg-purple-500 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

        {/* Header Branding */}
        <div className="text-center z-10 pt-8 space-y-1.5">
          <div className="bg-blue-600/30 p-3.5 rounded-2xl inline-block shadow-lg border border-white/10 mb-3">
            <Smartphone className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">ফ্রেন্ডস এন্টারপ্রাইজ ইআরপি</h2>
          <p className="text-xs text-slate-300">প্রোপরাইটর: ফরহাদুল হক</p>
          <span className="inline-block bg-white/5 text-emerald-400 border border-white/10 text-[10px] px-2.5 py-0.5 rounded-full font-mono mt-2">
            ১০০% নিরাপদ অফলাইন ডেটাবেজ
          </span>
        </div>

        {/* PIN Entry Area */}
        <div className="w-full max-w-xs z-10 space-y-6 text-center bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              সিকিউর পিন প্রবেশ করান
            </h4>
            
            {/* Visual PIN dots indicators */}
            <div className={`flex justify-center gap-4 py-3 ${pinError ? 'animate-bounce text-rose-500' : ''}`}>
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-4.5 h-4.5 rounded-full border-2 transition-all ${
                    i < pinInput.length 
                      ? 'bg-blue-500 border-blue-400 shadow-[0_0_8px_#3b82f6]' 
                      : 'border-white/10 bg-slate-900/60'
                  }`}
                ></div>
              ))}
            </div>
            {pinError && <p className="text-[10px] text-rose-400 font-semibold">ভুল পিন কোড! পুনরায় চেষ্টা করুন।</p>}
          </div>

          {/* Numeric keypad key block */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                onClick={() => handlePinSubmit(num)}
                className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-lg font-bold font-mono transition-all active:scale-95 cursor-pointer text-white"
              >
                {num}
              </button>
            ))}
            
            {/* Clear button */}
            <button
              onClick={() => setPinInput('')}
              className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center text-slate-300"
            >
              মুছুন
            </button>

            {/* Zero digit */}
            <button
              onClick={() => handlePinSubmit('0')}
              className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-lg font-bold font-mono transition-all active:scale-95 cursor-pointer text-white"
            >
              0
            </button>

            {/* Fingerprint bypass if enabled */}
            <button
              onClick={handleFingerprintUnlockSim}
              disabled={!settings.isFingerprintEnabled}
              className={`py-3 rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
                settings.isFingerprintEnabled 
                  ? 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 text-emerald-400' 
                  : 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed'
              }`}
              title="ফিঙ্গারপ্রিন্ট আনলক"
            >
              <Fingerprint className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="z-10 pb-4 text-[9px] text-slate-400 font-sans text-center">
          <p>© {new Date().getFullYear()} Friends Enterprise. All Rights Reserved.</p>
          <p className="mt-0.5">সরাসরি ডেটা সুরক্ষিত করতে পিন ব্যবহার করুন (ডিফল্ট: ১২৩৪)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] flex items-center justify-center p-0 md:p-4 select-none font-sans relative overflow-hidden" id="app-workspace-root">
      {/* Decorative ambient glow circles */}
      <div className="absolute top-[-100px] left-[-100px] w-80 h-80 bg-blue-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-50px] right-[-50px] w-96 h-96 bg-purple-500 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
      
      {/* 
        This is the Android Tablet/Phone Simulator frame. 
        It gives the absolute high-fidelity vibe of a native Android ERP App!
        If fullscreen is enabled, it expands to fit the screen like a native Tablet application.
      */}
      <div className={`transition-all duration-500 bg-slate-950/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden flex flex-col border border-white/10 ${
        isFullscreen 
          ? 'w-full h-screen md:rounded-none border-none' 
          : 'w-[430px] h-[880px] rounded-[36px] border-[12px] border-slate-900'
      }`}>
        
        {/* ANDROID DEVICE TOP SENSORS & BAR (if not fullscreen) */}
        {!isFullscreen && (
          <div className="absolute top-0 inset-x-0 h-7 bg-slate-950/80 backdrop-blur-md z-50 px-6 flex justify-between items-center text-white text-[11px] font-mono select-none border-b border-white/5">
            {/* Real-time Bengali time clock */}
            <span>{timeStr || '১২:০০'}</span>
            
            {/* Camera notch cutout simulator */}
            <div className="w-24 h-4 bg-slate-950 rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0"></div>
            
            <div className="flex items-center gap-1.5 text-slate-300">
              <Wifi className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 rounded uppercase">অফলাইন</span>
              <Battery className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* SYSTEM APP NAV HEADER */}
        <header className={`bg-white/10 backdrop-blur-md border-b border-white/10 text-white flex justify-between items-center shrink-0 shadow-lg z-30 ${
          isFullscreen ? 'h-14 px-5' : 'h-14 pt-6 pb-2 px-4'
        }`}>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
              id="menu-drawer-trigger"
            >
              <Menu className="w-5 h-5 text-slate-200" />
            </button>
            <h1 className="font-bold text-xs tracking-tight truncate max-w-[200px] text-slate-100">{getScreenTitle()}</h1>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle Simulator Fullscreen/Frame viewport */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors text-white"
              title={isFullscreen ? 'ফোন ফ্রেম মুড' : 'ফুলস্ক্রিন মুড'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-slate-300" /> : <Maximize2 className="w-4 h-4 text-slate-300" />}
            </button>
            <span className="text-[10px] bg-blue-500/20 border border-blue-400/30 px-2.5 py-0.5 rounded-full font-bold text-blue-300">
              ফ্রেন্ডস
            </span>
          </div>
        </header>

        {/* SCREEN SCROLLABLE BODY CANVAS */}
        <main className="flex-1 overflow-y-auto bg-transparent p-4 pb-16 z-10 relative">
          {renderActiveScreen()}
        </main>

        {/* SLIDE-OUT ANDROID NAVIGATION DRAWER */}
        <AnimatePresence>
          {isDrawerOpen && (
            <div className="absolute inset-0 z-50 flex">
              {/* Overlay mask */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDrawerOpen(false)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              />

              {/* Drawer Container drawer panel */}
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="relative w-72 h-full bg-slate-900/95 backdrop-blur-2xl border-r border-white/10 flex flex-col z-10"
              >
                {/* Header Profile branding */}
                <div className="p-5 bg-gradient-to-br from-blue-600/30 to-purple-600/30 text-white space-y-1.5 relative overflow-hidden border-b border-white/10">
                  <div className="absolute right-0 bottom-0 opacity-10 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent w-24 h-24 pointer-events-none"></div>
                  
                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/20 inline-block">
                    <Smartphone className="w-6 h-6 text-blue-300" />
                  </div>
                  <h3 className="font-extrabold text-xs tracking-tight mt-2 text-slate-100">ফ্রেন্ডস এন্টারপ্রাইজ ইআরপি</h3>
                  <p className="text-[10px] text-slate-300">প্রোপরাইটর: ফরহাদুল হক</p>
                  
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="absolute right-4 top-4 text-white/80 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5 text-slate-300" />
                  </button>
                </div>

                {/* Scrolled list items */}
                <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1 text-xs">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeScreen;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveScreen(item.id);
                          setIsDrawerOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg font-bold text-left transition-colors cursor-pointer ${
                          isActive 
                            ? 'bg-white/15 text-white border border-white/10' 
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                        id={`nav-item-${item.id}`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sticky drawer bottom */}
                <div className="p-4 border-t border-white/10 text-[10px] text-slate-400 font-sans flex justify-between items-center bg-slate-950/50 shrink-0">
                  <span className="font-semibold text-slate-500">সংস্করণ v৩.৫ (অফলাইন)</span>
                  <button 
                    onClick={() => {
                      setIsLocked(true);
                      setIsDrawerOpen(false);
                    }}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5 font-bold cursor-pointer"
                    title="অ্যাপ লক করুন"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    লক করুন
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* BOTTOM NAVIGATION TAB BAR (For instant visual accessibility) */}
        <nav className="absolute bottom-0 inset-x-0 h-14 bg-slate-900/80 backdrop-blur-md border-t border-white/10 px-2 flex justify-around items-center z-30 shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeScreen;
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[9px] font-bold cursor-pointer transition-colors ${
                  isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 mb-1 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
