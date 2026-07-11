/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  CircleDollarSign, 
  Wallet, 
  AlertTriangle, 
  Briefcase, 
  Lightbulb,
  Box,
  Percent,
  TrendingDown
} from 'lucide-react';
import { Shop, Product, MarketVisitInvoice, ExpenseRecord } from '../types';

interface DashboardProps {
  shops: Shop[];
  products: Product[];
  invoices: MarketVisitInvoice[];
  expenses: ExpenseRecord[];
}

export default function Dashboard({ shops, products, invoices, expenses }: DashboardProps) {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Formatting helpers
  const formatTaka = (amount: number) => {
    return `৳${amount.toLocaleString('bn-BD')}`;
  };

  const toBengaliNumber = (num: number) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
  };

  // Calculations
  const todayStr = '2026-07-10'; // Simulated current date
  const currentMonth = '2026-07';

  // 1. Today's Sales
  const todayInvoices = invoices.filter(inv => inv.date === todayStr);
  const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  // 2. Monthly Sales
  const monthlyInvoices = invoices.filter(inv => inv.date.startsWith(currentMonth));
  const monthlySales = monthlyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  // 3. Collections (Today & Monthly)
  const todayCollections = todayInvoices.reduce((sum, inv) => sum + inv.totalPaid, 0);
  const monthlyCollections = monthlyInvoices.reduce((sum, inv) => sum + inv.totalPaid, 0);

  // 4. Total Dues
  const totalDues = shops.reduce((sum, shop) => sum + shop.due, 0);

  // 5. Expenses
  const monthlyExpenses = expenses
    .filter(exp => exp.date.startsWith(currentMonth))
    .reduce((sum, exp) => sum + exp.amount, 0);

  // 6. Profits (Sales Revenue - Cost of Goods Sold - Expenses)
  // Let's compute profit from invoice sales
  let monthlyCOGS = 0;
  monthlyInvoices.forEach(inv => {
    inv.entries.forEach(entry => {
      entry.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const purchasePrice = prod ? prod.purchasePrice : item.price * 0.8; // Fallback COGS
        monthlyCOGS += purchasePrice * item.quantity;
      });
    });
  });

  const grossProfit = monthlySales - monthlyCOGS;
  const netProfit = grossProfit - monthlyExpenses;

  // 7. Current Stock Value & Low Stock items count
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
  const lowStockItems = products.filter(p => p.stock <= p.minStockAlert);

  // Analytics messages generator
  const getAnalyticsSuggestions = () => {
    const alerts = [];
    if (totalDues > monthlySales * 0.5) {
      alerts.push({
        title: 'বকেয়া কালেকশন তাগিদ',
        desc: `বর্তমান বকেয়া (${formatTaka(totalDues)}) এই মাসের মোট বিক্রির ৫০% এর বেশি। আদায়ের গতি বাড়াতে হবে।`,
        type: 'warning'
      });
    } else {
      alerts.push({
        title: 'বকেয়া নিয়ন্ত্রণ',
        desc: 'আপনার বকেয়া আদায়ের হার সন্তোষজনক সীমার মধ্যে রয়েছে।',
        type: 'success'
      });
    }

    if (lowStockItems.length > 0) {
      alerts.push({
        title: 'স্বল্প স্টক সতর্কতা',
        desc: `${toBengaliNumber(lowStockItems.length)}টি পণ্য রি-অর্ডার লেভেলে রয়েছে। দ্রুত স্টক-ইন সম্পন্ন করুন।`,
        type: 'danger'
      });
    }

    if (netProfit > monthlyExpenses) {
      alerts.push({
        title: 'লাভজনক ব্যবসা',
        desc: `পরিচালন খরচের চেয়ে নিট প্রফিট বেশি। ফ্রেন্ডস এন্টারপ্রাইজ সঠিক ধারায় এগোচ্ছে।`,
        type: 'success'
      });
    } else {
      alerts.push({
        title: 'ব্যয় হ্রাস করুন',
        desc: 'ব্যবসায়িক খরচ কমাতে ডেলিভারি রুট পুনর্বিন্যাস বা অতিরিক্ত ভ্যান খরচ কমানোর চেষ্টা করুন।',
        type: 'warning'
      });
    }

    return alerts;
  };

  // Pie Chart Data: Category Breakdown of Stock Value
  const categoriesMap: { [key: string]: number } = {};
  products.forEach(p => {
    categoriesMap[p.category] = (categoriesMap[p.category] || 0) + (p.stock * p.sellingPrice);
  });
  const pieColors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const pieData = Object.entries(categoriesMap).map(([name, value], idx) => ({
    name,
    value,
    color: pieColors[idx % pieColors.length]
  }));
  const totalCategoryValue = pieData.reduce((sum, item) => sum + item.value, 0) || 1;

  // Bar Chart Data: Sales for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const daysInBengali = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
  const barData = last7Days.map(dateStr => {
    const dateObj = new Date(dateStr);
    const dayName = daysInBengali[dateObj.getDay()];
    const daySales = invoices
      .filter(inv => inv.date === dateStr)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    return {
      date: dateStr,
      label: dayName,
      sales: daySales
    };
  });
  const maxSales = Math.max(...barData.map(d => d.sales), 1000);

  // Line Chart Data: Monthly Sales vs Collections Cumulative trend (simulated 4-part milestones)
  const lineData = [
    { label: '১ম সপ্তাহ', sales: monthlySales * 0.25, collections: monthlyCollections * 0.22 },
    { label: '২য় সপ্তাহ', sales: monthlySales * 0.55, collections: monthlyCollections * 0.48 },
    { label: '৩য় সপ্তাহ', sales: monthlySales * 0.82, collections: monthlyCollections * 0.75 },
    { label: '৪র্থ সপ্তাহ', sales: monthlySales, collections: monthlyCollections },
  ];
  const maxLineVal = Math.max(...lineData.flatMap(d => [d.sales, d.collections]), 1000);

  return (
    <div className="space-y-6" id="dashboard-screen">
      {/* Proprietor & Business Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 rounded-2xl text-white shadow-md flex justify-between items-center relative overflow-hidden">
        <div className="z-10">
          <span className="bg-emerald-500/30 text-emerald-100 text-xs px-2.5 py-1 rounded-full font-medium border border-emerald-400/30">
            FMCG ডিস্ট্রিবিউশন প্ল্যাটফর্ম
          </span>
          <h2 className="text-2xl font-bold mt-2 font-sans tracking-tight">ফ্রেন্ডস এন্টারপ্রাইজ</h2>
          <p className="text-emerald-100/90 text-sm mt-1">প্রোপরাইটর: ফরহাদুল হক (Forhadul Hoque)</p>
        </div>
        <div className="hidden sm:block z-10 text-right">
          <p className="text-emerald-200 text-xs font-mono">সিস্টেম স্ট্যাটাস</p>
          <p className="text-lg font-semibold text-emerald-100 font-mono">১০০% অফলাইন মুড</p>
          <p className="text-xs text-emerald-200 mt-1">আজকের তারিখ: ১০ জুলাই, ২০২৬</p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
      </div>

      {/* Primary Analytics KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Today Sales */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between"
          id="kpi-today-sales"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">আজকের</span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500">আজকের মোট বিক্রি</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{formatTaka(todaySales)}</p>
          </div>
        </motion.div>

        {/* Monthly Sales */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between"
          id="kpi-monthly-sales"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">মাসিক</span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500">চলতি মাসের বিক্রি</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{formatTaka(monthlySales)}</p>
          </div>
        </motion.div>

        {/* Collections */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between"
          id="kpi-collections"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-medium">আদায়কৃত</span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500">চলতি মাসের কালেকশন</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{formatTaka(monthlyCollections)}</p>
          </div>
        </motion.div>

        {/* Due */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex flex-col justify-between"
          id="kpi-due"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-medium">বকেয়া</span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500">মোট কাস্টমার বকেয়া</p>
            <p className="text-lg font-bold text-rose-600 mt-0.5">{formatTaka(totalDues)}</p>
          </div>
        </motion.div>

        {/* Expenses */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between"
          id="kpi-expenses"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium">খরচ</span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500">চলতি মাসের খরচ</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{formatTaka(monthlyExpenses)}</p>
          </div>
        </motion.div>

        {/* Net Profit */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-between"
          id="kpi-profit"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
              <Percent className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-teal-100/50 text-teal-800 px-2 py-0.5 rounded font-medium">নিট প্রফিট</span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500">চলতি মাসের নিট লাভ</p>
            <p className={`text-lg font-bold mt-0.5 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatTaka(netProfit)}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Stock Summary Small Info Card */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-700">বর্তমান ইনভেন্টরি স্টক মূল্য</h4>
            <p className="text-base font-bold text-slate-900">{formatTaka(totalStockValue)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lowStockItems.length > 0 ? (
            <div className="bg-amber-100 border border-amber-200 text-amber-800 text-xs py-1 px-3 rounded-full flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{toBengaliNumber(lowStockItems.length)}টি পণ্যের স্টক কম!</span>
            </div>
          ) : (
            <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs py-1 px-3 rounded-full flex items-center gap-1.5">
              <span>সব পণ্যের স্টক পর্যাপ্ত</span>
            </div>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Bar Chart - Weekly Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between" id="weekly-sales-chart">
          <div>
            <h3 className="text-sm font-bold text-slate-800">সাপ্তাহিক বিক্রয় চার্ট (গত ৭ দিন)</h3>
            <p className="text-[11px] text-slate-400">বার প্রতি বিক্রয়ের পরিমাণ নির্দেশ করে</p>
          </div>

          <div className="h-44 mt-6 flex items-end justify-between relative">
            {/* Guide Gridlines */}
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-100 text-[9px] text-slate-300 pt-0.5">{formatTaka(maxSales)}</div>
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-100 text-[9px] text-slate-300 pt-0.5">{formatTaka(maxSales / 2)}</div>
            <div className="absolute inset-x-0 bottom-0 border-b border-slate-200"></div>

            {/* Bars */}
            {barData.map((d, i) => {
              const heightPct = Math.max((d.sales / maxSales) * 100, 3); // Minimum visible height
              return (
                <div key={i} className="flex flex-col items-center flex-1 group z-10">
                  <div className="relative w-full flex justify-center">
                    {/* Tooltip */}
                    <div className="absolute -top-8 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 shadow">
                      {formatTaka(d.sales)}
                    </div>
                    {/* Animated Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className={`w-6 sm:w-8 rounded-t-md transition-colors cursor-pointer ${
                        hoveredBar === i ? 'bg-indigo-600' : 'bg-indigo-400'
                      }`}
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)}
                    ></motion.div>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 font-medium">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Line Chart - Cumulative Sales vs Collections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between" id="sales-vs-collections-chart">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-800">বিক্রয় বনাম কালেকশন অগ্রগতি</h3>
                <p className="text-[11px] text-slate-400">মাসিক ক্রমযোজিত ধারা</p>
              </div>
              <div className="flex gap-2 text-[10px]">
                <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full inline-block"></span> বিক্রি
                </span>
                <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span> কালেকশন
                </span>
              </div>
            </div>
          </div>

          <div className="h-44 mt-6 relative">
            <div className="absolute inset-y-0 left-0 flex flex-col justify-between text-[9px] text-slate-300 pointer-events-none">
              <span>{formatTaka(maxLineVal)}</span>
              <span>{formatTaka(maxLineVal / 2)}</span>
              <span>৳০</span>
            </div>

            <svg className="w-full h-full pt-2" viewBox="0 0 300 120" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="10" x2="300" y2="10" stroke="#f1f5f9" strokeDasharray="3,3" />
              <line x1="0" y1="60" x2="300" y2="60" stroke="#f1f5f9" strokeDasharray="3,3" />
              <line x1="0" y1="110" x2="300" y2="110" stroke="#e2e8f0" />

              {/* Generate Sales Path */}
              {(() => {
                const points = lineData.map((d, idx) => {
                  const x = (idx / 3) * 300;
                  const y = 110 - (d.sales / maxLineVal) * 100;
                  return `${x},${y}`;
                }).join(' ');
                return (
                  <>
                    <polyline fill="none" stroke="#4f46e5" strokeWidth="2.5" points={points} />
                    {lineData.map((d, idx) => {
                      const x = (idx / 3) * 300;
                      const y = 110 - (d.sales / maxLineVal) * 100;
                      return <circle key={`s-${idx}`} cx={x} cy={y} r="3.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="1" className="cursor-pointer group" />;
                    })}
                  </>
                );
              })()}

              {/* Generate Collections Path */}
              {(() => {
                const points = lineData.map((d, idx) => {
                  const x = (idx / 3) * 300;
                  const y = 110 - (d.collections / maxLineVal) * 100;
                  return `${x},${y}`;
                }).join(' ');
                return (
                  <>
                    <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={points} strokeDasharray="1,0" />
                    {lineData.map((d, idx) => {
                      const x = (idx / 3) * 300;
                      const y = 110 - (d.collections / maxLineVal) * 100;
                      return <circle key={`c-${idx}`} cx={x} cy={y} r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" className="cursor-pointer" />;
                    })}
                  </>
                );
              })()}
            </svg>

            {/* X Labels */}
            <div className="flex justify-between text-[9px] text-slate-400 mt-1.5 px-1 font-medium">
              {lineData.map((d, i) => <span key={i}>{d.label}</span>)}
            </div>
          </div>
        </div>

        {/* 3. Pie Chart - Stock Value Categories */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between" id="category-distribution-chart">
          <div>
            <h3 className="text-sm font-bold text-slate-800">পণ্য ক্যাটাগরি অনুসারে মজুদ মূল্য</h3>
            <p className="text-[11px] text-slate-400">টাকার মূল্যে অনুপাত বিন্যাস</p>
          </div>

          <div className="flex items-center justify-between gap-4 mt-4">
            {/* Pie SVG */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {/* Background base circle */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                
                {/* Dynamically construct slices */}
                {(() => {
                  let accumulatedPercent = 0;
                  return pieData.map((d, i) => {
                    const percent = (d.value / totalCategoryValue) * 100;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = 100 - accumulatedPercent;
                    accumulatedPercent += percent;

                    return (
                      <circle
                        key={i}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke={d.color}
                        strokeWidth={hoveredSlice === i ? "4.5" : "3.5"}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredSlice(i)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Display hovered info in the center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400">মোট মজুদ</span>
                <span className="text-xs font-bold text-slate-800">{formatTaka(totalStockValue)}</span>
              </div>
            </div>

            {/* Custom Interactive Legend */}
            <div className="flex-1 space-y-1 text-xs">
              {pieData.map((d, i) => {
                const percent = ((d.value / totalCategoryValue) * 100).toFixed(0);
                return (
                  <div 
                    key={i} 
                    className={`flex justify-between items-center px-1.5 py-0.5 rounded transition-colors ${
                      hoveredSlice === i ? 'bg-slate-50 font-semibold' : ''
                    }`}
                    onMouseEnter={() => setHoveredSlice(i)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    <span className="flex items-center gap-1.5 text-slate-600 truncate max-w-[80px]">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: d.color }}></span>
                      {d.name}
                    </span>
                    <span className="text-slate-500 text-[10px] font-mono">{percent}% ({formatTaka(d.value)})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Business Analytics Panel (বুদ্ধিদীপ্ত বিশ্লেষণ) */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800" id="business-analytics-panel">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-amber-400 w-5 h-5" />
          <h3 className="font-bold text-sm">বুদ্ধিদীপ্ত ব্যবসায়িক বিশ্লেষণ ও পরামর্শ</h3>
        </div>
        <p className="text-slate-400 text-xs mt-1">ফিজিক্যাল ডেটা ট্রেন্ড এবং ডিস্ট্রিবিউশন মডেলের ওপর ভিত্তি করে তৈরি স্বয়ংক্রিয় ইনসাইটসমূহ:</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {getAnalyticsSuggestions().map((s, idx) => (
            <div key={idx} className="bg-slate-800 p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    s.type === 'danger' ? 'bg-rose-500' : s.type === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}></span>
                  <span className="text-xs font-bold text-slate-200">{s.title}</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">{s.desc}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-700/40 flex justify-end">
                <span className="text-[9px] text-slate-400 font-mono">আইডি: {toBengaliNumber(idx + 1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
