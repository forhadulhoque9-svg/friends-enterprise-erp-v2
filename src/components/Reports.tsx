/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Calculator,
  ArrowDownToLine,
  FileSpreadsheet
} from 'lucide-react';
import { Shop, Product, MarketVisitInvoice, ExpenseRecord, PurchaseRecord } from '../types';

interface ReportsProps {
  shops: Shop[];
  products: Product[];
  invoices: MarketVisitInvoice[];
  expenses: ExpenseRecord[];
  purchases: PurchaseRecord[];
}

type ReportType = 'sales' | 'due' | 'product' | 'profit';

export default function Reports({
  shops,
  products,
  invoices,
  expenses,
  purchases
}: ReportsProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('sales');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const formatTaka = (amount: number) => {
    return `৳${amount.toLocaleString('bn-BD')}`;
  };

  const toBengaliNumber = (num: number) => {
    const bDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bDigits[parseInt(digit, 10)]);
  };

  // 1. Due Report calculation
  const dueShops = [...shops]
    .filter(s => s.due > 0)
    .sort((a, b) => b.due - a.due); // Highest due first
  const overallCustomerDue = shops.reduce((sum, s) => sum + s.due, 0);

  // 2. Product Report calculation
  const productSalesMap: { [key: string]: { qty: number; revenue: number; profit: number; cartonsSold: number; piecesSold: number } } = {};
  invoices.forEach(inv => {
    inv.entries.forEach(entry => {
      entry.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const purchasePrice = prod ? prod.purchasePrice : item.price * 0.8;
        const profitPerUnit = item.price - purchasePrice;
        const piecesPerCarton = item.piecesPerCarton || (prod ? prod.piecesPerCarton : 24) || 24;

        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { qty: 0, revenue: 0, profit: 0, cartonsSold: 0, piecesSold: 0 };
        }
        productSalesMap[item.productId].qty += item.quantity;
        productSalesMap[item.productId].revenue += item.quantity * item.price;
        productSalesMap[item.productId].profit += item.quantity * profitPerUnit;

        if (item.cartonsSold !== undefined) {
          productSalesMap[item.productId].cartonsSold += item.cartonsSold;
          productSalesMap[item.productId].piecesSold += item.piecesSold || 0;
        } else {
          productSalesMap[item.productId].cartonsSold += Math.floor(item.quantity / piecesPerCarton);
          productSalesMap[item.productId].piecesSold += item.quantity % piecesPerCarton;
        }
      });
    });
  });

  // 3. Profit Report calculation (Income Statement style)
  const currentMonth = '2026-07';
  const monthlyInvoices = invoices.filter(inv => inv.date.startsWith(currentMonth));
  
  const totalSalesRev = monthlyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCashCollected = monthlyInvoices.reduce((sum, inv) => sum + inv.totalPaid, 0);
  const totalInvoicedDue = monthlyInvoices.reduce((sum, inv) => sum + inv.totalDue, 0);

  let totalCOGS = 0;
  monthlyInvoices.forEach(inv => {
    inv.entries.forEach(entry => {
      entry.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const pCost = prod ? prod.purchasePrice : item.price * 0.8;
        totalCOGS += pCost * item.quantity;
      });
    });
  });

  const grossProfit = totalSalesRev - totalCOGS;
  const totalOperatingExpenses = expenses
    .filter(exp => exp.date.startsWith(currentMonth))
    .reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = grossProfit - totalOperatingExpenses;

  // 4. Daily Sales list for selected date
  const dailySalesList = invoices.filter(inv => inv.date === dateFilter);
  const dailyTotalSales = dailySalesList.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const dailyTotalPaid = dailySalesList.reduce((sum, inv) => sum + inv.totalPaid, 0);
  const dailyTotalDue = dailySalesList.reduce((sum, inv) => sum + inv.totalDue, 0);

  // ================= EXPORTS IMPLEMENTATION =================

  // UTF-8 CSV Export compatible with Bengali fonts in Excel
  const handleExportCSV = (reportType: ReportType) => {
    let csvContent = '';
    let filename = '';

    if (reportType === 'sales') {
      filename = `sales_report_${dateFilter}.csv`;
      csvContent = 'চালান আইডি,রুট/এলাকা,কাস্টমার সংখ্যা,মোট বিক্রয়,ক্যাশ সংগ্রহ,নতুন বকেয়া\n' +
        dailySalesList.map(inv => 
          `"${inv.id}","${inv.marketName}","${inv.entries.length}","${inv.totalAmount}","${inv.totalPaid}","${inv.totalDue}"`
        ).join('\n');
    } else if (reportType === 'due') {
      filename = `customer_due_ledger.csv`;
      csvContent = 'দোকান/কাস্টমার নাম,মোবাইল নম্বর,ঠিকানা,সর্বমোট বকেয়া (৳)\n' +
        dueShops.map(s => 
          `"${s.name}","${s.phone}","${s.address}","${s.due}"`
        ).join('\n');
    } else if (reportType === 'product') {
      filename = `product_sales_velocity.csv`;
      csvContent = 'পণ্য নাম,কার্টুন বিক্রয়,খুচরা পিস বিক্রয়,মোট পিস বিক্রয়,বিক্রি মূল্য (৳),লাভ (৳)\n' +
        products.map(p => {
          const stats = productSalesMap[p.id] || { qty: 0, revenue: 0, profit: 0, cartonsSold: 0, piecesSold: 0 };
          return `"${p.name}","${stats.cartonsSold}","${stats.piecesSold}","${stats.qty}","${stats.revenue}","${Math.round(stats.profit)}"`
        }).join('\n');
    } else if (reportType === 'profit') {
      filename = `profit_loss_statement_${currentMonth}.csv`;
      csvContent = 'বিবরণ,মূল্য (৳)\n' +
        `"১. পাইকারি রাজস্ব আয় (Revenue)","${totalSalesRev}"\n` +
        `"   - ক্যাশ আদায়কৃত","${totalCashCollected}"\n` +
        `"   - বকেয়া খতিয়ান","${totalInvoicedDue}"\n` +
        `"২. বিক্রিত পণ্যের পাইকারি ক্রয় ব্যয় (COGS)","-${totalCOGS}"\n` +
        `"৩. মোট স্থূল লাভ (Gross Profit)","${grossProfit}"\n` +
        expenses.filter(exp => exp.date.startsWith(currentMonth)).map(exp => `"পরিচালন ব্যয়: ${exp.category}","-${exp.amount}"`).join('\n') + '\n' +
        `"মোট পরিচালন ব্যয়","-${totalOperatingExpenses}"\n` +
        `"নিট প্রকৃত লাভ (Net Profit)","${netProfit}"\n`;
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // High Fidelity PDF Print Report Generator
  const handlePrintPDF = (reportType: ReportType) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let reportTitle = '';
    let reportHtml = '';

    if (reportType === 'sales') {
      reportTitle = `দৈনিক ও রুটভিত্তিক বিক্রয় বিবরণী (${dateFilter})`;
      reportHtml = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="margin:0; font-size:18px;">দৈনিক ও রুটভিত্তিক বিক্রয় বিবরণী</h2>
          <p style="margin:5px 0 0 0; font-size:12px; color:#555;">তারিখ: ${dateFilter}</p>
        </div>
        <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; font-family: sans-serif;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th>চালান আইডি</th>
              <th>বাজার/এলাকা রুট</th>
              <th style="text-align: center;">কাস্টমার সংখ্যা</th>
              <th style="text-align: right;">মোট বিক্রয়</th>
              <th style="text-align: right;">ক্যাশ সংগ্রহ</th>
              <th style="text-align: right;">বকেয়া দেনা</th>
            </tr>
          </thead>
          <tbody>
            ${dailySalesList.map(inv => `
              <tr>
                <td style="font-family: monospace; font-weight: bold;">${inv.id}</td>
                <td><strong>${inv.marketName}</strong></td>
                <td style="text-align: center;">${inv.entries.length} জন</td>
                <td style="text-align: right;">৳${inv.totalAmount.toLocaleString('bn-BD')}</td>
                <td style="text-align: right; color: #16a34a;">৳${inv.totalPaid.toLocaleString('bn-BD')}</td>
                <td style="text-align: right; color: #dc2626;">৳${inv.totalDue.toLocaleString('bn-BD')}</td>
              </tr>
            `).join('')}
            ${dailySalesList.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding: 20px; color: #777;">কোনো চালান পাওয়া যায়নি</td></tr>` : ''}
            <tr style="font-weight: bold; background: #e2e8f0; font-size:13px;">
              <td colspan="2">সর্বমোট দৈনিক হিসাব</td>
              <td style="text-align: center;">${dailySalesList.reduce((s, i) => s + i.entries.length, 0)} জন</td>
              <td style="text-align: right;">৳${dailyTotalSales.toLocaleString('bn-BD')}</td>
              <td style="text-align: right; color: #16a34a;">৳${dailyTotalPaid.toLocaleString('bn-BD')}</td>
              <td style="text-align: right; color: #dc2626;">৳${dailyTotalDue.toLocaleString('bn-BD')}</td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (reportType === 'due') {
      reportTitle = 'বকেয়া কাস্টমার খতিয়ান বিবরণী';
      reportHtml = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="margin:0; font-size:18px;">বকেয়া কাস্টমার খতিয়ান বিবরণী</h2>
          <p style="margin:5px 0 0 0; font-size:12px; color:#555;">মোট কাস্টমার বকেয়া: ৳${overallCustomerDue.toLocaleString('bn-BD')}</p>
        </div>
        <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; font-family: sans-serif;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="width: 50px;">ক্রমিক</th>
              <th>দোকানের নাম / কাস্টমার</th>
              <th>মোবাইল নম্বর</th>
              <th>ঠিকানা</th>
              <th style="text-align: right;">মোট বকেয়া পাওনা</th>
            </tr>
          </thead>
          <tbody>
            ${dueShops.map((s, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${s.name}</strong></td>
                <td>${s.phone}</td>
                <td>${s.address}</td>
                <td style="text-align: right; font-weight: bold; color: #dc2626; font-size:13px;">৳${s.due.toLocaleString('bn-BD')}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; background: #e2e8f0; font-size: 13px;">
              <td colspan="4" style="text-align: right;">সর্বমোট বকেয়া:</td>
              <td style="text-align: right; color: #dc2626;">৳${overallCustomerDue.toLocaleString('bn-BD')}</td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (reportType === 'product') {
      reportTitle = 'পণ্য বিক্রয়ের গতিবেগ ও লাভ বিবরণী';
      reportHtml = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="margin:0; font-size:18px;">পণ্য বিক্রয়ের গতিবেগ ও লাভ বিবরণী</h2>
          <p style="margin:5px 0 0 0; font-size:12px; color:#555;">পাইকারি পণ্য ভিত্তিক পারফরম্যান্স রিপোর্ট</p>
        </div>
        <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; font-family: sans-serif;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th>পণ্য নাম</th>
              <th style="text-align: center;">কার্টুন বিক্রয়</th>
              <th style="text-align: center;">পিস বিক্রয়</th>
              <th style="text-align: center;">মোট পিস</th>
              <th style="text-align: right;">মোট বিক্রি মূল্য</th>
              <th style="text-align: right;">অর্জিত লাভ (৳)</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => {
              const stats = productSalesMap[p.id] || { qty: 0, revenue: 0, profit: 0, cartonsSold: 0, piecesSold: 0 };
              return `
                <tr>
                  <td><strong>${p.name}</strong></td>
                  <td style="text-align: center;">${stats.cartonsSold} কা</td>
                  <td style="text-align: center;">${stats.piecesSold} পি</td>
                  <td style="text-align: center; font-weight: bold;">${stats.qty} পিস</td>
                  <td style="text-align: right;">৳${stats.revenue.toLocaleString('bn-BD')}</td>
                  <td style="text-align: right; font-weight: bold; color: #16a34a; font-size:13px;">৳${Math.round(stats.profit).toLocaleString('bn-BD')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'profit') {
      reportTitle = 'মাসিক আর্থিক লাভ-লোকসান বিবরণী';
      reportHtml = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="margin:0; font-size:18px;">লাভ-লোকসান খতিয়ান বিবরণী</h2>
          <p style="margin:5px 0 0 0; font-size:12px; color:#555;">মাস: জুলাই, ২০২৬</p>
        </div>
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 25px; font-family: sans-serif; font-size: 13px; border-radius: 12px; background: #f8fafc;">
          <h3 style="text-align: center; margin: 0 0 15px 0; font-size:16px;">ফ্রেন্ডস এন্টারপ্রাইজ লাভ লোকসান হিসাব</h3>
          <hr style="border:0; border-top: 1px solid #cbd5e1; margin: 15px 0;"/>
          <p style="margin: 8px 0;"><strong>১. পাইকারি রাজস্ব আয় (Revenue):</strong> <span style="float: right; font-weight: bold;">৳${totalSalesRev.toLocaleString('bn-BD')}</span></p>
          <p style="padding-left: 20px; font-size: 11px; color: #64748b; margin: 2px 0;">ক্যাশ সংগ্রহ: ৳${totalCashCollected.toLocaleString('bn-BD')} | নতুন বকেয়া: ৳${totalInvoicedDue.toLocaleString('bn-BD')}</p>
          <p style="margin: 8px 0;"><strong>২. বিক্রিত পণ্যের পাইকারি ক্রয় খরচ (COGS):</strong> <span style="float: right; font-weight: bold; color:#dc2626;">(৳${totalCOGS.toLocaleString('bn-BD')})</span></p>
          <hr style="border:0; border-top: 1px dashed #cbd5e1; margin: 15px 0;"/>
          <h4 style="background: #e2e8f0; padding: 10px; border-radius: 6px; margin: 0; font-size:14px;">৩. মোট স্থূল লাভ (Gross Profit): <span style="float: right; color:#16a34a;">৳${grossProfit.toLocaleString('bn-BD')}</span></h4>
          <p style="margin: 15px 0 5px 0;"><strong>৪. পরিচালন ব্যয়সমূহ (Operating Expenses):</strong></p>
          ${expenses.filter(exp => exp.date.startsWith(currentMonth)).map(exp => `
            <p style="padding-left: 20px; font-size: 12px; margin: 4px 0;">${exp.category}: <span style="float: right;">৳${exp.amount.toLocaleString('bn-BD')}</span></p>
          `).join('')}
          ${expenses.filter(exp => exp.date.startsWith(currentMonth)).length === 0 ? '<p style="padding-left: 20px; font-size:12px; color:#aaa; font-style:italic;">পরিচালন ব্যয় পাওয়া যায়নি</p>' : ''}
          <p style="padding-left: 20px; font-weight: bold; margin: 10px 0;">মোট পরিচালন ব্যয়: <span style="float: right; color:#dc2626;">(৳${totalOperatingExpenses.toLocaleString('bn-BD')})</span></p>
          <hr style="border:0; border-top: 1px solid #cbd5e1; margin: 15px 0;"/>
          <h3 style="background: ${netProfit >= 0 ? '#d1fae5' : '#fee2e2'}; color: ${netProfit >= 0 ? '#065f46' : '#991b1b'}; padding: 12px; border-radius: 8px; text-align: center; margin: 0; font-size: 15px;">
            নিট প্রকৃত লাভ (Net Profit): ৳${netProfit.toLocaleString('bn-BD')}
          </h3>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #1e293b; line-height: 1.5; }
            h1, h2, h3, h4 { color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 30px;">
            <div>
              <h1 style="margin: 0; font-size: 24px;">ফ্রেন্ডস এন্টারপ্রাইজ</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">এফএমসিজি ডিস্ট্রিবিউটর ও হোলসেল | প্রোপরাইটর: ফরহাদুল হক</p>
            </div>
            <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">পিডিএফ হিসেবে ডাউনলোড / প্রিন্ট করুন</button>
          </div>
          ${reportHtml}
          <div style="margin-top: 60px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b;">
            <p>রিপোর্ট তৈরির তারিখ: ${new Date().toLocaleDateString('bn-BD')}</p>
            <p style="border-top: 1px solid #64748b; padding-top: 5px; width: 150px; text-align: center;">স্বাক্ষর: ফরহাদুল হক</p>
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

  return (
    <div className="space-y-6" id="reports-screen">
      
      {/* Sidebar-like report type selectors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <button
          onClick={() => setActiveReport('sales')}
          className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
            activeReport === 'sales' ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          id="btn-report-sales"
        >
          <Calendar className="w-5 h-5" />
          বিক্রয় ও চালানের বিবরণী
        </button>
        <button
          onClick={() => setActiveReport('due')}
          className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
            activeReport === 'due' ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          id="btn-report-due"
        >
          <AlertTriangle className="w-5 h-5" />
          বকেয়া গ্রাহক খতিয়ান
        </button>
        <button
          onClick={() => setActiveReport('product')}
          className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
            activeReport === 'product' ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          id="btn-report-product"
        >
          <TrendingUp className="w-5 h-5" />
          পণ্য বিক্রয়ের गतिবেগ
        </button>
        <button
          onClick={() => setActiveReport('profit')}
          className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
            activeReport === 'profit' ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          id="btn-report-profit"
        >
          <Calculator className="w-5 h-5" />
          মাসিক লাভ-লোকসান বিবরণী
        </button>
      </div>

      {/* Main Report Container */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        
        {/* --- REPORT 1: DAILY / PERIODIC SALES --- */}
        {activeReport === 'sales' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 gap-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">দৈনিক ও রুটভিত্তিক বিক্রয় বিবরণী</h3>
                <p className="text-[10px] text-slate-400">তারিখ নির্বাচন করে নির্দিষ্ট দিনের মোট চালান দেখুন</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600 shrink-0">তারিখ:</label>
                  <input 
                    type="date" 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="p-1.5 border border-slate-200 rounded text-xs focus:outline-none"
                  />
                </div>
                
                {/* Export buttons */}
                <button
                  onClick={() => handleExportCSV('sales')}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel ডাউনলোড
                </button>
                <button
                  onClick={() => handlePrintPDF('sales')}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  PDF প্রিন্ট
                </button>
              </div>
            </div>

            {/* Daily summary KPIs */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center text-xs">
              <div>
                <span className="block text-[9px] text-slate-500">দিনের মোট সেল</span>
                <span className="text-sm font-bold text-slate-800">{formatTaka(dailyTotalSales)}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-500">দিনের মোট কালেকশন</span>
                <span className="text-sm font-bold text-emerald-600">{formatTaka(dailyTotalPaid)}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-500">নতুন বকেয়া বৃদ্ধি</span>
                <span className="text-sm font-bold text-rose-600">{formatTaka(dailyTotalDue)}</span>
              </div>
            </div>

            {/* Table layout */}
            <div className="overflow-x-auto pt-2 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-2.5 px-4">চালান আইডি</th>
                    <th className="py-2.5 px-4">বাজার/এলাকা রুট</th>
                    <th className="py-2.5 px-4 text-center">কাস্টমার সংখ্যা</th>
                    <th className="py-2.5 px-4 text-right">মোট বিক্রয়</th>
                    <th className="py-2.5 px-4 text-right">ক্যাশ সংগ্রহ</th>
                    <th className="py-2.5 px-4 text-right">বকেয়া দেনা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {dailySalesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        নির্বাচিত তারিখে কোনো বিক্রয় রেকর্ড নেই!
                      </td>
                    </tr>
                  ) : (
                    dailySalesList.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{inv.id}</td>
                        <td className="py-2.5 px-4 text-slate-800 font-semibold">{inv.marketName}</td>
                        <td className="py-2.5 px-4 text-center">{toBengaliNumber(inv.entries.length)} জন</td>
                        <td className="py-2.5 px-4 text-right font-bold">{formatTaka(inv.totalAmount)}</td>
                        <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">{formatTaka(inv.totalPaid)}</td>
                        <td className="py-2.5 px-4 text-right text-rose-600 font-semibold">{formatTaka(inv.totalDue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- REPORT 2: CUSTOMER DUE LIST --- */}
        {activeReport === 'due' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 gap-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">বকেয়া আদায়ের লেজার বিবরণী</h3>
                <p className="text-[10px] text-slate-400">সর্বোচ্চ বকেয়া গ্রাহক থেকে সাজানো তালিকা</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-right text-xs mr-2">
                  <span className="text-slate-500">মোট বকেয়া: </span>
                  <span className="font-bold text-rose-600 font-mono text-sm">{formatTaka(overallCustomerDue)}</span>
                </div>
                
                {/* Export buttons */}
                <button
                  onClick={() => handleExportCSV('due')}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel ডাউনলোড
                </button>
                <button
                  onClick={() => handlePrintPDF('due')}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  PDF প্রিন্ট
                </button>
              </div>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-2.5 px-4 text-center">ক্রমিক</th>
                    <th className="py-2.5 px-4">দোকানের নাম / কাস্টমার</th>
                    <th className="py-2.5 px-4">মোবাইল নম্বর</th>
                    <th className="py-2.5 px-4">ঠিকানা</th>
                    <th className="py-2.5 px-4 text-right">সর্বমোট বকেয়া পাওনা (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {dueShops.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        বর্তমানে কোনো বকেয়া দোকান নেই! সব বকেয়া আদায় হয়েছে।
                      </td>
                    </tr>
                  ) : (
                    dueShops.map((shop, idx) => (
                      <tr key={shop.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 text-center text-slate-500">{toBengaliNumber(idx + 1)}</td>
                        <td className="py-2.5 px-4 text-slate-800 font-bold">{shop.name}</td>
                        <td className="py-2.5 px-4 text-slate-600 font-mono">{shop.phone}</td>
                        <td className="py-2.5 px-4 text-slate-500">{shop.address}</td>
                        <td className="py-2.5 px-4 text-right text-rose-600 font-extrabold font-mono text-xs">{formatTaka(shop.due)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- REPORT 3: PRODUCT VELOCITY & STOCK --- */}
        {activeReport === 'product' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 gap-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">পণ্য বিক্রয়ের গতিবেগ ও লাভ রিপোর্ট</h3>
                <p className="text-[10px] text-slate-400">কোন কোন পণ্য কী পরিমাণে বিক্রি হচ্ছে এবং অর্জিত মোট লাভ দেখুন</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Export buttons */}
                <button
                  onClick={() => handleExportCSV('product')}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel ডাউনলোড
                </button>
                <button
                  onClick={() => handlePrintPDF('product')}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  PDF প্রিন্ট
                </button>
              </div>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-2.5 px-4">পণ্যের নাম</th>
                    <th className="py-2.5 px-4 text-center">কার্টুন বিক্রি</th>
                    <th className="py-2.5 px-4 text-center">খুচরা পিস বিক্রি</th>
                    <th className="py-2.5 px-4 text-center">মোট পিস বিক্রি</th>
                    <th className="py-2.5 px-4 text-right">মোট বিক্রি মূল্য (৳)</th>
                    <th className="py-2.5 px-4 text-right">অর্জিত লাভ (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {products.map((p) => {
                    const stats = productSalesMap[p.id] || { qty: 0, revenue: 0, profit: 0, cartonsSold: 0, piecesSold: 0 };
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 text-slate-800 font-bold">{p.name}</td>
                        <td className="py-2.5 px-4 text-center font-semibold text-slate-600">{toBengaliNumber(stats.cartonsSold)} কা</td>
                        <td className="py-2.5 px-4 text-center text-slate-500">{toBengaliNumber(stats.piecesSold)} পি</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-700">{toBengaliNumber(stats.qty)} পিস</td>
                        <td className="py-2.5 px-4 text-right font-bold">{formatTaka(stats.revenue)}</td>
                        <td className="py-2.5 px-4 text-right text-emerald-600 font-extrabold">{formatTaka(Math.round(stats.profit))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- REPORT 4: MONTHLY PNL STATEMENT --- */}
        {activeReport === 'profit' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 gap-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">আর্থিক লাভ-লোকসান বিবরণী (Income Statement)</h3>
                <p className="text-[10px] text-slate-400">চলতি মাসের সামগ্রিক আর্থিক নিরীক্ষা খতিয়ান</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Export buttons */}
                <button
                  onClick={() => handleExportCSV('profit')}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel ডাউনলোড
                </button>
                <button
                  onClick={() => handlePrintPDF('profit')}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  PDF প্রিন্ট
                </button>
              </div>
            </div>

            {/* Income statement grid sheet */}
            <div className="max-w-xl mx-auto border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-slate-50 font-sans text-xs">
              <div className="bg-slate-900 text-white p-4 text-center">
                <h4 className="font-bold text-sm">ফ্রেন্ডস এন্টারপ্রাইজ</h4>
                <p className="text-[9px] text-slate-300">লাভ-লোকসান খতিয়ান (চলতি জুলাই মাস)</p>
              </div>

              <div className="p-4 space-y-3.5">
                
                {/* REVENUE */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center font-bold border-b border-slate-300 pb-1 text-slate-700">
                    <span>১. পাইকারি রাজস্ব আয় (Revenue)</span>
                    <span></span>
                  </div>
                  <div className="flex justify-between items-center pl-4 py-0.5 text-slate-600">
                    <span>মোট পণ্য বিক্রয় চালান</span>
                    <span className="font-mono">{formatTaka(totalSalesRev)}</span>
                  </div>
                  <div className="flex justify-between items-center pl-4 py-0.5 text-slate-500 text-[10px] italic">
                    <span>(ক্যাশ আদায়কৃত: {formatTaka(totalCashCollected)} | বকেয়া খতিয়ান: {formatTaka(totalInvoicedDue)})</span>
                    <span></span>
                  </div>
                </div>

                {/* COGS */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center font-bold border-b border-slate-300 pb-1 text-slate-700">
                    <span>২. বিক্রিত পণ্যের উৎপাদন/ক্রয় ব্যয় (COGS)</span>
                    <span></span>
                  </div>
                  <div className="flex justify-between items-center pl-4 py-0.5 text-slate-600">
                    <span>পণ্যের মূল পাইকারি ক্রয় খরচ</span>
                    <span className="font-mono">({formatTaka(totalCOGS)})</span>
                  </div>
                </div>

                {/* GROSS PROFIT */}
                <div className="flex justify-between items-center font-bold bg-slate-200/60 p-2 rounded text-slate-800">
                  <span>৩. মোট স্থূল লাভ (Gross Profit)</span>
                  <span className="font-mono">{formatTaka(grossProfit)}</span>
                </div>

                {/* EXPENSES */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center font-bold border-b border-slate-300 pb-1 text-slate-700">
                    <span>৪. পরিচালন ব্যয়সমূহ (Operating Expenses)</span>
                    <span></span>
                  </div>
                  {expenses
                    .filter(exp => exp.date.startsWith(currentMonth))
                    .map((exp) => (
                      <div key={exp.id} className="flex justify-between items-center pl-4 py-0.5 text-slate-600">
                        <span>{exp.category}</span>
                        <span className="font-mono">{formatTaka(exp.amount)}</span>
                      </div>
                    ))}
                  {expenses.filter(exp => exp.date.startsWith(currentMonth)).length === 0 && (
                    <div className="text-center text-slate-400 py-1 text-[11px]">কোনো পরিচালন ব্যয় এই মাসে রেকর্ড করা হয়নি।</div>
                  )}
                  <div className="flex justify-between items-center font-semibold pl-4 pt-1 text-slate-700 border-t border-dotted border-slate-300">
                    <span>মোট পরিচালন ব্যয়</span>
                    <span className="font-mono">({formatTaka(totalOperatingExpenses)})</span>
                  </div>
                </div>

                {/* NET PROFIT */}
                <div className={`flex justify-between items-center font-bold p-3.5 rounded-xl border text-sm ${
                  netProfit >= 0 ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-rose-600 text-white border-rose-700'
                }`}>
                  <span>নিট প্রকৃত লাভ (Net Profit)</span>
                  <span className="font-mono text-base">{formatTaka(netProfit)}</span>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
