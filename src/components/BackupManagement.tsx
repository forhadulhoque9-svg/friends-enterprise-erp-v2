/**
 * Friends Enterprise ERP - Backup & Restore Management Component with Google Drive Integration
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCcw, 
  CheckCircle, 
  AlertCircle, 
  ToggleLeft, 
  ToggleRight, 
  History, 
  Trash2, 
  Cloud, 
  CloudOff, 
  HardDrive, 
  FileJson, 
  Wifi, 
  WifiOff,
  UserCheck,
  ShieldCheck,
  Settings,
  LogIn,
  LogOut,
  Clock
} from 'lucide-react';
import { BackupHelper, BackupHistoryItem } from '../utils/backupHelper';
import { initAuth, googleSignIn, logout, getAccessToken } from '../utils/firebaseAuth';
import { 
  listDriveBackups, 
  restoreFromDriveFile, 
  triggerGoogleDriveBackup, 
  hasPendingBackup, 
  processPendingUploads, 
  isOnline, 
  deleteDriveBackup,
  DriveBackupFile 
} from '../utils/gdriveSync';

interface BackupManagementProps {
  onRestoreSuccess: () => void;
}

export default function BackupManagement({ onRestoreSuccess }: BackupManagementProps) {
  // Local Backup State
  const [history, setHistory] = useState<BackupHistoryItem[]>([]);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    fileInputRef.current?.click();
  };

  // Google Drive Cloud State
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [googleUser, setGoogleUser] = useState<{ email: string | null; name: string | null }>({ email: null, name: null });
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [gdriveAutoEnabled, setGdriveAutoEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const [pendingQueue, setPendingQueue] = useState(hasPendingBackup());

  // Show status banner notification
  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => {
      setStatusMsg(null);
    }, 5000);
  };

  // Fetch backups list from Google Drive
  const fetchDriveBackups = async () => {
    if (!isOnline()) return;
    setIsSyncing(true);
    try {
      const files = await listDriveBackups();
      setDriveBackups(files);
      setPendingQueue(hasPendingBackup());
    } catch (e) {
      console.error('Error fetching Google Drive backups:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load state and listen to auth/network on mount
  useEffect(() => {
    setHistory(BackupHelper.getBackupHistory());
    setAutoBackupEnabled(BackupHelper.isAutoBackupEnabled());

    // Load GDrive Auto Backup Toggle preference
    const savedGDriveAuto = localStorage.getItem('fe_erp_gdrive_auto_backup');
    setGdriveAutoEnabled(savedGDriveAuto === null ? true : savedGDriveAuto === 'true');

    // Initialize Firebase Auth Listener
    const unsubscribeAuth = initAuth(
      (user, token) => {
        setIsSignedIn(true);
        setGoogleUser({ email: user.email, name: user.displayName });
        // Initial Drive fetch on sign-in
        fetchDriveBackups();
        // Check for any pending offline backups to process
        processPendingUploads().then(didUpload => {
          if (didUpload) {
            showStatus('success', 'অফলাইনে তৈরি পেন্ডিং ব্যাকআপ সফলভাবে গুগল ড্রাইভে সিঙ্ক করা হয়েছে!');
            setPendingQueue(false);
            fetchDriveBackups();
          }
        });
      },
      () => {
        setIsSignedIn(false);
        setGoogleUser({ email: null, name: null });
        setDriveBackups([]);
      }
    );

    // Network Online/Offline status listeners
    const handleOnline = () => {
      setOnline(true);
      // Sync pending offline backup if signed in
      if (getAccessToken()) {
        processPendingUploads().then(didUpload => {
          if (didUpload) {
            showStatus('success', 'নেটওয়ার্ক সংযুক্ত! পেন্ডিং ব্যাকআপ গুগল ড্রাইভে আপলোড করা হয়েছে।');
            setPendingQueue(false);
            fetchDriveBackups();
          }
        });
      }
    };
    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup Callback in BackupHelper to sync with Google Drive automatically
    BackupHelper.onAutoBackupTriggered = async () => {
      const isGDriveAuto = localStorage.getItem('fe_erp_gdrive_auto_backup') !== 'false';
      if (isGDriveAuto && getAccessToken()) {
        setIsSyncing(true);
        const result = await triggerGoogleDriveBackup();
        setPendingQueue(hasPendingBackup());
        if (result === 'synced') {
          fetchDriveBackups();
        }
        setIsSyncing(false);
      }
    };

    return () => {
      unsubscribeAuth();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      BackupHelper.onAutoBackupTriggered = null;
    };
  }, []);

  // Google Sign In handler
  const handleConnectDrive = async () => {
    setIsSyncing(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setIsSignedIn(true);
        setGoogleUser({ email: result.user.email, name: result.user.displayName });
        showStatus('success', 'সফলভাবে গুগল অ্যাকাউন্ট সংযুক্ত করা হয়েছে!');
        // Trigger sync of current data immediately
        const backupResult = await triggerGoogleDriveBackup();
        if (backupResult === 'synced') {
          showStatus('success', 'প্রথম ডেটা ব্যাকআপ সফলভাবে গুগল ড্রাইভে ক্লাউড সিঙ্ক করা হয়েছে!');
        }
        await fetchDriveBackups();
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      showStatus('error', 'গুগল সংযোগ স্থাপন করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Log Out handler
  const handleDisconnectDrive = async () => {
    const confirmLogout = window.confirm('আপনি কি গুগল অ্যাকাউন্ট সংযোগ বিচ্ছিন্ন করতে চান? এটি করার পরও আপনার স্থানীয় অফলাইন ব্যাকআপ নিরাপদ থাকবে।');
    if (!confirmLogout) return;

    try {
      await logout();
      setIsSignedIn(false);
      setGoogleUser({ email: null, name: null });
      setDriveBackups([]);
      showStatus('success', 'গুগল অ্যাকাউন্ট সফলভাবে বিচ্ছিন্ন করা হয়েছে।');
    } catch (err) {
      showStatus('error', 'সংযোগ বিচ্ছিন্ন করতে সমস্যা হয়েছে।');
    }
  };

  // Force trigger Google Drive manual backup
  const handleGDriveBackupNow = async () => {
    if (!isSignedIn) {
      showStatus('error', 'অনুগ্রহ করে প্রথমে গুগল অ্যাকাউন্ট সংযুক্ত করুন।');
      return;
    }
    
    setIsSyncing(true);
    try {
      // Force = true to bypass checksum comparison
      const result = await triggerGoogleDriveBackup(true);
      setPendingQueue(hasPendingBackup());
      
      if (result === 'synced') {
        showStatus('success', 'সফলভাবে গুগল ড্রাইভে নতুন ব্যাকআপ ফাইল তৈরি করা হয়েছে!');
        await fetchDriveBackups();
      } else if (result === 'queued') {
        showStatus('success', 'অফলাইন থাকার কারণে ব্যাকআপটি কিউতে রাখা হয়েছে, নেটওয়ার্ক পেলেই ড্রাইভে আপলোড হবে।');
      } else {
        showStatus('success', 'গুগল ড্রাইভে ব্যাকআপ সফলভাবে প্রসেস করা হয়েছে।');
        await fetchDriveBackups();
      }
    } catch (e) {
      showStatus('error', 'গুগল ড্রাইভে ব্যাকআপ আপলোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsSyncing(false);
    }
  };

  // Restore DB from selected Google Drive File
  const handleGDriveRestore = async (fileId: string, filename: string) => {
    const confirmRestore = window.confirm(
      `আপনি কি নিশ্চিতভাবে গুগল ড্রাইভের ব্যাকআপ ফাইল "${filename}" থেকে ডেটা রিস্টোর করতে চান? এটি আপনার বর্তমান সকল স্থানীয় ডেটা পরিবর্তন করে ফেলবে।`
    );
    if (!confirmRestore) return;

    setIsSyncing(true);
    try {
      const success = await restoreFromDriveFile(fileId);
      if (success) {
        onRestoreSuccess();
        setHistory(BackupHelper.getBackupHistory());
        showStatus('success', 'অভিনন্দন! গুগল ড্রাইভ থেকে ডেটাবেজ সফলভাবে রিস্টোর করা হয়েছে!');
      } else {
        showStatus('error', 'ডেটা রিস্টোর করতে ব্যর্থ হয়েছে। ফাইলটি ভুল অথবা ত্রুটিযুক্ত হতে পারে।');
      }
    } catch (err: any) {
      showStatus('error', err.message || 'রিস্টোর ব্যর্থ হয়েছে।');
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete specific Google Drive Backup File
  const handleDeleteDriveFile = async (fileId: string, filename: string) => {
    const confirmDel = window.confirm(`আপনি কি গুগল ড্রাইভ থেকে "${filename}" ব্যাকআপ ফাইলটি চিরতরে মুছে ফেলতে চান?`);
    if (!confirmDel) return;

    setIsSyncing(true);
    try {
      const success = await deleteDriveBackup(fileId);
      if (success) {
        showStatus('success', 'গুগল ড্রাইভ থেকে ফাইলটি মুছে ফেলা হয়েছে।');
        await fetchDriveBackups();
      } else {
        showStatus('error', 'ফাইলটি মুছতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
      }
    } catch (e) {
      showStatus('error', 'মুছে ফেলার প্রসেসে সমস্যা হয়েছে।');
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle Auto Backup (Device Local)
  const handleToggleAutoBackup = () => {
    const nextVal = !autoBackupEnabled;
    setAutoBackupEnabled(nextVal);
    BackupHelper.setAutoBackupEnabled(nextVal);
    showStatus('success', `স্বয়ংক্রিয় ব্যাকআপ ${nextVal ? 'চালু' : 'বন্ধ'} করা হয়েছে।`);
  };

  // Toggle Auto Backup (Google Drive Cloud)
  const handleToggleGDriveAuto = () => {
    const nextVal = !gdriveAutoEnabled;
    setGdriveAutoEnabled(nextVal);
    localStorage.setItem('fe_erp_gdrive_auto_backup', nextVal ? 'true' : 'false');
    showStatus('success', `গুগল ড্রাইভ অটো ক্লাউড ব্যাকআপ ${nextVal ? 'চালু' : 'বন্ধ'} করা হয়েছে।`);
  };

  // Create manual local backup and trigger file download
  const handleManualBackup = () => {
    try {
      const backup = BackupHelper.createManualBackup();
      BackupHelper.downloadBackupFile(backup);
      setHistory(BackupHelper.getBackupHistory());
      showStatus('success', 'সম্পূর্ণ এনক্রিপ্টেড ব্যাকআপ ফাইল সফলভাবে তৈরি ও ডাউনলোড করা হয়েছে!');
    } catch (e) {
      showStatus('error', 'ব্যাকআপ তৈরি করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    }
  };

  // Restore database from device uploaded file
  const handleRestoreFromData = (encryptedData: string) => {
    const confirmRestore = window.confirm(
      'আপনি কি নিশ্চিতভাবে এই ব্যাকআপটি রিস্টোর করতে চান? এটি আপনার বর্তমান সকল ডেটা পরিবর্তন করে ব্যাকআপের ডেটা সেট করবে।'
    );
    if (!confirmRestore) return;

    try {
      const success = BackupHelper.restoreFromEncryptedData(encryptedData);
      if (success) {
        onRestoreSuccess();
        setHistory(BackupHelper.getBackupHistory());
        showStatus('success', 'অভিনন্দন! ডেটাবেজ সফলভাবে পূর্বাবস্থায় ফিরিয়ে আনা হয়েছে (Restored)।');
      } else {
        showStatus('error', 'রিস্টোর করতে ব্যর্থ হয়েছে। ফাইলটি ভুল অথবা ত্রুটিযুক্ত হতে পারে।');
      }
    } catch (err: any) {
      showStatus('error', err.message || 'রিস্টোর ব্যর্থ হয়েছে।');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleRestoreFromData(content);
      }
    };
    reader.onerror = () => {
      showStatus('error', 'ফাইল পড়তে ব্যর্থ হয়েছে।');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          handleRestoreFromData(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    const confirmDel = window.confirm('আপনি কি এই ব্যাকআপ পয়েন্টটি তালিকা থেকে মুছে ফেলতে চান?');
    if (!confirmDel) return;

    const nextHistory = history.filter(item => item.id !== id);
    BackupHelper.saveBackupHistory(nextHistory);
    setHistory(nextHistory);
    showStatus('success', 'ব্যাকআপ পয়েন্টটি তালিকা থেকে মুছে ফেলা হয়েছে।');
  };

  // Bengali translation formatting helpers
  const formatBengaliNumber = (num: number | string) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '০ B';
    const k = 1024;
    const dm = 1;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const sizeVal = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
    return `${formatBengaliNumber(sizeVal)} ${sizes[i]}`;
  };

  const formatBengaliDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = date.getDate();
    const monthNames = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const timeStr = date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    return `${formatBengaliNumber(day)} ${month}, ${formatBengaliNumber(year)} - ${timeStr}`;
  };

  const formatISOToBengaliDateTime = (isoString: string) => {
    const timestamp = Date.parse(isoString);
    if (isNaN(timestamp)) return isoString;
    return formatBengaliDateTime(timestamp);
  };

  // Stats summary calculation
  const lastBackup = history.length > 0 ? history[0] : null;
  const totalBackupSize = history.reduce((sum, item) => sum + item.size, 0);

  // Sync network and queue descriptions
  const getNetworkStatusLabel = () => {
    if (!online) {
      return pendingQueue ? 'অফলাইন (কিউতে জমাকৃত)' : 'অফলাইন (ডিসকানেক্টেড)';
    }
    return pendingQueue ? 'অনলাইন (সিঙ্ক করা হচ্ছে...)' : 'সংযুক্ত (সরাসরি সিঙ্ক)';
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 font-sans">
      {/* Notifications banner */}
      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-start gap-3 shadow-md animate-fade-in transition-all ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`} id="backup-status-banner">
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold text-sm">
              {statusMsg.type === 'success' ? 'সফল হয়েছে!' : 'ত্রুটি দেখা দিয়েছে!'}
            </p>
            <p className="text-xs mt-0.5">{statusMsg.text}</p>
          </div>
        </div>
      )}

      {/* Header section with Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="backup-dashboard-stats">
        {/* Stat 1: Last Backup */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">সর্বশেষ ব্যাকআপ</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              {lastBackup ? formatBengaliDateTime(lastBackup.timestamp).split(' - ')[1] : 'নেওয়া হয়নি'}
            </p>
            <p className="text-[10px] text-slate-500">
              {lastBackup ? formatBengaliDateTime(lastBackup.timestamp).split(' - ')[0] : 'ম্যানুয়াল বা অটো'}
            </p>
          </div>
        </div>

        {/* Stat 2: Total Backups Size */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">মোট লোকাল সাইজ</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {formatFileSize(totalBackupSize)}
            </p>
            <p className="text-[10px] text-slate-500">
              সর্বোচ্চ {formatBengaliNumber(10)}টি হিস্টোরি পয়েন্ট
            </p>
          </div>
        </div>

        {/* Stat 3: Auto Backup Switch */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <RefreshCcw className={`w-6 h-6 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">অটো ব্যাকআপ স্ট্যাটাস</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              {autoBackupEnabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
            </p>
            <button 
              onClick={handleToggleAutoBackup}
              className="text-[10px] text-indigo-600 font-bold hover:underline mt-1 block"
              id="btn-toggle-auto-backup"
            >
              {autoBackupEnabled ? 'বন্ধ করুন' : 'চালু করুন'}
            </button>
          </div>
        </div>

        {/* Stat 4: Sync Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-xl ${isSignedIn ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
            <Cloud className={`w-6 h-6 ${isSyncing ? 'animate-bounce' : ''}`} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">গুগল ড্রাইভ সিঙ্ক</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              {isSignedIn ? 'সংযুক্ত (Connected)' : 'সংযোগহীন'}
            </p>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              {isSignedIn ? googleUser.email : 'গুগল ড্রাইভ বন্ধ'}
            </p>
          </div>
        </div>
      </div>

      {/* Google Drive Cloud Backup Settings & Status Dashboard */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="module-gdrive-cloud-settings">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Cloud className={`w-5 h-5 ${isSignedIn ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />
            <h3 className="font-bold text-slate-800 text-sm">গুগল ড্রাইভ ক্লাউড ব্যাকআপ (Google Drive Cloud Sync)</h3>
          </div>
          {isSyncing && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full animate-pulse">
              <RefreshCcw className="w-3 h-3 animate-spin" /> সিঙ্ক করা হচ্ছে...
            </span>
          )}
        </div>
        
        <p className="text-xs text-slate-500 leading-relaxed">
          আপনার সফটওয়্যারের সকল ডেটা নিরাপদে আপনার নিজস্ব গুগল ড্রাইভে সংরক্ষণ করুন। ড্রাইভ ব্যাকআপ চালু থাকলে যেকোনো সময়ে আপনার মূল্যবান ডেটা ক্লাউড থেকে রিস্টোর করতে পারবেন।
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Status Panel */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700">গুগল অ্যাকাউন্ট সিঙ্ক বিবরণী:</h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>সংযুক্ত অ্যাকাউন্ট:</span>
                <span className={`font-bold ${isSignedIn ? 'text-indigo-600' : 'text-slate-500'} text-[11px] flex items-center gap-1`}>
                  {isSignedIn ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      {googleUser.name} ({googleUser.email})
                    </>
                  ) : 'সংযুক্ত নেই (Disabled)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>সিঙ্ক ফোল্ডার:</span>
                <span className={`font-bold ${isSignedIn ? 'text-slate-700' : 'text-slate-400'}`}>
                  {isSignedIn ? 'Friends Enterprise ERP Backup' : 'নিষ্ক্রিয় (Inactive)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>ইন্টারনেট সিঙ্ক স্ট্যাটাস:</span>
                <span className={`inline-flex items-center gap-1 font-bold ${online ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  {getNetworkStatusLabel()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>ক্লাউড অটো সিঙ্ক:</span>
                <span className={`inline-block font-bold text-[9px] px-2.5 py-0.5 rounded-full ${gdriveAutoEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {gdriveAutoEnabled ? 'সক্রিয় (ON)' : 'নিষ্ক্রিয় (OFF)'}
                </span>
              </div>
            </div>
          </div>

          {/* User Settings/Options Panel */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-700">ড্রাইভ সিঙ্ক সেটিংস ও টগল:</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {isSignedIn 
                  ? 'আপনার গুগল অ্যাকাউন্ট সফলভাবে সংযুক্ত আছে। সফটওয়্যারের কোনো পরিবর্তন হলে ড্রাইভে স্বয়ংক্রিয় ব্যাকআপ আপলোড করা হবে।' 
                  : 'গুগল ড্রাইভ ব্যাকআপ শুরু করতে নিচের বাটনে ক্লিক করে অ্যাকাউন্ট কানেক্ট করুন। আপনার ডেটা এনক্রিপ্ট হয়ে ড্রাইভে জমা থাকবে।'}
              </p>
            </div>
            
            <div className="space-y-2">
              {/* Google Drive Auto Backup Toggle */}
              {isSignedIn && (
                <div className="flex items-center justify-between border-t border-b border-slate-200/50 py-2">
                  <span className="text-xs font-bold text-slate-700">স্বয়ংক্রিয় ক্লাউড ব্যাকআপ</span>
                  <button 
                    onClick={handleToggleGDriveAuto}
                    className="text-indigo-600 focus:outline-none"
                    title={gdriveAutoEnabled ? 'অটো ব্যাকআপ বন্ধ করুন' : 'অটো ব্যাকআপ চালু করুন'}
                  >
                    {gdriveAutoEnabled ? (
                      <ToggleRight className="w-10 h-10 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-400" />
                    )}
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {!isSignedIn ? (
                  <button
                    onClick={handleConnectDrive}
                    disabled={isSyncing}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4" />
                    গুগল অ্যাকাউন্ট সংযুক্ত করুন
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleGDriveBackupNow}
                      disabled={isSyncing}
                      className="flex-1 bg-emerald-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      ম্যানুয়ালি সিঙ্ক করুন (Backup Now)
                    </button>
                    <button
                      onClick={handleDisconnectDrive}
                      disabled={isSyncing}
                      className="bg-rose-50 text-rose-600 font-bold text-xs py-2.5 px-4 rounded-xl border border-rose-200 hover:bg-rose-100 flex items-center gap-1 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      সংযোগ বিচ্ছিন্ন
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Google Drive Rolling Restore Points */}
        {isSignedIn && (
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600" />
              গুগল ড্রাইভ ক্লাউড ব্যাকআপ হিস্টোরি (Google Drive Restore Points)
            </h4>

            {driveBackups.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <Database className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-400">গুগল ড্রাইভে কোনো ব্যাকআপ ফাইল পাওয়া যায়নি।</p>
                <button
                  onClick={handleGDriveBackupNow}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  প্রথম ক্লাউড ব্যাকআপ তৈরি করতে এখানে ক্লিক করুন
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse" id="tbl-gdrive-backup-history">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold text-[10px] border-b border-slate-100">
                      <th className="p-3">ক্রমিক</th>
                      <th className="p-3">ফাইলের নাম</th>
                      <th className="p-3">তৈরির সময় ও তারিখ</th>
                      <th className="p-3">ফাইলের আকার</th>
                      <th className="p-3 text-right">কার্যক্রম (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                    {driveBackups.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-3 font-semibold text-slate-400">{formatBengaliNumber(index + 1)}</td>
                        <td className="p-3 font-medium text-slate-800 flex items-center gap-1">
                          <Cloud className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[200px]" title={item.name}>{item.name}</span>
                        </td>
                        <td className="p-3 font-medium text-slate-600">{formatISOToBengaliDateTime(item.createdTime)}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">{formatFileSize(item.size)}</td>
                        <td className="p-3 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleGDriveRestore(item.id, item.name)}
                            disabled={isSyncing}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500 text-white hover:bg-indigo-600 rounded-lg font-bold text-[10px] shadow-sm transition-all active:scale-95 disabled:opacity-50"
                            title="গুগল ড্রাইভ থেকে রিস্টোর করুন"
                          >
                            <RefreshCcw className="w-3 h-3" />
                            রিস্টোর
                          </button>
                          <button
                            onClick={() => handleDeleteDriveFile(item.id, item.name)}
                            disabled={isSyncing}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all disabled:opacity-50"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary Action Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="backup-action-modules">
        
        {/* Module A: Device Local Backup */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Download className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">ডিভাইস ব্যাকআপ (Export to Device)</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            আপনার ERP-র সম্পূর্ণ ডেটা (দোকান তালিকা, পণ্য বিবরণী, ক্যাশ মেমো, কোম্পানি লেজার ইত্যাদি) এনক্রিপ্ট করে একটি ডাউনলোডেবল ফাইলে সংরক্ষণ করুন। এটি আপনার ডিভাইসের মেমোরিতে নিরাপদে জমা থাকবে।
          </p>
          <div className="pt-2">
            <button 
              onClick={handleManualBackup}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-3 px-4 rounded-xl text-xs hover:from-indigo-700 hover:to-blue-700 shadow-sm transition-all active:scale-[0.98]"
              id="btn-download-backup"
            >
              <Download className="w-4.5 h-4.5" />
              এনক্রিপ্টেড ব্যাকআপ ফাইল ডাউনলোড করুন
            </button>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl flex gap-2 items-start border border-slate-100">
            <ShieldCheck className="w-4.5 h-4.5 text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-slate-500">
              নিরাপত্তা সতর্কতা: তৈরি করা ফাইলটি উন্নত এনক্রিপশন যুক্ত। ব্যাকআপ ফাইলটি কোনো সাধারণ টেক্সট বা এক্সেল ফাইল নয়, এটি শুধুমাত্র এই ERP সফটওয়্যারে ব্যবহারের জন্য তৈরি করা হয়েছে।
            </p>
          </div>
        </div>

        {/* Module B: Device From Restore */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Upload className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">ডিভাইস থেকে রিস্টোর (Import from Device)</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            পূর্বে ডাউনলোড করে রাখা আপনার কাঙ্ক্ষিত এনক্রিপ্টেড ব্যাকআপ ফাইলটি সিলেক্ট করে সম্পূর্ণ ডেটাবেজ মুহূর্তেই পূর্বাবস্থায় ফিরিয়ে আনুন।
          </p>

          {/* Drag and Drop File Input Area */}
          <div 
            onClick={handleContainerClick}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer relative ${
              dragActive 
                ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]' 
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
            }`}
            id="drag-drop-restore-zone"
          >
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="space-y-2 pointer-events-none">
              <FileJson className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600">ব্যাকআপ ফাইল টেনে আনুন অথবা ক্লিক করুন</p>
              <p className="text-[10px] text-slate-400">শুধুমাত্র এনক্রিপ্টেড .json ফাইল সমর্থন করে</p>
            </div>
          </div>
        </div>

      </div>

      {/* Module C: Rolling Smart Auto-Backup History Restore Points */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="module-smart-backup-history">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">স্মার্ট লোকাল রিস্টোর পয়েন্ট হিস্টোরি (Smart Backups)</h3>
          </div>
          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">
            সর্বোচ্চ ১০টি পয়েন্ট
          </span>
        </div>
        
        <p className="text-xs text-slate-500 leading-relaxed">
          কোনো প্রকার ফাইল ডাউনলোড ছাড়াই অ্যাপটি স্বয়ংক্রিয়ভাবে আপনার ডেটা পরিবর্তনের সময়ে রিস্টোর পয়েন্ট তৈরি করে। আপনার প্রয়োজন অনুসারে নিচের তালিকাভুক্ত যেকোনো রিস্টোর পয়েন্টে ১-ক্লিকে ফিরে যান।
        </p>

        {history.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <Database className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-400">এখনও কোনো ব্যাকআপ পয়েন্ট তৈরি করা হয়নি।</p>
            <p className="text-[10px] text-slate-300">তথ্য যুক্ত বা পরিবর্তন করলে স্বয়ংক্রিয়ভাবে ব্যাকআপ পয়েন্ট তৈরি হবে।</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse" id="tbl-backup-history">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold text-[10px] border-b border-slate-100">
                  <th className="p-3">ক্রমিক</th>
                  <th className="p-3">তৈরির সময় ও তারিখ</th>
                  <th className="p-3">ব্যাকআপ ধরণ</th>
                  <th className="p-3">ফাইলের আকার</th>
                  <th className="p-3 text-right">কার্যক্রম (Actions)</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                {history.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="p-3 font-semibold text-slate-400">{formatBengaliNumber(index + 1)}</td>
                    <td className="p-3 font-medium text-slate-800">{formatBengaliDateTime(item.timestamp)}</td>
                    <td className="p-3">
                      {item.type === 'auto' ? (
                        <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] px-2 py-0.5 rounded-md font-bold">
                          স্বয়ংক্রিয় (Auto)
                        </span>
                      ) : (
                        <span className="inline-block bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] px-2 py-0.5 rounded-md font-bold">
                          ম্যানুয়াল (Manual)
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">{formatFileSize(item.size)}</td>
                    <td className="p-3 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => BackupHelper.downloadBackupFile(item)}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                        title="ডাউনলোড করুন"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRestoreFromData(item.data)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg font-bold text-[10px] shadow-sm transition-all active:scale-95"
                        title="রিস্টোর করুন"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        রিস্টোর
                      </button>
                      <button
                        onClick={() => handleDeleteHistoryItem(item.id)}
                        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                        title="মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
