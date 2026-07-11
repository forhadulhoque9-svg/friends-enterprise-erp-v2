/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  AlertTriangle, 
  PackageCheck, 
  History, 
  Box, 
  RotateCcw, 
  UserCheck, 
  Layers, 
  Trash2, 
  HelpCircle,
  TrendingDown,
  FileSpreadsheet
} from 'lucide-react';
import { Product, InventoryLog, Shop, ProductReturn, DistributorReturn, DamagedStock } from '../types';

interface InventoryManagementProps {
  products: Product[];
  shops: Shop[];
  inventoryLogs: InventoryLog[];
  returns: ProductReturn[];
  distReturns: DistributorReturn[];
  damagedStocks: DamagedStock[];
  onAdjustStock: (productId: string, type: 'stock_in' | 'stock_out', quantity: number, note: string, date: string) => void;
  onAddCustomerReturn: (returnData: Omit<ProductReturn, 'id'>, adjustDue: boolean) => void;
  onAddDistributorReturn: (dReturnData: Omit<DistributorReturn, 'id'>) => void;
  onAddDamagedStock: (damagedData: Omit<DamagedStock, 'id'>) => void;
}

type SubTab = 'adjust' | 'customer_return' | 'distributor_return' | 'damaged';

export default function InventoryManagement({
  products,
  shops,
  inventoryLogs,
  returns,
  distReturns,
  damagedStocks,
  onAdjustStock,
  onAddCustomerReturn,
  onAddDistributorReturn,
  onAddDamagedStock
}: InventoryManagementProps) {
  // Navigation tabs inside Inventory Management
  const [activeTab, setActiveTab] = useState<SubTab>('adjust');

  // Common UI helper
  const toBengaliNumber = (num: number) => {
    const bDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bDigits[parseInt(digit, 10)]);
  };

  const formatTaka = (amount: number) => {
    return `৳${amount.toLocaleString('bn-BD')}`;
  };

  // ================= TAB 1: STOCK ADJUSTMENT STATE & SUBMIT =================
  const [adjProductId, setAdjProductId] = useState('');
  const [adjType, setAdjType] = useState<'stock_in' | 'stock_out'>('stock_in');
  const [adjCartons, setAdjCartons] = useState('0');
  const [adjPieces, setAdjPieces] = useState('0');
  const [adjNote, setAdjNote] = useState('');
  const [adjDate, setAdjDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProductId) {
      alert('অনুগ্রহ করে পণ্য নির্বাচন করুন!');
      return;
    }
    const prod = products.find(p => p.id === adjProductId);
    if (!prod) return;

    const cartons = parseInt(adjCartons) || 0;
    const pieces = parseInt(adjPieces) || 0;
    const pCarton = prod.piecesPerCarton || 24;
    const totalQty = (cartons * pCarton) + pieces;

    if (totalQty <= 0) {
      alert('অনুগ্রহ করে পরিমাণ (কার্টুন বা পিস) প্রবেশ করান!');
      return;
    }

    if (adjType === 'stock_out' && prod.stock < totalQty) {
      alert(`দুঃখিত! স্টক আউটের পরিমাণ বর্তমান মজুদের চেয়ে বেশি হতে পারবে না। বর্তমান মজুদ: ${toBengaliNumber(prod.stock)} পিস।`);
      return;
    }

    const noteText = adjNote || (adjType === 'stock_in' ? 'ম্যানুয়াল স্টক ইন' : 'ম্যানুয়াল স্টক আউট');
    onAdjustStock(adjProductId, adjType, totalQty, `${noteText} (${toBengaliNumber(cartons)} কা, ${toBengaliNumber(pieces)} পি)`, adjDate);

    // Reset
    setAdjProductId('');
    setAdjCartons('0');
    setAdjPieces('0');
    setAdjNote('');
    alert('স্টক সফলভাবে সংশোধন করা হয়েছে!');
  };

  // ================= TAB 2: CUSTOMER RETURN STATE & SUBMIT =================
  const [retCustomerId, setRetCustomerId] = useState('');
  const [retProductId, setRetProductId] = useState('');
  const [retCartons, setRetCartons] = useState('0');
  const [retPieces, setRetPieces] = useState('0');
  const [retRefund, setRetRefund] = useState('');
  const [retType, setRetType] = useState<'good' | 'damaged'>('good');
  const [retAdjustDue, setRetAdjustDue] = useState(true);
  const [retNote, setRetNote] = useState('');
  const [retDate, setRetDate] = useState(new Date().toISOString().split('T')[0]);

  // Auto-calculate suggested refund on product/qty change
  const selectedRetProduct = products.find(p => p.id === retProductId);
  const selectedRetShop = shops.find(s => s.id === retCustomerId);

  const calculatedRetPieces = selectedRetProduct 
    ? ((parseInt(retCartons) || 0) * (selectedRetProduct.piecesPerCarton || 24)) + (parseInt(retPieces) || 0)
    : 0;

  const suggestedRefund = selectedRetProduct 
    ? ((parseInt(retCartons) || 0) * (selectedRetProduct.sellingPriceCarton || (selectedRetProduct.sellingPrice * (selectedRetProduct.piecesPerCarton || 24)))) + ((parseInt(retPieces) || 0) * selectedRetProduct.sellingPrice)
    : 0;

  const handleCustomerReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retCustomerId || !retProductId) {
      alert('অনুগ্রহ করে কাস্টমার ও পণ্য সিলেক্ট করুন!');
      return;
    }
    if (calculatedRetPieces <= 0) {
      alert('ফেরতের পরিমাণ প্রবেশ করান!');
      return;
    }

    const refund = parseFloat(retRefund) !== undefined && retRefund !== '' ? parseFloat(retRefund) : suggestedRefund;

    onAddCustomerReturn({
      date: retDate,
      customerId: retCustomerId,
      customerName: selectedRetShop?.name || 'অজানা কাস্টমার',
      productId: retProductId,
      productName: selectedRetProduct?.name || 'অজানা পণ্য',
      quantity: calculatedRetPieces,
      cartons: parseInt(retCartons) || 0,
      pieces: parseInt(retPieces) || 0,
      refundAmount: refund,
      type: retType,
      note: retNote
    }, retAdjustDue);

    // Reset Form
    setRetCustomerId('');
    setRetProductId('');
    setRetCartons('0');
    setRetPieces('0');
    setRetRefund('');
    setRetNote('');
    alert('কাস্টমার ফেরত এন্ট্রি সফলভাবে সম্পন্ন হয়েছে!');
  };

  // ================= TAB 3: DISTRIBUTOR RETURN STATE & SUBMIT =================
  const [distSupplier, setDistSupplier] = useState('');
  const [distProductId, setDistProductId] = useState('');
  const [distCartons, setDistCartons] = useState('0');
  const [distPieces, setDistPieces] = useState('0');
  const [distValue, setDistValue] = useState('');
  const [distNote, setDistNote] = useState('');
  const [distDate, setDistDate] = useState(new Date().toISOString().split('T')[0]);

  const selectedDistProduct = products.find(p => p.id === distProductId);
  const calculatedDistPieces = selectedDistProduct 
    ? ((parseInt(distCartons) || 0) * (selectedDistProduct.piecesPerCarton || 24)) + (parseInt(distPieces) || 0)
    : 0;

  const suggestedDistValue = selectedDistProduct 
    ? calculatedDistPieces * selectedDistProduct.purchasePrice
    : 0;

  const handleDistributorReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distSupplier || !distProductId) {
      alert('সাপ্লাইয়ার এবং পণ্য নির্বাচন করুন!');
      return;
    }
    if (calculatedDistPieces <= 0) {
      alert('ফেরতকৃত পণ্যের পরিমাণ প্রবেশ করান!');
      return;
    }
    if (selectedDistProduct && selectedDistProduct.stock < calculatedDistPieces) {
      alert(`দুঃখিত! ডিস্ট্রিবিউটর ফেরতের পরিমাণ স্টক মজুদের চেয়ে বেশি হতে পারবে না। বর্তমান মজুদ: ${toBengaliNumber(selectedDistProduct.stock)} পিস।`);
      return;
    }

    const value = parseFloat(distValue) !== undefined && distValue !== '' ? parseFloat(distValue) : suggestedDistValue;

    onAddDistributorReturn({
      date: distDate,
      supplierName: distSupplier,
      productId: distProductId,
      productName: selectedDistProduct?.name || '',
      quantity: calculatedDistPieces,
      cartons: parseInt(distCartons) || 0,
      pieces: parseInt(distPieces) || 0,
      value,
      note: distNote
    });

    setDistSupplier('');
    setDistProductId('');
    setDistCartons('0');
    setDistPieces('0');
    setDistValue('');
    setDistNote('');
    alert('কোম্পানি ফেরত এন্ট্রি সফল হয়েছে এবং স্টক কমানো হয়েছে!');
  };

  // ================= TAB 4: DAMAGED STOCK STATE & SUBMIT =================
  const [damProductId, setDamProductId] = useState('');
  const [damCartons, setDamCartons] = useState('0');
  const [damPieces, setDamPieces] = useState('0');
  const [damLoss, setDamLoss] = useState('');
  const [damAction, setDamAction] = useState<'written_off' | 'returned_to_company' | 'pending'>('written_off');
  const [damNote, setDamNote] = useState('');
  const [damDate, setDamDate] = useState(new Date().toISOString().split('T')[0]);

  const selectedDamProduct = products.find(p => p.id === damProductId);
  const calculatedDamPieces = selectedDamProduct 
    ? ((parseInt(damCartons) || 0) * (selectedDamProduct.piecesPerCarton || 24)) + (parseInt(damPieces) || 0)
    : 0;

  const suggestedDamLoss = selectedDamProduct 
    ? calculatedDamPieces * selectedDamProduct.purchasePrice
    : 0;

  const handleDamagedStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!damProductId) {
      alert('পণ্য নির্বাচন করুন!');
      return;
    }
    if (calculatedDamPieces <= 0) {
      alert('ড্যামেজ পণ্যের সংখ্যা দিন!');
      return;
    }
    if (selectedDamProduct && selectedDamProduct.stock < calculatedDamPieces) {
      alert(`দুঃখিত! ড্যামেজ রাইট-অফের পরিমাণ স্টক মজুদের চেয়ে বেশি হতে পারবে না। বর্তমান মজুদ: ${toBengaliNumber(selectedDamProduct.stock)} পিস।`);
      return;
    }

    const loss = parseFloat(damLoss) !== undefined && damLoss !== '' ? parseFloat(damLoss) : suggestedDamLoss;

    onAddDamagedStock({
      date: damDate,
      productId: damProductId,
      productName: selectedDamProduct?.name || '',
      quantity: calculatedDamPieces,
      cartons: parseInt(damCartons) || 0,
      pieces: parseInt(damPieces) || 0,
      lossAmount: loss,
      actionTaken: damAction,
      note: damNote
    });

    setDamProductId('');
    setDamCartons('0');
    setDamPieces('0');
    setDamLoss('');
    setDamNote('');
    alert('ড্যামেজ পণ্য এন্ট্রি সম্পন্ন হয়েছে এবং স্টক থেকে বাদ দেয়া হয়েছে!');
  };

  // Stats calculation
  const lowStockItems = products.filter(p => p.stock <= p.minStockAlert);

  return (
    <div className="space-y-6" id="inventory-screen">
      
      {/* 4 main tabs header */}
      <div className="flex border-b border-slate-200 bg-white/80 backdrop-blur-md rounded-2xl p-1.5 shadow-sm overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('adjust')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'adjust'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          স্টক সংশোধন
        </button>
        <button
          onClick={() => setActiveTab('customer_return')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'customer_return'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          কাস্টমার ফেরত
        </button>
        <button
          onClick={() => setActiveTab('distributor_return')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'distributor_return'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          কোম্পানি ফেরত
        </button>
        <button
          onClick={() => setActiveTab('damaged')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'damaged'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          ড্যামেজ পণ্য
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side forms based on active tab */}
        <div className="lg:col-span-5 bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-md">
          
          {activeTab === 'adjust' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-800 text-sm">ইনভেন্টরি পণ্য মজুদ সংশোধন</h4>
                <p className="text-[10px] text-slate-400">ম্যানুয়ালি পণ্য স্টক ইন বা স্টক আউট করুন</p>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">পণ্য নির্বাচন <span className="text-rose-500">*</span></label>
                  <select
                    value={adjProductId}
                    onChange={(e) => setAdjProductId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="">পণ্য সিলেক্ট করুন...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (বর্তমান: {toBengaliNumber(p.stock)} পিস)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">সংশোধন প্রকার</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjType('stock_in')}
                      className={`flex-1 py-2 rounded-lg border font-bold flex items-center justify-center gap-1 cursor-pointer text-xs ${
                        adjType === 'stock_in' 
                          ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      স্টক ইন (Stock In)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjType('stock_out')}
                      className={`flex-1 py-2 rounded-lg border font-bold flex items-center justify-center gap-1 cursor-pointer text-xs ${
                        adjType === 'stock_out' 
                          ? 'bg-rose-600 border-rose-700 text-white shadow-sm' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                      স্টক আউট (Stock Out)
                    </button>
                  </div>
                </div>

                {/* Carton + Pieces support */}
                {adjProductId && (
                  (() => {
                    const prod = products.find(p => p.id === adjProductId);
                    return prod ? (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2.5">
                        <p className="text-[10px] text-slate-500 font-bold">মজুদ প্যাকিং হিসাব (১ কার্টুন = {toBengaliNumber(prod.piecesPerCarton)} পিস)</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">কার্টুন পরিমাণ</label>
                            <input 
                              type="number" 
                              min="0"
                              value={adjCartons}
                              onChange={(e) => setAdjCartons(e.target.value)}
                              className="w-full p-2 border border-slate-200 rounded font-mono text-center text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">খুচরা পিস</label>
                            <input 
                              type="number" 
                              min="0"
                              value={adjPieces}
                              onChange={(e) => setAdjPieces(e.target.value)}
                              className="w-full p-2 border border-slate-200 rounded font-mono text-center text-xs"
                            />
                          </div>
                        </div>
                        {(() => {
                          const total = ((parseInt(adjCartons) || 0) * prod.piecesPerCarton) + (parseInt(adjPieces) || 0);
                          return (
                            <p className="text-[11px] text-indigo-600 font-bold text-right">
                              মোট সংশোধন পিস: {toBengaliNumber(total)} পিস
                            </p>
                          );
                        })()}
                      </div>
                    ) : null;
                  })()
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-600 mb-1">তারিখ</label>
                    <input 
                      type="date" 
                      required
                      value={adjDate}
                      onChange={(e) => setAdjDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">সংশোধনের বিবরণ / নোট</label>
                  <input 
                    type="text" 
                    placeholder="উদা: গুদাম অডিট সমন্বয়"
                    value={adjNote}
                    onChange={(e) => setAdjNote(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                >
                  স্টক আপডেট নিশ্চিত করুন
                </button>
              </form>
            </div>
          )}

          {activeTab === 'customer_return' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-800 text-sm">গ্রাহক পণ্য ফেরত (Product Return)</h4>
                <p className="text-[10px] text-slate-400">কাস্টমার হতে বিক্রি হওয়া মাল ফেরত নিয়ে সমন্বয় করুন</p>
              </div>

              <form onSubmit={handleCustomerReturnSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">কাস্টমার / দোকান <span className="text-rose-500">*</span></label>
                  <select
                    value={retCustomerId}
                    onChange={(e) => setRetCustomerId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">দোকান সিলেক্ট করুন...</option>
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (বকেয়া: ৳{s.due})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">পণ্য <span className="text-rose-500">*</span></label>
                  <select
                    value={retProductId}
                    onChange={(e) => {
                      setRetProductId(e.target.value);
                      setRetCartons('0');
                      setRetPieces('0');
                      setRetRefund('');
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">পণ্য সিলেক্ট করুন...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {selectedRetProduct && (
                  <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 space-y-3">
                    <p className="text-[10px] text-indigo-700 font-bold">ফেরত পরিমাণ হিসাব (১ কার্টুন = {toBengaliNumber(selectedRetProduct.piecesPerCarton || 24)} পিস)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">কার্টুন ফেরত</label>
                        <input 
                          type="number" 
                          min="0"
                          value={retCartons}
                          onChange={(e) => setRetCartons(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded font-mono text-center text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">পিস ফেরত</label>
                        <input 
                          type="number" 
                          min="0"
                          value={retPieces}
                          onChange={(e) => setRetPieces(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded font-mono text-center text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-600 font-medium">
                      মোট ফেরত: <span className="font-bold text-slate-800">{toBengaliNumber(calculatedRetPieces)}</span> পিস | আনুমানিক মূল্য: <span className="font-bold text-indigo-600">৳{suggestedRefund}</span>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1 font-bold">ফেরত রিফান্ড / ক্রেডিট টাকা (ফাঁকা রাখলে অটো হিসাব হবে)</label>
                      <input 
                        type="number" 
                        placeholder={suggestedRefund.toString()}
                        value={retRefund}
                        onChange={(e) => setRetRefund(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded font-mono text-xs bg-white"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">ফেরত পণ্যের অবস্থা</label>
                    <select
                      value={retType}
                      onChange={(e) => setRetType(e.target.value as 'good' | 'damaged')}
                      className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                    >
                      <option value="good">ভালো পণ্য (মজুদ বাড়বে)</option>
                      <option value="damaged">নষ্ট পণ্য (মজুদ বাড়বে না)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">তারিখ</label>
                    <input 
                      type="date"
                      value={retDate}
                      onChange={(e) => setRetDate(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded border border-slate-200/50">
                  <input 
                    type="checkbox"
                    id="adjustDueCheck"
                    checked={retAdjustDue}
                    onChange={(e) => setRetAdjustDue(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="adjustDueCheck" className="text-[10px] text-slate-600 font-bold cursor-pointer">
                    দোকানের বকেয়া খতিয়ান থেকে এই ফেরত মূল্য মাইনাস করুন
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">ফেরতের কারণ / নোট</label>
                  <input 
                    type="text" 
                    placeholder="উদা: মেয়াদ উত্তীর্ণ পণ্য"
                    value={retNote}
                    onChange={(e) => setRetNote(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
                >
                  গ্রাহক ফেরত জমা করুন
                </button>
              </form>
            </div>
          )}

          {activeTab === 'distributor_return' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-800 text-sm">কোম্পানি / ডিস্ট্রিবিউটর ফেরত (Distributor Return)</h4>
                <p className="text-[10px] text-slate-400">কোম্পানিতে পণ্য ফেরত পাঠিয়ে স্টক সমন্বয় ও রিফান্ড ক্রেডিট এন্ট্রি করুন</p>
              </div>

              <form onSubmit={handleDistributorReturnSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">সাপ্লাইয়ার / কোম্পানি নাম <span className="text-rose-500">*</span></label>
                  <input 
                    type="text"
                    required
                    placeholder="উদা: ইউনিলিভার / আকিজ গ্রুপ"
                    value={distSupplier}
                    onChange={(e) => setDistSupplier(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">ফেরতযোগ্য পণ্য <span className="text-rose-500">*</span></label>
                  <select
                    value={distProductId}
                    onChange={(e) => {
                      setDistProductId(e.target.value);
                      setDistCartons('0');
                      setDistPieces('0');
                      setDistValue('');
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">পণ্য নির্বাচন করুন...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (স্টক: {toBengaliNumber(p.stock)} পিস)</option>
                    ))}
                  </select>
                </div>

                {selectedDistProduct && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                    <p className="text-[10px] text-slate-500 font-bold">ফেরত পরিমাণ হিসাব (১ কার্টুন = {toBengaliNumber(selectedDistProduct.piecesPerCarton || 24)} পিস)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">কার্টুন ফেরত</label>
                        <input 
                          type="number" 
                          min="0"
                          value={distCartons}
                          onChange={(e) => setDistCartons(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded font-mono text-center text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">পিস ফেরত</label>
                        <input 
                          type="number" 
                          min="0"
                          value={distPieces}
                          onChange={(e) => setDistPieces(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded font-mono text-center text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-600 font-medium">
                      মোট ফেরত: <span className="font-bold text-slate-800">{toBengaliNumber(calculatedDistPieces)}</span> পিস | আনুমানিক ক্রয়মূল্য: <span className="font-bold text-indigo-600">৳{suggestedDistValue}</span>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-bold">কোম্পানি ফেরত ক্রেডিট মূল্য (৳)</label>
                      <input 
                        type="number" 
                        placeholder={suggestedDistValue.toString()}
                        value={distValue}
                        onChange={(e) => setDistValue(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded font-mono text-xs bg-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">তারিখ</label>
                  <input 
                    type="date"
                    value={distDate}
                    onChange={(e) => setDistDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">ফেরত নোট / মেমো নম্বর</label>
                  <input 
                    type="text" 
                    placeholder="মেমো নং বা ফেরতের কারণ"
                    value={distNote}
                    onChange={(e) => setDistNote(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs"
                >
                  কোম্পানি ফেরত নিশ্চিত করুন (স্টক কমবে)
                </button>
              </form>
            </div>
          )}

          {activeTab === 'damaged' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-800 text-sm">ড্যামেজ পণ্য রাইট-অফ (Damaged Stock)</h4>
                <p className="text-[10px] text-slate-400">নষ্ট বা ড্যামেজ হওয়া পণ্য স্টক থেকে বাদ দিয়ে ক্ষতির অংক হিসাব করুন</p>
              </div>

              <form onSubmit={handleDamagedStockSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">ড্যামেজ পণ্য নির্বাচন <span className="text-rose-500">*</span></label>
                  <select
                    value={damProductId}
                    onChange={(e) => {
                      setDamProductId(e.target.value);
                      setAdjCartons('0');
                      setAdjPieces('0');
                      setDamLoss('');
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">পণ্য নির্বাচন করুন...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (স্টক: {toBengaliNumber(p.stock)} পিস)</option>
                    ))}
                  </select>
                </div>

                {selectedDamProduct && (
                  <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-100 space-y-3">
                    <p className="text-[10px] text-rose-700 font-bold">ড্যামেজ পরিমাণ হিসাব (১ কার্টুন = {toBengaliNumber(selectedDamProduct.piecesPerCarton || 24)} পিস)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">কার্টুন ড্যামেজ</label>
                        <input 
                          type="number" 
                          min="0"
                          value={damCartons}
                          onChange={(e) => setDamCartons(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded font-mono text-center text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">পিস ড্যামেজ</label>
                        <input 
                          type="number" 
                          min="0"
                          value={damPieces}
                          onChange={(e) => setDamPieces(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded font-mono text-center text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-600 font-medium">
                      মোট ড্যামেজ: <span className="font-bold text-slate-800">{toBengaliNumber(calculatedDamPieces)}</span> পিস | লোকসান মূল্য: <span className="font-bold text-rose-600">৳{suggestedDamLoss}</span>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1 font-bold">ক্ষতির অংক বা লোকসান মূল্য (৳)</label>
                      <input 
                        type="number" 
                        placeholder={suggestedDamLoss.toString()}
                        value={damLoss}
                        onChange={(e) => setDamLoss(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded font-mono text-xs bg-white"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">গৃহীত পদক্ষেপ</label>
                    <select
                      value={damAction}
                      onChange={(e) => setDamAction(e.target.value as any)}
                      className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                    >
                      <option value="written_off">রাইট-অফ (সম্পূর্ণ লোকসান)</option>
                      <option value="returned_to_company">কোম্পানি ফেরত প্রক্রিয়াধীন</option>
                      <option value="pending">সিদ্ধান্তের অপেক্ষায়</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">তারিখ</label>
                    <input 
                      type="date"
                      value={damDate}
                      onChange={(e) => setDamDate(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">ড্যামেজ নোট / ক্ষতি বিবরণ</label>
                  <input 
                    type="text" 
                    placeholder="উদা: ইঁদুর কেটে নষ্ট করেছে / পরিবহনে ক্ষতি"
                    value={damNote}
                    onChange={(e) => setDamNote(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs"
                >
                  ড্যামেজ পণ্য স্টক থেকে বাদ দিন
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Right side: Complete audit log history OR active tab report list */}
        <div className="lg:col-span-7 bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-md flex flex-col h-[600px] overflow-hidden">
          
          {/* Header indicator */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-slate-800 text-sm">
                {activeTab === 'adjust' && 'স্টক ফ্লো অডিট লেজার'}
                {activeTab === 'customer_return' && 'গ্রাহক ফেরত ইতিহাস'}
                {activeTab === 'distributor_return' && 'কোম্পানি ফেরত ইতিহাস'}
                {activeTab === 'damaged' && 'ড্যামেজ পণ্য খতিয়ান'}
              </h4>
            </div>
            
            {lowStockItems.length > 0 && activeTab === 'adjust' && (
              <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px] animate-pulse">
                {toBengaliNumber(lowStockItems.length)} টি কম স্টক
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 text-xs pr-1">
            
            {activeTab === 'adjust' && (
              inventoryLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400">কোনো সমন্বয় বা বিক্রয় ইতিহাস নেই।</div>
              ) : (
                [...inventoryLogs]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-xl border flex justify-between items-center transition-all hover:bg-slate-50/50 ${
                        log.type === 'stock_in' || log.type === 'purchase' || log.type === 'customer_return'
                          ? 'bg-emerald-50/30 border-emerald-100'
                          : 'bg-rose-50/30 border-rose-100'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            log.type === 'stock_in' || log.type === 'purchase' || log.type === 'customer_return' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}></span>
                          <span className="font-bold text-slate-800">{log.productName}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          বিবরণ: {log.note || 'সাধারণ মজুদ সমন্বয়'}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono">তারিখ: {log.date}</p>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-bold font-mono ${
                          log.type === 'stock_in' || log.type === 'purchase' || log.type === 'customer_return' ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {log.type === 'stock_in' || log.type === 'purchase' || log.type === 'customer_return' ? '+' : '-'}{toBengaliNumber(log.quantity)} পিস
                        </span>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                          {log.type === 'sale' ? 'বিক্রয় চালান' : 
                           log.type === 'purchase' ? 'ক্রয় এন্ট্রি' : 
                           log.type === 'customer_return' ? 'গ্রাহক ফেরত' :
                           log.type === 'distributor_return' ? 'কোম্পানি ফেরত' :
                           log.type === 'damaged' ? 'ড্যামেজ' :
                           log.type === 'stock_in' ? 'স্টক ইন' : 'স্টক আউট'}
                        </p>
                      </div>
                    </div>
                  ))
              )
            )}

            {activeTab === 'customer_return' && (
              returns.length === 0 ? (
                <div className="py-12 text-center text-slate-400">কোনো গ্রাহক ফেরত তালিকা পাওয়া যায়নি।</div>
              ) : (
                [...returns]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((ret) => (
                    <div key={ret.id} className="p-3.5 bg-white border border-slate-150 rounded-xl space-y-2 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-slate-800">{ret.productName}</h5>
                          <p className="text-[10px] text-indigo-600 font-bold mt-0.5">গ্রাহক: {ret.customerName}</p>
                        </div>
                        <div className="text-right">
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            {ret.type === 'good' ? 'ভালো পণ্য' : 'নষ্ট পণ্য'}
                          </span>
                          <p className="text-[9px] text-slate-400 font-mono mt-1">{ret.date}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600">
                        <div>
                          <span className="block text-slate-400">ফেরত পরিমাণ</span>
                          <span className="font-bold text-slate-700 font-mono">
                            {toBengaliNumber(ret.cartons || 0)} কা, {toBengaliNumber(ret.pieces || 0)} পি ({toBengaliNumber(ret.quantity)} পিস)
                          </span>
                        </div>
                        <div>
                          <span className="block text-slate-400">ফেরত রিফান্ড</span>
                          <span className="font-bold text-slate-700">{formatTaka(ret.refundAmount)}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400">কারন/নোট</span>
                          <span className="font-semibold text-slate-700 truncate block">{ret.note || '---'}</span>
                        </div>
                      </div>
                    </div>
                  ))
              )
            )}

            {activeTab === 'distributor_return' && (
              distReturns.length === 0 ? (
                <div className="py-12 text-center text-slate-400">কোনো কোম্পানি ফেরত তালিকা পাওয়া যায়নি।</div>
              ) : (
                [...distReturns]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((dRet) => (
                    <div key={dRet.id} className="p-3.5 bg-white border border-slate-150 rounded-xl space-y-2 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-slate-800">{dRet.productName}</h5>
                          <p className="text-[10px] text-indigo-600 font-bold mt-0.5">কোম্পানি: {dRet.supplierName}</p>
                        </div>
                        <div className="text-right">
                          <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            ফেরত সম্পন্ন
                          </span>
                          <p className="text-[9px] text-slate-400 font-mono mt-1">{dRet.date}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600">
                        <div>
                          <span className="block text-slate-400">ফেরত পরিমাণ</span>
                          <span className="font-bold text-slate-700 font-mono">
                            {toBengaliNumber(dRet.cartons || 0)} কা, {toBengaliNumber(dRet.pieces || 0)} পি ({toBengaliNumber(dRet.quantity)} পিস)
                          </span>
                        </div>
                        <div>
                          <span className="block text-slate-400">ফেরত রিসিভ ক্রেডিট</span>
                          <span className="font-bold text-indigo-600">{formatTaka(dRet.value)}</span>
                        </div>
                      </div>
                      {dRet.note && <p className="text-[10px] text-slate-500 italic">নোট: {dRet.note}</p>}
                    </div>
                  ))
              )
            )}

            {activeTab === 'damaged' && (
              damagedStocks.length === 0 ? (
                <div className="py-12 text-center text-slate-400">কোনো ড্যামেজ বা লোকসান পণ্য পাওয়া যায়নি।</div>
              ) : (
                [...damagedStocks]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((dam) => (
                    <div key={dam.id} className="p-3.5 bg-white border border-slate-150 rounded-xl space-y-2 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-slate-800">{dam.productName}</h5>
                          <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                            অবস্থা: {dam.actionTaken === 'written_off' ? 'রাইট-অফ (নষ্ট)' : dam.actionTaken === 'returned_to_company' ? 'কোম্পানি ফেরত পাঠানো হয়েছে' : 'সিদ্ধান্তের অপেক্ষায়'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            ড্যামেজ পণ্য
                          </span>
                          <p className="text-[9px] text-slate-400 font-mono mt-1">{dam.date}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600">
                        <div>
                          <span className="block text-slate-400">ড্যামেজ পরিমাণ</span>
                          <span className="font-bold text-slate-700 font-mono">
                            {toBengaliNumber(dam.cartons || 0)} কা, {toBengaliNumber(dam.pieces || 0)} পি ({toBengaliNumber(dam.quantity)} পিস)
                          </span>
                        </div>
                        <div>
                          <span className="block text-slate-400">লোকসান মূল্য</span>
                          <span className="font-bold text-rose-600">{formatTaka(dam.lossAmount)}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400">ক্ষতি কারণ</span>
                          <span className="font-semibold text-slate-700 truncate block">{dam.note || '---'}</span>
                        </div>
                      </div>
                    </div>
                  ))
              )
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
