
import React from 'react';
import { MonthlyData } from '../types';

interface DashboardProps {
  monthlyData: MonthlyData[];
  onMonthSelect: (month: MonthlyData) => void;
  onAddEntry?: () => void;
  currency: string;
}

const getCurrencySymbol = (code: string) => {
  const symbols: Record<string, string> = { 'USD': '$', 'BDT': '৳', 'EUR': '€' };
  return symbols[code] || '$';
};

const Dashboard: React.FC<DashboardProps> = ({ monthlyData, onMonthSelect, onAddEntry, currency }) => {
  const currencySymbol = getCurrencySymbol(currency);

  // Handle empty data
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
        {/* ... (empty state content unchanged) ... */}
        <div className="size-24 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-primary">savings</span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Welcome to ZenSpend</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Start tracking your finances today
          </p>
          <button
            onClick={onAddEntry}
            className="px-8 py-4 bg-gradient-to-r from-primary to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Get Started
          </button>
        </div>
      </div>
    );
  }

  const currentMonth = monthlyData[0];
  const previousMonths = monthlyData.slice(1);

  return (
    <div className="flex flex-col gap-6 p-4 pt-2 overflow-y-auto h-full hide-scrollbar">
      {/* Current Month Hero Card */}
      <div
        onClick={() => onMonthSelect(currentMonth)}
        className="glass-card relative overflow-hidden rounded-[2.5rem] p-8 shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group"
      >
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none group-hover:bg-primary/20 transition-colors"></div>
        <div className="flex flex-row justify-between items-stretch relative z-10">
          <div className="flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Current Month</span>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{currentMonth.month}</h2>
            <span className="text-sm font-mono text-slate-400 dark:text-slate-500 mt-1">{currentMonth.year}</span>
          </div>
          <div className="flex flex-col justify-between items-end gap-4 pl-6 border-l border-slate-200/50 dark:border-slate-700/50">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 mb-1">
                <span className="material-symbols-outlined text-xs text-green-500">arrow_upward</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400">Income</span>
              </div>
              <span className="font-mono text-xl font-bold text-slate-900 dark:text-white tracking-tight">{currencySymbol}{currentMonth.income.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 mb-1">
                <span className="material-symbols-outlined text-xs text-red-500">arrow_downward</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400">Expense</span>
              </div>
              <span className="font-mono text-xl font-bold text-slate-900 dark:text-white tracking-tight">{currencySymbol}{currentMonth.expense.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Previous Months List */}
      {previousMonths.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] px-2">History</h3>
          <div className="space-y-3">
            {previousMonths.map((m) => (
              <div
                key={`${m.month}-${m.year}`}
                onClick={() => onMonthSelect(m)}
                className="glass-card p-5 rounded-3xl flex items-center justify-between shadow-sm transition-all hover:bg-white dark:hover:bg-white/5 hover:translate-x-1 active:scale-95 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    <span className="material-symbols-outlined text-2xl">calendar_month</span>
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-bold text-base leading-tight">{m.month}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-mono">{m.year}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold font-mono text-base ${m.income - m.expense > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {m.income - m.expense > 0 ? '+' : ''}{currencySymbol}{(m.income - m.expense).toFixed(2)}
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Savings</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-24"></div>
    </div>
  );
};

export default Dashboard;
