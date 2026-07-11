/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Briefcase, 
  Coins, 
  CheckCircle, 
  X,
  TrendingUp,
  Truck,
  ArrowRight
} from 'lucide-react';
import { Product, PurchaseRecord } from '../types';

interface PurchaseManagementProps {
  products: Product[];
  purchases: PurchaseRecord[];
  onAddPurchase: (record: Omit<PurchaseRecord, 'id'>) => void;
}

export default function PurchaseManagement({
  products,
  purchases,
  onAddPurchase
}: PurchaseManagementProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Form states
  const [supplierName, setSupplierName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<{ productId: string; productName: string; quantity: number; price: number }[]>([]);
  const [paidAmount, setPaidAmount] = useState('');

  // Item line states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [lineQty, setLineQty] = useState('10');
  const [lineCost, setLineCost] = useState('');

  // Calculations
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const supplierDue = Math.max(totalAmount - (parseFloat(paidAmount) || 0), 0);
  const totalSupplierDue = purchases.reduce((sum, p) => sum + p.dueAmount, 0);

  const formatTaka = (amount: number) => {
    return `৳${amount.toLocaleString('bn-BD')}`;
  };

  const toBengaliNumber = (num: number | string) => {
    const bDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bDigits[parseInt(digit, 10)]);
  };

  const handleAddLine = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const qty = parseInt(lineQty) || 1;
    // Fallback cost to product purchasePrice if empty
    const cost = parseFloat(lineCost) || prod.purchasePrice;

    const existingIdx = items.findIndex(i => i.productId === selectedProductId);
    if (existingIdx > -1) {
      const updated = [...items];
      updated[existingIdx].quantity += qty;
      setItems(updated);
    } else {
      setItems([...items, {
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        price: cost
      }]);
    }

    // Reset line fields
    setSelectedProductId('');
    setLineQty('10');
    setLineCost('');
  };

  const handleRemoveLine = (prodId: string) => {
    setItems(items.filter(i => i.productId !== prodId));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('সাপ্লায়ারের নাম প্রবেশ করান!');
      return;
    }
    if (items.length === 0) {
      alert('ক্রয় চালানে কমপক্ষে ১টি আইটেম থাকতে হবে!');
      return;
    }

    const paidAmt = parseFloat(paidAmount) || 0;
    const dueAmt = Math.max(totalAmount - paidAmt, 0);

    onAddPurchase({
      date: purchaseDate,
      supplierName,
      items,
      totalAmount,
      paidAmount: paidAmt,
      dueAmount: dueAmt
    });

    // Reset
    setSupplierName('');
    setItems([]);
    setPaidAmount('');
    setIsOpen(false);
  };

  return (
    <div className="space-y-6" id="purchase-screen">
      
      {/* Supplier Due Header status bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500">মোট সাপ্লায়ার বকেয়া দেনা</h4>
            <p className="text-2xl font-bold text-rose-600 font-sans mt-1">{formatTaka(totalSupplierDue)}</p>
          </div>
        </div>

        <button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 font-bold shadow transition-colors cursor-pointer"
          id="btn-add-purchase"
        >
          <Plus className="w-4 h-4" />
          নতুন ক্যাশ/বকেয়া ক্রয় এন্ট্রি
        </button>
      </div>

      {/* Completed Purchases Table logs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 text-xs">সাপ্লায়ার ক্রয় খতিয়ান ও রশিদ তালিকা</h3>
          <p className="text-[10px] text-slate-400">পাইকারি ক্রয়ের বিল, নগদ পরিশোধ ও বকেয়ার বিবরণ</p>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">সাপ্লায়ার / কোম্পানী</th>
                <th className="py-3 px-4">ক্রয়কৃত মালামাল সমূহ</th>
                <th className="py-3 px-4 text-right">মোট বিল</th>
                <th className="py-3 px-4 text-right">পরিশোধ</th>
                <th className="py-3 px-4 text-right">বকেয়া</th>
                <th className="py-3 px-4 text-center">ক্রয় আইডি</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    কোনো পাইকারি ক্রয়ের রেকর্ড নেই!
                  </td>
                </tr>
              ) : (
                [...purchases]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors" id={`purchase-row-${p.id}`}>
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">{p.date}</td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{p.supplierName}</p>
                      </td>

                      {/* Items info */}
                      <td className="py-3.5 px-4 font-sans text-slate-600 text-[11px] max-w-[200px] truncate">
                        {p.items.map(i => `${i.productName} (${i.quantity} পিস)`).join(', ')}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatTaka(p.totalAmount)}</td>

                      {/* Paid */}
                      <td className="py-3.5 px-4 text-right text-emerald-600 font-semibold">{formatTaka(p.paidAmount)}</td>

                      {/* Supplier Due */}
                      <td className={`py-3.5 px-4 text-right font-bold ${
                        p.dueAmount > 0 ? 'text-rose-600' : 'text-slate-500'
                      }`}>
                        {p.dueAmount > 0 ? formatTaka(p.dueAmount) : 'পরিশোধিত'}
                      </td>

                      {/* Purchase ID */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                        P-{toBengaliNumber(p.id.replace('PUR-', ''))}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP FORM MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 relative"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                নতুন ক্রয় রশিদ (Purchase Restock) এন্ট্রি
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">সাপ্লায়ার / কোম্পানীর নাম <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="উদা: ইউনিলিভার বাংলাদেশ"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">তারিখ</label>
                    <input 
                      type="date" 
                      required
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Sub-form to Add line items */}
                <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-xl space-y-3">
                  <p className="font-bold text-indigo-600 text-[10px]">পণ্যের মজুদ তালিকা যুক্ত করুন</p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] text-slate-400 mb-0.5">পণ্য নির্বাচন</label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => {
                          setSelectedProductId(e.target.value);
                          const prod = products.find(p => p.id === e.target.value);
                          if (prod) setLineCost(prod.purchasePrice.toString());
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white"
                      >
                        <option value="">পণ্য নির্বাচন...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (৳{p.purchasePrice})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 mb-0.5">পরিমাণ (পিস)</label>
                      <input 
                        type="number" 
                        min="1"
                        value={lineQty}
                        onChange={(e) => setLineQty(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 mb-0.5">ক্রয় দর (৳)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="৳ দর"
                        value={lineCost}
                        onChange={(e) => setLineCost(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded text-center font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold py-1.5 px-3 rounded border border-indigo-200 cursor-pointer"
                    >
                      আইটেম যুক্ত করুন (+)
                    </button>
                  </div>
                </div>

                {/* Added lines items */}
                {items.length > 0 && (
                  <div className="border border-slate-200 rounded-lg p-3 bg-white divide-y divide-slate-100 max-h-32 overflow-y-auto space-y-1">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1">
                        <span className="font-medium text-slate-800">{item.productName}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-500 text-[10px]">{item.price} ৳ × {item.quantity} পিস</span>
                          <span className="font-bold font-mono">৳{item.price * item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveLine(item.productId)}
                            className="text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subtotal & Paid field */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-slate-800">মোট ক্রয় মূল্য: {formatTaka(totalAmount)}</p>
                    <p className="text-[10px] text-rose-600 font-semibold">সাপ্লায়ার বকেয়া দেনা: {formatTaka(supplierDue)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-600">আজ নগদ পরিশোধ: ৳</label>
                    <input 
                      type="number" 
                      min="0"
                      max={totalAmount}
                      placeholder="৳০"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-24 p-2 border border-slate-200 rounded focus:outline-none font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
                  >
                    ক্রয় রেকর্ড সম্পন্ন করুন
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
