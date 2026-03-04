
import { Category, Transaction, MonthlyData } from './entities/types';

export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'f31e7e8d-ca1c-41d2-a959-e2cd54c2369f', name: 'Food', icon: 'restaurant', color: 'bg-red-100 text-red-500', type: 'expense', is_default: true },
    { id: 'cd50c5be-a420-4d3d-bf65-53745d6b0d9c', name: 'Transport', icon: 'directions_bus', color: 'bg-blue-100 text-blue-500', type: 'expense', is_default: true },
    { id: '44c528fb-bc17-4b27-85ac-fd9cae1fd30d', name: 'Groceries', icon: 'shopping_cart', color: 'bg-orange-100 text-orange-500', type: 'expense', is_default: true },
    { id: '77f69086-8065-4185-a98d-31199de7a8d6', name: 'Entertainment', icon: 'movie', color: 'bg-purple-100 text-purple-500', type: 'expense', is_default: true },
    { id: 'c9b9c638-12d3-4acb-a020-27cfd3ce0657', name: 'Health', icon: 'health_and_safety', color: 'bg-teal-100 text-teal-500', type: 'expense', is_default: true },
    { id: 'f300dee1-39e6-4682-be3c-28ab03763a96', name: 'Shopping', icon: 'shopping_bag', color: 'bg-indigo-100 text-indigo-500', type: 'expense', is_default: true },
    { id: '0eb33064-93bd-4a6c-bbce-4890bca55f9d', name: 'Salary', icon: 'payments', color: 'bg-green-100 text-green-500', type: 'income', is_default: true },
    { id: '2365c2fd-4202-4851-b499-f70767d0f607', name: 'Investment', icon: 'trending_up', color: 'bg-cyan-100 text-cyan-500', type: 'income', is_default: true },
];

export const CATEGORIES = DEFAULT_CATEGORIES;

// Empty arrays - data comes from Supabase
export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const MONTHLY_HISTORY: MonthlyData[] = [];
