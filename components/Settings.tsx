import React, { useState } from 'react';
import { Transaction, View } from '../types';
import { useAuth } from './AuthContext';
import { useCloudBackup } from './CloudBackupContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LocalRepository } from '../services/db/localRepository';
import { formatDate } from '../utils';
import Dropdown from './UI/Dropdown';
import DatePicker from './UI/DatePicker';
import ConfirmModal from './UI/ConfirmModal';

interface SettingsProps {
	onNavigate: (view: View) => void;
	onBack: () => void;
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

const Settings: React.FC<SettingsProps> = ({ onNavigate, onBack, categoryCount, transactions, currency, setCurrency }) => {
	const { user, signIn, logOut } = useAuth();
	const { isCloudEnabled, backupStatus, statusMessage, lastBackupTime, toggleCloudBackup, retryBackup } = useCloudBackup();
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const toggleDarkMode = () => {
		const isDark = document.documentElement.classList.toggle('dark');
		LocalRepository.updateSettings({ theme: isDark ? 'dark' : 'light' });
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

	const getStatusConfig = () => {
		switch (backupStatus) {
			case 'syncing':
				return { text: statusMessage || 'Backing up...', color: 'text-amber-500', icon: 'cloud_sync', spin: true };
			case 'success':
				return { text: statusMessage || 'All data backed up', color: 'text-green-500', icon: 'cloud_done', spin: false };
			case 'error':
				return { text: statusMessage || 'Backup failed', color: 'text-rose-500', icon: 'cloud_off', spin: false };
			default:
				return { text: isCloudEnabled ? 'Cloud backup is active' : 'Cloud backup is off', color: 'text-stone-400', icon: isCloudEnabled ? 'cloud_done' : 'cloud_off', spin: false };
		}
	};

	const statusConfig = getStatusConfig();

	const handleExportPDF = () => {
		try {
			const doc = new jsPDF();
			const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';
			const currencyCode = currency;

			// Title
			doc.setFontSize(22);
			doc.setTextColor(28, 25, 23); // stone-900
			doc.text('CostPilot Financial Report', 14, 22);

			let filteredTransactions = transactions;
			if (startDate || endDate) {
				filteredTransactions = transactions.filter(t => {
					const tDate = t.date;
					const afterStart = !startDate || tDate >= startDate;
					const beforeEnd = !endDate || tDate <= endDate;
					return afterStart && beforeEnd;
				});
				doc.setFontSize(10);
				doc.setTextColor(100, 116, 139);
				doc.text(`Range: ${startDate || 'All Time'} to ${endDate || 'Present'}`, 14, 30);
			}

			if (filteredTransactions.length === 0) {
				alert('No transactions found in the specified range.');
				return;
			}

			const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
			const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
			const balance = income - expense;

			autoTable(doc, {
				startY: 40,
				head: [['Summary', 'Amount']],
				body: [
					['Total Income', `${currencyCode} ${income.toLocaleString()}`],
					['Total Expense', `${currencyCode} ${expense.toLocaleString()}`],
					['Net Balance', `${currencyCode} ${balance.toLocaleString()}`]
				],
				theme: 'striped',
				headStyles: { fillColor: [79, 70, 229] },
				columnStyles: {
					1: { halign: 'right', fontStyle: 'bold' }
				}
			});

			// Transactions Table
			const tableData = filteredTransactions.map(t => {
				const categoryName = t.category && typeof t.category === 'object' ? t.category.name : (t.category || '-');
				return [
					formatDate(t.date),
					t.title || 'Untitled',
					categoryName,
					t.type === 'expense' ? `-${t.amount.toLocaleString()}` : `+${t.amount.toLocaleString()}`
				];
			});

			autoTable(doc, {
				startY: (doc as any).lastAutoTable.finalY + 15,
				head: [['Date', 'Description', 'Category', `Amount (${currencyCode})`]],
				body: tableData,
				theme: 'grid',
				headStyles: { fillColor: [41, 37, 36] }, // stone-800
				styles: { fontSize: 9 },
				columnStyles: {
					0: { cellWidth: 30 },
					3: { halign: 'right', cellWidth: 35 }
				},
				didParseCell: function (data) {
					if (data.section === 'body' && data.column.index === 3) {
						const val = data.cell.text[0];
						if (val.startsWith('-')) {
							data.cell.styles.textColor = [225, 29, 72];
						} else if (val.startsWith('+')) {
							data.cell.styles.textColor = [5, 150, 105];
						}
					}
				}
			});

			doc.save(`CostPilot_Report_${new Date().toISOString().split('T')[0]}.pdf`);
		} catch (error) {
			console.error('PDF Export Error:', error);
			alert('Failed to generate PDF. Please check console for details.');
		}
	};

	const handleExportCSV = () => {
		try {
			let filteredTransactions = transactions;
			if (startDate || endDate) {
				filteredTransactions = transactions.filter(t => {
					const tDate = t.date;
					const afterStart = !startDate || tDate >= startDate;
					const beforeEnd = !endDate || tDate <= endDate;
					return afterStart && beforeEnd;
				});
			}

			if (filteredTransactions.length === 0) {
				alert('No transactions found to export.');
				return;
			}

			const headers = ['Date', 'Title', 'Category', 'Type', 'Amount', 'Currency', 'Location'];
			const rows = filteredTransactions.map(t => {
				const categoryName = t.category && typeof t.category === 'object' ? t.category.name : (t.category || '');
				const safeTitle = (t.title || '').replace(/"/g, '""');
				const safeCategory = (categoryName || '').replace(/"/g, '""');
				const safeLocation = (t.location || '').replace(/"/g, '""');

				return [
					t.date,
					`"${safeTitle}"`,
					`"${safeCategory}"`,
					t.type,
					t.amount,
					currency,
					`"${safeLocation}"`
				];
			});

			const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);

			const link = document.createElement('a');
			link.href = url;
			link.download = `CostPilot_Export_${new Date().toISOString().split('T')[0]}.csv`;

			// Append to body to ensure it works in all browsers
			document.body.appendChild(link);
			link.click();

			// Cleanup
			setTimeout(() => {
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
			}, 100);
		} catch (error) {
			console.error('CSV Export Error:', error);
			alert('Failed to generate CSV. Please check console for details.');
		}
	};

	return (
		<div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="flex items-center justify-between px-1">
				<div className="flex items-center gap-4">
					<button
						onClick={onBack}
						className="size-10 rounded-lg bg-brand-surface-light dark:bg-brand-surface-dark border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all active:scale-95"
					>
						<span className="material-symbols-outlined">arrow_back</span>
					</button>
					<div>
						<h2 className="text-3xl font-bold text-stone-900 dark:text-white">Settings</h2>
						<p className="text-stone-500 text-sm mt-1">Manage your preferences and data.</p>
					</div>
				</div>
				<button
					onClick={toggleDarkMode}
					className="size-12 rounded-xl bg-brand-surface-light dark:bg-brand-surface-dark border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all active:scale-95 shadow-sm"
					title="Toggle Dark Mode"
				>
					<span className="material-symbols-outlined">
						{document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode'}
					</span>
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
				{/* Profile / Account */}
				<div className="card p-4 space-y-5">
					<div className="flex items-center gap-4">
						<div className="size-16 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 overflow-hidden border border-primary-200 dark:border-primary-800 relative">
							{user?.user_metadata?.avatar_url ? (
								<img
									src={user.user_metadata.avatar_url}
									alt="Profile"
									className="w-full h-full object-cover"
									onError={(e) => {
										(e.target as HTMLImageElement).style.display = 'none';
										const parent = (e.target as HTMLImageElement).parentElement;
										if (parent) {
											const span = document.createElement('span');
											span.className = 'text-xl font-bold uppercase';
											span.innerText = (user?.user_metadata?.full_name || user?.email || 'Z')[0];
											parent.appendChild(span);
										}
									}}
								/>
							) : (
								<span className="text-xl font-bold uppercase">
									{(user?.user_metadata?.full_name || user?.email || 'Z')[0]}
								</span>
							)}
						</div>
						<div className="min-w-0">
							<p className="font-bold text-stone-900 dark:text-white truncate">{user?.user_metadata?.full_name || 'CostPilot User'}</p>
							<p className="text-xs text-stone-500 truncate">{user?.email || 'Local Mode'}</p>
						</div>
					</div>
					{user ? (
						<button onClick={() => logOut()} className="btn-secondary w-full text-xs py-2 text-rose-600 dark:text-rose-400">Sign Out</button>
					) : (
						<div className="space-y-3">
							<div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 space-y-2">
								<div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
									<span className="material-symbols-outlined text-base text-primary-500">cloud_upload</span>
									<span className="text-xs font-bold">Cloud Backup</span>
								</div>
								<div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
									<span className="material-symbols-outlined text-base text-primary-500">devices</span>
									<span className="text-xs font-bold">Cross-Device Sync</span>
								</div>
								<div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
									<span className="material-symbols-outlined text-base text-primary-500">lock</span>
									<span className="text-xs font-bold">Secure & Private</span>
								</div>
							</div>
							<button onClick={() => signIn()} className="w-full text-sm flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all active:scale-95 border border-primary-500/50 bg-emerald-500/5 text-stone-900 dark:border-primary-500/40 dark:bg-emerald-900/20 dark:text-white hover:bg-emerald-500/10 dark:hover:bg-emerald-900/30 shadow-sm">
								<svg className="size-4" viewBox="0 0 24 24">
									<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
									<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
									<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
									<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
								</svg>
								Sign In with Google
							</button>
						</div>
					)}
				</div>

				{/* Categories Shortcut */}
				<button
					onClick={() => onNavigate('category-picker')}
					className="card p-4 flex flex-col justify-between text-left hover:border-primary-600 dark:hover:border-primary-400 group transition-all active:scale-[0.98]"
				>
					<div>
						<p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400">Categories</p>
						<p className="text-2xl font-bold text-stone-900 dark:text-white">{categoryCount}</p>
						<p className="text-xs text-stone-500 mt-1">Custom labels for your transactions.</p>
					</div>
					<div className="flex items-center gap-2 mt-4 text-primary-600 dark:text-primary-400 font-bold text-sm">
						<span>Manage Categories</span>
						<span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
					</div>
				</button>

				{/* Preferences - Currency */}
				<div className="card p-4 flex flex-col justify-between relative group">
					<div>
						<p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Primary Currency</p>
						<div className="flex items-baseline gap-2">
							<p className="text-2xl font-bold text-stone-900 dark:text-white">{currency}</p>
							<p className="text-xs font-bold text-stone-400">{CURRENCIES.find(c => c.code === currency)?.name}</p>
						</div>
						<p className="text-xs text-stone-500 mt-2">All financial metrics will use this symbol.</p>
					</div>

					<Dropdown
						label="Select Currency"
						options={CURRENCIES.map(c => ({ id: c.code, name: `${c.code} - ${c.name}` }))}
						value={currency}
						onChange={setCurrency}
						className="mt-4"
					/>
				</div>

				{/* Data Exports */}
				<div className="card p-4 space-y-4">
					<div>
						<p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Data Management</p>
						<div className="grid grid-cols-2 gap-4 mt-4">
							<DatePicker
								label="Start Date"
								value={startDate}
								onChange={setStartDate}
							/>
							<DatePicker
								label="End Date"
								value={endDate}
								onChange={setEndDate}
							/>
						</div>
					</div>
					<div className="flex gap-2">
						<button onClick={handleExportPDF} className="btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-2">
							<span className="material-symbols-outlined text-sm">picture_as_pdf</span>
							Export PDF
						</button>
						<button onClick={handleExportCSV} className="btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-2">
							<span className="material-symbols-outlined text-sm">description</span>
							Export CSV
						</button>
					</div>
				</div>
			</div>

			{/* Cloud Backup Card */}
			<div className="card p-6 bg-stone-900 text-white dark:bg-brand-surface-dark border-none relative overflow-hidden group">
				<div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -mb-32 -mr-32 blur-3xl group-hover:bg-primary-500/20 transition-all"></div>
				<div className="relative z-10">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-3">
							<span className={`material-symbols-outlined text-2xl ${statusConfig.color} ${statusConfig.spin ? 'animate-spin' : ''}`}>
								{statusConfig.icon}
							</span>
							<h3 className="text-2xl font-bold">Cloud Backup</h3>
						</div>

						{/* Toggle Switch */}
						<button
							onClick={user ? toggleCloudBackup : undefined}
							disabled={!user}
							className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${!user ? 'bg-stone-700 cursor-not-allowed opacity-50' :
								isCloudEnabled ? 'bg-primary-500' : 'bg-stone-600'
								}`}
							title={!user ? 'Sign in to enable cloud backup' : (isCloudEnabled ? 'Disable cloud backup' : 'Enable cloud backup')}
						>
							<span
								className={`inline-block size-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${isCloudEnabled && user ? 'translate-x-6' : 'translate-x-1'
									}`}
							/>
						</button>
					</div>

					<p className="text-stone-400 text-sm max-w-sm mb-3">
						{!user
							? 'Sign in to enable cloud backup and sync your data across devices.'
							: 'Secure your financial history and access it across all your devices.'
						}
					</p>

					{/* Status Line */}
					<div className="flex items-center gap-3 text-sm">
						<span className={`${statusConfig.color} font-medium`}>{statusConfig.text}</span>
						{isCloudEnabled && lastBackupTime && backupStatus !== 'syncing' && (
							<span className="text-stone-500 text-xs">• Last backup: {formatLastBackup(lastBackupTime)}</span>
						)}
					</div>

					{/* Retry button on error */}
					{backupStatus === 'error' && user && (
						<button
							onClick={retryBackup}
							className="mt-4 bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
						>
							<span className="material-symbols-outlined text-sm">refresh</span>
							Retry Sync
						</button>
					)}


				</div>
			</div>
		</div>
	);
};

export default Settings;
