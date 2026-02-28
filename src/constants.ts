
import { Category, Transaction, MonthlyData } from './entities/types';

export const CATEGORIES: Category[] = [
    { id: 'a1b2c3d4-1111-4000-8000-000000000001', name: 'Food', icon: 'restaurant', color: 'bg-red-100 text-red-500', type: 'expense' },
    { id: 'a1b2c3d4-1111-4000-8000-000000000002', name: 'Transport', icon: 'directions_bus', color: 'bg-blue-100 text-blue-500', type: 'expense' },
    { id: 'a1b2c3d4-1111-4000-8000-000000000003', name: 'Groceries', icon: 'shopping_cart', color: 'bg-orange-100 text-orange-500', type: 'expense' },
    { id: 'a1b2c3d4-1111-4000-8000-000000000004', name: 'Entertainment', icon: 'movie', color: 'bg-purple-100 text-purple-500', type: 'expense' },
    { id: 'a1b2c3d4-1111-4000-8000-000000000005', name: 'Health', icon: 'health_and_safety', color: 'bg-teal-100 text-teal-500', type: 'expense' },
    { id: 'a1b2c3d4-1111-4000-8000-000000000006', name: 'Shopping', icon: 'shopping_bag', color: 'bg-indigo-100 text-indigo-500', type: 'expense' },
    { id: 'a1b2c3d4-1111-4000-8000-000000000007', name: 'Salary', icon: 'payments', color: 'bg-green-100 text-green-500', type: 'income' },
    { id: 'a1b2c3d4-1111-4000-8000-000000000008', name: 'Investment', icon: 'trending_up', color: 'bg-cyan-100 text-cyan-500', type: 'income' },
];

// Empty arrays - data comes from Supabase
export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const MONTHLY_HISTORY: MonthlyData[] = [];
