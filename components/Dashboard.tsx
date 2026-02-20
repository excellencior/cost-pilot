import React, { useState, useRef, useEffect } from 'react';
import { MonthlyData, Transaction } from '../types';
import { useCloudBackup } from './CloudBackupContext';

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
  const { isCloudEnabled, backupStatus, statusMessage, lastBackupTime, retryBackup } = useCloudBackup();
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const currentMonth = monthlyData[0] || { month: 'Unknown', year: new Date().getFullYear(), income: 0, expense: 0 };
  const balance = currentMonth.income - currentMonth.expense;
  const recentTransactions = transactions.slice(0, 4);

  // Close popover on outside click
  useEffect(() => {
    if (!showPopover) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPopover]);

  const getIconConfig = () => {
    if (!isCloudEnabled) return { icon: 'cloud_off', color: 'text-white/40', spin: false };
    switch (backupStatus) {
      case 'syncing': return { icon: 'cloud_sync', color: 'text-amber-300', spin: true };
      case 'success': return { icon: 'cloud_done', color: 'text-green-300', spin: false };
      case 'error': return { icon: 'cloud_off', color: 'text-rose-300', spin: false };
      default: return { icon: 'cloud_done', color: 'text-white/60', spin: false };
    }
  };

  const formatLastBackup = (iso: string | null) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString();
  };

  const getPopoverStatusText = () => {
    if (!isCloudEnabled) return 'Cloud backup is disabled';
    switch (backupStatus) {
      case 'syncing': return statusMessage || 'Syncing your data...';
      case 'success': return statusMessage || 'All data backed up';
      case 'error': return statusMessage || 'Backup failed';
      default: return 'Cloud backup is active';
    }
  };

  const iconConfig = getIconConfig();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Stats */}
      <section className="card p-6 bg-primary-600 border-none text-white overflow-hidden relative shadow-2xl shadow-primary-600/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-primary-100 text-sm font-bold uppercase tracking-widest opacity-90">Total Balance</p>

              {/* Cloud Backup Icon */}
              <div className="relative" ref={popoverRef}>
                <button
                  onClick={() => setShowPopover(!showPopover)}
                  className={`size-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 ${iconConfig.color}`}
                  title="Cloud backup status"
                >
                  <span className={`material-symbols-outlined text-lg ${iconConfig.spin ? 'animate-spin' : ''}`}>
                    {iconConfig.icon}
                  </span>
                </button>

                {/* Status Popover */}
                {showPopover && (
                  <div className="absolute right-0 top-10 w-64 bg-slate-900 dark:bg-slate-800 rounded-2xl shadow-2xl border border-white/10 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`material-symbols-outlined text-base ${iconConfig.color} ${iconConfig.spin ? 'animate-spin' : ''}`}>
                        {iconConfig.icon}
                      </span>
                      <span className="text-sm font-bold text-white">Cloud Backup</span>
                    </div>
                    <p className="text-xs text-slate-300 mb-2">{getPopoverStatusText()}</p>
                    {isCloudEnabled && lastBackupTime && (
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                        Last backup: {formatLastBackup(lastBackupTime)}
                      </p>
                    )}
                    {backupStatus === 'error' && (
                      <button
                        onClick={() => { retryBackup(); setShowPopover(false); }}
                        className="mt-3 w-full bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Retry Sync
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-5xl font-black mb-1">{currencySymbol}{balance.toLocaleString()}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded backdrop-blur-md">
                {currentMonth.month} {currentMonth.year}
              </span>
            </div>
          </div>

          <div className="flex gap-8 border-t md:border-t-0 md:border-l border-white/20 pt-6 md:pt-0 md:pl-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary-100">
                <span className="material-symbols-outlined text-base">arrow_upward</span>
                <span className="text-xs font-black uppercase tracking-widest">Income</span>
              </div>
              <p className="text-3xl font-bold font-mono">{currencySymbol}{currentMonth.income.toLocaleString()}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary-100">
                <span className="material-symbols-outlined text-base">arrow_downward</span>
                <span className="text-xs font-black uppercase tracking-widest">Expenses</span>
              </div>
              <p className="text-3xl font-bold font-mono">{currencySymbol}{currentMonth.expense.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Mini Progress Bar */}
        <div className="mt-8 relative z-10 space-y-2">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                  <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                    }`}>
                    <span className="material-symbols-outlined text-2xl">{t.category.icon}</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{t.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t.category.name} • {t.date}</p>
                  </div>
                  <div className={`font-bold text-lg ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                    {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString()}
                  </div>
                </button>
              ))
            ) : (
              <div className="card p-12 flex flex-col items-center justify-center text-slate-400 border-dashed">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-20">history_edu</span>
                <p className="text-sm font-medium">No transactions yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Financial Health */}
        <section className="space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white px-1">Overview</h3>
          <div className="card p-6 bg-slate-900 text-white dark:bg-slate-800/50">
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
