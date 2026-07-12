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
  X, 
  Package, 
  AlertTriangle, 
  Coins, 
  ShoppingBag, 
  Tag,
  Boxes
} from 'lucide-react';
import { Product, Company } from '../types';

interface ProductManagementProps {
  products: Product[];
  companies?: Company[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onEditProduct: (product: Product) => void;
}

export default function ProductManagement({
  products,
  companies = [],
  onAddProduct,
  onEditProduct
}: ProductManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState(''); // selling price per piece
  const [sellingPriceCarton, setSellingPriceCarton] = useState(''); // selling price per carton
  const [piecesPerCarton, setPiecesPerCarton] = useState('24'); // pieces per carton
  const [cartonQuantity, setCartonQuantity] = useState(''); // carton quantity stock
  const [pieceQuantity, setPieceQuantity] = useState(''); // remainder pieces stock
  const [minStockAlert, setMinStockAlert] = useState('15');
  const [companyId, setCompanyId] = useState('');
  const [editId, setEditId] = useState('');

  // Categories extraction
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Filters
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatTaka = (amount: number) => {
    return `৳${amount.toLocaleString('bn-BD')}`;
  };

  const toBengaliNumber = (num: number | string) => {
    const bDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bDigits[parseInt(digit, 10)]);
  };

