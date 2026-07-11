/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Phone, 
  MapPin, 
  User, 
  Calendar, 
  FileText, 
  DollarSign, 
  CheckCircle,
  X,
  History,
  FileSpreadsheet
} from 'lucide-react';
import { Shop, CustomerLedger } from '../types';

interface CustomerManagementProps {
  shops: Shop[];
  ledgers: CustomerLedger[];
  onAddShop: (shop: Omit<Shop, 'id'>) => void;
  onEditShop: (shop: Shop) => void;
  onDeleteShop: (id: string) => void;
  onAcceptPayment: (customerId: string, amount: number, note: string, date: string) => void;
}

export default function CustomerManagement({
  shops,
  ledgers,
  onAddShop,
  onEditShop,
  onDeleteShop,
  onAcceptPayment
}: CustomerManagementProps) {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(shops[0]?.id || null);

  // Form Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Form Fields
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [initialDue, setInitialDue] = useState(0);

  // Payment Fields
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit Fields
  const [editShopId, setEditShopId] = useState('');

  // Selected shop calculations
  const selectedShop = shops.find(s => s.id === selectedShopId);
  const selectedLedger = ledgers
    .filter(l => l.customerId === selectedShopId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first

  const filteredShops = shops.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  const formatTaka = (amount: number) => {
    return `৳${amount.toLocaleString('bn-BD')}`;
  };

  const toBengaliNumber = (num: number | string) => {
    const bDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bDigits[parseInt(digit, 10)]);
  };

  // Handle Add
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;
    onAddShop({
      name: shopName,
      ownerName: ownerName || 'অজানা',
      phone: phone || 'প্রদান করা হয়নি',
      address: address || 'প্রদান করা হয়নি',
      due: initialDue || 0
    });
    // Reset
    setShopName('');
    setOwnerName('');
    setPhone('');
    setAddress('');
    setInitialDue(0);
    setIsAddOpen(false);
  };

  // Handle Edit Trigger
  const triggerEdit = (shop: Shop) => {
    setEditShopId(shop.id);
    setShopName(shop.name);
    setOwnerName(shop.ownerName);
    setPhone(shop.phone);
    setAddress(shop.address);
    setInitialDue(shop.due);
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;
    onEditShop({
      id: editShopId,
      name: shopName,
      ownerName,
      phone,
      address,
      due: initialDue
    });
    setIsEditOpen(false);
  };

  // Handle Payment Submit
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId || !paymentAmount || parseFloat(paymentAmount) <= 0) return;
    onAcceptPayment(selectedShopId, parseFloat(paymentAmount), paymentNote, paymentDate);
    setPaymentAmount('');
    setPaymentNote('');
    setIsPaymentOpen(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="customer-screen">
      
      {/* Left Column: Shop Directory List */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[calc(100vh-140px)]">
        
        {/* Header Search & Actions */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">দোকান ও কাস্টমার তালিকা</h3>
            <button 
              onClick={() => setIsAddOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors cursor-pointer"
              id="btn-add-shop"
            >
              <Plus className="w-4 h-4" />
              নতুন দোকান
            </button>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="দোকান, মালিক বা মোবাইল দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Directory List Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredShops.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              কোনো কাস্টমার দোকান পাওয়া যায়নি!
            </div>
          ) : (
            filteredShops.map((shop) => (
              <div 
                key={shop.id}
                onClick={() => setSelectedShopId(shop.id)}
                className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${
                  selectedShopId === shop.id ? 'bg-indigo-50/70 border-r-4 border-indigo-600' : 'hover:bg-slate-50/50'
                }`}
                id={`shop-item-${shop.id}`}
              >
                <div className="space-y-1 min-w-0 pr-3">
                  <h4 className="font-semibold text-xs text-slate-800 truncate">{shop.name}</h4>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{shop.ownerName}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{shop.phone}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold py-1 px-2.5 rounded-full ${
                    shop.due > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {shop.due > 0 ? formatTaka(shop.due) : 'পরিশোধিত'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Customer Details, Ledger, and Payment History */}
      <div className="lg:col-span-7 space-y-6">
        {selectedShop ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]" id="customer-ledger-pane">
            
            {/* Header / Meta Profile */}
            <div className="p-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex justify-between items-start gap-4">
              <div className="space-y-1.5">
                <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/20 text-[10px] px-2.5 py-0.5 rounded-full font-medium">
                  কাস্টমার আইডি: {toBengaliNumber(selectedShop.id.replace('s', ''))}
                </span>
                <h3 className="font-bold text-lg">{selectedShop.name}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedShop.address}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {selectedShop.phone}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => triggerEdit(selectedShop)}
                  className="bg-slate-700/80 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors cursor-pointer"
                  title="এডিট কাস্টমার"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    if (confirm('আপনি কি নিশ্চিতভাবে এই কাস্টমার মুছে ফেলতে চান?')) {
                      onDeleteShop(selectedShop.id);
                      setSelectedShopId(shops[0]?.id || null);
                    }
                  }}
                  className="bg-rose-500/80 hover:bg-rose-600 text-white p-2 rounded-lg transition-colors cursor-pointer"
                  title="ডিলিট কাস্টমার"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Ledger Financial summary */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center gap-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">বর্তমান বকেয়া (Due)</p>
                <p className={`text-xl font-bold mt-0.5 ${selectedShop.due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatTaka(selectedShop.due)}
                </p>
              </div>
              <button 
                onClick={() => setIsPaymentOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 font-bold shadow-sm transition-all cursor-pointer"
                id="btn-collect-payment"
              >
                <DollarSign className="w-4 h-4" />
                টাকা জমা নিন (Payment)
              </button>
            </div>

            {/* Chronological Due Ledger */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
                <History className="w-4 h-4 text-indigo-500" />
                <h4 className="font-bold text-xs">লেনদেন খতিয়ান (Due Ledger)</h4>
              </div>

              {selectedLedger.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  কোনো বকেয়া বা পেমেন্ট রেকর্ড নেই।
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedLedger.map((item, idx) => (
                    <div 
                      key={item.id}
                      className={`p-3 rounded-xl border flex justify-between items-center text-xs ${
                        item.type === 'sales' 
                          ? 'bg-amber-50/40 border-amber-100' 
                          : 'bg-emerald-50/40 border-emerald-100'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            item.type === 'sales' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}></span>
                          <span className="font-bold text-slate-800">
                            {item.type === 'sales' ? 'পণ্য বিক্রয় (বিক্রয় চালান)' : 'বকেয়া নগদ পরিশোধ'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.date}
                          </span>
                          {item.invoiceId && (
                            <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono text-[9px]">
                              <FileText className="w-2.5 h-2.5" />
                              {item.invoiceId}
                            </span>
                          )}
                        </div>
                        {item.note && <p className="text-[10px] text-slate-600 italic mt-1 font-sans">মন্তব্য: {item.note}</p>}
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-xs ${item.type === 'sales' ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {item.type === 'sales' ? '+' : '-'}{formatTaka(item.amount)}
                        </p>
                        <span className="text-[9px] text-slate-400 font-mono">আইডি: {toBengaliNumber(item.id.replace('l', ''))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-400 text-xs">
            কাস্টমার বিবরণ ও খতিয়ান দেখতে বামদিকের তালিকা থেকে নির্বাচন করুন।
          </div>
        )}
      </div>

      {/* MODAL 1: ADD NEW SHOP */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative"
            >
              <button 
                onClick={() => setIsAddOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                নতুন কাস্টমার দোকান যোগ করুন
              </h3>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">দোকানের নাম <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="উদা: ভাই ভাই ট্রেডার্স"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">প্রোপরাইটর / মালিকের নাম</label>
                  <input 
                    type="text" 
                    placeholder="উদা: আলমগীর হোসেন"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">মোবাইল নম্বর</label>
                    <input 
                      type="tel" 
                      placeholder="01xxxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">প্রারম্ভিক বকেয়া (যদি থাকে)</label>
                    <input 
                      type="number" 
                      placeholder="৳০"
                      value={initialDue || ''}
                      onChange={(e) => setInitialDue(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">ঠিকানা</label>
                  <textarea 
                    placeholder="ঠিকানা লিখুন..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
                  >
                    দাখিল করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EDIT SHOP */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative"
            >
              <button 
                onClick={() => setIsEditOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                কাস্টমার দোকানের তথ্য সংশোধন করুন
              </h3>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">দোকানের নাম <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">প্রোপরাইটর / মালিকের নাম</label>
                  <input 
                    type="text" 
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">মোবাইল নম্বর</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">ঠিকানা</label>
                  <textarea 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setIsEditOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
                  >
                    আপডেট করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: COLLECT PAYMENT */}
      <AnimatePresence>
        {isPaymentOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 relative"
            >
              <button 
                onClick={() => setIsPaymentOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-bold text-slate-800 mb-2">
                পেমেন্ট রিসিভ ফরম
              </h3>
              <p className="text-[10px] text-slate-400 mb-4">কাস্টমার: {selectedShop?.name}</p>

              <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">পরিশোধের পরিমাণ (টাকা) <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <input 
                      type="number" 
                      required
                      min="1"
                      max={selectedShop?.due}
                      placeholder="বকেয়া সীমা অতিক্রম করতে পারবে না"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-sm"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">সর্বোচ্চ বকেয়া সীমা: {formatTaka(selectedShop?.due || 0)}</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">তারিখ <span className="text-rose-500">*</span></label>
                  <input 
                    type="date" 
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">মন্তব্য / মাধ্যম</label>
                  <input 
                    type="text" 
                    placeholder="উদা: বিকাশ পেমেন্ট / ক্যাশ কালেকশন"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setIsPaymentOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer"
                  >
                    পরিশোধ নিশ্চিত করুন
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
