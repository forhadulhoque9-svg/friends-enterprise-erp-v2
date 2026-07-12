/**
 * Friends Enterprise ERP - Google Drive Sync Utility
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAccessToken, getGoogleUserInfo } from './firebaseAuth';
import { getDatabaseRawState, getChecksum, encryptBackup, decryptBackup } from './backupHelper';

const PENDING_BACKUP_KEY = 'fe_erp_pending_gdrive_backup';
const LAST_DRIVE_HASH_KEY = 'fe_erp_last_drive_hash';
const DRIVE_BACKUPS_CACHE_KEY = 'fe_erp_drive_backups_cache';

export interface DriveBackupFile {
  id: string;
  name: string;
  size: number;
  createdTime: string;
}

/**
 * Check if the browser currently has internet connectivity
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Find or create the "Friends Enterprise ERP Backup" folder in Google Drive
 */
async function getOrCreateFolder(accessToken: string): Promise<string> {
  const folderName = 'Friends Enterprise ERP Backup';
  
  // 1. Search for folder
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  )}&fields=files(id)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!searchRes.ok) {
    throw new Error(`Google Drive API search error: ${searchRes.statusText}`);
  }
  
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }
  
  // 2. Create folder if not found
  const createUrl = 'https://www.googleapis.com/drive/v3/files';
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  
  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive folder: ${createRes.statusText}`);
  }
  
  const createdFolder = await createRes.json();
  return createdFolder.id;
}

/**
 * List files in the backup folder and cache them locally
 */
export async function listDriveBackups(): Promise<DriveBackupFile[]> {
  const token = getAccessToken();
  if (!token) return getCachedDriveBackups();
  
  try {
    const folderId = await getOrCreateFolder(token);
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `'${folderId}' in parents and trashed = false`
    )}&orderBy=createdTime desc&fields=files(id,name,size,createdTime)&pageSize=30`;
    
    const res = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to list Google Drive files: ${res.statusText}`);
    }
    
    const data = await res.json();
    const files: DriveBackupFile[] = data.files || [];
    
    // Save to cache
    localStorage.setItem(DRIVE_BACKUPS_CACHE_KEY, JSON.stringify(files));
    return files;
  } catch (error) {
    console.error('Error listing Google Drive backups:', error);
    return getCachedDriveBackups();
  }
}

/**
 * Retrieve cached list of Drive backups when offline or loading
 */
export function getCachedDriveBackups(): DriveBackupFile[] {
  try {
    const cached = localStorage.getItem(DRIVE_BACKUPS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

/**
 * Delete older backups keeping only the latest 10
 */
async function pruneOldBackups(accessToken: string, folderId: string) {
  try {
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `'${folderId}' in parents and trashed = false`
    )}&orderBy=createdTime desc&fields=files(id,name)&pageSize=30`;
    
    const res = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!res.ok) return;
    const data = await res.json();
    const files = data.files || [];
    
    // Keep only the latest 10
    if (files.length > 10) {
      const filesToDelete = files.slice(10);
      for (const file of filesToDelete) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    }
  } catch (e) {
    console.error('Error pruning old backups:', e);
  }
}

/**
 * Upload backup data string directly to Google Drive folder
 */
async function uploadBackupDataToDrive(accessToken: string, encryptedData: string): Promise<boolean> {
  const folderId = await getOrCreateFolder(accessToken);
  
  const timestamp = Date.now();
  const date = new Date(timestamp);
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `friends_erp_backup_${dateStr}_${timeStr}.json`;
  
  const metadata = {
    name: filename,
    parents: [folderId],
    mimeType: 'application/json',
  };
  
  const boundary = '314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const close_delim = `\r\n--${boundary}--`;
  
  const body =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    encryptedData +
    close_delim;
    
  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: body,
  });
  
  if (!res.ok) {
    throw new Error(`Google Drive upload failed: ${res.statusText}`);
  }
  
  // Prune history to keep only latest 10 on Drive
  await pruneOldBackups(accessToken, folderId);
  return true;
}

