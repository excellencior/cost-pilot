
export type View = 'dashboard' | 'analysis' | 'settings' | 'overview' | 'category-picker' | 'new-category' | 'history' | 'support';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  category: Category;
  date: string;
  location?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}

export interface MonthlyData {
  month: string;
  year: number;
  income: number;
  expense: number;
}
