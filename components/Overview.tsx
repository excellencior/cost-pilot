
import React from 'react';
import { Transaction, MonthlyData } from '../types';


interface OverviewProps {
  month: MonthlyData;
  transactions: Transaction[];
  onBack: () => void;
  onAddClick: () => void;
  currency: string;
}

const getCurrencySymbol = (code: string) => {
  const symbols: Record<string, string> = { 'USD': '$', 'BDT': '৳', 'EUR': '€' };
  return symbols[code] || '$';
};

const Overview: React.FC<OverviewProps> = ({ month, transactions, onBack, onAddClick, currency }) => {
  const currencySymbol = getCurrencySymbol(currency);
  return (
    <div className="flex flex-col gap-6 p-4 pt-2 overflow-y-auto h-full hide-scrollbar pb-32">
      {/* Header Info */}
      <div className="flex items-center gap-4 px-2 mt-2">
        <button
          onClick={onBack}
          className="size-10 rounded-full bg-white/50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-white hover:bg-white transition-colors border border-white/20"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{month.month} Overview</h2>
          <p className="text-xs text-slate-500 font-mono">{month.year} Breakdown</p>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 gap-3 px-2">
        <div className="glass-card rounded-2xl p-4">
          <span className="text-[9px] font-bold uppercase tracking-wider text-green-500 mb-1 block">Total Income</span>
          <p className="text-lg font-bold font-mono text-slate-900 dark:text-white">{currencySymbol}{month.income.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 mb-1 block">Total Expense</span>
          <p className="text-lg font-bold font-mono text-slate-900 dark:text-white">{currencySymbol}{month.expense.toLocaleString()}</p>
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transactions</span>
        </div>
        <div className="flex flex-col gap-3">
          {transactions.map(t => (
            <div
              key={t.id}
              className={`group flex items-center gap-3 p-4 rounded-3xl shadow-sm border backdrop-blur-sm transition-all hover:bg-white/80 dark:hover:bg-white/5 ${t.type === 'expense'
                  ? 'bg-red-50/50 dark:bg-red-900/5 border-red-100 dark:border-red-500/20'
                  : 'bg-green-50/50 dark:bg-green-900/5 border-green-100 dark:border-green-500/20'
                }`}
            >
              <div className={`flex items-center justify-center rounded-2xl bg-white dark:bg-white/10 shrink-0 size-12 shadow-sm ${t.type === 'expense' ? 'text-red-500' : 'text-green-500'
                }`}>
                <span className="material-symbols-outlined text-2xl">{t.category.icon}</span>
              </div>
              <div className="flex flex-col flex-1 justify-center min-w-0">
                <p className="text-slate-900 dark:text-white text-sm font-bold leading-tight truncate">{t.title}</p>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-medium leading-tight truncate mt-1">
                  {t.location} • {t.date}
                </p>
              </div>
              <div className="shrink-0 text-right pl-2">
                <p className={`text-sm font-bold font-mono leading-normal ${t.type === 'expense' ? 'text-slate-900 dark:text-white' : 'text-green-600 dark:text-green-400'
                  }`}>
                  {t.type === 'expense' ? '-' : '+'}{currencySymbol}{t.amount.toFixed(2)}
                </p>
              </div>
            </div>
          ))}

          {transactions.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-2 opacity-20">history</span>
              <p className="text-xs font-bold uppercase tracking-widest">No transactions found</p>
            </div>
          )}
        </div>
      </div>

      {/* FAB - Moved here as requested */}
      <button
        onClick={onAddClick}
        className="fixed bottom-8 right-8 z-10 flex items-center justify-center size-16 rounded-full bg-primary text-white shadow-xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>
    </div>
  );
};

export default Overview;