  // Handle Add Product
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim()) return;

    const finalPiecesPerCarton = parseInt(piecesPerCarton) || 24;
    const finalCartons = parseInt(cartonQuantity) || 0;
    const finalRemainderPieces = parseInt(pieceQuantity) || 0;
    const computedStock = (finalCartons * finalPiecesPerCarton) + finalRemainderPieces;

    onAddProduct({
      name,
      category,
      purchasePrice: parseFloat(purchasePrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      sellingPriceCarton: parseFloat(sellingPriceCarton) || (parseFloat(sellingPrice) * finalPiecesPerCarton),
      piecesPerCarton: finalPiecesPerCarton,
      stock: computedStock,
      minStockAlert: parseInt(minStockAlert) || 10,
      companyId: companyId || undefined
    });

    // Reset
    setName('');
    setCategory('');
    setPurchasePrice('');
    setSellingPrice('');
    setSellingPriceCarton('');
    setPiecesPerCarton('24');
    setCartonQuantity('');
    setPieceQuantity('');
    setMinStockAlert('15');
    setCompanyId('');
    setIsAddOpen(false);
  };

  // Handle Edit Trigger
  const triggerEdit = (p: Product) => {
    const finalPiecesPerCarton = p.piecesPerCarton || 24;
    setEditId(p.id);
    setName(p.name);
    setCategory(p.category);
    setPurchasePrice(p.purchasePrice.toString());
    setSellingPrice(p.sellingPrice.toString());
    setSellingPriceCarton((p.sellingPriceCarton || (p.sellingPrice * finalPiecesPerCarton)).toString());
    setPiecesPerCarton(finalPiecesPerCarton.toString());
    setCartonQuantity(Math.floor(p.stock / finalPiecesPerCarton).toString());
    setPieceQuantity((p.stock % finalPiecesPerCarton).toString());
    setMinStockAlert(p.minStockAlert.toString());
    setCompanyId(p.companyId || '');
    setIsEditOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalPiecesPerCarton = parseInt(piecesPerCarton) || 24;
    const finalCartons = parseInt(cartonQuantity) || 0;
    const finalRemainderPieces = parseInt(pieceQuantity) || 0;
    const computedStock = (finalCartons * finalPiecesPerCarton) + finalRemainderPieces;

    onEditProduct({
      id: editId,
      name,
      category,
      purchasePrice: parseFloat(purchasePrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      sellingPriceCarton: parseFloat(sellingPriceCarton) || (parseFloat(sellingPrice) * finalPiecesPerCarton),
      piecesPerCarton: finalPiecesPerCarton,
      stock: computedStock,
      minStockAlert: parseInt(minStockAlert) || 10,
      companyId: companyId || undefined
    });

    setCompanyId('');
    setIsEditOpen(false);
  };

  return (
    <div className="space-y-6" id="product-screen">
      
      {/* Search and Quick Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="পণ্যের নাম বা ক্যাটাগরি দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-slate-50/50 text-xs px-4 py-2 pr-8 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium text-slate-700 w-full"
            >
              <option value="all">সব ক্যাটাগরি</option>
              {categories.filter(c => c !== 'all').map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
          </div>
        </div>

        {/* Add Product Trigger */}
        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-sm transition-colors cursor-pointer"
          id="btn-add-product"
        >
          <Plus className="w-4.5 h-4.5" />
          নতুন পণ্য যোগ করুন
        </button>
      </div>

      {/* Products Table/Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">পণ্যের বিবরণ</th>
                <th className="py-3 px-4">ক্যাটাগরি</th>
                <th className="py-3 px-4 text-right">ক্রয় মূল্য</th>
                <th className="py-3 px-4 text-right">বিক্রয় মূল্য</th>
                <th className="py-3 px-4 text-center">স্টক পরিমাণ</th>
                <th className="py-3 px-4 text-center">অবস্থা</th>
                <th className="py-3 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    কোনো পণ্য তালিকা পাওয়া যায়নি!
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLowStock = p.stock <= p.minStockAlert;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors" id={`product-row-${p.id}`}>
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            isLowStock ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-600'
                          }`}>
                            <Package className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{p.name}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <p className="text-[10px] text-slate-400">আইডি: {toBengaliNumber(p.id.replace('p', ''))}</p>
                              {p.companyId && (
                                <>
                                  <span className="text-[9px] text-slate-300">•</span>
                                  <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded border border-blue-100">
                                    {companies.find(c => c.id === p.companyId)?.name || 'অজানা কোম্পানি'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {p.category}
                        </span>
                      </td>

                      {/* Prices */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">{formatTaka(p.purchasePrice)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">{formatTaka(p.sellingPrice)} <span className="text-[10px] text-slate-400 font-normal">/পিস</span></div>
                        <div className="text-[10px] text-slate-500 font-mono">{formatTaka(p.sellingPriceCarton)} <span className="text-[9px] text-slate-400 font-normal">/কার্টুন ({p.piecesPerCarton || 24})</span></div>
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        {(() => {
                          const pCarton = p.piecesPerCarton || 24;
                          const cartons = Math.floor(p.stock / pCarton);
                          const pieces = p.stock % pCarton;
                          return (
                            <div className="flex flex-col items-center">
                              <span className={`font-semibold text-xs ${isLowStock ? 'text-rose-600' : 'text-slate-800'}`}>
                                {toBengaliNumber(cartons)} কার্টুন, {toBengaliNumber(pieces)} পিস
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                (মোট: {toBengaliNumber(p.stock)} পিস)
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            স্টক শেষ প্রায় (কম)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                            পর্যাপ্ত মজুদ
                          </span>
                        )}
                      </td>

                      {/* Edit */}
                      <td className="py-3.5 px-4 text-center">
                        <button 
                          onClick={() => triggerEdit(p)}
                          className="p-1.5 hover:bg-slate-100 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD PRODUCT */}
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
                নতুন পাইকারি পণ্য তালিকাভুক্ত করুন
              </h3>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">পণ্যের নাম <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="উদা: লাক্স সাবান ১০০ গ্রাম"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">ক্যাটাগরি <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="উদা: প্রসাধন, স্ন্যাক্স, পানীয়"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">কার্টুন প্রতি পিস সংখ্যা <span className="text-rose-500">*</span></label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      placeholder="২৪"
                      value={piecesPerCarton}
                      onChange={(e) => setPiecesPerCarton(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">কার্টুন বিক্রি মূল্য (৳) <span className="text-rose-500">*</span></label>
                    <input 
                      type="number" 
                      required
                      min="0.1"
                      step="0.01"
                      placeholder="৳০.০০"
                      value={sellingPriceCarton}
                      onChange={(e) => setSellingPriceCarton(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">পিস বিক্রি মূল্য (৳) <span className="text-rose-500">*</span></label>
                    <input 
                      type="number" 
                      required
                      min="0.1"
                      step="0.01"
                      placeholder="৳০.০০"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">ক্রয় মূল্য (৳/পিস) <span className="text-rose-500">*</span></label>
                    <input 
                      type="number" 
                      required
                      min="0.1"
                      step="0.01"
                      placeholder="৳০.০০"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">স্টক (কার্টুন)</label>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="০"
                      value={cartonQuantity}
                      onChange={(e) => setCartonQuantity(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">স্টক (অতিরিক্ত পিস)</label>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="০"
                      value={pieceQuantity}
                      onChange={(e) => setPieceQuantity(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">কোম্পানি সংযুক্তিকরণ (ঐচ্ছিক)</label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="">কোনো কোম্পানি নেই (None)</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">সতর্ক সংকেত সীমা (পিস)</label>
                  <input 
                    type="number" 
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                  />
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
                    যোগ করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EDIT PRODUCT */}
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
                পণ্য তথ্য সংশোধন করুন
              </h3>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">পণ্যের নাম <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">ক্যাটাগরি <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">কার্টুন প্রতি পিস সংখ্যা <span className="text-rose-500">*</span></label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={piecesPerCarton}
                      onChange={(e) => setPiecesPerCarton(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">কার্টুন বিক্রি মূল্য (৳) <span className="text-rose-500">*</span></label>
                    <input 
                      type="number" 
                      required
                      min="0.1"
                      step="0.01"
                      value={sellingPriceCarton}
                      onChange={(e) => setSellingPriceCarton(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">পিস বিক্রি মূল্য (৳) <span className="text-rose-500">*</span></label>
                    <input 
                      type="number" 
                      required
                      min="0.1"
                      step="0.01"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">ক্রয় মূল্য (৳/পিস) <span className="text-rose-500">*</span></label>
                    <input 
                      type="number" 
                      required
                      min="0.1"
                      step="0.01"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">স্টক (কার্টুন)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={cartonQuantity}
                      onChange={(e) => setCartonQuantity(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">স্টক (পিস)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={pieceQuantity}
                      onChange={(e) => setPieceQuantity(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">কোম্পানি সংযুক্তিকরণ (ঐচ্ছিক)</label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="">কোনো কোম্পানি নেই (None)</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">সতর্ক সংকেত সীমা (পিস)</label>
                  <input 
                    type="number" 
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                  />
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
                    সংরক্ষণ করুন
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
