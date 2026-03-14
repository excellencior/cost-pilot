// local-backup.ts
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { LocalRepository } from './local-repository';

export interface BackupPayload {
    version: 1;
    timestamp: string;
    settings: Record<string, any>;
    categories: any[];
    transactions: any[];
}

const DB_KEY = 'costpilot_backup_db';
const HANDLE_KEY = 'costpilot_backup_dir_handle';

class LocalBackupService {
    private dirHandle: FileSystemDirectoryHandle | null = null;
    private db: IDBDatabase | null = null;

    constructor() {
        if (!Capacitor.isNativePlatform() && window.showDirectoryPicker) {
            this.initDB();
        }
    }

    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_KEY, 1);
            request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('handles')) {
                    db.createObjectStore('handles');
                }
            };
            request.onsuccess = (e: Event) => {
                this.db = (e.target as IDBOpenDBRequest).result;
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    private async saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction('handles', 'readwrite');
            const store = tx.objectStore('handles');
            const request = store.put(handle, HANDLE_KEY);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async loadHandle(): Promise<FileSystemDirectoryHandle | null> {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction('handles', 'readonly');
            const store = tx.objectStore('handles');
            const request = store.get(HANDLE_KEY);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async hasAccess(): Promise<boolean> {
        if (Capacitor.isNativePlatform()) return true; // Mobile uses fixed App directory
        if (!window.showDirectoryPicker) return false; // Not supported on Firefox/Safari

        try {
            if (!this.dirHandle) {
                this.dirHandle = await this.loadHandle();
            }
            if (this.dirHandle) {
                const permission = await this.dirHandle.queryPermission({ mode: 'readwrite' });
                if (permission === 'granted') return true;
                const request = await this.dirHandle.requestPermission({ mode: 'readwrite' });
                return request === 'granted';
            }
            return false;
        } catch (e) {
            console.error('Error checking directory access:', e);
            return false;
        }
    }

    async requestAccess(): Promise<boolean> {
        if (Capacitor.isNativePlatform()) return true;
        if (!window.showDirectoryPicker) return false;

        try {
            this.dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            await this.saveHandle(this.dirHandle);
            return true;
        } catch (e) {
            console.error('User cancelled or error requesting access:', e);
            return false;
        }
    }

    getDirectoryName(): string | null {
        if (Capacitor.isNativePlatform()) return 'App Documents';
        return this.dirHandle?.name || null;
    }

    private generateFileName(): string {
        const date = new Date().toISOString().split('T')[0];
        return `costpilot_backup_${date}.json`;
    }

    private buildPayload(): BackupPayload {
        return {
            version: 1,
            timestamp: new Date().toISOString(),
            settings: LocalRepository.getSettings(),
            categories: LocalRepository.getAllCategories(),
            transactions: LocalRepository.getAllExpenses()
        };
    }

    async createBackup(): Promise<string> {
        const payload = this.buildPayload();
        const jsonString = JSON.stringify(payload, null, 2);
        const fileName = this.generateFileName();

        if (Capacitor.isNativePlatform()) {
            await Filesystem.writeFile({
                path: fileName,
                data: jsonString,
                directory: Directory.Documents,
                encoding: Encoding.UTF8
            });
        } else {
            if (!await this.hasAccess()) {
                throw new Error('No directory access');
            }
            const fileHandle = await this.dirHandle!.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(jsonString);
            await writable.close();
        }

        await this.pruneOldBackups();
        const currentHash = await this.getCurrentDataHash();
        LocalRepository.updateSettings({ lastBackupDate: payload.timestamp, lastBackupHash: currentHash });
        return fileName;
    }

    async getCurrentDataHash(): Promise<string> {
        const payload = this.buildPayload();
        const objToHash = {
            categories: payload.categories,
            transactions: payload.transactions,
            settings: { ...payload.settings, lastBackupDate: undefined, lastBackupHash: undefined }
        };
        const str = JSON.stringify(objToHash);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }

    async restoreBackup(file: File): Promise<{ newTransactions: any[], newCategoriesCount: number }> {
        try {
            const payload = await this.parseBackupFile(file);
            
            if (payload.version !== 1 || !payload.transactions || !payload.categories || !payload.settings) {
                throw new Error("Invalid backup file format");
            }

            // Restore settings, but PRESERVE backup configuration
            const currentSettings = LocalRepository.getSettings();
            const backupSettings = payload.settings;
            
            const keysToPreserve = ['autoBackupEnabled', 'backupTime', 'lastBackupDate', 'lastBackupHash'];
            const mergedSettings = { ...backupSettings };
            keysToPreserve.forEach(key => {
                if (currentSettings[key] !== undefined) {
                    mergedSettings[key] = currentSettings[key];
                }
            });
            localStorage.setItem('costpilot_settings', JSON.stringify(mergedSettings));

            // Merge transactions (stored as map/object in costpilot_local_db)
            const currentData = JSON.parse(localStorage.getItem('costpilot_local_db') || '{}');
            const backupTransactions = payload.transactions;
            
            const addedTransactions: any[] = [];

            backupTransactions.forEach((t: any) => {
                const existing = currentData[t.id];
                if (!existing) {
                    currentData[t.id] = t;
                    addedTransactions.push(t);
                } else if (existing.deleted && !t.deleted) {
                    // Revive deleted item if it's active in the backup
                    currentData[t.id] = { ...t, deleted: false };
                    addedTransactions.push(currentData[t.id]);
                }
            });

            localStorage.setItem('costpilot_local_db', JSON.stringify(currentData));

            // Merge categories (stored as map/object in costpilot_local_categories)
            const currentCatData = JSON.parse(localStorage.getItem('costpilot_local_categories') || '{}');
            const backupCategories = payload.categories;
            const categoryNames = new Set(Object.values(currentCatData).map((c: any) => (c as any).name.toUpperCase()));
            let mergedCatCount = 0;

            backupCategories.forEach((c: any) => {
                const existing = currentCatData[c.id];
                if (!existing && !categoryNames.has(c.name.toUpperCase())) {
                    currentCatData[c.id] = c;
                    mergedCatCount++;
                } else if (existing && existing.deleted && !c.deleted) {
                    // Revive deleted category
                    currentCatData[c.id] = { ...c, deleted: false };
                    mergedCatCount++;
                }
            });

            localStorage.setItem('costpilot_local_categories', JSON.stringify(currentCatData));

            // Dispatch event for App to reload
            window.dispatchEvent(new Event('costpilot-settings-updated'));

            return {
                newTransactions: addedTransactions,
                newCategoriesCount: mergedCatCount
            };
        } catch (err) {
            throw err;
        }
    }

    async parseBackupFile(file: File): Promise<BackupPayload> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const payload = JSON.parse(content) as BackupPayload;
                    resolve(payload);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    async pruneOldBackups(retentionDays = 30): Promise<void> {
        const now = new Date();
        const cutoff = new Date(now.getTime() - (retentionDays * 24 * 60 * 60 * 1000));

        try {
            if (Capacitor.isNativePlatform()) {
                const result = await Filesystem.readdir({
                    path: '',
                    directory: Directory.Documents
                });

                for (const file of result.files) {
                    if (file.name.startsWith('costpilot_backup_') && file.name.endsWith('.json')) {
                        const dateStr = file.name.replace('costpilot_backup_', '').replace('.json', '');
                        const fileDate = new Date(dateStr);
                        if (fileDate < cutoff) {
                            await Filesystem.deleteFile({
                                path: file.name,
                                directory: Directory.Documents
                            });
                        }
                    }
                }
            } else {
                if (!await this.hasAccess()) return;

                const valuesContext: any = this.dirHandle!.values();
                for await (const entry of valuesContext) {
                    if (entry.kind === 'file' && entry.name.startsWith('costpilot_backup_') && entry.name.endsWith('.json')) {
                        const dateStr = entry.name.replace('costpilot_backup_', '').replace('.json', '');
                        const fileDate = new Date(dateStr);
                        // Using Date to implicitly handle valid parsed dates
                        if (!isNaN(fileDate.getTime()) && fileDate < cutoff) {
                            // Using standard File System API to remove entry
                            await this.dirHandle!.removeEntry(entry.name);
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error pruning backups:', e);
        }
    }

    async getMostRecentBackup(): Promise<File | null> {
        try {
            if (Capacitor.isNativePlatform()) {
                const result = await Filesystem.readdir({
                    path: '',
                    directory: Directory.Documents
                });

                let latestFile = null;
                let latestDate = 0;

                for (const file of result.files) {
                    if (file.name.startsWith('costpilot_backup_') && file.name.endsWith('.json')) {
                        const dateStr = file.name.replace('costpilot_backup_', '').replace('.json', '');
                        const fileDate = new Date(dateStr).getTime();
                        if (!isNaN(fileDate) && fileDate > latestDate) {
                            latestDate = fileDate;
                            latestFile = file.name;
                        }
                    }
                }

                if (latestFile) {
                    // We need a File object for the restore function. On native, we can read the string and mock a File
                    const contentRes = await Filesystem.readFile({
                        path: latestFile,
                        directory: Directory.Documents,
                        encoding: Encoding.UTF8
                    });
                    const blob = new Blob([contentRes.data as string], { type: 'application/json' });
                    return new File([blob], latestFile, { type: 'application/json' });
                }
                return null;
            } else {
                if (!await this.hasAccess()) return null;

                let latestFileHandle: FileSystemFileHandle | null = null;
                let latestDate = 0;

                const valuesContext: any = this.dirHandle!.values();
                for await (const entry of valuesContext) {
                    if (entry.kind === 'file' && entry.name.startsWith('costpilot_backup_') && entry.name.endsWith('.json')) {
                        const dateStr = entry.name.replace('costpilot_backup_', '').replace('.json', '');
                        const fileDate = new Date(dateStr).getTime();
                        if (!isNaN(fileDate) && fileDate > latestDate) {
                            latestDate = fileDate;
                            latestFileHandle = entry as FileSystemFileHandle;
                        }
                    }
                }

                if (latestFileHandle) {
                    return await latestFileHandle.getFile();
                }
                return null;
            }
        } catch (e) {
            console.error('Error finding recent backup:', e);
            return null;
        }
    }
}

export const localBackupService = new LocalBackupService();
