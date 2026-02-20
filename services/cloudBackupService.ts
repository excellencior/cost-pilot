import { supabase } from './supabaseClient';
import { LocalRepository, LocalExpense, LocalCategory } from './db/localRepository';

export type BackupStatus = 'idle' | 'syncing' | 'success' | 'error';

type StatusCallback = (status: BackupStatus, message?: string) => void;

const CLOUD_BACKUP_KEY = 'zenspend_cloud_backup_enabled';
const LAST_BACKUP_KEY = 'zenspend_last_backup_time';

let statusListeners: StatusCallback[] = [];
let isSyncing = false;

const emitStatus = (status: BackupStatus, message?: string) => {
    statusListeners.forEach(cb => cb(status, message));
};

export const CloudBackupService = {
    // --- Listener Management ---
    onStatusChange: (callback: StatusCallback): (() => void) => {
        statusListeners.push(callback);
        return () => {
            statusListeners = statusListeners.filter(cb => cb !== callback);
        };
    },

    // --- Preference Persistence ---
    isEnabled: (): boolean => {
        return localStorage.getItem(CLOUD_BACKUP_KEY) === 'true';
    },

    setEnabled: (enabled: boolean) => {
        localStorage.setItem(CLOUD_BACKUP_KEY, String(enabled));
    },

    getLastBackupTime: (): string | null => {
        return localStorage.getItem(LAST_BACKUP_KEY);
    },

    setLastBackupTime: (isoDate: string) => {
        localStorage.setItem(LAST_BACKUP_KEY, isoDate);
    },

    // --- Pull from Remote (Cross-Device Sync) ---
    pullFromRemote: async (userId: string): Promise<boolean> => {
        if (!supabase) return false;

        try {
            emitStatus('syncing', 'Downloading your data...');

            // Pull categories
            const { data: remoteCategories, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', userId);

            if (catError) throw catError;

            if (remoteCategories && remoteCategories.length > 0) {
                LocalRepository.bulkUpsert(remoteCategories as LocalCategory[], 'category', true);
            }

            // Pull transactions
            const { data: remoteTransactions, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId);

            if (txError) throw txError;

            if (remoteTransactions && remoteTransactions.length > 0) {
                LocalRepository.bulkUpsert(remoteTransactions as LocalExpense[], 'expense', true);
            }

            const pulledCount = (remoteCategories?.length || 0) + (remoteTransactions?.length || 0);
            emitStatus('success', `Downloaded ${pulledCount} items from cloud`);
            CloudBackupService.setLastBackupTime(new Date().toISOString());
            return true;

        } catch (error) {
            console.error('Pull from remote failed:', error);
            emitStatus('error', 'Failed to download cloud data');
            return false;
        }
    },

    // --- Push to Remote (Backup) ---
    startBackup: async (userId: string): Promise<boolean> => {
        if (!supabase) {
            emitStatus('error', 'Supabase not configured');
            return false;
        }

        if (isSyncing) return false;

        if (!navigator.onLine) {
            emitStatus('error', 'No internet connection');
            // Register retry on reconnect
            const onlineHandler = () => {
                window.removeEventListener('online', onlineHandler);
                CloudBackupService.startBackup(userId);
            };
            window.addEventListener('online', onlineHandler);
            return false;
        }

        try {
            isSyncing = true;
            emitStatus('syncing', 'Backing up your data...');

            // --- 1. Push Categories ---
            const pendingCategories = LocalRepository.getPendingSyncCategories();
            if (pendingCategories.length > 0) {
                const toUpload = pendingCategories.map(c => ({
                    ...c,
                    user_id: userId,
                }));

                // Remove local-only fields before pushing
                const cleaned = toUpload.map(({ is_synced, deleted, ...rest }) => rest);

                const { error } = await supabase
                    .from('categories')
                    .upsert(cleaned, { onConflict: 'id' });

                if (error) {
                    console.error('Category backup error:', error);
                    throw error;
                }

                // Mark as synced locally
                LocalRepository.bulkUpsert(toUpload, 'category', true);
            }

            // --- 2. Push Transactions ---
            const pendingExpenses = LocalRepository.getPendingSyncExpenses();
            if (pendingExpenses.length > 0) {
                const toUpload = pendingExpenses.map(e => ({
                    ...e,
                    user_id: userId,
                }));

                // Separate soft-deleted items
                const toDelete = toUpload.filter(e => e.deleted);
                const toUpsert = toUpload.filter(e => !e.deleted);

                if (toUpsert.length > 0) {
                    const cleaned = toUpsert.map(({ is_synced, deleted, ...rest }) => rest);
                    const { error } = await supabase
                        .from('transactions')
                        .upsert(cleaned, { onConflict: 'id' });

                    if (error) {
                        console.error('Transaction backup error:', error);
                        throw error;
                    }
                }

                // Handle deletes on remote
                if (toDelete.length > 0) {
                    const deleteIds = toDelete.map(e => e.id);
                    const { error } = await supabase
                        .from('transactions')
                        .delete()
                        .in('id', deleteIds);

                    if (error) {
                        console.error('Transaction delete error:', error);
                        // Non-fatal — log but don't throw
                    }
                }

                // Mark all as synced locally
                LocalRepository.bulkUpsert(toUpload, 'expense', true);
            }

            const totalPushed = pendingCategories.length + pendingExpenses.length;
            const now = new Date().toISOString();
            CloudBackupService.setLastBackupTime(now);
            LocalRepository.setLastSync(now);

            if (totalPushed > 0) {
                emitStatus('success', `Backed up ${totalPushed} items`);
            } else {
                emitStatus('success', 'All data is up to date');
            }

            return true;
        } catch (error) {
            console.error('Backup failed:', error);
            emitStatus('error', 'Backup failed. Tap to retry.');
            return false;
        } finally {
            isSyncing = false;
        }
    },

    // --- Check if local DB needs a pull (new device) ---
    isLocalEmpty: (): boolean => {
        const expenses = LocalRepository.getAllExpenses();
        const categories = LocalRepository.getAllCategories();
        return expenses.length === 0 && categories.length === 0;
    },
};
