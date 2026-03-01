
import { Category, Transaction, MonthlyData } from './entities/types';

export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'cat-food-' + crypto.randomUUID(), name: 'Food', icon: 'restaurant', color: 'bg-red-100 text-red-500', type: 'expense' },
    { id: 'cat-transport-' + crypto.randomUUID(), name: 'Transport', icon: 'directions_bus', color: 'bg-blue-100 text-blue-500', type: 'expense' },
    { id: 'cat-groceries-' + crypto.randomUUID(), name: 'Groceries', icon: 'shopping_cart', color: 'bg-orange-100 text-orange-500', type: 'expense' },
    { id: 'cat-entertainment-' + crypto.randomUUID(), name: 'Entertainment', icon: 'movie', color: 'bg-purple-100 text-purple-500', type: 'expense' },
    { id: 'cat-health-' + crypto.randomUUID(), name: 'Health', icon: 'health_and_safety', color: 'bg-teal-100 text-teal-500', type: 'expense' },
    { id: 'cat-shopping-' + crypto.randomUUID(), name: 'Shopping', icon: 'shopping_bag', color: 'bg-indigo-100 text-indigo-500', type: 'expense' },
    { id: 'cat-salary-' + crypto.randomUUID(), name: 'Salary', icon: 'payments', color: 'bg-green-100 text-green-500', type: 'income' },
    { id: 'cat-investment-' + crypto.randomUUID(), name: 'Investment', icon: 'trending_up', color: 'bg-cyan-100 text-cyan-500', type: 'income' },
];

export const CATEGORIES = DEFAULT_CATEGORIES;

// Empty arrays - data comes from Supabase
export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const MONTHLY_HISTORY: MonthlyData[] = [];
