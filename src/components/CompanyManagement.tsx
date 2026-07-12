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
  Building, 
  Calendar, 
  FileText, 
  DollarSign, 
  CheckCircle,
  X,
  History,
  TrendingUp,
  TrendingDown,
  Percent,
  Check,
  AlertCircle
} from 'lucide-react';
import { Company, CompanyLedgerEntry, Product } from '../types';

interface CompanyManagementProps {
  companies: Company[];
  companyLedgers: CompanyLedgerEntry[];
  products: Product[];
  onAddCompany: (company: Omit<Company, 'id'>) => void;
  onEditCompany: (company: Company) => void;
  onDeleteCompany: (id: string) => void;
  onAddLedgerEntry: (entry: Omit<CompanyLedgerEntry, 'id' | 'currentBalance' | 'previousDue'>) => void;
  onDeleteLedgerEntry: (id: string) => void;
}

export default function CompanyManagement({
  companies,
  companyLedgers,
  products,
  onAddCompany,
  onEditCompany,
  onDeleteCompany,
  onAddLedgerEntry,
  onDeleteLedgerEntry
}: CompanyManagementProps) {
  // Search and view state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(companies[0]?.id || null);

  // Modals/Forms state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLedgerEntryOpen, setIsLedgerEntryOpen] = useState(false);

  // Add Company Form State
  const [companyName, setCompanyName] = useState('');
  const [openingDue, setOpeningDue] = useState('');
  const [primaryTarget, setPrimaryTarget] = useState('');
  const [secondaryTarget, setSecondaryTarget] = useState('');

  // Edit Company Form State
  const [editCompanyId, setEditCompanyId] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editPrimaryTarget, setEditPrimaryTarget] = useState('');
  const [editSecondaryTarget, setEditSecondaryTarget] = useState('');

  // Ledger Entry Form State
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryType, setEntryType] = useState<CompanyLedgerEntry['type']>('goods_received');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryNote, setEntryNote] = useState('');

  // Formatting helpers
  const formatTaka = (amount: number) => {
    return `৳${amount.toLocaleString('bn-BD')}`;
  };

  const toBengaliNumber = (num: number | string) => {
    const bDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bDigits[parseInt(digit, 10)]);
  };

  const getBTypeLabel = (type: CompanyLedgerEntry['type']) => {
    switch(type) {
      case 'opening': return 'প্রারম্ভিক ব্যালেন্স';
      case 'payment': return 'পরিশোধ (Payment)';
      case 'goods_received': return 'পণ্য প্রাপ্তি (Goods Received)';
      case 'damage_adj': return 'ড্যামেজ সমন্বয়';
      case 'scheme_adj': return 'স্কিম সমন্বয়';
      case 'credit_note': return 'ক্রেডিট নোট';
      case 'bonus_adj': return 'বোনাস সমন্বয়';
      default: return '';
    }
  };

  // Selected Company Calculations
  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];
  const activeCompanyId = selectedCompany?.id;

  // Compute balanced ledger for active company
  const activeLedgerRaw = companyLedgers.filter(l => l.companyId === activeCompanyId);
  const activeCompanyOpeningDue = selectedCompany?.openingDue || 0;

  // Chronologically balance the entries
  const sortedAndBalancedLedger = (() => {
    if (!activeCompanyId) return [];
    
    // Sort chronological: date ASC, then id ASC
    const sorted = [...activeLedgerRaw].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    
    let balance = activeCompanyOpeningDue;
    const balanced = sorted.map((entry) => {
      const prevDue = balance;
      if (entry.type === 'opening') {
        balance = entry.amount;
        return { ...entry, previousDue: 0, currentBalance: balance };
      }
      
      if (entry.type === 'goods_received') {
        balance += entry.amount;
      } else {
        // payment, damage_adj, scheme_adj, credit_note, bonus_adj
        balance -= entry.amount;
      }
      return { ...entry, previousDue: prevDue, currentBalance: balance };
    });

    // Return descending for display (newest first)
    return balanced.reverse();
  })();

  const currentCompanyBalance = sortedAndBalancedLedger[0]?.currentBalance ?? activeCompanyOpeningDue;

  // Filter companies based on search
  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Add Company Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    onAddCompany({
      name: companyName,
      openingDue: parseFloat(openingDue) || 0,
      primaryTarget: parseFloat(primaryTarget) || 0,
      secondaryTarget: parseFloat(secondaryTarget) || 0
    });

    setCompanyName('');
    setOpeningDue('');
    setPrimaryTarget('');
    setSecondaryTarget('');
    setIsAddOpen(false);
  };

  // Handle Edit Company Trigger
  const handleEditTrigger = (company: Company) => {
    setEditCompanyId(company.id);
    setEditCompanyName(company.name);
    setEditPrimaryTarget(company.primaryTarget.toString());
    setEditSecondaryTarget(company.secondaryTarget.toString());
    setIsEditOpen(true);
  };

  // Handle Edit Company Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompanyName.trim()) return;

    const original = companies.find(c => c.id === editCompanyId);
    if (!original) return;

    onEditCompany({
      ...original,
      name: editCompanyName,
      primaryTarget: parseFloat(editPrimaryTarget) || 0,
      secondaryTarget: parseFloat(editSecondaryTarget) || 0
    });

    setIsEditOpen(false);
  };

  // Handle Ledger Entry Submit
  const handleLedgerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryAmount || parseFloat(entryAmount) <= 0 || !activeCompanyId) return;

    onAddLedgerEntry({
      companyId: activeCompanyId,
      date: entryDate,
      type: entryType,
      amount: parseFloat(entryAmount),
      note: entryNote.trim() || undefined
    });

    setEntryAmount('');
    setEntryNote('');
    setIsLedgerEntryOpen(false);
  };

  return (
    <div className="space-y-6" id="company-management-screen">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="কোম্পানির নাম দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          কোম্পানি যুক্ত করুন
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Company list */}
        <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[600px]">
          <h3 className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <Building className="w-4 h-4 text-slate-500" />
            কোম্পানিসমূহ ({toBengaliNumber(filteredCompanies.length)})
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-xs">কোনো কোম্পানি খুঁজে পাওয়া যায়নি।</p>
              </div>
            ) : (
              filteredCompanies.map((comp) => {
                const isSelected = comp.id === selectedCompanyId;
                
                // Get balance
                const companyRaw = companyLedgers.filter(l => l.companyId === comp.id);
                const balanced = [...companyRaw].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
                let bal = comp.openingDue;
                balanced.forEach(e => {
                  if (e.type === 'opening') {
                    bal = e.amount;
                  } else if (e.type === 'goods_received') {
                    bal += e.amount;
                  } else {
                    bal -= e.amount;
                  }
                });

                return (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedCompanyId(comp.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected 
                        ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
                        : 'bg-white border-slate-100 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs text-slate-800">{comp.name}</h4>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        ব্যালেন্স: <span className={bal > 0 ? 'text-rose-600' : 'text-emerald-600'}>{formatTaka(bal)}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400">প্রাইমারি টার্গেট</span>
                        <span className="font-bold text-slate-700">{formatTaka(comp.primaryTarget)}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400">সেকেন্ডারি টার্গেট</span>
                        <span className="font-bold text-slate-700">{formatTaka(comp.secondaryTarget)}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-slate-50/50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTrigger(comp);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`আপনি কি নিশ্চিতভাবে ${comp.name} মুছে ফেলতে চান? কোম্পানির সমস্ত লেজার ডেটা ডিলিট হয়ে যাবে।`)) {
                            onDeleteCompany(comp.id);
                            if (selectedCompanyId === comp.id) {
                              setSelectedCompanyId(companies.find(c => c.id !== comp.id)?.id || null);
                            }
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Company Ledger details */}
        <div className="lg:col-span-7 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[600px]">
          {selectedCompany ? (
            <div className="flex flex-col h-full">
              {/* Ledger Header details */}
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                    <History className="w-4.5 h-4.5 text-blue-500" />
                    লেজার খতিয়ান: {selectedCompany.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">কোম্পানির প্রারম্ভিক দেনা: {formatTaka(selectedCompany.openingDue)}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">বর্তমান মোট দেনা</span>
                    <span className={`text-base font-extrabold ${currentCompanyBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatTaka(currentCompanyBalance)}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsLedgerEntryOpen(true)}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    লেনদেন যোগ
                  </button>
                </div>
              </div>

              {/* Ledger list table */}
              <div className="flex-1 overflow-y-auto mt-3 pr-1">
                {sortedAndBalancedLedger.length === 0 ? (
                  <div className="text-center py-24 text-slate-400">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-xs">এই কোম্পানির কোনো লেনদেন রেকর্ড পাওয়া যায়নি।</p>
                    <button
                      onClick={() => setIsLedgerEntryOpen(true)}
                      className="text-xs text-blue-500 font-bold underline mt-2"
                    >
                      প্রথম লেনদেন যোগ করুন
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sortedAndBalancedLedger.map((entry) => {
                      const isAddition = entry.type === 'goods_received' || entry.type === 'opening';
                      return (
                        <div key={entry.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col sm:flex-row justify-between gap-2.5 relative group">
                          
                          {/* Transaction Main Details */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                entry.type === 'goods_received' ? 'bg-amber-100 text-amber-800' :
                                entry.type === 'payment' ? 'bg-emerald-100 text-emerald-800' :
                                entry.type === 'opening' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {getBTypeLabel(entry.type)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium font-mono flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {toBengaliNumber(entry.date)}
                              </span>
                            </div>

                            {entry.note && (
                              <p className="text-xs font-semibold text-slate-700 mt-1">{entry.note}</p>
                            )}

                            <div className="grid grid-cols-2 gap-x-4 pt-1 text-[10px] text-slate-400">
                              <div>পূর্বের দেনা: <span className="font-medium text-slate-600">{formatTaka(entry.previousDue)}</span></div>
                              <div>লেনদেনের পরিমাণ: <span className={`font-bold ${isAddition ? 'text-amber-600' : 'text-emerald-600'}`}>{isAddition ? '+' : '-'}{formatTaka(entry.amount)}</span></div>
                            </div>
                          </div>

                          {/* Transaction Results */}
                          <div className="flex flex-col justify-between items-start sm:items-end text-left sm:text-right shrink-0">
                            <div>
                              <span className="block text-[8px] uppercase tracking-wider text-slate-400">সমাপনী দেনা ব্যালেন্স</span>
                              <span className={`text-xs font-extrabold ${entry.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatTaka(entry.currentBalance)}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                if (confirm('আপনি কি এই লেনদেন এন্ট্রি মুছে ফেলতে চান?')) {
                                  onDeleteLedgerEntry(entry.id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 text-[10px] font-bold mt-1.5 transition-opacity duration-200 cursor-pointer"
                            >
                              মুছুন
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center">
              <Building className="w-16 h-16 text-slate-200 mb-3" />
              <p className="text-xs">লেজার বিবরণ এবং লেনদেনের খতিয়ান দেখতে বাম পাশের তালিকা থেকে একটি কোম্পানি নির্বাচন করুন।</p>
            </div>
          )}
        </div>

      </div>

      {/* --- ADD COMPANY FORM MODAL --- */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="absolute inset-0 bg-slate-950/70"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full p-5 z-10 relative space-y-4 text-slate-800"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-500" />
                  নতুন কোম্পানি যুক্ত করুন
                </h3>
                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">কোম্পানির নাম <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: Square Pharmaceuticals"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">প্রারম্ভিক বকেয়া দেনা (টাকা)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="০.০০"
                    value={openingDue}
                    onChange={(e) => setOpeningDue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">প্রাইমারি টার্গেট</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="০.০০"
                      value={primaryTarget}
                      onChange={(e) => setPrimaryTarget(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">সেকেন্ডারি টার্গেট</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="০.০০"
                      value={secondaryTarget}
                      onChange={(e) => setSecondaryTarget(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-lg transition-all active:scale-95 mt-4 cursor-pointer"
                >
                  কোম্পানি সংরক্ষণ করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EDIT COMPANY FORM MODAL --- */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditOpen(false)}
              className="absolute inset-0 bg-slate-950/70"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full p-5 z-10 relative space-y-4 text-slate-800"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-500" />
                  কোম্পানি তথ্য সংশোধন
                </h3>
                <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">কোম্পানির নাম <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ACI"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">প্রাইমারি টার্গেট</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="০.০০"
                      value={editPrimaryTarget}
                      onChange={(e) => setEditPrimaryTarget(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">সেকেন্ডারি টার্গেট</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="০.০০"
                      value={editSecondaryTarget}
                      onChange={(e) => setEditSecondaryTarget(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-lg transition-all active:scale-95 mt-4 cursor-pointer"
                >
                  কোম্পানি তথ্য আপডেট করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD LEDGER TRANSACTION MODAL --- */}
      <AnimatePresence>
        {isLedgerEntryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLedgerEntryOpen(false)}
              className="absolute inset-0 bg-slate-950/70"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full p-5 z-10 relative space-y-4 text-slate-800"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-indigo-500" />
                  নতুন লেনদেন রেকর্ড করুন
                </h3>
                <button onClick={() => setIsLedgerEntryOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleLedgerSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">তারিখ</label>
                    <input
                      type="date"
                      required
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">লেনদেনের ধরন</label>
                    <select
                      value={entryType}
                      onChange={(e) => setEntryType(e.target.value as CompanyLedgerEntry['type'])}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="goods_received">পণ্য প্রাপ্তি (Goods Received)</option>
                      <option value="payment">পরিশোধ (Payment Given)</option>
                      <option value="damage_adj">ড্যামেজ সমন্বয়</option>
                      <option value="scheme_adj">স্কিম সমন্বয়</option>
                      <option value="credit_note">ক্রেডিট নোট</option>
                      <option value="bonus_adj">বোনাস সমন্বয়</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">টাকার পরিমাণ <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    placeholder="০.০০"
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">বিবরণ / নোট</label>
                  <input
                    type="text"
                    placeholder="লেনদেনের সংক্ষিপ্ত নোট"
                    value={entryNote}
                    onChange={(e) => setEntryNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-[10px] text-blue-800 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    ব্যালেন্সের প্রভাব:
                  </p>
                  <p>
                    {entryType === 'goods_received' 
                      ? 'কোম্পানির পণ্য গ্রহণের কারণে আপনার দেনা বৃদ্ধি পাবে।' 
                      : 'কোম্পানিকে সমন্বয়/টাকা পরিশোধের কারণে আপনার দেনা হ্রাস পাবে।'}
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg transition-all active:scale-95 mt-4 cursor-pointer"
                >
                  লেনদেন সংরক্ষণ করুন
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
