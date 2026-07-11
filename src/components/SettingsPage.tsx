/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Fingerprint, 
  Download, 
  Upload, 
  RefreshCcw, 
  Lock, 
  CheckCircle, 
  FileCode, 
  Briefcase, 
  User, 
  Check,
  AlertTriangle
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsPageProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onExportDatabase: () => string;
  onImportDatabase: (code: string) => boolean;
  onResetDatabase: () => void;
}

export default function SettingsPage({
  settings,
  onSaveSettings,
  onExportDatabase,
  onImportDatabase,
  onResetDatabase
}: SettingsPageProps) {
  // Local states
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [proprietorName, setProprietorName] = useState(settings.proprietorName);
  const [isAppLockEnabled, setIsAppLockEnabled] = useState(settings.isAppLockEnabled);
  const [appLockPin, setAppLockPin] = useState(settings.appLockPin);
  const [isFingerprintEnabled, setIsFingerprintEnabled] = useState(settings.isFingerprintEnabled);

  // Backup codes
  const [backupCode, setBackupCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Biometric animation states
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      businessName,
      proprietorName,
      isAppLockEnabled,
      appLockPin,
      isFingerprintEnabled
    });
    alert('ব্যবসায়িক তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!');
  };

  const handleGenerateBackup = () => {
    const code = onExportDatabase();
    setBackupCode(code);
    setIsCopied(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(backupCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCode.trim()) return;
    
    // Save rollback snapshot
    const currentBackup = onExportDatabase();
    localStorage.setItem('fe_erp_auto_rollback', currentBackup);

    const success = onImportDatabase(importCode);
    setImportSuccess(success);
    if (success) {
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  // JSON File Import Handler
  const handleJsonFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let base64Code = '';
        if (text.trim().startsWith('{')) {
          base64Code = btoa(unescape(encodeURIComponent(text)));
        } else {
          base64Code = text.trim();
        }

        const currentBackup = onExportDatabase();
        localStorage.setItem('fe_erp_auto_rollback', currentBackup);

        const success = onImportDatabase(base64Code);
        setImportSuccess(success);
        if (success) {
          alert('ফাইল থেকে ব্যাকআপ সফলভাবে রিস্টোর করা হয়েছে! সিস্টেম রিলোড হচ্ছে...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          alert('ভুল ব্যাকআপ ফাইল! দয়া করে সঠিক ফ্রেন্ডস এন্টারপ্রাইজ ব্যাকআপ ফাইল দিন।');
        }
      } catch (err) {
        alert('ফাইল পড়তে ত্রুটি হয়েছে!');
      }
    };
    reader.readAsText(file);
  };

  // Download raw JSON Backup file
  const handleDownloadBackupFile = () => {
    const rawCode = onExportDatabase();
    const decodedText = decodeURIComponent(escape(atob(rawCode)));
    const blob = new Blob([decodedText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `friends_enterprise_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Rollback helper
  const hasRollback = !!localStorage.getItem('fe_erp_auto_rollback');
  const handleRecoverRollback = () => {
    const rollbackCode = localStorage.getItem('fe_erp_auto_rollback');
    if (rollbackCode && confirm('আপনি কি পূর্ববর্তী অটো-ব্যাকআপ রিকভার করতে চান?')) {
      const success = onImportDatabase(rollbackCode);
      if (success) {
        localStorage.removeItem('fe_erp_auto_rollback');
        alert('অটো-ব্যাকআপ সফলভাবে রিকভার করা হয়েছে!');
        window.location.reload();
      }
    }
  };

  const handleResetClick = () => {
    if (confirm('আপনি কি নিশ্চিতভাবে সম্পূর্ণ সফটওয়্যার রিসেট করতে চান? এর ফলে আপনার যুক্ত করা সকল হিসাব মুছে যাবে এবং পুনরায় ডেমো ডাটা লোড হবে।')) {
      // Save rollback snapshot
      const currentBackup = onExportDatabase();
      localStorage.setItem('fe_erp_auto_rollback', currentBackup);
      
      onResetDatabase();
      window.location.reload();
    }
  };

  // Biometric enrollment simulator
  const triggerBiometricScan = () => {
    setIsScanning(true);
    setScanSuccess(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
      setIsFingerprintEnabled(true);
      onSaveSettings({
        businessName,
        proprietorName,
        isAppLockEnabled,
        appLockPin,
        isFingerprintEnabled: true
      });
    }, 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="settings-screen">
      
      {/* Left Column: Business & Security setups */}
      <div className="lg:col-span-6 space-y-6">
        
        {/* Business Information */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-100 mb-4">
            <Briefcase className="w-4.5 h-4.5 text-indigo-500" />
            ব্যবসায়িক প্রোফাইল সেটিংস
          </h3>

          <form onSubmit={handleSaveInfo} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">প্রতিষ্ঠানের নাম (FMCG Business Name)</label>
              <input 
                type="text" 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">প্রোপরাইটর / মালিকের নাম</label>
              <input 
                type="text" 
                value={proprietorName}
                onChange={(e) => setProprietorName(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              তথ্য আপডেট করুন
            </button>
          </form>
        </div>

        {/* Security / App Lock & Biometrics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-100 mb-2">
            <Shield className="w-4.5 h-4.5 text-indigo-500" />
            নিরাপত্তা ও অ্যাপ লক (Security & Biometrics)
          </h3>

          {/* APP LOCK PIN */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="space-y-0.5 max-w-[70%]">
              <h4 className="font-bold text-slate-800 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                অ্যাপ লক সিকিউরিটি পিন (App Lock PIN)
              </h4>
              <p className="text-[10px] text-slate-500">অ্যাপ ওপেন করার সময় ৪-ডিজিটের গোপন পিন কোড যাচাই করবে</p>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="text" 
                maxLength={4}
                value={appLockPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setAppLockPin(val);
                  onSaveSettings({
                    businessName,
                    proprietorName,
                    isAppLockEnabled,
                    appLockPin: val,
                    isFingerprintEnabled
                  });
                }}
                className="w-12 p-1 border border-slate-300 rounded text-center font-mono font-bold text-sm bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  const enabled = !isAppLockEnabled;
                  setIsAppLockEnabled(enabled);
                  onSaveSettings({
                    businessName,
                    proprietorName,
                    isAppLockEnabled: enabled,
                    appLockPin,
                    isFingerprintEnabled
                  });
                }}
                className={`py-1 px-2 rounded font-bold cursor-pointer transition-colors text-[10px] ${
                  isAppLockEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {isAppLockEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
              </button>
            </div>
          </div>

          {/* BIOMETRIC FINGERPRINT */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="space-y-0.5 max-w-[70%]">
              <h4 className="font-bold text-slate-800 flex items-center gap-1">
                <Fingerprint className="w-4 h-4 text-indigo-500" />
                ফিঙ্গারপ্রিন্ট লগইন ভেরিফিকেশন (Biometrics)
              </h4>
              <p className="text-[10px] text-slate-500">মোবাইলের বায়োমেট্রিক সেন্সর ব্যবহার করে ওয়ান-ট্যাপ সিকিউর লগইন</p>
            </div>

            <div className="flex items-center gap-2">
              {isFingerprintEnabled ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsFingerprintEnabled(false);
                    onSaveSettings({
                      businessName,
                      proprietorName,
                      isAppLockEnabled,
                      appLockPin,
                      isFingerprintEnabled: false
                    });
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-1 px-3 rounded font-bold text-[10px] cursor-pointer"
                >
                  এনরোলড (অন)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={triggerBiometricScan}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded font-bold text-[10px] cursor-pointer"
                >
                  স্ক্যান করুন
                </button>
              )}
            </div>
          </div>

          {/* Scan animations representation */}
          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-slate-900 text-white rounded-xl text-center space-y-3"
              >
                <div className="relative w-12 h-12 mx-auto">
                  <Fingerprint className="w-12 h-12 text-indigo-400 animate-pulse" />
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-bounce"></div>
                </div>
                <p className="text-[10px] text-indigo-200">আঙুল বায়োমেট্রিক সেন্সরে চেপে রাখুন...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {scanSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-[10px] font-bold flex items-center gap-1.5 justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              আপনার ফিঙ্গারপ্রিন্ট বায়োমেট্রিক সফলভাবে এনরোলড করা হয়েছে!
            </div>
          )}

        </div>
      </div>

      {/* Right Column: Database Backup and Recovery */}
      <div className="lg:col-span-6 space-y-6">
        
        {/* Backup export and import */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <RefreshCcw className="w-4.5 h-4.5 text-indigo-500" />
            অফলাইন ব্যাকআপ এবং রিস্টোর (Local Backup & Restore)
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Generate Export button */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                  <Download className="w-4 h-4 text-indigo-500" />
                  ডাটা ব্যাকআপ জেনারেটর
                </h4>
                <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">সম্পূর্ণ ERP ক্লাউড-মুক্ত টেক্সট কোড বা ব্যাকআপ ফাইলে কনভার্ট করে নিরাপদ স্থানে সংরক্ষণ করুন।</p>
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={handleGenerateBackup}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded text-[10px] cursor-pointer"
                >
                  ব্যাকআপ কোড তৈরি করুন
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBackupFile}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded text-[10px] cursor-pointer"
                >
                  ব্যাকআপ ফাইল (.json) ডাউনলোড
                </button>
              </div>
            </div>

            {/* Reset Database button */}
            <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-100 space-y-2 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-rose-900 flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  ফ্যাক্টরি ডাটা রিসেট
                </h4>
                <p className="text-[9px] text-rose-500 mt-1 leading-relaxed">সকল দোকানের লেনদেন ও বকেয়া খতিয়ান সম্পূর্ণ ডিলিট করে পুনরায় প্রারম্ভিক ডেমো ডাটা ফিরিয়ে আনে।</p>
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={handleResetClick}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 rounded text-[10px] cursor-pointer"
                >
                  ERP রিসেট করুন
                </button>
                {hasRollback && (
                  <button
                    type="button"
                    onClick={handleRecoverRollback}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 rounded text-[10px] cursor-pointer animate-pulse"
                  >
                    অটো-ব্যাকআপ রিকভার করুন
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Export Code display */}
          {backupCode && (
            <div className="p-3 bg-slate-900 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-[9px] font-mono">জেনারেটেড ব্যাকআপ স্ট্রিং:</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] py-1 px-2.5 rounded font-bold cursor-pointer"
                >
                  {isCopied ? 'কপি হয়েছে!' : 'কপি করুন'}
                </button>
              </div>
              <textarea
                readOnly
                rows={3}
                value={backupCode}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-indigo-300 font-mono text-[8px] focus:outline-none select-all"
              ></textarea>
            </div>
          )}

          {/* Import database Form */}
          <div className="space-y-3.5 text-xs pt-2 border-t border-slate-100">
            {/* File Restore input picker */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-dashed border-emerald-200">
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Upload className="w-4 h-4 text-emerald-600" />
                ব্যাকআপ ফাইল আপলোড করে রিস্টোর (রীতিসম্মত পদ্ধতি)
              </label>
              <p className="text-[10px] text-slate-500 mb-3">আপনার মোবাইল বা কম্পিউটার থেকে ডাউনলোড করা ব্যাকআপ (.json) ফাইলটি সিলেক্ট করে সরাসরি রিস্টোর করুন।</p>
              
              <input 
                type="file" 
                id="json-backup-file-picker" 
                accept=".json" 
                className="hidden" 
                onChange={handleJsonFileImport} 
              />
              <button
                type="button"
                onClick={() => document.getElementById('json-backup-file-picker')?.click()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                রিস্টোর ফাইল সিলেক্ট করুন (.json)
              </button>
            </div>

            {/* Paste Code form */}
            <form onSubmit={handleImportSubmit} className="space-y-3 text-xs pt-2">
              <div>
                <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <FileCode className="w-4 h-4 text-indigo-500" />
                  বা ব্যাকআপ টেক্সট কোড পেস্ট করুন
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="আপনার পূর্বে কপি করা টেক্সট ব্যাকআপ কোডটি এখানে পেস্ট করুন..."
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-[8px]"
                ></textarea>
              </div>

              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                টেক্সট কোড রিস্টোর করুন
              </button>

              {importSuccess === true && (
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded border border-emerald-100 font-bold text-[10px] text-center">
                  ডাটা সফলভাবে রিস্টোর হয়েছে! সিস্টেম রিলোড হচ্ছে...
                </div>
              )}
              {importSuccess === false && (
                <div className="p-2 bg-rose-50 text-rose-800 rounded border border-rose-100 font-bold text-[10px] text-center">
                  দুঃখিত! ব্যাকআপ কোডটি সঠিক নয়। অনুগ্রহ করে পুনরায় সঠিক কোড কপি করুন।
                </div>
              )}
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
