import { Transaction, Category } from '../../types';

const STORAGE_KEY = 'costpilot_local_db';
const CATEGORY_KEY = 'costpilot_local_categories';
const SYNC_META_KEY = 'costpilot_sync_meta';
const SETTINGS_KEY = 'costpilot_settings';

export interface LocalExpense extends Transaction {
    user_id: string | null;
    created_at: string;
    updated_at: string;
    deleted: boolean;
    is_synced: boolean;
}

export interface LocalCategory extends Category {
    user_id: string | null;
    created_at: string;
    updated_at: string;
    deleted: boolean;
    is_synced: boolean;
}

// Helper to get raw data
const getRawData = (key: string): Record<string, any> => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
};

// Helper to save raw data
const saveRawData = (key: string, data: Record<string, any>) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const LocalRepository = {
    // --- EXPENSES ---
    // Get all active expenses
    getAllExpenses: (): LocalExpense[] => {
        const data = getRawData(STORAGE_KEY);
        return Object.values(data)
            .filter((item: any) => !item.deleted)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    // Get expenses pending sync
    getPendingSyncExpenses: (): LocalExpense[] => {
        const data = getRawData(STORAGE_KEY);
        return Object.values(data).filter((item: any) => !item.is_synced);
    },

    // Upsert Expense
    upsertExpense: (expense: Omit<LocalExpense, 'updated_at' | 'created_at' | 'is_synced' | 'deleted'> & Partial<LocalExpense>) => {
        const data = getRawData(STORAGE_KEY);
        const now = new Date().toISOString();
        const existing = data[expense.id];

        const record: LocalExpense = {
            ...expense,
            user_id: expense.user_id ?? (existing?.user_id || null),
            created_at: existing?.created_at || now,
            updated_at: now,
            deleted: expense.deleted ?? false,
            is_synced: false,
        } as LocalExpense;

        data[expense.id] = record;
        saveRawData(STORAGE_KEY, data);
        return record;
    },

    // Soft delete expense
    deleteExpense: (id: string) => {
        const data = getRawData(STORAGE_KEY);
        if (data[id]) {
            data[id].deleted = true;
            data[id].updated_at = new Date().toISOString();
            data[id].is_synced = false;
            saveRawData(STORAGE_KEY, data);
        }
    },

    // --- CATEGORIES ---
    getAllCategories: (): LocalCategory[] => {
        const data = getRawData(CATEGORY_KEY);
        return Object.values(data).filter((item: any) => !item.deleted);
    },

    getPendingSyncCategories: (): LocalCategory[] => {
        const data = getRawData(CATEGORY_KEY);
        return Object.values(data).filter((item: any) => !item.is_synced);
    },

    upsertCategory: (category: Omit<LocalCategory, 'updated_at' | 'created_at' | 'is_synced' | 'deleted'> & Partial<LocalCategory>) => {
        const data = getRawData(CATEGORY_KEY);
        const now = new Date().toISOString();
        const existing = data[category.id];

        const record: LocalCategory = {
            ...category,
            user_id: category.user_id ?? (existing?.user_id || null),
            created_at: existing?.created_at || now,
            updated_at: now,
            deleted: category.deleted ?? false,
            is_synced: false,
        } as LocalCategory;

        data[category.id] = record;
        saveRawData(CATEGORY_KEY, data);
        return record;
    },

    // Bulk upsert (generic)
    bulkUpsert: (items: any[], type: 'expense' | 'category', fromRemote: boolean = false) => {
        const key = type === 'expense' ? STORAGE_KEY : CATEGORY_KEY;
        const data = getRawData(key);
        items.forEach(item => {
            data[item.id] = {
                ...item,
                is_synced: fromRemote ? true : false
            };
        });
        saveRawData(key, data);
    },

    // --- META ---
    getLastSync: (): string | null => {
        const meta = localStorage.getItem(SYNC_META_KEY);
        return meta ? JSON.parse(meta).last_sync : null;
    },

    setLastSync: (isoDate: string) => {
        localStorage.setItem(SYNC_META_KEY, JSON.stringify({ last_sync: isoDate }));
    },

    // Assign User ID (Migration)
    assignUserId: (userId: string) => {
        // Expenses
        const expData = getRawData(STORAGE_KEY);
        Object.values(expData).forEach((item: any) => {
            if (!item.user_id) {
                item.user_id = userId;
                item.updated_at = new Date().toISOString();
                item.is_synced = false;
            }
        });
        saveRawData(STORAGE_KEY, expData);

        // Categories
        const catData = getRawData(CATEGORY_KEY);
        Object.values(catData).forEach((item: any) => {
            if (!item.user_id) {
                item.user_id = userId;
                item.updated_at = new Date().toISOString();
                item.is_synced = false;
            }
        });
        saveRawData(CATEGORY_KEY, catData);
    },

    // --- SETTINGS ---
    getSettings: () => {
        const data = localStorage.getItem(SETTINGS_KEY);
        const defaults = { currency: 'USD' };
        try {
            return data ? { ...defaults, ...JSON.parse(data) } : defaults;
        } catch {
            return defaults;
        }
    },

    updateSettings: (updates: Record<string, any>) => {
        const current = LocalRepository.getSettings();
        const next = { ...current, ...updates };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    }
};
