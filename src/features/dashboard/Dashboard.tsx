import React from 'react';
import { MonthlyData, Transaction } from '../../entities/types';
import { formatDate } from '../../entities/financial';

interface DashboardProps {
  monthlyData: MonthlyData[];
  transactions: Transaction[];
  onAddEntry: () => void;
  onViewAll: () => void;
  onTransactionClick: (t: Transaction) => void;
  onTypeFilter: (type: 'income' | 'expense') => void;
  currencySymbol: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  monthlyData,
  transactions,
  onAddEntry,
  onViewAll,
  onTransactionClick,
  onTypeFilter,
  currencySymbol
}) => {
  const currentMonth = monthlyData[0] || { month: 'Unknown', year: new Date().getFullYear(), income: 0, expense: 0 };
  const balance = currentMonth.income - currentMonth.expense;
  const recentTransactions = transactions.slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero Stats */}
      <section className="card p-4 md:p-4 bg-primary-600 border-none text-white overflow-hidden relative shadow-2xl shadow-primary-600/30 min-h-[100px] flex flex-col justify-center">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex flex-col justify-center">
            <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest mb-1 opacity-90 flex items-center gap-2">
              Balance ・ {currentMonth.month}
            </p>
            <h3 className="text-3xl md:text-5xl font-black">{currencySymbol}{balance.toLocaleString()}</h3>
          </div>

          <div className="flex flex-row sm:flex-row items-center gap-2 md:gap-4 w-full sm:w-auto">
            <button
              onClick={() => onTypeFilter('income')}
              className="flex-1 sm:flex-none flex items-center gap-3 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 hover:bg-white/20 hover:border-white/25 transition-all active:scale-95 cursor-pointer"
            >
              <div className="size-6 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Income</p>
                <p className="text-sm md:text-base font-bold font-mono text-white leading-none">
                  {currencySymbol}{currentMonth.income.toLocaleString()}
                </p>
              </div>
            </button>

            <button
              onClick={() => onTypeFilter('expense')}
              className="flex-1 sm:flex-none flex items-center gap-3 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 hover:bg-white/20 hover:border-white/25 transition-all active:scale-95 cursor-pointer"
            >
              <div className="size-6 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Expense</p>
                <p className="text-sm md:text-base font-bold font-mono text-white leading-none">
                  {currencySymbol}{currentMonth.expense.toLocaleString()}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Mini Progress Bar */}
        <div className="mt-4 relative z-10 space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary-100/60">
            <span>Expense Progress</span>
            <span>{Math.min(100, (currentMonth.income > 0 ? Math.round((currentMonth.expense / currentMonth.income) * 100) : 0))}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-1000"
              style={{ width: `${Math.min(100, (currentMonth.income > 0 ? (currentMonth.expense / currentMonth.income) * 100 : 0))}%` }}
            ></div>
          </div>
        </div>
      </section>

      {/* Recent & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent Transactions */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-stone-900 dark:text-white">Recent Transactions</h3>
            <button
              onClick={onViewAll}
              className="text-primary-600 dark:text-primary-400 text-xs font-bold hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onTransactionClick(t)}
                  className="w-full card p-3 md:p-4 flex items-center gap-3 md:gap-4 border border-[#AF8F42]/30 dark:border-[#AF8F42]/40 hover:border-[#AF8F42]/60 transition-all duration-500 ease-out hover:shadow-xl hover:shadow-[#AF8F42]/10 group active:scale-[0.99]"
                >           <div className={`size-12 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                  }`}>
                    <span className="material-symbols-outlined text-2xl">{t.category.icon}</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-stone-900 dark:text-white truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">{t.category.name}</span>
                      <span className="text-[8px] text-stone-300 dark:text-stone-700 font-black">•</span>
                      <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{formatDate(t.date)}</span>
                    </div>
                  </div>
                  <div className={`font-bold text-lg ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-stone-900 dark:text-white'}`}>
                    {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString()}
                  </div>
                </button>
              ))
            ) : (
              <div className="card p-8 flex flex-col items-center justify-center text-stone-400 border-dashed border-stone-200 dark:border-stone-800">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-20">history_edu</span>
                <p className="text-sm font-medium">No transactions yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Financial Health */}
        <section className="space-y-4">
          <h3 className="font-bold text-stone-900 dark:text-white px-1">Overview</h3>
          <div className="card p-3 md:p-4 bg-stone-900 text-white dark:bg-brand-surface-dark">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 mb-4">Financial Health</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-sm text-stone-300">Savings Rate</p>
                <p className="text-xl font-bold">{currentMonth.income > 0 ? Math.round(((currentMonth.income - currentMonth.expense) / currentMonth.income) * 100) : 0}%</p>
              </div>
              <div className="w-full h-2 bg-stone-800 dark:bg-stone-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${Math.max(0, currentMonth.income > 0 ? ((currentMonth.income - currentMonth.expense) / currentMonth.income) * 100 : 0)}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Monthly Budget</span>
                <span className="font-bold text-white">Flexible</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Total Transactions</span>
                <span className="font-bold text-white">{transactions.length}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
