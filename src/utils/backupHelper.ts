/**
 * Friends Enterprise ERP - Secure Backup & Restore Utility
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../db';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface BackupHistoryItem {
  id: string;
  timestamp: number;
  size: number;
  type: 'auto' | 'manual';
  data: string; // Encrypted JSON payload string
}

const HISTORY_KEY = 'fe_erp_backups_history';
const AUTO_BACKUP_ENABLED_KEY = 'fe_erp_auto_backup_enabled';
const LAST_BACKUP_HASH_KEY = 'fe_erp_last_backup_hash';

// Secret encryption key
const SECRET_KEY = 'FriendsEnterpriseERPv2SecretKey2026';

/**
 * Robust symmetric encryption
 * Encrypts cleartext into base64 encoded and obfuscated cipher
 */
export function encryptBackup(text: string): string {
  // 1. Convert Unicode text to standard base64
  const base64Text = btoa(unescape(encodeURIComponent(text)));
  
  // 2. XOR each char of the base64 string
  let xorChars = '';
  for (let i = 0; i < base64Text.length; i++) {
    const charCode = base64Text.charCodeAt(i);
    const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    xorChars += String.fromCharCode(charCode ^ keyChar);
  }
  
  // 3. Encode the XOR'ed string to base64
  const encryptedData = btoa(xorChars);
  
  const payload = {
    v: '2.0',
    app: 'FriendsEnterpriseERP',
    ts: Date.now(),
    data: encryptedData
  };
  
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

/**
 * Decrypts a base64 encoded cipher back to JSON string
 */
export function decryptBackup(encryptedBase64: string): string {
  try {
    const decodedPayload = decodeURIComponent(escape(atob(encryptedBase64)));
    const parsed = JSON.parse(decodedPayload);
    
    if (parsed.app !== 'FriendsEnterpriseERP' || !parsed.data) {
      throw new Error('Invalid backup file structure.');
    }
    
    // If it's version 2.0 (our new safe format)
    if (parsed.v === '2.0') {
      const xorChars = atob(parsed.data);
      let base64Text = '';
      for (let i = 0; i < xorChars.length; i++) {
        const charCode = xorChars.charCodeAt(i);
        const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
        base64Text += String.fromCharCode(charCode ^ keyChar);
      }
      return decodeURIComponent(escape(atob(base64Text)));
    }
    
    // Otherwise, fallback to the old version 1.0 format decryption
    const xorString = decodeURIComponent(escape(atob(parsed.data)));
    let result = '';
    for (let i = 0; i < xorString.length; i++) {
      const charCode = xorString.charCodeAt(i);
      const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      const xorValue = charCode ^ keyChar;
      result += String.fromCharCode(xorValue);
    }
    return result;
  } catch (error) {
    throw new Error('Failed to decrypt data. The file might be corrupted or invalid.');
  }
}

/**
 * Get current DB state payload as raw JSON string
 */
export function getDatabaseRawState(): string {
  const data = {
    shops: db.getShops(),
    products: db.getProducts(),
    ledgers: db.getLedgers(),
    invoices: db.getInvoices(),
    hawlats: db.getHawlats(),
    inventoryLogs: db.getInventoryLogs(),
    purchases: db.getPurchases(),
    expenses: db.getExpenses(),
    settings: db.getSettings(),
    returns: db.getReturns(),
    distReturns: db.getDistReturns(),
    damagedStocks: db.getDamagedStocks(),
    companies: db.getCompanies(),
    companyLedgers: db.getCompanyLedgers(),
  };
  return JSON.stringify(data);
}

/**
 * Simple hash/checksum helper to detect state changes quickly
 */
export function getChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

export const BackupHelper = {
  // Callback hook for Google Drive sync to avoid circular dependencies
  onAutoBackupTriggered: null as (() => void) | null,

  // Toggle Auto Backup state
  isAutoBackupEnabled: (): boolean => {
    const val = localStorage.getItem(AUTO_BACKUP_ENABLED_KEY);
    return val === null ? true : val === 'true'; // Default to true
  },

  setAutoBackupEnabled: (enabled: boolean): void => {
    localStorage.setItem(AUTO_BACKUP_ENABLED_KEY, enabled ? 'true' : 'false');
  },

  // Get list of local backups
  getBackupHistory: (): BackupHistoryItem[] => {
    try {
      const val = localStorage.getItem(HISTORY_KEY);
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  },

  // Save history
  saveBackupHistory: (history: BackupHistoryItem[]): void => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },

  // Create manual backup
  createManualBackup: (): BackupHistoryItem => {
    const rawState = getDatabaseRawState();
    const encrypted = encryptBackup(rawState);
    const checksum = getChecksum(rawState);
    
    const newItem: BackupHistoryItem = {
      id: `bk-manual-${Date.now()}`,
      timestamp: Date.now(),
      size: new Blob([encrypted]).size,
      type: 'manual',
      data: encrypted
    };

    let history = BackupHelper.getBackupHistory();
    history = [newItem, ...history].slice(0, 10); // Keep only latest 10
    BackupHelper.saveBackupHistory(history);
    
    // Save state checksum to avoid duplicate auto-backups immediately
    localStorage.setItem(LAST_BACKUP_HASH_KEY, checksum);
    
    if (BackupHelper.onAutoBackupTriggered) {
      BackupHelper.onAutoBackupTriggered();
    }
    
    return newItem;
  },

  // Trigger automatic backup if enabled and data has changed
  triggerAutoBackup: (): BackupHistoryItem | null => {
    if (!BackupHelper.isAutoBackupEnabled()) return null;

    const rawState = getDatabaseRawState();
    const checksum = getChecksum(rawState);
    const lastChecksum = localStorage.getItem(LAST_BACKUP_HASH_KEY);

    // Smart Backup: Only backup when data has changed!
    if (checksum === lastChecksum) {
      return null;
    }

    const encrypted = encryptBackup(rawState);
    const newItem: BackupHistoryItem = {
      id: `bk-auto-${Date.now()}`,
      timestamp: Date.now(),
      size: new Blob([encrypted]).size,
      type: 'auto',
      data: encrypted
    };

    let history = BackupHelper.getBackupHistory();
    history = [newItem, ...history].slice(0, 10); // Keep only latest 10
    BackupHelper.saveBackupHistory(history);

    // Update last backup checksum
    localStorage.setItem(LAST_BACKUP_HASH_KEY, checksum);

    if (BackupHelper.onAutoBackupTriggered) {
      BackupHelper.onAutoBackupTriggered();
    }

    return newItem;
  },

  // Restore database from an encrypted string
  restoreFromEncryptedData: (encryptedString: string): boolean => {
    try {
      const rawJson = decryptBackup(encryptedString);
      const data = JSON.parse(rawJson);
      
      if (data.shops) db.saveShops(data.shops);
      if (data.products) db.saveProducts(data.products);
      if (data.ledgers) db.saveLedgers(data.ledgers);
      if (data.invoices) db.saveInvoices(data.invoices);
      if (data.hawlats) db.saveHawlats(data.hawlats);
      if (data.inventoryLogs) db.saveInventoryLogs(data.inventoryLogs);
      if (data.purchases) db.savePurchases(data.purchases);
      if (data.expenses) db.saveExpenses(data.expenses);
      if (data.settings) db.saveSettings(data.settings);
      if (data.returns) db.saveReturns(data.returns);
      if (data.distReturns) db.saveDistReturns(data.distReturns);
      if (data.damagedStocks) db.saveDamagedStocks(data.damagedStocks);
      if (data.companies) db.saveCompanies(data.companies);
      if (data.companyLedgers) db.saveCompanyLedgers(data.companyLedgers);
      
      // Update checksum of current state so we don't immediately trigger auto-backup
      const checksum = getChecksum(rawJson);
      localStorage.setItem(LAST_BACKUP_HASH_KEY, checksum);
      
      return true;
    } catch (e) {
      console.error('Failed to restore from backup:', e);
      return false;
    }
  },

  // Trigger file download in browser/webview
  downloadBackupFile: async (backup: BackupHistoryItem) => {
    const date = new Date(backup.timestamp);
    const dateString = date.toISOString().split('T')[0];
    const timeString = date.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `friends_erp_backup_${dateString}_${timeString}.json`;

    if (Capacitor.isNativePlatform()) {
      try {
        // Write file locally to Cache directory so we can share it
        const writeResult = await Filesystem.writeFile({
          path: filename,
          data: backup.data, // This is already the encrypted string (which is base64)
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        // Open native share sheet so user can save it to files or share
        await Share.share({
          title: 'Friends ERP Backup',
          text: 'Friends Enterprise ERP Encrypted Backup File',
          url: writeResult.uri,
          dialogTitle: 'Save or Share Backup File'
        });
      } catch (err) {
        console.error('Capacitor native export error:', err);
        alert('ফাইল সংরক্ষণ করতে ব্যর্থ হয়েছে: ' + JSON.stringify(err));
      }
    } else {
      // Standard browser download
      const blob = new Blob([backup.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
};
