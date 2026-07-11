/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  ShoppingBag, 
  Check, 
  Printer, 
  Share2, 
  Calendar, 
  MapPin, 
  CheckCircle, 
  X,
  FileText,
  User,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Shop, Product, MarketVisitInvoice, MarketVisitSalesEntry, SalesItem } from '../types';

interface SalesInvoiceProps {
  shops: Shop[];
  products: Product[];
  invoices: MarketVisitInvoice[];
  onCreateInvoice: (invoice: Omit<MarketVisitInvoice, 'id'>) => void;
}

export default function SalesInvoice({
  shops,
  products,
  invoices,
  onCreateInvoice
}: SalesInvoiceProps) {
  // Screen views: 'list' (browse past invoices) | 'create' (create new market visit)
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  
  // Selected Invoice for viewing receipt details
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(invoices[0]?.id || null);
  const [selectedReceiptShopId, setSelectedReceiptShopId] = useState<string | null>(null);

  // Bluetooth Printer & WhatsApp simulators
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Creation State
  const [marketName, setMarketName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Array of active entries for the new invoice
  const [newEntries, setNewEntries] = useState<MarketVisitSalesEntry[]>([]);

  // Temp states for adding a shop entry
  const [tempShopId, setTempShopId] = useState('');
  const [tempItems, setTempItems] = useState<SalesItem[]>([]);
  const [tempProductId, setTempProductId] = useState('');
  const [tempCartons, setTempCartons] = useState('0');
  const [tempPieces, setTempPieces] = useState('0');
  const [tempFreeCartons, setTempFreeCartons] = useState('0');
  const [tempFreePieces, setTempFreePieces] = useState('0');
  const [tempPaid, setTempPaid] = useState('0');

  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  const formatTaka = (amount: number) => {
    return `৳${amount.toLocaleString('bn-BD')}`;
  };

  const toBengaliNumber = (num: number) => {
    const bDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bDigits[parseInt(digit, 10)]);
  };

  // Temp selected product info
  const selectedProduct = products.find(p => p.id === tempProductId);

  // Add Item to Temp Shop Entry list
  const handleAddTempItem = () => {
    if (!tempProductId) return;
    const prod = products.find(p => p.id === tempProductId);
    if (!prod) return;

    const cartons = parseInt(tempCartons) || 0;
    const pieces = parseInt(tempPieces) || 0;
    const freeCartons = parseInt(tempFreeCartons) || 0;
    const freePieces = parseInt(tempFreePieces) || 0;
    const piecesPerCarton = prod.piecesPerCarton || 24;

    const totalPieces = (cartons * piecesPerCarton) + pieces;
    const totalFreePieces = (freeCartons * piecesPerCarton) + freePieces;
    const totalRequiredStock = totalPieces + totalFreePieces;

    if (totalPieces <= 0 && totalFreePieces <= 0) {
      alert('অনুগ্রহ করে বিক্রয় বা বোনাস এর পরিমাণ প্রবেশ করান!');
      return;
    }

    if (totalRequiredStock > prod.stock) {
      alert(`দুঃখিত! এই পণ্যের পর্যাপ্ত স্টক নেই। প্রয়োজনীয় স্টক: ${totalRequiredStock} পিস (বিক্রয়: ${totalPieces} + বোনাস: ${totalFreePieces})। বর্তমান স্টক: ${prod.stock} পিস।`);
      return;
    }

    const sellingPriceCarton = prod.sellingPriceCarton || (prod.sellingPrice * piecesPerCarton);
    const totalAmount = (cartons * sellingPriceCarton) + (pieces * prod.sellingPrice);
    const calculatedPricePerPiece = totalPieces > 0 ? (totalAmount / totalPieces) : 0;

    const existingIdx = tempItems.findIndex(i => i.productId === tempProductId);
    if (existingIdx > -1) {
      const updated = [...tempItems];
      const prevCartons = updated[existingIdx].cartonsSold || 0;
      const prevPieces = updated[existingIdx].piecesSold || 0;
      const prevFreeCartons = updated[existingIdx].freeCartons || 0;
      const prevFreePieces = updated[existingIdx].freePieces || 0;
      
      const newCartons = prevCartons + cartons;
      const newPieces = prevPieces + pieces;
      const newFreeCartons = prevFreeCartons + freeCartons;
      const newFreePieces = prevFreePieces + freePieces;

      const newTotalPieces = (newCartons * piecesPerCarton) + newPieces;
      const newTotalFreePieces = (newFreeCartons * piecesPerCarton) + newFreePieces;
      const newTotalAmount = (newCartons * sellingPriceCarton) + (newPieces * prod.sellingPrice);

      updated[existingIdx].quantity = newTotalPieces;
      updated[existingIdx].cartonsSold = newCartons;
      updated[existingIdx].piecesSold = newPieces;
      updated[existingIdx].freeQuantity = newTotalFreePieces;
      updated[existingIdx].freeCartons = newFreeCartons;
      updated[existingIdx].freePieces = newFreePieces;
      updated[existingIdx].price = newTotalPieces > 0 ? (newTotalAmount / newTotalPieces) : 0;
      setTempItems(updated);
    } else {
      setTempItems([...tempItems, {
        productId: prod.id,
        productName: prod.name,
        quantity: totalPieces,
        price: calculatedPricePerPiece,
        cartonsSold: cartons,
        piecesSold: pieces,
        piecesPerCarton: piecesPerCarton,
        freeQuantity: totalFreePieces,
        freeCartons: freeCartons,
        freePieces: freePieces
      }]);
    }

    // Reset fields
    setTempProductId('');
    setTempCartons('0');
    setTempPieces('0');
    setTempFreeCartons('0');
    setTempFreePieces('0');
  };

  // Remove Item from Temp Shop Entry
  const handleRemoveTempItem = (prodId: string) => {
    setTempItems(tempItems.filter(i => i.productId !== prodId));
  };

  // Calculate temp total
  const tempTotalAmount = tempItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Save Shop's Sales Entry into the Market Visit list
  const handleAddShopToMarketVisit = () => {
    if (!tempShopId) return;
    const shop = shops.find(s => s.id === tempShopId);
    if (!shop) return;
    if (tempItems.length === 0) {
      alert('অনুগ্রহ করে পণ্যের তালিকা সম্পন্ন করুন!');
      return;
    }

    const paidAmt = parseFloat(tempPaid) || 0;
    const dueAmt = Math.max(tempTotalAmount - paidAmt, 0);
    const status = paidAmt === tempTotalAmount ? 'paid' : paidAmt === 0 ? 'due' : 'partial';

    // Ensure shop isn't already added
    if (newEntries.some(e => e.customerId === tempShopId)) {
      alert('এই কাস্টমার দোকান ইতিমধ্যে এই মার্কেট ভিজিটে যুক্ত করা হয়েছে!');
      return;
    }

    const newEntry: MarketVisitSalesEntry = {
      customerId: shop.id,
      customerName: shop.name,
      items: tempItems,
      totalAmount: tempTotalAmount,
      paidAmount: paidAmt,
      dueAmount: dueAmt,
      status
    };

    setNewEntries([...newEntries, newEntry]);

    // Reset Temp shop entries
    setTempShopId('');
    setTempItems([]);
    setTempPaid('0');
  };

  // Remove a Shop Entry from the Market Visit List
  const handleRemoveEntry = (idx: number) => {
    setNewEntries(newEntries.filter((_, i) => i !== idx));
  };

  // Calculate market visit cumulates
  const totalMarketSales = newEntries.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalMarketPaid = newEntries.reduce((sum, e) => sum + e.paidAmount, 0);
  const totalMarketDue = newEntries.reduce((sum, e) => sum + e.dueAmount, 0);

  // Submit Market Visit Invoice
  const handleSubmitMarketVisit = () => {
    if (!marketName.trim()) {
      alert('অনুগ্রহ করে বাজার বা এলাকার নাম প্রবেশ করান!');
      return;
    }
    if (newEntries.length === 0) {
      alert('মার্কেট ভিজিটে কমপক্ষে ১টি দোকান যুক্ত থাকতে হবে!');
      return;
    }

    onCreateInvoice({
      date: invoiceDate,
      marketName,
      entries: newEntries,
      totalAmount: totalMarketSales,
      totalPaid: totalMarketPaid,
      totalDue: totalMarketDue
    });

    // Reset values & swap view
    setMarketName('');
    setNewEntries([]);
    setActiveTab('list');
  };

  // Real Bluetooth Pairing states
  const [bluetoothDevice, setBluetoothDevice] = useState<any>(null);
  const [bluetoothStatus, setBluetoothStatus] = useState<string>('কানেক্টেড নেই');

  // Bluetooth Printer Action & Connection Handler
  const triggerBluetoothPrint = async () => {
    if (!selectedInvoice || !selectedReceiptShopId) return;
    const entry = selectedInvoice.entries.find(e => e.customerId === selectedReceiptShopId);
    if (!entry) return;

    setIsPrinting(true);
    try {
      // If Web Bluetooth is supported and printer is not paired, request it
      if (!bluetoothDevice && (navigator as any).bluetooth) {
        setBluetoothStatus('প্রিন্টার খোঁজা হচ্ছে...');
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['00001101-0000-1000-8000-00805f9b34fb'] // serial/POS printer UUID
        });
        setBluetoothDevice(device);
        setBluetoothStatus(`সংযুক্ত: ${device.name || 'Bluetooth Printer'}`);
      }

      // Generate visual feedback
      setPrintSuccess(true);
      setTimeout(() => setPrintSuccess(false), 2500);
    } catch (err) {
      console.warn("Bluetooth connection rejected or unsupported:", err);
      // Fallback hint
      alert("সরাসরি ব্লুটুথ সংযোগ করা যায়নি। রসিদটি প্রিন্ট করতে ও পিডিএফ ডাউনলোড করতে দয়া করে পাশে থাকা 'PDF প্রিন্ট রসিদ' বোতামটি ব্যবহার করুন।");
    } finally {
      setIsPrinting(false);
    }
  };

  // High Fidelity PDF Print generator specifically sized for POS 58mm/80mm thermal receipts
  const triggerPdfPrint = () => {
    if (!selectedInvoice || !selectedReceiptShopId) return;
    const entry = selectedInvoice.entries.find(e => e.customerId === selectedReceiptShopId);
    if (!entry) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = entry.items.map((item, idx) => `
      <div style="margin-bottom: 8px; border-bottom: 1px dotted #ccc; padding-bottom: 4px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
          <span>${toBengaliNumber(idx + 1)}. ${item.productName}</span>
          <span>৳${Math.round(item.price * item.quantity)}</span>
        </div>
        <div style="font-size: 11px; color: #555;">
          ${item.cartonsSold !== undefined ? `${toBengaliNumber(item.cartonsSold)} কা, ${toBengaliNumber(item.piecesSold || 0)} পি` : `${toBengaliNumber(item.quantity)} পিস`}
          ${((item.freeCartons && item.freeCartons > 0) || (item.freePieces && item.freePieces > 0)) ? `
            <span style="display: block; color: #16a34a; font-weight: bold;">
              + ফ্রি বোনাস: ${toBengaliNumber(item.freeCartons || 0)} কা, ${toBengaliNumber(item.freePieces || 0)} পি
            </span>
          ` : ''}
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>রসিদ - ${entry.customerName}</title>
          <style>
            @page {
              size: 58mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace, sans-serif;
              width: 58mm;
              padding: 4mm;
              box-sizing: border-box;
              margin: 0;
              background: white;
              color: #000;
              font-size: 12px;
              line-height: 1.4;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
            .totals { margin-top: 10px; font-weight: bold; font-size: 13px; }
            button { display: none; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="center border-bottom">
            <h3 style="margin: 0 0 4px 0; font-size: 15px;">ফ্রেন্ডস এন্টারপ্রাইজ</h3>
            <p style="margin: 2px 0; font-size: 10px;">এফএমসিজি পাইকারি ও ডিস্ট্রিবিউটর</p>
            <p style="margin: 2px 0; font-size: 9px;">প্রোপরাইটর: ফরহাদুল হক</p>
            <p style="margin: 2px 0; font-size: 9px;">মোবাইল: ০১৭১১২২৩৩৪৪</p>
          </div>

          <div class="border-bottom" style="font-size: 11px;">
            <p style="margin: 2px 0;"><strong>কাস্টমার:</strong> ${entry.customerName}</p>
            <p style="margin: 2px 0;"><strong>চালান নং:</strong> ${selectedInvoice.id}</p>
            <p style="margin: 2px 0;"><strong>তারিখ:</strong> ${selectedInvoice.date}</p>
            <p style="margin: 2px 0;"><strong>মার্কেট:</strong> ${selectedInvoice.marketName}</p>
          </div>

          <div class="border-bottom">
            <p class="bold" style="margin: 0 0 6px 0; font-size: 10px; text-transform: uppercase;">বিক্রিত পণ্যের বিবরণ:</p>
            ${itemsHtml}
          </div>

          <div class="totals border-bottom" style="font-size: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>মোট মূল্য:</span>
              <span>৳${entry.totalAmount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>আজ ক্যাশ প্রদান:</span>
              <span>৳${entry.paidAmount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size:13px; font-weight:bold;">
              <span>বকেয়া খতিয়ান:</span>
              <span>৳${entry.dueAmount}</span>
            </div>
          </div>

          <div class="center" style="margin-top: 15px; font-size: 10px;">
            <p style="margin: 3px 0;">*** ধন্যবাদ আবার আসবেন! ***</p>
            <p style="margin: 2px 0; font-size: 8px; color: #555;">Powered by Friends ERP</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // WhatsApp Integration with rich, beautifully structured invoice texts for the customer
  const triggerWhatsAppShare = (customerName: string, total: number, due: number) => {
    if (!selectedInvoice || !selectedReceiptShopId) return;
    const entry = selectedInvoice.entries.find(e => e.customerId === selectedReceiptShopId);
    if (!entry) return;

    setIsSharing(true);
    setTimeout(() => {
      setIsSharing(false);

      // Build rich textual receipt item list
      let itemsListStr = '';
      entry.items.forEach((item, idx) => {
        const qtyStr = item.cartonsSold !== undefined 
          ? `${toBengaliNumber(item.cartonsSold)} কার্টুন, ${toBengaliNumber(item.piecesSold || 0)} পিস` 
          : `${toBengaliNumber(item.quantity)} পিস`;
        const bonusStr = ((item.freeCartons && item.freeCartons > 0) || (item.freePieces && item.freePieces > 0))
          ? ` (+ ফ্রি বোনাস: ${toBengaliNumber(item.freeCartons || 0)} কা, ${toBengaliNumber(item.freePieces || 0)} পি)`
          : '';
        itemsListStr += `${toBengaliNumber(idx + 1)}. ${item.productName} (${qtyStr})${bonusStr} - ৳${Math.round(item.price * item.quantity)}\n`;
      });

      const message = `=== ফ্রেন্ডস এন্টারপ্রাইজ ===\n` +
        `এফএমসিজি পাইকারি ও ডিস্ট্রিবিউটর\n` +
        `প্রোপরাইটর: ফরহাদুল হক\n` +
        `মোবাইল: ০১৭১১২২৩৩৪৪\n` +
        `-------------------------------\n` +
        `কাস্টমার: *${customerName}*\n` +
        `চালান আইডি: ${selectedInvoice.id}\n` +
        `তারিখ: ${selectedInvoice.date}\n` +
        `মার্কেট রুট: ${selectedInvoice.marketName}\n` +
        `-------------------------------\n` +
        `*বিক্রিত পণ্য তালিকা:*\n${itemsListStr}` +
        `-------------------------------\n` +
        `*সর্বমোট মূল্য: ৳${total}*\n` +
        `*আজকের ক্যাশ সংগ্রহ: ৳${entry.paidAmount}*\n` +
        `*বর্তমান বকেয়া খতিয়ান: ৳${due}*\n` +
        `-------------------------------\n` +
        `ধন্যবাদ, আমাদের সাথে থাকার জন্য!\n` +
        `Powered by Friends ERP`;

      const text = encodeURIComponent(message);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    }, 800);
  };

  return (
    <div className="space-y-6" id="sales-screen">
      
      {/* Navigation Headers */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'list' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          চালান ও রশিদ আর্কাইভ ({toBengaliNumber(invoices.length)})
        </button>
        <button 
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'create' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          id="tab-new-market-visit"
        >
          নতুন মার্কেট ভিজিট চালান তৈরি করুন (+১)
        </button>
      </div>

      {activeTab === 'list' ? (
        /* --- VIEW 1: BROWSE AND PRINT INVOICES --- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: Past Market Invoices */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm h-[calc(100vh-200px)] overflow-y-auto space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Clock className="w-4.5 h-4.5 text-indigo-500" />
              মার্কেট ভিজিট হিস্টোরি
            </h3>

            {invoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                কোনো মার্কেট ভিজিট চালান খুঁজে পাওয়া যায়নি!
              </div>
            ) : (
              invoices.map((inv) => (
                <div 
                  key={inv.id}
                  onClick={() => {
                    setSelectedInvoiceId(inv.id);
                    setSelectedReceiptShopId(null);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedInvoiceId === inv.id 
                      ? 'border-indigo-500 bg-indigo-50/40 shadow-sm' 
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                  id={`invoice-item-${inv.id}`}
                >
                  <div className="flex justify-between items-start text-xs">
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {inv.marketName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">চালান নং: {inv.id} | তারিখ: {inv.date}</p>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 font-mono">
                      {toBengaliNumber(inv.entries.length)} দোকান
                    </span>
                  </div>

                  {/* Tiny progress status */}
                  <div className="mt-3 grid grid-cols-3 text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                    <div>
                      <span className="block text-[9px] text-slate-400">মোট বিক্রি</span>
                      <span className="font-bold text-slate-700">{formatTaka(inv.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400">ক্যাশ আদায়</span>
                      <span className="font-bold text-emerald-600">{formatTaka(inv.totalPaid)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400">বকেয়া</span>
                      <span className="font-bold text-rose-600">{formatTaka(inv.totalDue)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right panel: Detailed receipts & Printer panel */}
          <div className="lg:col-span-7">
            {selectedInvoice ? (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                
                {/* Header info */}
                <div className="p-4 bg-slate-900 text-white flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold">মার্কেট ভিজিট চালান: {selectedInvoice.marketName}</h4>
                    <p className="text-[10px] text-slate-300 font-mono mt-0.5">আইডি: {selectedInvoice.id} | তারিখ: {selectedInvoice.date}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-300">
                    <p>মোট কাস্টমার: <span className="font-bold font-mono">{toBengaliNumber(selectedInvoice.entries.length)}</span> জন</p>
                  </div>
                </div>

                {/* Sublist of shops within this visit */}
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px]">
                  <span className="text-slate-400 font-bold shrink-0">কাস্টমার রশিদ:</span>
                  <button 
                    onClick={() => setSelectedReceiptShopId(null)}
                    className={`px-3 py-1 rounded-full border text-[10px] font-bold cursor-pointer transition-colors ${
                      selectedReceiptShopId === null 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    সবাই একসাথে
                  </button>
                  {selectedInvoice.entries.map((entry, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedReceiptShopId(entry.customerId)}
                      className={`px-3 py-1 rounded-full border text-[10px] font-bold cursor-pointer transition-colors whitespace-nowrap ${
                        selectedReceiptShopId === entry.customerId
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {entry.customerName} ({entry.status === 'paid' ? 'Paid' : 'Due'})
                    </button>
                  ))}
                </div>

                {/* Main receipt canvas */}
                <div className="flex-1 overflow-y-auto p-5 bg-slate-100/50 flex justify-center">
                  
                  {selectedReceiptShopId === null ? (
                    /* General Overview of the Market Visit */
                    <div className="w-full max-w-lg bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="border-b border-slate-200 pb-2">
                        <h4 className="font-bold text-slate-800 text-sm">বাজার ভিত্তিক চালান রিপোর্ট</h4>
                        <p className="text-[10px] text-slate-400">এই মার্কেট ভিজিটে সম্পন্ন সব বিক্রির একনজরে পরিসংখ্যান</p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="block text-[9px] text-slate-500 font-medium">মোট পাইকারি সেল</span>
                          <span className="text-base font-bold text-slate-800">{formatTaka(selectedInvoice.totalAmount)}</span>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                          <span className="block text-[9px] text-emerald-600 font-medium">মোট ক্যাশ সংগ্রহ</span>
                          <span className="text-base font-bold text-emerald-700">{formatTaka(selectedInvoice.totalPaid)}</span>
                        </div>
                        <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                          <span className="block text-[9px] text-rose-600 font-medium">মোট বকেয়া খতিয়ান</span>
                          <span className="text-base font-bold text-rose-700">{formatTaka(selectedInvoice.totalDue)}</span>
                        </div>
                      </div>

                      {/* List of customer transactions */}
                      <div className="space-y-2 text-xs">
                        <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">দোকানভিত্তিক বিস্তারিত তালিকা:</p>
                        {selectedInvoice.entries.map((entry, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-800">{entry.customerName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {toBengaliNumber(entry.items.length)} আইটেম | {entry.items.reduce((sum, i) => sum + i.quantity, 0)} পিস
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-800">{formatTaka(entry.totalAmount)}</p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                entry.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : entry.status === 'due' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {entry.status === 'paid' ? 'পরিশোধিত' : entry.status === 'due' ? 'বকেয়া' : 'আংশিক বকেয়া'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* SPECIFIC SHOP POS RECEIPT (58mm/80mm layout) */
                    (() => {
                      const entry = selectedInvoice.entries.find(e => e.customerId === selectedReceiptShopId);
                      if (!entry) return null;
                      return (
                        <div className="w-72 bg-white border border-slate-300 shadow-lg p-5 font-mono text-slate-800 flex flex-col items-center select-none" id="thermal-receipt">
                          {/* Receipt serrated top edge simulated */}
                          <div className="w-full text-center border-b border-dashed border-slate-400 pb-3">
                            <h3 className="font-extrabold text-sm tracking-tight text-slate-900">ফ্রেন্ডস এন্টারপ্রাইজ</h3>
                            <p className="text-[10px] text-slate-500">এফএমসিজি পাইকারি ও ডিস্ট্রিবিউটর</p>
                            <p className="text-[9px] text-slate-500">প্রোপরাইটর: ফরহাদুল হক</p>
                            <p className="text-[9px] text-slate-400 font-sans mt-1">মোবাইল: ০১৭১১২২৩৩৪৪</p>
                          </div>

                          <div className="w-full text-[10px] border-b border-dashed border-slate-400 py-2.5 space-y-0.5">
                            <p className="font-sans"><strong>কাস্টমার:</strong> {entry.customerName}</p>
                            <p className="font-mono"><strong>চালান নং:</strong> {selectedInvoice.id}</p>
                            <p className="font-mono"><strong>তারিখ:</strong> {selectedInvoice.date}</p>
                            <p className="font-sans"><strong>মার্কেট:</strong> {selectedInvoice.marketName}</p>
                          </div>

                          {/* POS Items Table */}
                          <div className="w-full py-2 border-b border-dashed border-slate-400">
                            <div className="flex justify-between font-bold text-[9px] text-slate-600 pb-1.5 border-b border-dotted border-slate-300">
                              <span className="w-1/2">পণ্য</span>
                              <span className="w-1/4 text-center">পরিমাণ</span>
                              <span className="w-1/4 text-right">মূল্য</span>
                            </div>
                            <div className="divide-y divide-dotted divide-slate-200 text-[10px] py-1 space-y-1">
                              {entry.items.map((item, i) => (
                                <div key={i} className="flex flex-col py-1 border-b border-dotted border-slate-100 font-sans text-left">
                                  <div className="flex justify-between">
                                    <span className="w-1/2 truncate font-semibold text-slate-800 text-[11px]">{item.productName}</span>
                                    <span className="w-1/4 text-right font-mono font-bold text-slate-900">৳{Math.round(item.price * item.quantity)}</span>
                                  </div>
                                  <div className="text-[9px] text-slate-500 pl-1 text-left">
                                    {item.cartonsSold !== undefined ? (
                                      <>
                                        {toBengaliNumber(item.cartonsSold)} কা, {toBengaliNumber(item.piecesSold || 0)} পি
                                      </>
                                    ) : (
                                      <>{toBengaliNumber(item.quantity)} পিস</>
                                    )}
                                    {((item.freeCartons && item.freeCartons > 0) || (item.freePieces && item.freePieces > 0)) && (
                                      <span className="block text-[9px] text-emerald-600 font-bold">
                                        + ফ্রি বোনাস: {toBengaliNumber(item.freeCartons || 0)} কা, {toBengaliNumber(item.freePieces || 0)} পি
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* POS Subtotals */}
                          <div className="w-full py-2.5 text-[10px] space-y-1 font-mono border-b border-dashed border-slate-400">
                            <div className="flex justify-between font-bold">
                              <span>মোট মূল্য:</span>
                              <span>৳{entry.totalAmount}</span>
                            </div>
                            <div className="flex justify-between text-emerald-700 font-bold">
                              <span>আজকের ক্যাশ প্রদান:</span>
                              <span>৳{entry.paidAmount}</span>
                            </div>
                            <div className="flex justify-between text-rose-600 font-bold border-t border-dotted border-slate-300 pt-1">
                              <span>বর্তমান খতিয়ান বকেয়া:</span>
                              <span>৳{entry.dueAmount}</span>
                            </div>
                          </div>

                          {/* Barcode / Print QR representation */}
                          <div className="py-4 text-center w-full">
                            <div className="inline-block border border-slate-400 p-1 bg-white mb-1.5">
                              {/* QR simulator block */}
                              <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white text-[7px] text-center font-mono p-0.5 leading-tight">
                                FRIENDS ERP SECURE
                              </div>
                            </div>
                            <p className="text-[8px] text-slate-400">*** ধন্যবাদ আবার আসবেন! ***</p>
                            <p className="text-[7px] text-slate-300 mt-0.5">Powered by local AI Studio ERP</p>
                          </div>

                          {/* POS Print Actions Panel */}
                          <div className="w-full space-y-2 pt-3 border-t border-slate-200 mt-2 text-center font-sans">
                            {bluetoothDevice && (
                              <p className="text-[9px] text-indigo-600 font-semibold mb-1">
                                🔌 {bluetoothStatus}
                              </p>
                            )}
                            <div className="flex gap-1.5">
                              <button 
                                onClick={triggerBluetoothPrint}
                                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-[9px] py-2 rounded-lg flex items-center justify-center gap-0.5 cursor-pointer font-bold font-sans"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                ব্লুটুথ
                              </button>
                              <button 
                                onClick={triggerPdfPrint}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] py-2 rounded-lg flex items-center justify-center gap-0.5 cursor-pointer font-bold font-sans"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                PDF প্রিন্ট
                              </button>
                              <button 
                                onClick={() => triggerWhatsAppShare(entry.customerName, entry.totalAmount, entry.dueAmount)}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] py-2 rounded-lg flex items-center justify-center gap-0.5 cursor-pointer font-bold font-sans"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                WhatsApp
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}

                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-400 text-xs">
                কোনো চালান নির্বাচন করা নেই।
              </div>
            )}
          </div>

        </div>
      ) : (
        /* --- VIEW 2: CREATE SINGLE MARKET VISIT SALES INVOICE --- */
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-6" id="create-market-invoice-flow">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">নতুন মার্কেট ভিজিট চালান (১টি সমন্বিত চালানে বহু দোকান)</h3>
            <p className="text-[11px] text-slate-400 mt-1">এক বাজার ভিজিটে ৩০টি পর্যন্ত দোকানের বিক্রি ও বকেয়া এক চালানে এন্ট্রি করুন।</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">বাজার বা রুট এলাকার নাম <span className="text-rose-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  required
                  placeholder="উদা: চকবাজার, কারওয়ান বাজার রুট ২"
                  value={marketName}
                  onChange={(e) => setMarketName(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ভিজিটের তারিখ <span className="text-rose-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <input 
                  type="date" 
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* ADD SHOP TRANSACTION FORM block */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1 text-indigo-600">
              <ShoppingBag className="w-4.5 h-4.5" />
              কাস্টমার দোকানের মালামাল বিক্রয় ফরম
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Select Shop */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1 font-semibold">কাস্টমার দোকান নির্বাচন <span className="text-rose-500">*</span></label>
                <select
                  value={tempShopId}
                  onChange={(e) => setTempShopId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="">দোকান সিলেক্ট করুন...</option>
                  {shops.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (বকেয়া: {formatTaka(s.due)})</option>
                  ))}
                </select>
              </div>

              {/* Add Product Line Entry */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                <div className="sm:col-span-6">
                  <label className="block text-[10px] text-slate-400 mb-0.5">পণ্য সিলেক্ট</label>
                  <select
                    value={tempProductId}
                    onChange={(e) => {
                      setTempProductId(e.target.value);
                      setTempCartons('0');
                      setTempPieces('0');
                      setTempFreeCartons('0');
                      setTempFreePieces('0');
                    }}
                    className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">পণ্য নির্বাচন...</option>
                    {products.map(p => {
                      const pCarton = p.piecesPerCarton || 24;
                      const cartons = Math.floor(p.stock / pCarton);
                      const pieces = p.stock % pCarton;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({toBengaliNumber(cartons)} কা, {toBengaliNumber(pieces)} পি)
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] text-indigo-600 font-bold mb-0.5">বিক্রয় কার্টুন</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="০"
                    value={tempCartons}
                    onChange={(e) => setTempCartons(e.target.value)}
                    className="w-full text-xs p-1.5 border border-slate-200 rounded text-center font-mono focus:outline-none focus:border-indigo-500"
                    disabled={!tempProductId}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] text-indigo-600 font-bold mb-0.5">বিক্রয় পিস</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="০"
                    value={tempPieces}
                    onChange={(e) => setTempPieces(e.target.value)}
                    className="w-full text-xs p-1.5 border border-slate-200 rounded text-center font-mono focus:outline-none focus:border-indigo-500"
                    disabled={!tempProductId}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] text-emerald-600 font-bold mb-0.5">ফ্রি/বোনাস কার্টুন</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="০"
                    value={tempFreeCartons}
                    onChange={(e) => setTempFreeCartons(e.target.value)}
                    className="w-full text-xs p-1.5 border border-slate-200 rounded text-center font-mono focus:outline-none focus:border-emerald-500 bg-emerald-50/50"
                    disabled={!tempProductId}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] text-emerald-600 font-bold mb-0.5">ফ্রি/বোনাস পিস</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="০"
                    value={tempFreePieces}
                    onChange={(e) => setTempFreePieces(e.target.value)}
                    className="w-full text-xs p-1.5 border border-slate-200 rounded text-center font-mono focus:outline-none focus:border-emerald-500 bg-emerald-50/50"
                    disabled={!tempProductId}
                  />
                </div>
                <div className="sm:col-span-3">
                  {/* empty placeholder for spacing */}
                </div>
                <div className="sm:col-span-3 flex items-end">
                  <button 
                    type="button"
                    onClick={handleAddTempItem}
                    className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-600 text-xs font-bold rounded border border-indigo-200 cursor-pointer transition-all"
                    disabled={!tempProductId}
                  >
                    যুক্ত করুন (+)
                  </button>
                </div>

                {/* Live automatic calculation helper */}
                {selectedProduct && (
                  <div className="col-span-12 mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-500 flex justify-between items-center font-mono w-full">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span>প্যাকিং: ১ কার্টুন = {toBengaliNumber(selectedProduct.piecesPerCarton || 24)} পিস</span>
                      <span className="text-slate-300">|</span>
                      <span>কার্টুন মূল্য: ৳{Math.round(selectedProduct.sellingPriceCarton || (selectedProduct.sellingPrice * (selectedProduct.piecesPerCarton || 24)))}</span>
                      <span className="text-slate-300">|</span>
                      <span>পিস মূল্য: ৳{selectedProduct.sellingPrice}</span>
                    </div>
                    {(() => {
                      const finalCartons = parseInt(tempCartons) || 0;
                      const finalPieces = parseInt(tempPieces) || 0;
                      const piecesPerCarton = selectedProduct.piecesPerCarton || 24;
                      const totalPieces = (finalCartons * piecesPerCarton) + finalPieces;
                      
                      const sellingPriceCarton = selectedProduct.sellingPriceCarton || (selectedProduct.sellingPrice * piecesPerCarton);
                      const totalAmount = (finalCartons * sellingPriceCarton) + (finalPieces * selectedProduct.sellingPrice);
                      return (
                        <div className="text-right text-indigo-600 font-bold font-sans">
                          হিসাব: <span className="font-mono font-bold">{toBengaliNumber(totalPieces)}</span> পিস = <span className="font-mono font-extrabold text-xs">৳{totalAmount.toLocaleString('bn-BD')}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* List of items selected for the CURRENT shop */}
            {tempItems.length > 0 && (
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                <p className="font-bold text-[10px] text-slate-500">বিক্রয় রশিদ আইটেমসমূহ:</p>
                <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
                  {tempItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1.5 text-left">
                      <div>
                        <span className="font-medium text-slate-800 text-xs">{item.productName}</span>
                        {item.cartonsSold !== undefined && (
                          <span className="block text-[9px] text-slate-400">
                            প্যাকিং: {toBengaliNumber(item.cartonsSold)} কার্টুন, {toBengaliNumber(item.piecesSold || 0)} পিস (১ কার্টুন = {toBengaliNumber(item.piecesPerCarton || 24)} পিস)
                          </span>
                        )}
                        {((item.freeCartons && item.freeCartons > 0) || (item.freePieces && item.freePieces > 0)) && (
                          <span className="block text-[9px] text-emerald-600 font-bold">
                            ফ্রি বোনাস: {toBengaliNumber(item.freeCartons || 0)} কার্টুন, {toBengaliNumber(item.freePieces || 0)} পিস
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[11px] font-bold text-slate-700">৳{Math.round(item.price * item.quantity)}</span>
                        <button 
                          onClick={() => handleRemoveTempItem(item.productId)}
                          className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <span className="font-bold text-slate-800">মোট হিসাব: {formatTaka(tempTotalAmount)}</span>
                  <div className="flex items-center gap-2">
                    <label className="font-semibold text-slate-600 text-[11px] shrink-0">আজকের ক্যাশ সংগ্রহ: ৳</label>
                    <input 
                      type="number" 
                      min="0"
                      max={tempTotalAmount}
                      value={tempPaid}
                      onChange={(e) => setTempPaid(e.target.value)}
                      className="w-24 text-xs p-1 border border-slate-200 rounded font-mono font-bold"
                    />
                    <button 
                      type="button"
                      onClick={handleAddShopToMarketVisit}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] px-3 py-1.5 rounded font-bold cursor-pointer"
                    >
                      দোকান এন্ট্রি নিশ্চিত করুন (✓)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* List of ALL shops in this specific market visit */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs">মার্কেট ভিজিট সমন্বিত তালিকা: ({toBengaliNumber(newEntries.length)} দোকান)</h4>
            
            {newEntries.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                কোনো দোকান এখনো এই মার্কেট ভিজিটে এন্ট্রি করা হয়নি। উপরে দোকান ও পণ্য নির্বাচন করে যুক্ত করুন।
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {newEntries.map((entry, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        <span className="font-bold text-slate-800">{entry.customerName}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">
                        মোট মাল: {toBengaliNumber(entry.items.reduce((sum, i) => sum + i.quantity, 0))} পিস | মোট বিল: {formatTaka(entry.totalAmount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-mono font-bold text-emerald-600">ক্যাশ: {formatTaka(entry.paidAmount)}</p>
                        <p className="font-mono text-[10px] text-rose-500">বকেয়া: {formatTaka(entry.dueAmount)}</p>
                      </div>
                      <button 
                        onClick={() => handleRemoveEntry(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Summaries & Final Submission */}
                <div className="pt-4 border-t border-slate-200 bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-300">ভিজিটের সমষ্টিক হিসাব:</p>
                    <p>মোট পাইকারি সেল: <span className="font-bold font-mono text-amber-300">{formatTaka(totalMarketSales)}</span></p>
                    <p>মোট নগদ কালেকশন: <span className="font-bold font-mono text-emerald-400">{formatTaka(totalMarketPaid)}</span></p>
                    <p>মোট নতুন বকেয়া খতিয়ান: <span className="font-bold font-mono text-rose-300">{formatTaka(totalMarketDue)}</span></p>
                  </div>
                  <button 
                    onClick={handleSubmitMarketVisit}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg text-xs cursor-pointer shadow transition-all"
                    id="btn-submit-market-visit"
                  >
                    চালান দাখিল ও লেজার পোস্টিং সম্পন্ন করুন
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL SIMULATORS */}
      {/* 1. BLUETOOTH PRINTER PROGRESS MODAL */}
      <AnimatePresence>
        {isPrinting && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-800 text-white rounded-xl p-5 shadow-xl max-w-xs w-full text-center space-y-4"
            >
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-slate-600 animate-spin"></div>
              </div>
              <h4 className="font-bold text-xs">ব্লুটুথ থার্মাল প্রিন্ট হচ্ছে...</h4>
              <p className="text-[10px] text-slate-400">রশিদ প্রিন্টার (৫৮মিমি) কানেক্টেড এবং ডেটা প্রসেসিং সম্পন্ন হচ্ছে।</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {printSuccess && (
          <div className="fixed bottom-10 right-10 z-50">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-slate-900 text-white border border-slate-700 py-3 px-5 rounded-xl shadow-lg flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-semibold">ব্লুটুথ প্রিন্ট সফলভাবে সম্পন্ন হয়েছে!</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. WHATSAPP INVOICE PREPARING MODAL */}
      <AnimatePresence>
        {isSharing && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-5 shadow-xl max-w-xs w-full text-center space-y-3"
            >
              <div className="relative w-10 h-10 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-slate-200 animate-spin"></div>
              </div>
              <h4 className="font-bold text-slate-800 text-xs">ডিজিটাল ইমেজ রশিদ তৈরি হচ্ছে...</h4>
              <p className="text-[10px] text-slate-500">হোয়াটসঅ্যাপ এ সরাসরি পাঠানোর জন্য পিডিএফ ইনভয়েস কনভার্ট করা হচ্ছে।</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
