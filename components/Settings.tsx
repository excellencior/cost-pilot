import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import jsPDF from 'jspdf';

interface SettingsProps {
  onNavigate: (view: any) => void;
  categoryCount: number;
  transactions?: any[];
  currency: string;
  setCurrency: (code: string) => void;
}

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
];

const Settings: React.FC<SettingsProps> = ({ onNavigate, categoryCount, transactions = [], currency, setCurrency }) => {
  const { user, signIn, logOut, loading } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const [fromDate, setFromDate] = useState('2023-10-01');
  const [toDate, setToDate] = useState('2023-10-31');

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleSync = () => {
    if (!user) return;
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

    // Title
    doc.setFontSize(20);
    doc.text('ZenSpend Financial Report', 20, 20);

    // Date range
    doc.setFontSize(12);
    doc.text(`Period: ${fromDate} to ${toDate}`, 20, 35);

    // Filter transactions by date
    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= new Date(fromDate) && d <= new Date(toDate);
    });

    // Summary
    const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    doc.setFontSize(14);
    doc.text(`Total Income: ${currencySymbol}${income.toLocaleString()}`, 20, 50);
    doc.text(`Total Expense: ${currencySymbol}${expense.toLocaleString()}`, 20, 60);
    doc.text(`Net Savings: ${currencySymbol}${(income - expense).toLocaleString()}`, 20, 70);

    // Transactions list
    doc.setFontSize(12);
    doc.text('Transactions:', 20, 90);

    let y = 100;
    filtered.slice(0, 20).forEach((t, i) => {
      const sign = t.type === 'expense' ? '-' : '+';
      doc.setFontSize(10);
      doc.text(`${t.date} | ${t.title} | ${sign}${currencySymbol}${t.amount}`, 20, y);
      y += 8;
    });

    if (filtered.length > 20) {
      doc.text(`... and ${filtered.length - 20} more transactions`, 20, y);
    }

    doc.save(`ZenSpend_Report_${fromDate}_to_${toDate}.pdf`);
  };

  const handleExportCSV = () => {
    const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= new Date(fromDate) && d <= new Date(toDate);
    });

    const headers = ['Date', 'Type', 'Title', 'Category', 'Amount'];
    const rows = filtered.map(t => [
      t.date,
      t.type,
      t.title,
      t.category?.name || 'Uncategorized',
      `${currencySymbol}${t.amount}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ZenSpend_Export_${fromDate}_to_${toDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8 p-6 overflow-y-auto h-full hide-scrollbar pb-32">
      {/* Profile Section */}
      <div className="flex flex-col items-center py-4 gap-3">
        <div className="size-24 rounded-[2rem] bg-gradient-to-tr from-primary to-blue-400 p-1 shadow-xl shadow-primary/20">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-full h-full rounded-[1.8rem] border border-white/10 object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-[1.8rem] bg-background-dark flex items-center justify-center text-white text-3xl font-bold border border-white/10">
              {user?.displayName?.charAt(0) || 'G'}
            </div>
          )}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {user?.displayName || 'Guest User'}
          </h2>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">
            {user?.email || 'Sign in to sync data'}
          </p>
        </div>
      </div>

      {/* Settings Groups */}
      <div className="space-y-6">

        {/* Cloud Sync Section */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">Cloud Services</h3>
          <div className="glass-card rounded-3xl overflow-hidden">
            {user ? (
              <>
                <div className="p-4 px-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-500">cloud_done</span>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">Cloud Backup</span>
                      <span className="text-[10px] text-green-500 font-mono">Syncing automatically</span>
                    </div>
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isSyncing
                      ? 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'
                      : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                      }`}
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>
                <div className="border-t border-slate-100 dark:border-white/5 p-4 px-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={user.photoURL || ''}
                      alt=""
                      className="size-8 rounded-full"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">{user.displayName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Connected</span>
                </div>
              </>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full p-4 px-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">Sign in with Google</span>
                    <span className="text-[10px] text-slate-400 font-mono">Enable cloud backup & sync</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories & Preferences */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">Preferences</h3>
          <div className="glass-card rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
            <div
              onClick={() => onNavigate('category-picker')}
              className="flex items-center justify-between p-4 px-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-slate-400">category</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Manage Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400">{categoryCount} items</span>
                <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
              </div>
            </div>
            <div
              onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
              className="flex items-center justify-between p-4 px-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-slate-400">payments</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Currency</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-primary">{currency}</span>
                <span className="material-symbols-outlined text-slate-300 text-sm">expand_more</span>
              </div>
            </div>
            {showCurrencyPicker && (
              <div className="p-3 bg-slate-50 dark:bg-white/5">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => { setCurrency(c.code); setShowCurrencyPicker(false); }}
                    className={`w-full p-3 rounded-xl flex items-center justify-between transition-all ${currency === c.code
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-white dark:hover:bg-white/5'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">{c.symbol}</span>
                      <span className="text-sm font-bold">{c.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold">{c.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Data Export Section */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">Reports & Export</h3>
          <div className="glass-card rounded-3xl p-5 space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Statement Period</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="glass-input rounded-xl px-3 py-2 flex flex-col">
                  <span className="text-[8px] uppercase font-bold text-slate-400 mb-0.5">From</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="bg-transparent border-none p-0 text-xs font-bold focus:ring-0 color-scheme-dark"
                  />
                </div>
                <div className="glass-input rounded-xl px-3 py-2 flex flex-col">
                  <span className="text-[8px] uppercase font-bold text-slate-400 mb-0.5">To</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="bg-transparent border-none p-0 text-xs font-bold focus:ring-0 color-scheme-dark"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportPDF}
                className="flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-transparent hover:border-primary/30 transition-all group active:scale-95"
              >
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">picture_as_pdf</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">PDF Report</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-transparent hover:border-primary/30 transition-all group active:scale-95"
              >
                <span className="material-symbols-outlined text-green-500 group-hover:scale-110 transition-transform">csv</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">CSV Sheet</span>
              </button>
            </div>
          </div>
        </div>

        {/* General Appearance - Notifications REMOVED */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">General</h3>
          <div className="glass-card rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
            <div className="flex items-center justify-between p-4 px-5">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-slate-400">dark_mode</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Dark Appearance</span>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-primary' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 size-4 bg-white rounded-full transition-all shadow-sm ${darkMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Security & Account */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">Security</h3>
          <div className="glass-card rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
            <div className="flex items-center gap-4 p-4 px-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <span className="material-symbols-outlined text-slate-400">lock_reset</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Change PIN</span>
            </div>
            {user && (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-4 p-4 px-5 cursor-pointer hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="text-sm font-bold">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">ZenSpend v2.6.0-supabase</p>
      </div>
    </div>
  );
};

export default Settings;
