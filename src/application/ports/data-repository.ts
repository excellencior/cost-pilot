import { Transaction, Category } from '../../entities/types';

export interface LocalExpense extends Transaction {
    user_id: string | null;
    created_at: string;
    updated_at: string;
    deleted: boolean;
    is_synced: boolean;
}

export interface DataRepositoryPort {
    // Transactions
    getAllTransactions(): LocalExpense[];
    upsertTransaction(tx: Omit<LocalExpense, 'updated_at' | 'created_at' | 'is_synced' | 'deleted'> & Partial<LocalExpense>): LocalExpense;
    deleteTransaction(id: string): void;
    getPendingSyncTransactions(): LocalExpense[];

    // Categories
    getAllCategories(): Category[];
    upsertCategory(cat: Category): void;

    // Settings
    getSettings(): Record<string, any>;
    updateSettings(updates: Record<string, any>): void;
}