/**
 * Main Google Drive Backup trigger function. Handles online/offline conditions gracefully.
 * - If online and signed-in, uploads immediately.
 * - If offline or token missing, saves to pending queue.
 */
export async function triggerGoogleDriveBackup(force: boolean = false): Promise<'synced' | 'queued' | 'no-change' | 'not-signed-in'> {
  const rawState = getDatabaseRawState();
  const checksum = getChecksum(rawState);
  const lastChecksum = localStorage.getItem(LAST_DRIVE_HASH_KEY);
  
  // Smart Backup: Only backup when data has changed!
  if (!force && checksum === lastChecksum) {
    return 'no-change';
  }
  
  const encrypted = encryptBackup(rawState);
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    // Keep pending backup locally to upload when user connects or token refreshed
    localStorage.setItem(PENDING_BACKUP_KEY, encrypted);
    return 'not-signed-in';
  }
  
  if (!isOnline()) {
    // Keep pending backup locally and automatically upload it when internet becomes available
    localStorage.setItem(PENDING_BACKUP_KEY, encrypted);
    return 'queued';
  }
  
  try {
    const success = await uploadBackupDataToDrive(accessToken, encrypted);
    if (success) {
      localStorage.setItem(LAST_DRIVE_HASH_KEY, checksum);
      // Clean up queue since successfully uploaded
      localStorage.removeItem(PENDING_BACKUP_KEY);
      return 'synced';
    }
    return 'queued';
  } catch (error) {
    console.error('Error during Google Drive upload, queueing backup:', error);
    localStorage.setItem(PENDING_BACKUP_KEY, encrypted);
    return 'queued';
  }
}

/**
 * Check if there is any pending offline backup and upload it
 */
export async function processPendingUploads(): Promise<boolean> {
  const accessToken = getAccessToken();
  if (!accessToken || !isOnline()) return false;
  
  const pendingData = localStorage.getItem(PENDING_BACKUP_KEY);
  if (!pendingData) return false;
  
  try {
    const success = await uploadBackupDataToDrive(accessToken, pendingData);
    if (success) {
      localStorage.removeItem(PENDING_BACKUP_KEY);
      // Update hash
      const decrypted = decryptBackup(pendingData);
      const checksum = getChecksum(decrypted);
      localStorage.setItem(LAST_DRIVE_HASH_KEY, checksum);
      return true;
    }
  } catch (e) {
    console.error('Failed to process pending backup:', e);
  }
  return false;
}

/**
 * Download file from Google Drive and decrypt/restore it
 */
export async function restoreFromDriveFile(fileId: string): Promise<boolean> {
  const token = getAccessToken();
  if (!token) throw new Error('গুগল অ্যাকাউন্টে লগইন করা নেই।');
  
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    throw new Error(`ফাইল ডাউনলোড করতে ব্যর্থ হয়েছে: ${res.statusText}`);
  }
  
  const encryptedString = await res.text();
  try {
    const rawJson = decryptBackup(encryptedString);
    const data = JSON.parse(rawJson);
    
    const { db } = await import('../db');
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
    
    // Save checksum of current state
    const checksum = getChecksum(rawJson);
    localStorage.setItem(LAST_DRIVE_HASH_KEY, checksum);
    
    return true;
  } catch (e) {
    console.error('Failed to restore from Google Drive file:', e);
    return false;
  }
}

/**
 * Helper to check pending queue status
 */
export function hasPendingBackup(): boolean {
  return localStorage.getItem(PENDING_BACKUP_KEY) !== null;
}

/**
 * Delete a specific file from Google Drive
 */
export async function deleteDriveBackup(fileId: string): Promise<boolean> {
  const token = getAccessToken();
  if (!token) return false;
  
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to delete Google Drive backup:', e);
    return false;
  }
}

