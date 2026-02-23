import React, { useMemo } from 'react';
import { Transaction, MonthlyData } from '../types';
import { formatDate } from '../utils';

interface OverviewProps {
  month: MonthlyData;
  transactions: Transaction[];
  onBack: () => void;
  onTransactionClick: (t: Transaction) => void;
  currency: string;
  typeFilter?: 'income' | 'expense' | null;
  onClearFilter?: () => void;
}

const getCurrencySymbol = (code: string) => {
  const symbols: Record<string, string> = { 'USD': '$', 'BDT': '৳', 'EUR': '€' };
  return symbols[code] || '$';
};

const Overview: React.FC<OverviewProps> = ({ month, transactions, onBack, onTransactionClick, currency, typeFilter, onClearFilter }) => {
  const currencySymbol = getCurrencySymbol(currency);
  const filteredTransactions = useMemo(() => {
    if (!typeFilter) return transactions;
    return transactions.filter(t => t.type === typeFilter);
  }, [transactions, typeFilter]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="size-10 rounded-lg bg-brand-surface-light dark:bg-brand-surface-dark border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white leading-tight">
              {month.month} {month.year}
            </h2>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-widest">Monthly Records</p>
          </div>
        </div>

      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-3 md:p-4 flex items-center gap-4">
          <div className="size-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
            <span className="material-symbols-outlined">arrow_upward</span>
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Income</p>
            <p className="text-2xl font-bold text-stone-900 dark:text-white">{currencySymbol}{(month.income || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-3 md:p-4 flex items-center gap-4">
          <div className="size-12 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <span className="material-symbols-outlined">arrow_downward</span>
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Expenses</p>
            <p className="text-2xl font-bold text-stone-900 dark:text-white">{currencySymbol}{(month.expense || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <section className="space-y-4">
        {typeFilter && (
          <div className="flex items-center gap-2 px-1 animate-in fade-in duration-300">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${typeFilter === 'income'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
              }`}>
              <span className="material-symbols-outlined text-sm">{typeFilter === 'income' ? 'arrow_upward' : 'arrow_downward'}</span>
              Showing {typeFilter} only
            </div>
            {onClearFilter && (
              <button
                onClick={onClearFilter}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all active:scale-95 uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Clear
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-stone-900 dark:text-white">Transaction Timeline</h3>
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{filteredTransactions.length} items</span>
        </div>

        <div className="flex flex-col gap-5">
          {(() => {
            // Group transactions by date
            const sorted = [...filteredTransactions].sort((a, b) => b.date.localeCompare(a.date));
            const grouped: { [dateKey: string]: { label: string; transactions: Transaction[] } } = {};
            sorted.forEach(t => {
              const [year, month, day] = t.date.split('-').map(Number);
              const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              if (!grouped[dateKey]) {
                const d = new Date(year, month - 1, day);
                grouped[dateKey] = {
                  label: `${day} ${d.toLocaleString('default', { month: 'long' })} - ${year}`,
                  transactions: []
                };
              }
              grouped[dateKey].transactions.push(t);
            });
            const sortedDateKeys = Object.keys(grouped).sort().reverse();

            if (sortedDateKeys.length === 0) {
              return (
                <div className="py-20 card flex flex-col items-center justify-center text-stone-400 border-dashed border-2">
                  <span className="material-symbols-outlined text-4xl mb-4 opacity-20">history_edu</span>
                  <p className="text-sm font-bold uppercase tracking-widest opacity-40">No records for this month</p>
                </div>
              );
            }

            return sortedDateKeys.map(dateKey => (
              <div key={dateKey} className="space-y-2.5">
                <div className="flex items-center gap-3 px-1 pt-1">
                  <span className="material-symbols-outlined text-base text-primary-500 dark:text-primary-400">calendar_today</span>
                  <h3 className="text-xs font-extrabold text-stone-600 dark:text-stone-300 uppercase tracking-widest whitespace-nowrap">
                    {grouped[dateKey].label}
                  </h3>
                  <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700"></div>
                </div>
                <div className="flex flex-col gap-2.5">
                  {grouped[dateKey].transactions.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onTransactionClick(t)}
                      className="w-full card p-3 flex items-center gap-4 group border border-[#AF8F42]/30 dark:border-[#AF8F42]/40 hover:border-[#AF8F42]/60 text-left transition-all duration-500 ease-out hover:shadow-xl hover:shadow-[#AF8F42]/10 shadow-sm active:scale-[0.99]"
                    >
                      <div className={`size-12 rounded-lg flex items-center justify-center bg-stone-50 dark:bg-stone-800 shrink-0 ${t.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-green-600 dark:text-green-400'}`}>
                        <span className="material-symbols-outlined text-2xl">{t.category.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-900 dark:text-white truncate">{t.title}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t.category.name}</span>
                          <span className="text-[10px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">{formatDate(t.date)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${t.type === 'expense' ? 'text-stone-900 dark:text-white' : 'text-green-600 dark:text-green-400'}`}>
                          {t.type === 'expense' ? '-' : '+'}{currencySymbol}{t.amount.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      </section>
    </div>
  );
};

export default Overview;
