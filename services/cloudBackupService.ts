import { supabase } from './supabaseClient';
import { LocalRepository, LocalExpense, LocalCategory } from './db/localRepository';

export type BackupStatus = 'idle' | 'syncing' | 'success' | 'error';

type StatusCallback = (status: BackupStatus, message?: string) => void;

const CLOUD_BACKUP_KEY = 'costpilot_cloud_backup_enabled';
const LAST_BACKUP_KEY = 'costpilot_last_backup_time';

let statusListeners: StatusCallback[] = [];
let isSyncing = false;

const emitStatus = (status: BackupStatus, message?: string) => {
    statusListeners.forEach(cb => cb(status, message));
};

// --- Data Transformers ---

/**
 * Transform a local category to the shape expected by the Supabase `categories` table.
 * Only include columns that exist in the schema.
 */
const localCatToRemote = (cat: any, userId: string) => {
    const remote: Record<string, any> = {
        id: cat.id,
        user_id: userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        is_default: false,
    };
    // Only include timestamps if they exist and are valid
    if (cat.created_at) remote.created_at = cat.created_at;
    if (cat.updated_at) remote.updated_at = cat.updated_at;
    return remote;
};

/**
 * Transform a local transaction (which has a nested `category` object)
 * to the flat shape expected by the Supabase `transactions` table.
 * Maps `category.id` → `category_id`.
 */
const localTxToRemote = (tx: any, userId: string) => {
    const remote: Record<string, any> = {
        id: tx.id,
        user_id: userId,
        category_id: tx.category?.id || tx.category_id || null,
        title: tx.title,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
    };
    if (tx.location) remote.location = tx.location;
    if (tx.notes) remote.notes = tx.notes;
    if (tx.created_at) remote.created_at = tx.created_at;
    if (tx.updated_at) remote.updated_at = tx.updated_at;
    return remote;
};

/**
 * Transform a remote transaction (flat, with `category_id`) back to the local shape
 * (nested `category` object) so the app can render it.
 */
