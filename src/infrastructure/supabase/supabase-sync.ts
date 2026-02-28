import { supabase } from './client';
import { LocalRepository, LocalExpense, LocalCategory } from '../local/local-repository';
import { deriveUserKey, encryptPayload, decryptPayload } from '../crypto/encryption';

export type BackupStatus = 'idle' | 'syncing' | 'success' | 'error';

type StatusCallback = (status: BackupStatus, message?: string) => void;

const CLOUD_BACKUP_KEY = 'costpilot_cloud_backup_enabled';
const LAST_BACKUP_KEY = 'costpilot_last_backup_time';

let statusListeners: StatusCallback[] = [];
let isSyncing = false;
let syncTimeoutId: ReturnType<typeof setTimeout> | null = null;
const SYNC_TIMEOUT_MS = 30000; // 30 second safety net

const startSyncGuard = (): boolean => {
    if (isSyncing) {
        console.warn('[CloudBackup] Sync already in progress, skipping');
        emitStatus('error', 'A sync is already in progress. Please wait.');
        return false;
    }
    isSyncing = true;
    // Safety net: auto-reset after timeout to prevent permanent lock
    syncTimeoutId = setTimeout(() => {
        if (isSyncing) {
            console.warn('[CloudBackup] Sync timed out, force-resetting isSyncing');
            isSyncing = false;
            emitStatus('error', 'Sync timed out. Please try again.');
        }
    }, SYNC_TIMEOUT_MS);
    return true;
};

const endSyncGuard = () => {
    isSyncing = false;
    if (syncTimeoutId) {
        clearTimeout(syncTimeoutId);
        syncTimeoutId = null;
    }
};

const emitStatus = (status: BackupStatus, message?: string) => {
    statusListeners.forEach(cb => cb(status, message));
};

// --- Data Transformers ---

/**
 * Transform a local category to the shape expected by the Supabase `categories` table.
 * Encrypts sensitive fields into a single `payload` string.
 */
const localCatToRemote = (cat: any, userId: string) => {
    const key = deriveUserKey(userId);
    const catPayload = {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        is_default: false,
    };

    const remote: Record<string, any> = {
        id: cat.id,
        user_id: userId,
        payload: encryptPayload(catPayload, key)
    };

    // Timestamps remain unencrypted for sync resolution logic
    if (cat.created_at) remote.created_at = cat.created_at;
    if (cat.updated_at) remote.updated_at = cat.updated_at;

    return remote;
};

/**
 * Transform a local transaction (which has a nested `category` object)
 * to the encrypted flat shape expected by the Supabase `transactions` table.
 */
const localTxToRemote = (tx: any, userId: string) => {
    const key = deriveUserKey(userId);
    const txPayload = {
        category_id: tx.category?.id || tx.category_id || null,
        title: tx.title,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        location: tx.location,
        notes: tx.notes
    };

    const remote: Record<string, any> = {
        id: tx.id,
        user_id: userId,
        payload: encryptPayload(txPayload, key)
    };

    if (tx.created_at) remote.created_at = tx.created_at;
    if (tx.updated_at) remote.updated_at = tx.updated_at;

    return remote;
};

/**
 * Transform a remote encrypted transaction back to the local shape
 * (nested `category` object) so the app can render it.
 */
const remoteTxToLocal = (remoteTx: any, categories: any[], userId: string) => {
    const key = deriveUserKey(userId);
    const decryptedPayload = decryptPayload(remoteTx.payload, key) || {};

    const catId = decryptedPayload.category_id;
    const cat = categories.find((c: any) => c.id === catId);

    return {
        id: remoteTx.id,
        user_id: remoteTx.user_id,
        ...decryptedPayload,
        category: cat
            ? { id: cat.id, name: cat.name, icon: cat.icon, color: cat.color, type: cat.type }
            : { id: catId || '', name: 'Unknown', icon: 'help', color: 'bg-slate-100 text-slate-500', type: decryptedPayload.type },
        category_id: catId,
        created_at: remoteTx.created_at,
        updated_at: remoteTx.updated_at
    };
};

/**
 * Transform a remote encrypted category back to the local shape.
 */
