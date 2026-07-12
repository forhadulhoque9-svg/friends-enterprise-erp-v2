/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  due: number;
}

export interface CustomerLedger {
  id: string;
  customerId: string;
  date: string;
  type: 'sales' | 'payment';
  amount: number;
  invoiceId?: string;
  note?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number; // selling price per piece
  sellingPriceCarton: number; // selling price per carton
  piecesPerCarton: number; // e.g. 12, 24, 48
  stock: number; // total stock in pieces
  minStockAlert: number;
  companyId?: string;
}

export interface SalesItem {
  productId: string;
  productName: string;
  quantity: number; // total pieces calculated
  price: number; // price per piece used
  cartonsSold?: number; // cartons entered in sales entry
  piecesSold?: number; // pieces entered in sales entry
  piecesPerCarton?: number; // pieces per carton at time of sale
  freeQuantity?: number; // free pieces given as bonus
  freeCartons?: number; // free cartons entered
  freePieces?: number; // free pieces entered
}

export interface MarketVisitSalesEntry {
  customerId: string;
  customerName: string;
  items: SalesItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'due' | 'partial';
}

export interface MarketVisitInvoice {
  id: string;
  date: string;
  marketName: string;
  entries: MarketVisitSalesEntry[];
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
}

export interface HawlatRecord {
  id: string;
  date: string;
  type: 'borrow_cash' | 'borrow_product' | 'return_cash' | 'return_product';
  amount: number; // For cash borrow/return, or calculated product value
  productId?: string;
  productName?: string;
  quantity?: number;
  note?: string;
}

export interface InventoryLog {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: 'stock_in' | 'stock_out' | 'sale' | 'purchase' | 'customer_return' | 'distributor_return' | 'damaged';
  quantity: number;
  note?: string;
}

export interface ProductReturn {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  cartons?: number;
  pieces?: number;
  refundAmount: number;
  type: 'good' | 'damaged'; // returned as sellable good, or damaged
  note?: string;
}

export interface DistributorReturn {
  id: string;
  date: string;
  supplierName: string;
  productId: string;
  productName: string;
  quantity: number;
  cartons?: number;
  pieces?: number;
  value: number;
  note?: string;
}

export interface DamagedStock {
  id: string;
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  cartons?: number;
  pieces?: number;
  lossAmount: number;
  actionTaken: 'written_off' | 'returned_to_company' | 'pending';
  note?: string;
}

export interface PurchaseRecord {
  id: string;
  date: string;
  supplierName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  note?: string;
}

export interface AppSettings {
  appLockPin: string;
  isAppLockEnabled: boolean;
  isFingerprintEnabled: boolean;
  businessName: string;
  proprietorName: string;
}

export interface Company {
  id: string;
  name: string;
  openingDue: number;
  primaryTarget: number;
  secondaryTarget: number;
}

export interface CompanyLedgerEntry {
  id: string;
  companyId: string;
  date: string;
  type: 'opening' | 'payment' | 'goods_received' | 'damage_adj' | 'scheme_adj' | 'credit_note' | 'bonus_adj';
  previousDue?: number;
  amount: number;
  currentBalance?: number;
  note?: string;
}