const remoteTxToLocal = (tx: any, categories: any[]) => {
    const cat = categories.find((c: any) => c.id === tx.category_id);
    return {
        ...tx,
        category: cat
            ? { id: cat.id, name: cat.name, icon: cat.icon, color: cat.color, type: cat.type }
            : { id: tx.category_id || '', name: 'Unknown', icon: 'help', color: 'bg-slate-100 text-slate-500', type: tx.type },
        category_id: tx.category_id,
    };
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
        if (isSyncing) {
            console.log('[CloudBackup] Pull skipped: sync already in progress');
            return false;
        }

        if (!navigator.onLine) {
            emitStatus('error', 'No internet connection');
            return false;
        }

        try {
            isSyncing = true;
            console.log('[CloudBackup] Starting pull from remote for user:', userId);
            emitStatus('syncing', 'Downloading your data...');

            // Pull categories first (needed to reconstruct transaction.category)
            const { data: remoteCategories, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', userId);

            if (catError) throw catError;

            if (remoteCategories) {
                console.log(`[CloudBackup] Pulled ${remoteCategories.length} categories`);
                LocalRepository.replaceAll(remoteCategories as LocalCategory[], 'category');
            }

            // Pull transactions and re-attach category objects
            const { data: remoteTransactions, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId);

            if (txError) throw txError;

            if (remoteTransactions) {
                console.log(`[CloudBackup] Pulled ${remoteTransactions.length} transactions`);
                const allCats = remoteCategories || LocalRepository.getAllCategories();
                const localizedTxs = remoteTransactions.map(tx => remoteTxToLocal(tx, allCats));
                LocalRepository.replaceAll(localizedTxs as LocalExpense[], 'expense');
            }

            const pulledCount = (remoteCategories?.length || 0) + (remoteTransactions?.length || 0);
            emitStatus('success', `Downloaded ${pulledCount} items from cloud`);
            CloudBackupService.setLastBackupTime(new Date().toISOString());
            return true;

        } catch (error: any) {
            console.error('[CloudBackup] Pull from remote failed:', error);
            emitStatus('error', 'Download failed. Please check your connection.');
            return false;
        } finally {
            isSyncing = false;
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

            // --- 1. Ensure all referenced categories exist in Supabase ---
            // Collect ALL categories used by pending transactions, not just "pending sync" categories.
            // This is critical: default categories may never have been "edited" so they aren't
            // in getPendingSyncCategories(), but we still need them in Supabase for FK constraints.
            const pendingExpenses = LocalRepository.getPendingSyncExpenses();
            const allLocalCategories = LocalRepository.getAllCategories();

            // Build a set of category IDs referenced by pending transactions
            const referencedCatIds = new Set<string>();
            pendingExpenses.forEach(e => {
                const catId = e.category?.id || (e as any).category_id;
                if (catId) referencedCatIds.add(catId);
            });

            // Find categories we need to ensure exist remotely
            const categoriesToEnsure = allLocalCategories.filter(c => referencedCatIds.has(c.id));

            // Also add any explicitly pending categories
            const pendingCategories = LocalRepository.getPendingSyncCategories();
            pendingCategories.forEach(c => {
                if (!categoriesToEnsure.find(existing => existing.id === c.id)) {
                    categoriesToEnsure.push(c);
                }
            });

            // --- 2. Push Categories ---
            if (categoriesToEnsure.length > 0) {
                const cleaned = categoriesToEnsure.map(c => localCatToRemote(c, userId));

                console.log('[CloudBackup] Pushing categories:', JSON.stringify(cleaned, null, 2));

                const { error } = await supabase
                    .from('categories')
                    .upsert(cleaned, { onConflict: 'id' });

                if (error) {
                    console.error('[CloudBackup] Category push error:', JSON.stringify(error));
                    throw new Error('Some settings failed to sync. Tap to retry.');
                }

                // Mark as synced locally
                LocalRepository.bulkUpsert(
                    categoriesToEnsure.map(c => ({ ...c, user_id: userId })),
                    'category',
                    true
                );
            }

            // --- 3. Push Transactions ---
            if (pendingExpenses.length > 0) {
                const toDelete = pendingExpenses.filter(e => e.deleted);
                const toUpsert = pendingExpenses.filter(e => !e.deleted);

                if (toUpsert.length > 0) {
                    const cleaned = toUpsert.map(e => localTxToRemote(e, userId));

                    console.log('[CloudBackup] Pushing transactions:', JSON.stringify(cleaned, null, 2));

                    const { error } = await supabase
                        .from('transactions')
                        .upsert(cleaned, { onConflict: 'id' });

                    if (error) {
                        console.error('[CloudBackup] Transaction push error:', JSON.stringify(error));
                        throw new Error('New data failed to sync. Tap to retry.');
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
                        console.error('[CloudBackup] Transaction delete error:', JSON.stringify(error));
                    }
                }

                // Mark all as synced locally
                LocalRepository.bulkUpsert(
                    pendingExpenses.map(e => ({ ...e, user_id: userId })),
                    'expense',
                    true
                );
            }

            const totalPushed = categoriesToEnsure.length + pendingExpenses.length;
            const now = new Date().toISOString();
            CloudBackupService.setLastBackupTime(now);
            LocalRepository.setLastSync(now);

            if (totalPushed > 0) {
                emitStatus('success', `Backed up ${totalPushed} items`);
            } else {
                emitStatus('success', 'All data is up to date');
            }

            return true;
        } catch (error: any) {
            console.error('[CloudBackup] Backup failed:', error);
            emitStatus('error', error?.message || 'Backup failed. Tap to retry.');
            return false;
        } finally {
            isSyncing = false;
        }
    },

    // --- Check if local DB needs a pull (new device) ---
    // Only check expenses — default categories are always seeded locally
    isLocalEmpty: (): boolean => {
        const expenses = LocalRepository.getAllExpenses();
        return expenses.length === 0;
    },

    resetSyncState: () => {
        isSyncing = false;
        emitStatus('idle');
        console.log('[CloudBackup] Sync state manually reset');
    }
};
