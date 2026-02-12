import { supabase } from './supabaseClient';
import { LocalRepository, LocalExpense, LocalCategory } from './db/localRepository';

export const SyncManager = {
    isSyncing: false,

    syncNow: async (userId: string) => {
        if (SyncManager.isSyncing) return;
        if (!navigator.onLine) return;

        try {
            SyncManager.isSyncing = true;
            console.log('Sync started...');

            // --- 1. CATEGORIES SYNC ---
            // Push
            const pendingCategories = LocalRepository.getPendingSyncCategories();
            if (pendingCategories.length > 0) {
                const toUpload = pendingCategories.map(c => ({ ...c, user_id: userId }));
                const { error } = await supabase.from('categories').upsert(toUpload, { onConflict: 'id' });
                if (error) console.error('Category Sync Push Error:', error);
                else LocalRepository.bulkUpsert(toUpload, 'category', true);
            }

            // Pull (Simplified: just fetch all for now, or lastSync)
            // Ideally we check lastSync timestamp for categories too.
            // But categories change infrequently, let's just pull all for robust sync.
            const { data: remoteCategories, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', userId);

            if (!catError && remoteCategories) {
                LocalRepository.bulkUpsert(remoteCategories as LocalCategory[], 'category', true);
            }


            // --- 2. EXPENSES SYNC ---
            // Push
            const pendingExpenses = LocalRepository.getPendingSyncExpenses();
            if (pendingExpenses.length > 0) {
                const toUpload = pendingExpenses.map(p => ({ ...p, user_id: userId }));
                const { error } = await supabase.from('expenses').upsert(toUpload, { onConflict: 'id' });
                if (error) {
                    console.error('Expense Sync Push Error:', error);
                } else {
                    LocalRepository.bulkUpsert(toUpload, 'expense', true);
                    console.log(`Pushed ${toUpload.length} expenses.`);
                }
            }

            // Pull
            const lastSync = LocalRepository.getLastSync();
            let query = supabase.from('expenses').select('*').eq('user_id', userId);
            if (lastSync) query = query.gt('updated_at', lastSync);

            const { data: remoteExpenses, error: expError } = await query;

            if (expError) {
                console.error('Expense Sync Pull Error:', expError);
            } else if (remoteExpenses && remoteExpenses.length > 0) {
                LocalRepository.bulkUpsert(remoteExpenses as LocalExpense[], 'expense', true);
                console.log(`Pulled ${remoteExpenses.length} remote expenses.`);
            }

            // 3. Update Checkpoint
            LocalRepository.setLastSync(new Date().toISOString());
            console.log('Sync complete.');

        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            SyncManager.isSyncing = false;
        }
    },

    mergeAnonymousData: async (userId: string) => {
        LocalRepository.assignUserId(userId);
        await SyncManager.syncNow(userId);
    }
};
