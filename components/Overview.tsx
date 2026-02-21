import React from 'react';
import { Transaction, MonthlyData } from '../types';
import { formatDate } from '../utils';

interface OverviewProps {
  month: MonthlyData;
  transactions: Transaction[];
  onBack: () => void;
  onTransactionClick: (t: Transaction) => void;
  currency: string;
}

const getCurrencySymbol = (code: string) => {
  const symbols: Record<string, string> = { 'USD': '$', 'BDT': '৳', 'EUR': '€' };
  return symbols[code] || '$';
};

const Overview: React.FC<OverviewProps> = ({ month, transactions, onBack, onTransactionClick, currency }) => {
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="size-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              {month.month} {month.year}
            </h2>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Monthly Records</p>
          </div>
        </div>

      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="size-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
            <span className="material-symbols-outlined">arrow_upward</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Income</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{currencySymbol}{(month.income || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="size-12 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <span className="material-symbols-outlined">arrow_downward</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expenses</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{currencySymbol}{(month.expense || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-slate-900 dark:text-white">Transaction Timeline</h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{transactions.length} items</span>
        </div>

        <div className="space-y-3">
          {transactions.map(t => (
            <button
              key={t.id}
              onClick={() => onTransactionClick(t)}
              className="w-full card p-4 flex items-center gap-4 group hover:border-primary-200 dark:hover:border-primary-900 text-left transition-all"
            >
              <div className={`size-12 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800 shrink-0 ${t.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-green-600 dark:text-green-400'}`}>
                <span className="material-symbols-outlined text-2xl">{t.category.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{t.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.category.name}</span>
                  <span className="size-1 rounded-full bg-slate-200 dark:bg-slate-800"></span>
                  <p className="text-[10px] font-medium text-slate-500">
                    {formatDate(t.date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg ${t.type === 'expense' ? 'text-slate-900 dark:text-white' : 'text-green-600 dark:text-green-400'}`}>
                  {t.type === 'expense' ? '-' : '+'}{currencySymbol}{t.amount.toLocaleString()}
                </p>
              </div>
            </button>
          ))}

          {transactions.length === 0 && (
            <div className="py-20 card flex flex-col items-center justify-center text-slate-400 border-dashed border-2">
              <span className="material-symbols-outlined text-4xl mb-4 opacity-20">history_edu</span>
              <p className="text-sm font-bold uppercase tracking-widest opacity-40">No records for this month</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Overview;