const remoteCatToLocal = (remoteCat: any, userId: string) => {
    const key = deriveUserKey(userId);
    const decryptedPayload = decryptPayload(remoteCat.payload, key) || {};

    return {
        id: remoteCat.id,
        user_id: remoteCat.user_id,
        ...decryptedPayload,
        created_at: remoteCat.created_at,
        updated_at: remoteCat.updated_at
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
        if (!startSyncGuard()) return false;

        try {
            console.log('[CloudBackup] Starting pull from remote for user:', userId);

            if (!navigator.onLine) {
                console.error('[CloudBackup:Pull] Offline - Sync aborted');
                emitStatus('error', 'No internet connection');
                return false;
            }

            emitStatus('syncing', 'Downloading your data...');
            console.log('[CloudBackup:Pull] Fetching remote profile for:', userId);

            // Pull profile settings (currency & theme)
            const { data: remoteProfile, error: profilePullError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            // Code PGRST116 means no rows found, which is fine for new users
            if (profilePullError && profilePullError.code !== 'PGRST116') {
                console.error('[CloudBackup] Profile fetch error:', profilePullError);
                throw profilePullError;
            }

            if (remoteProfile) {
                const settingsToUpdate: any = {};
                if (remoteProfile.currency && remoteProfile.currency !== LocalRepository.getSettings().currency) {
                    console.log(`[CloudBackup] Pulled currency: ${remoteProfile.currency}`);
                    settingsToUpdate.currency = remoteProfile.currency;
                }
                if (remoteProfile.theme && remoteProfile.theme !== LocalRepository.getSettings().theme) {
                    console.log(`[CloudBackup] Pulled theme: ${remoteProfile.theme}`);
                    settingsToUpdate.theme = remoteProfile.theme;
                }

                if (Object.keys(settingsToUpdate).length > 0) {
                    LocalRepository.updateSettings(settingsToUpdate);
                }
            }

            // Pull categories first (needed to reconstruct transaction.category)
            const { data: remoteCategories, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', userId);

            if (catError) throw catError;

            if (remoteCategories) {
                console.log(`[CloudBackup] Pulled ${remoteCategories.length} categories`);
                const localizedCats = remoteCategories.map(c => remoteCatToLocal(c, userId));
                LocalRepository.replaceAll(localizedCats as LocalCategory[], 'category');
            }

            // Pull transactions and re-attach category objects
            const { data: remoteTransactions, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId);

            if (txError) throw txError;

            if (remoteTransactions) {
                console.log(`[CloudBackup] Pulled ${remoteTransactions.length} transactions`);
                const allCats = remoteCategories ? remoteCategories.map(c => remoteCatToLocal(c, userId)) : LocalRepository.getAllCategories();
                const localizedTxs = remoteTransactions.map(tx => remoteTxToLocal(tx, allCats, userId));
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
            endSyncGuard();
        }
    },

    /**
     * Identify differences between local and remote data for reconciliation.
     */
    getSyncDiff: async (userId: string) => {
        if (!supabase) return null;

        try {
            // Fetch remote data
            const { data: remoteTxs, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId);

            if (txError) throw txError;

            const { data: remoteCats, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', userId);

            if (catError) throw catError;

            // Get all local data (including deleted items)
            const localTxs = LocalRepository.getRawExpenses();
            const remoteMap = new Map(remoteTxs?.map(tx => [tx.id, tx]));
            const localMap = new Map(Object.entries(localTxs));

            const diff = {
                addedLocally: [] as any[],    // New locally, doesn't exist remotely (is_synced: false)
                deletedLocally: [] as any[],  // Exists remotely, but marked deleted locally
                deletedRemotely: [] as any[], // is_synced: true, but missing from remote
                modifiedLocally: [] as any[], // Exists in both, but local is newer
                remoteOnly: [] as any[],      // New remotely (from other devices)
            };

            // Analyze local items
            for (const [id, local] of localMap.entries()) {
                const remote = remoteMap.get(id);
                if (!remote) {
                    if (local.is_synced && !local.deleted) {
                        // Was synced, missing remotely -> Someone deleted it in cloud
                        diff.deletedRemotely.push(local);
                    } else if (!local.is_synced && !local.deleted) {
                        // Not synced, missing remotely -> New local addition
                        diff.addedLocally.push(local);
                    }
                } else {
                    if (local.deleted) {
                        diff.deletedLocally.push(local);
                    } else if (new Date(local.updated_at) > new Date(remote.updated_at)) {
                        diff.modifiedLocally.push({ local, remote });
                    }
                }
            }

            // Analyze remote items for those missing locally
            for (const [id, remote] of remoteMap.entries()) {
                if (!localMap.has(id)) {
                    const allCats = remoteCats ? remoteCats.map(c => remoteCatToLocal(c, userId)) : [];
                    diff.remoteOnly.push(remoteTxToLocal(remote, allCats, userId));
                }
            }

            return diff;
        } catch (error) {
            console.error('[CloudBackup] getSyncDiff failed:', error);
            return null;
        }
    },

    /**
     * Apply user decisions for sync reconciliation.
     */
    applyReconciliation: async (userId: string, actions: { id: string, action: 'keep_local' | 'restore_cloud' | 'confirm_delete' | 'discard_local' }[]) => {
        if (!supabase) return false;

        try {
            emitStatus('syncing', 'Reconciling data...');

            for (const item of actions) {
                switch (item.action) {
                    case 'keep_local':
                        // Just mark as unsynced so the next startBackup handles it
                        const local = LocalRepository.getRawExpenses()[item.id];
                        if (local) {
                            LocalRepository.upsertExpense({ ...local, is_synced: false });
                        }
                        break;

                    case 'restore_cloud':
                        // Pull specific item from cloud (already fetched in list, but we reuse pull logic)
                        const { data: remote } = await supabase.from('transactions').select('*').eq('id', item.id).single();
                        if (remote) {
                            const cats = LocalRepository.getAllCategories();
                            LocalRepository.bulkUpsert([remoteTxToLocal(remote, cats, userId)], 'expense', true);
                        }
                        break;

                    case 'confirm_delete':
                        // Ensure it's marked as deleted and unsynced so startBackup deletes it remotely
                        LocalRepository.deleteExpense(item.id);
                        break;

                    case 'discard_local':
                        // Hard delete locally
                        LocalRepository.hardDeleteExpense(item.id);
                        break;
                }
            }

            return true;
        } catch (error) {
            console.error('[CloudBackup] applyReconciliation failed:', error);
            return false;
        } finally {
            emitStatus('idle');
        }
    },

    // --- Push to Remote (Backup) ---
    startBackup: async (userId: string): Promise<boolean> => {
        if (!supabase) {
            emitStatus('error', 'Supabase not configured');
            return false;
        }

        if (!startSyncGuard()) return false;

        try {
            if (!navigator.onLine) {
                console.error('[CloudBackup:Push] Offline - Sync aborted');
                emitStatus('error', 'No internet connection');
                const onlineHandler = () => {
                    console.log('[CloudBackup:Push] Device back online, retrying sync...');
                    window.removeEventListener('online', onlineHandler);
                    CloudBackupService.startBackup(userId);
                };
                window.addEventListener('online', onlineHandler);
                return false;
            }

            emitStatus('syncing', 'Backing up your data...');
            console.log('[CloudBackup:Push] Starting sync sequence...');

            // --- 1. Ensure all referenced categories exist in Supabase ---
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

            // --- 2. Push Profile Settings (Currency & Theme) ---
            const currentSettings = LocalRepository.getSettings();
            console.log('[CloudBackup:Push] Syncing profile settings...', currentSettings);
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    currency: currentSettings.currency,
                    theme: currentSettings.theme,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (profileError) {
                console.error('[CloudBackup:Push] Profile/Settings sync error:', profileError);
                // We don't throw here as sync can still proceed for transactions
            }

            // --- 3. Push Categories ---
            if (categoriesToEnsure.length > 0) {
                const cleaned = categoriesToEnsure.map(c => localCatToRemote(c, userId));

                console.log('[CloudBackup] Pushing categories:', JSON.stringify(cleaned, null, 2));

                const { error } = await supabase
                    .from('categories')
                    .upsert(cleaned, { onConflict: 'id' });

                if (error) {
                    console.error('[CloudBackup] Category push error:', JSON.stringify(error));
                    throw new Error(`Sync failed (Settings): ${error.message || 'Unknown error'}`);
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
                    console.log(`[CloudBackup:Push] Uploading ${toUpsert.length} transactions...`);

                    const { error } = await supabase
                        .from('transactions')
                        .upsert(cleaned, { onConflict: 'id' });

                    if (error) {
                        console.error('[CloudBackup:Push] Transaction upload error:', error);
                        throw new Error(`Sync failed (Data): ${error.message || 'Unknown error'}`);
                    }
                }

                // Handle deletes on remote
                if (toDelete.length > 0) {
                    console.log(`[CloudBackup:Push] Deleting ${toDelete.length} transactions from cloud...`);
                    const deleteIds = toDelete.map(e => e.id);
                    const { error } = await supabase
                        .from('transactions')
                        .delete()
                        .in('id', deleteIds);

                    if (error) {
                        console.error('[CloudBackup:Push] Transaction delete error:', error);
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
            endSyncGuard();
        }
    },

    // --- Check if local DB needs a pull (new device) ---
    // Only check expenses — default categories are always seeded locally
    isLocalEmpty: (): boolean => {
        const expenses = LocalRepository.getAllExpenses();
        return expenses.length === 0;
    },

    resetSyncState: () => {
        endSyncGuard();
        emitStatus('idle');
        console.log('[CloudBackup] Sync state manually reset');
    }
};
