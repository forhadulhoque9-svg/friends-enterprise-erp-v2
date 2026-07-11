/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Coins, 
  Box, 
  Calendar, 
  X,
  TrendingDown,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Product, HawlatRecord } from '../types';

interface DistributorManagementProps {
  products: Product[];
  hawlats: HawlatRecord[];
  onAddHawlat: (record: Omit<HawlatRecord, 'id'>) => void;
}

export default function DistributorManagement({
  products,
  hawlats,
  onAddHawlat
}: DistributorManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [txType, setTxType] = useState<'borrow_cash' | 'borrow_product' | 'return_cash' | 'return_product'>('borrow_cash');

  // Form states
  const [amount, setAmount] = useState('');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('1');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculations: Net hawlat balance
  // Cash borrowed (+) vs cash returned (-)
  // Product borrowed value (+) vs product returned value (-)
  const totalBorrowedCash = hawlats.filter(h => h.type === 'borrow_cash').reduce((sum, h) => sum + h.amount, 0);
  const totalReturnedCash = hawlats.filter(h => h.type === 'return_cash').reduce((sum, h) => sum + h.amount, 0);
  const totalBorrowedProductsVal = hawlats.filter(h => h.type === 'borrow_product').reduce((sum, h) => sum + h.amount, 0);
  const totalReturnedProductsVal = hawlats.filter(h => h.type === 'return_product').reduce((sum, h) => sum + h.amount, 0);

  const netCashBalance = totalBorrowedCash - totalReturnedCash;
  const netProductBalance = totalBorrowedProductsVal - totalReturnedProductsVal;
  const netTotalHawlat = netCashBalance + netProductBalance;

  const formatTaka = (amount: number) => {
    return `৳${amount.toLocaleString('bn-BD')}`;
  };

  const toBengaliNumber = (num: number | string) => {
    const bDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bDigits[parseInt(digit, 10)]);
  };

  const getTypeText = (type: HawlatRecord['type']) => {
    switch (type) {
      case 'borrow_cash': return 'নগদ হাওলাত গ্রহণ (+)';
      case 'borrow_product': return 'পণ্য বাকিতে গ্রহণ (+)';
      case 'return_cash': return 'নগদ হাওলাত পরিশোধ (-)';
      case 'return_product': return 'বাকির পণ্য ফেরত প্রদান (-)';
    }
  };

  const getTypeStyle = (type: HawlatRecord['type']) => {
    if (type.startsWith('borrow')) {
      return 'bg-amber-50 text-amber-800 border-amber-100';
    } else {
      return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let calculatedAmount = parseFloat(amount) || 0;
    let selectedProd = products.find(p => p.id === productId);

    // If it's product based, calculate monetary value from product purchase price
    if (txType === 'borrow_product' || txType === 'return_product') {
      if (!productId) {
        alert('অনুগ্রহ করে পণ্য নির্বাচন করুন!');
        return;
      }
      const quantity = parseInt(qty) || 1;
      calculatedAmount = (selectedProd?.purchasePrice || 0) * quantity;
    } else {
      if (calculatedAmount <= 0) {
        alert('অনুগ্রহ করে টাকার পরিমাণ লিখুন!');
        return;
      }
    }

    onAddHawlat({
      date,
      type: txType,
      amount: calculatedAmount,
      productId: (txType === 'borrow_product' || txType === 'return_product') ? productId : undefined,
      productName: (txType === 'borrow_product' || txType === 'return_product') ? selectedProd?.name : undefined,
      quantity: (txType === 'borrow_product' || txType === 'return_product') ? parseInt(qty) : undefined,
      note
    });

    // Reset
    setAmount('');
    setProductId('');
    setQty('1');
    setNote('');
    setIsOpen(false);
  };

  return (
    <div className="space-y-6" id="hawlat-screen">
      
      {/* Financial Status Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Net Cash Borrowed */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">নগদ হাওলাত ব্যালেন্স</span>
            <p className="text-xl font-bold text-slate-800 mt-2">{formatTaka(netCashBalance)}</p>
            <p className="text-[10px] text-slate-400 mt-1">ধার: {formatTaka(totalBorrowedCash)} | পরিশোধ: {formatTaka(totalReturnedCash)}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Net Product Borrowed Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">পণ্য বাকি (Hawlat) ব্যালেন্স</span>
            <p className="text-xl font-bold text-slate-800 mt-2">{formatTaka(netProductBalance)}</p>
            <p className="text-[10px] text-slate-400 mt-1">গ্রহন: {formatTaka(totalBorrowedProductsVal)} | ফেরত: {formatTaka(totalReturnedProductsVal)}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Net Outstanding Balance (TOTAL) */}
        <div className="bg-slate-900 p-5 rounded-xl text-white flex items-center justify-between shadow-md">
          <div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded font-semibold uppercase tracking-wider">সর্বমোট বকেয়া হাওলাত দেনা</span>
            <p className="text-2xl font-bold text-amber-300 mt-2">{formatTaka(netTotalHawlat)}</p>
            <p className="text-[10px] text-slate-400 mt-1">ডিস্ট্রিবিউটর বরাবর আপনার নিট দেনা খতিয়ান</p>
          </div>
          <div className="p-3 bg-slate-800 text-amber-400 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Actions and Ledger logs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-xs">হাওলাত ও ক্রেডিট ডিস্ট্রিবিউটর লেজার</h3>
            <p className="text-[10px] text-slate-400">টাকা ধার গ্রহণ বা পরিশোধের দৈনিক হিসাব রেকর্ড</p>
          </div>
          <button
            onClick={() => {
              setTxType('borrow_cash');
              setIsOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer"
            id="btn-add-hawlat"
          >
            <Plus className="w-4 h-4" />
            হাওলাত এন্ট্রি করুন
          </button>
        </div>

        {/* Chronological Logs table */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">লেনদেন প্রকার</th>
                <th className="py-3 px-4">বিবরণ / মালামাল তথ্য</th>
                <th className="py-3 px-4 text-right">টাকা (মূল্যমান)</th>
                <th className="py-3 px-4 text-center">লেনদেন আইডি</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {hawlats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    কোনো হাওলাত বা ডিস্ট্রিবিউটর রেকর্ড নেই!
                  </td>
                </tr>
              ) : (
                [...hawlats]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition-colors" id={`hawlat-row-${h.id}`}>
                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {h.date}
                        </div>
                      </td>

                      {/* Type badge */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTypeStyle(h.type)}`}>
                          {h.type.startsWith('borrow') ? <ArrowUpRight className="w-3 h-3 text-amber-600" /> : <ArrowDownRight className="w-3 h-3 text-emerald-600" />}
                          {getTypeText(h.type)}
                        </span>
                      </td>

                      {/* Description / items */}
                      <td className="py-3 px-4 text-slate-700">
                        {h.productId ? (
                          <div className="space-y-0.5 font-sans">
                            <p className="font-semibold text-slate-800">{h.productName}</p>
                            <p className="text-[10px] text-slate-500">পরিমাণ: {toBengaliNumber(h.quantity || 0)} পিস (ক্রয় দর অনুযায়ী)</p>
                          </div>
                        ) : (
                          <span className="font-sans font-medium">নগদ তরল টাকার ধার হিসাব</span>
                        )}
                        {h.note && <p className="text-[10px] text-slate-400 italic mt-0.5 font-sans">মন্তব্য: {h.note}</p>}
                      </td>

                      {/* Amount */}
                      <td className={`py-3 px-4 text-right font-bold text-sm ${
                        h.type.startsWith('borrow') ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {h.type.startsWith('borrow') ? '+' : '-'}{formatTaka(h.amount)}
                      </td>

                      {/* ID */}
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        H-{toBengaliNumber(h.id.replace('h', ''))}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* POPUP MODAL FOR NEW RECORD */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 relative"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                হাওলাত (Hawlat) ও ক্রেডিট এন্ট্রি করুন
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                
                {/* Selector for Type */}
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">লেনদেনের ধরন</label>
                  <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                    <button
                      type="button"
                      onClick={() => setTxType('borrow_cash')}
                      className={`py-2 px-1.5 rounded-lg border font-bold cursor-pointer transition-colors ${
                        txType === 'borrow_cash' ? 'bg-amber-500 border-amber-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      নগদ ধার (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType('borrow_product')}
                      className={`py-2 px-1.5 rounded-lg border font-bold cursor-pointer transition-colors ${
                        txType === 'borrow_product' ? 'bg-amber-500 border-amber-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      পণ্য বাকি (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType('return_cash')}
                      className={`py-2 px-1.5 rounded-lg border font-bold cursor-pointer transition-colors ${
                        txType === 'return_cash' ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      নগদ পরিশোধ (-)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType('return_product')}
                      className={`py-2 px-1.5 rounded-lg border font-bold cursor-pointer transition-colors ${
                        txType === 'return_product' ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      পণ্য ফেরত (-)
                    </button>
                  </div>
                </div>

                {/* Date Input */}
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">তারিখ</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Conditional Fields: If Cash or Product */}
                {txType === 'borrow_cash' || txType === 'return_cash' ? (
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">নগদ টাকা (৳) <span className="text-rose-500">*</span></label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      placeholder="টাকার পরিমাণ লিখুন..."
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-sm"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block font-semibold text-slate-600 mb-1">পণ্য সিলেক্ট করুন</label>
                      <select
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                      >
                        <option value="">পণ্য নির্বাচন...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (ক্রয়: ৳{p.purchasePrice})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">পরিমাণ (পিস)</label>
                      <input 
                        type="number" 
                        min="1"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-center"
                      />
                    </div>
                  </div>
                )}

                {/* Notes Input */}
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">মন্তব্য</label>
                  <input 
                    type="text" 
                    placeholder="হাওলাতের উৎস বা বিশদ বিবরণ..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Submissions */}
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
                    হাওলাত দাখিল করুন
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
