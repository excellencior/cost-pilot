import React from 'react';
import { MonthlyData, Transaction } from '../types';
import { formatDate } from '../utils';

interface DashboardProps {
  monthlyData: MonthlyData[];
  transactions: Transaction[];
  onAddEntry: () => void;
  onViewAll: () => void;
  onTransactionClick: (t: Transaction) => void;
  currencySymbol: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  monthlyData,
  transactions,
  onAddEntry,
  onViewAll,
  onTransactionClick,
  currencySymbol
}) => {
  const currentMonth = monthlyData[0] || { month: 'Unknown', year: new Date().getFullYear(), income: 0, expense: 0 };
  const balance = currentMonth.income - currentMonth.expense;
  const recentTransactions = transactions.slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero Stats */}
      <section className="card p-4 bg-primary-600 border-none text-white overflow-hidden relative shadow-2xl shadow-primary-600/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex-1">
            <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest mb-1 opacity-90 flex items-center gap-2">
              Total balance of
              <span className="bg-white/20 text-white px-2.5 py-1 rounded backdrop-blur-md shadow-sm">
                {currentMonth.month} {currentMonth.year}
              </span>
            </p>
            <h2 className="text-5xl font-black mb-1">{currencySymbol}{balance.toLocaleString()}</h2>
          </div>

          <div className="flex gap-12 border-t md:border-t-0 md:border-l border-white/20 pt-6 md:pt-0 md:pl-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-green-300">
                <span className="material-symbols-outlined text-base">arrow_upward</span>
                <span className="text-xs font-black uppercase tracking-widest">Income</span>
              </div>
              <p className="text-3xl font-bold font-mono text-green-400">{currencySymbol}{currentMonth.income.toLocaleString()}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-300">
                <span className="material-symbols-outlined text-base">arrow_downward</span>
                <span className="text-xs font-black uppercase tracking-widest">Expenses</span>
              </div>
              <p className="text-3xl font-bold font-mono text-rose-400">{currencySymbol}{currentMonth.expense.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Mini Progress Bar */}
        <div className="mt-6 relative z-10 space-y-1.5">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
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
                  className="w-full card p-4 flex items-center gap-4 hover:border-primary-200 dark:hover:border-primary-900 group"
                >
                  <div className={`size-12 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                    }`}>
                    <span className="material-symbols-outlined text-2xl">{t.category.icon}</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{t.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t.category.name} • {formatDate(t.date)}</p>
                  </div>
                  <div className={`font-bold text-lg ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                    {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString()}
                  </div>
                </button>
              ))
            ) : (
              <div className="card p-8 flex flex-col items-center justify-center text-slate-400 border-dashed">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-20">history_edu</span>
                <p className="text-sm font-medium">No transactions yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Financial Health */}
        <section className="space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white px-1">Overview</h3>
          <div className="card p-4 bg-slate-900 text-white dark:bg-slate-800/50">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Financial Health</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-sm text-slate-300">Savings Rate</p>
                <p className="text-xl font-bold">{currentMonth.income > 0 ? Math.round(((currentMonth.income - currentMonth.expense) / currentMonth.income) * 100) : 0}%</p>
              </div>
              <div className="w-full h-2 bg-slate-800 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{ width: `${Math.max(0, currentMonth.income > 0 ? ((currentMonth.income - currentMonth.expense) / currentMonth.income) * 100 : 0)}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Monthly Budget</span>
                <span className="font-bold text-white">Flexible</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Transactions</span>
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
