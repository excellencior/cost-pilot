import React, { useState } from 'react';
import { Transaction, View } from '../types';
import { useAuth } from './AuthContext';
import jsPDF from 'jspdf';

interface SettingsProps {
	onNavigate: (view: View) => void;
	categoryCount: number;
	transactions: Transaction[];
	currency: string;
	setCurrency: (c: string) => void;
}

const CURRENCIES = [
	{ code: 'USD', name: 'US Dollar', symbol: '$' },
	{ code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
	{ code: 'EUR', name: 'Euro', symbol: '€' },
];

const Settings: React.FC<SettingsProps> = ({ onNavigate, categoryCount, transactions, currency, setCurrency }) => {
	const { user, signIn, logOut } = useAuth();
	const [isSyncing, setIsSyncing] = useState(false);

	const toggleDarkMode = () => {
		document.documentElement.classList.toggle('dark');
	};

	const handleSync = () => {
		if (!user) return;
		setIsSyncing(true);
		setTimeout(() => setIsSyncing(false), 1500);
	};

	const handleExportPDF = () => {
		const doc = new jsPDF();
		const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

		doc.setFontSize(20);
		doc.text('ZenSpend Financial Report', 20, 20);
		doc.setFontSize(14);

		const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
		const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

		doc.text(`Total Income: ${currencySymbol}${income.toLocaleString()}`, 20, 40);
		doc.text(`Total Expense: ${currencySymbol}${expense.toLocaleString()}`, 20, 50);
		doc.text(`Net Balance: ${currencySymbol}${(income - expense).toLocaleString()}`, 20, 60);

		doc.setFontSize(10);
		doc.text('Recent Transactions:', 20, 80);
		transactions.slice(0, 15).forEach((t, i) => {
			doc.text(`${t.date} | ${t.title} | ${t.type === 'expense' ? '-' : '+'}${currencySymbol}${t.amount}`, 20, 90 + (i * 7));
		});

		doc.save('ZenSpend_Report.pdf');
	};

	return (
		<div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="px-1">
				<h2 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h2>
				<p className="text-slate-500 text-sm mt-1">Manage your preferences and data.</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Profile / Account */}
				<div className="card p-6 space-y-6">
					<div className="flex items-center gap-4">
						<div className="size-16 rounded-2xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 overflow-hidden border border-primary-200 dark:border-primary-800">
							{user?.photoURL ? (
								<img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
							) : (
								<span className="material-symbols-outlined text-4xl">person</span>
							)}
						</div>
						<div className="min-w-0">
							<p className="font-bold text-slate-900 dark:text-white truncate">{user?.displayName || 'Zen User'}</p>
							<p className="text-xs text-slate-500 truncate">{user?.email || 'Local Mode'}</p>
						</div>
					</div>
					{user ? (
						<div className="flex gap-2">
							<button onClick={handleSync} disabled={isSyncing} className="btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-2">
								<span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
								{isSyncing ? 'Syncing...' : 'Sync Now'}
							</button>
							<button onClick={() => logOut()} className="btn-secondary flex-1 text-xs py-2 text-rose-600 dark:text-rose-400">Sign Out</button>
						</div>
					) : (
						<button onClick={() => signIn()} className="btn-primary w-full text-sm">Sign In with Google</button>
					)}
				</div>

				{/* Categories Shortcut */}
				<div className="card p-6 flex flex-col justify-between">
					<div>
						<p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Categories</p>
						<p className="text-2xl font-bold text-slate-900 dark:text-white">{categoryCount}</p>
						<p className="text-xs text-slate-500 mt-1">Custom labels for your transactions.</p>
					</div>
					<button
						onClick={() => onNavigate('category-picker')}
						className="btn-primary w-full mt-4 text-sm"
					>
						Manage Categories
					</button>
				</div>

				{/* Preferences */}
				<div className="card p-6 space-y-6">
					<div>
						<label className="label-text">Currency</label>
						<select
							value={currency}
							onChange={(e) => setCurrency(e.target.value)}
							className="input-field mt-1"
						>
							{CURRENCIES.map(c => (
								<option key={c.code} value={c.code}>{c.code} - {c.name}</option>
							))}
						</select>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm font-bold text-slate-700 dark:text-slate-300">Dark Mode</span>
						<button
							onClick={toggleDarkMode}
							className="w-12 h-6 rounded-full bg-slate-200 dark:bg-primary-600 relative transition-colors"
						>
							<div className="absolute top-1 left-1 dark:left-7 size-4 bg-white rounded-full transition-all shadow-sm"></div>
						</button>
					</div>
				</div>

				{/* Data Exports */}
				<div className="card p-6 flex flex-col justify-between">
					<div>
						<p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Data Management</p>
						<p className="text-2xl font-bold text-slate-900 dark:text-white">{transactions.length}</p>
						<p className="text-xs text-slate-500 mt-1">Stored entries on this device.</p>
					</div>
					<div className="flex gap-2 mt-4">
						<button onClick={handleExportPDF} className="btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-2">
							<span className="material-symbols-outlined text-sm">picture_as_pdf</span>
							Export PDF
						</button>
						<button className="btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
							<span className="material-symbols-outlined text-sm">description</span>
							CSV
						</button>
					</div>
				</div>
			</div>

			<div className="card p-8 bg-slate-900 text-white dark:bg-slate-800 border-none relative overflow-hidden group">
				<div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -mb-32 -mr-32 blur-3xl group-hover:bg-primary-500/20 transition-all"></div>
				<div className="relative z-10">
					<h3 className="text-2xl font-bold mb-2">Cloud Backup</h3>
					<p className="text-slate-400 text-sm max-w-sm mb-6">Secure your financial history and access it across all your devices with safe cloud synchronization.</p>
					{!user && (
						<button onClick={() => signIn()} className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-bold text-sm shadow-xl hover:bg-slate-100 transition-all active:scale-95">
							Get Started Free
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default Settings;
