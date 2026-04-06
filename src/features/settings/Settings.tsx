import React, { useState, useEffect } from 'react';
import { Transaction, View } from '../../entities/types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LocalRepository } from '../../infrastructure/local/local-repository';
import { formatDate } from '../../entities/financial';
import Dropdown from '../../shared/ui/Dropdown';
import DatePicker from '../../shared/ui/DatePicker';
import TimePicker from '../../shared/ui/TimePicker';
import ConfirmModal from '../../shared/ui/ConfirmModal';
import { useLocalBackup } from '../../application/contexts/LocalBackupContext';
import { toast } from 'react-hot-toast';

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

const Settings: React.FC<SettingsProps> = ({
	onNavigate,
	categoryCount,
	transactions,
	currency,
	setCurrency
}) => {
	const backupService = useLocalBackup();
	const { isEnabled, backupTime, enableBackup, disableBackup, setBackupTime, performManualBackup, restoreFromBackup, hasDirectoryAccess, requestDirectoryAccess, directoryName, backupStatus, statusMessage, lastBackupTime, getMostRecentBackup, parseBackupFile } = backupService;

	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	// Restore on toggle state
	const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
	const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
	const [showManual, setShowManual] = useState(false);
	const [showMergedModal, setShowMergedModal] = useState(false);
	const [recentBackupFile, setRecentBackupFile] = useState<File | null>(null);
	const [backupMetadata, setBackupMetadata] = useState<{ transactions?: number, categories?: number } | null>(null);
	const [mergedEntries, setMergedEntries] = useState<any[]>([]);

	const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

	const toggleDarkMode = () => {
		const dark = document.documentElement.classList.toggle('dark');
		setIsDark(dark);
		LocalRepository.updateSettings({ theme: dark ? 'dark' : 'light' });
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
				return { text: statusMessage || 'Backing up...', color: 'text-amber-500', icon: 'sync', spin: true };
			case 'success':
				return { text: statusMessage || 'Backup successful', color: 'text-green-500', icon: 'check_circle', spin: false };
			case 'error':
				return { text: statusMessage || 'Backup failed', color: 'text-rose-500', icon: 'error', spin: false };
			default:
				return { text: isEnabled ? 'Auto backup is on' : 'Auto backup is off', color: 'text-stone-400', icon: isEnabled ? 'folder_special' : 'folder_off', spin: false };
		}
	};

	const statusConfig = getStatusConfig();

	const handleExportPDF = async () => {
		try {
			const doc = new jsPDF();
			const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';
			const currencyCode = currency;

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

			if (Capacitor.isNativePlatform()) {
				const pdfBase64 = doc.output('datauristring').split(',')[1];
				const fileName = `CostPilot_Report_${new Date().toISOString().split('T')[0]}.pdf`;

				const savedFile = await Filesystem.writeFile({
					path: fileName,
					data: pdfBase64,
					directory: Directory.Cache
				});

				await Share.share({
					title: 'Export PDF',
					text: 'Your CostPilot financial report.',
					url: savedFile.uri,
					dialogTitle: 'Share PDF'
				});
			} else {
				doc.save(`CostPilot_Report_${new Date().toISOString().split('T')[0]}.pdf`);
			}
		} catch (error) {
			console.error('PDF Export Error:', error);
			alert('Failed to generate PDF. Please check console for details.');
		}
	};

	const handleExportCSV = async () => {
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
			if (Capacitor.isNativePlatform()) {
				const fileName = `CostPilot_Export_${new Date().toISOString().split('T')[0]}.csv`;
				const base64Data = btoa(unescape(encodeURIComponent(csvContent)));

				const savedFile = await Filesystem.writeFile({
					path: fileName,
					data: base64Data,
					directory: Directory.Cache
				});

				await Share.share({
					title: 'Export CSV',
					text: 'Your CostPilot financial export.',
					url: savedFile.uri,
					dialogTitle: 'Share CSV'
				});
			} else {
				const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
				const url = URL.createObjectURL(blob);

				const link = document.createElement('a');
				link.href = url;
				link.download = `CostPilot_Export_${new Date().toISOString().split('T')[0]}.csv`;

				document.body.appendChild(link);
				link.click();

				setTimeout(() => {
					document.body.removeChild(link);
					URL.revokeObjectURL(url);
				}, 100);
			}
		} catch (error) {
			console.error('CSV Export Error:', error);
			alert('Failed to generate CSV. Please check console for details.');
		}
	};

	// Auto backup handlers
	const checkForTodayBackupConflict = async () => {
		try {
			const file = await getMostRecentBackup();
			if (file) {
				const filename = file.name;
				// Use local date for matching filename
				const now = new Date();
				const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
				
				if (filename.includes(today)) {
					const metadata = await parseBackupFile(file);
					setBackupMetadata({
						transactions: metadata.transactions?.length,
						categories: metadata.categories?.length
					});
					setShowOverwriteConfirm(true);
					return true;
				}
			}
		} catch (e) {
			console.error('Failed to check for backup conflict:', e);
		}
		return false;
	};

	const handleToggleBackup = async () => {
		if (!isEnabled) {
			// Turning ON
			if (!hasDirectoryAccess) {
				const granted = await requestDirectoryAccess();
				if (!granted) return;
			}

			// Check for conflict before final enable
			const hasConflict = await checkForTodayBackupConflict();
			if (!hasConflict) {
				enableBackup();
			}
		} else {
			// Turning OFF
			disableBackup();
		}
	};

	const onLocationClick = async () => {
		const granted = await requestDirectoryAccess();
		if (granted && isEnabled) {
			// If already enabled, check if the new location has a conflict
			await checkForTodayBackupConflict();
		}
	};

	const onRestoreClick = async () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async (e: any) => {
			const file = e.target.files?.[0];
			if (file) {
				const stats = await restoreFromBackup(file);
				if (stats && typeof stats === 'object') {
					setMergedEntries(stats.newTransactions || []);
					setShowMergedModal(true);
				}
			}
		};
		input.click();
	};

	const ManualModal = () => (
		<ConfirmModal
			isOpen={showManual}
			onClose={() => setShowManual(false)}
			onConfirm={() => setShowManual(false)}
			title="Backup Guidance"
			message="Choose the right way to manage your data."
			confirmLabel="Got it"
			variant="primary"
			extraContent={
				<div className="space-y-4 mt-6 text-left">
					{/* Merging Card */}
					<div className="card-section p-4 bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10 text-left">
						<div className="flex gap-4">
							<div className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
								<span className="material-symbols-outlined">call_merge</span>
							</div>
							<div className="text-left">
								<h4 className="font-bold text-stone-800 dark:text-stone-100 text-sm text-left">Merging Data</h4>
								<p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed text-left">
									Click <span className="font-bold text-emerald-600 dark:text-emerald-400">Restore</span> and select a file to combine backup data with your device data.
								</p>
							</div>
						</div>
					</div>

					{/* Overwriting Card */}
					<div className="card-section p-4 bg-amber-50/50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/10 text-left">
						<div className="flex gap-4">
							<div className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
								<span className="material-symbols-outlined">swap_horiz</span>
							</div>
							<div className="text-left">
								<h4 className="font-bold text-stone-800 dark:text-stone-100 text-sm text-left">Overwriting Data</h4>
								<p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed text-left">
									Enabling auto-backup overwrites today's file. To avoid data loss, <span className="font-bold text-amber-600 dark:text-amber-400">move/rename</span> the existing file first, then use <span className="font-bold text-amber-600 dark:text-amber-400">Restore</span> to merge it later if needed.
								</p>
							</div>
						</div>
					</div>
				</div>
			}
		/>
	);

	const MergedResultsModal = () => {
		const symbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

		return (
			<ConfirmModal
				isOpen={showMergedModal}
				onClose={() => { setShowMergedModal(false); window.dispatchEvent(new Event('costpilot-settings-updated')); }}
				onConfirm={() => { setShowMergedModal(false); window.dispatchEvent(new Event('costpilot-settings-updated')); }}
				title="Sync Complete"
				message={`Found ${mergedEntries.length} new items in your backup.`}
				confirmLabel="Done"
				variant="primary"
				extraContent={
					<div className="max-h-96 overflow-y-auto space-y-2 mt-6 px-1 custom-scrollbar">
						{mergedEntries.map((t, i) => (
							<div
								key={i}
								className="w-full card p-3 md:p-4 flex items-center gap-3 md:gap-4 border border-[#AF8F42]/30 dark:border-[#AF8F42]/40 transition-all duration-500 ease-out text-left"
							>
								<div className={`size-12 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
									}`}>
									<span className="material-symbols-outlined text-2xl">{t.category?.icon || (t.type === 'income' ? 'add_box' : 'payments')}</span>
								</div>
								<div className="flex-1 text-left min-w-0">
									<p className="font-bold text-stone-900 dark:text-white truncate tracking-tight">{t.title || 'Untitled'}</p>
									<div className="flex flex-col mt-0.5">
										<span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider font-brand-accent">
											{t.category?.name || 'Category'}
										</span>
										<span className="text-[9px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider leading-none mt-0.5">
											{formatDate(t.date)}
										</span>
									</div>
								</div>
								<div className={`font-bold text-base md:text-lg ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-stone-900 dark:text-white'}`}>
									{t.type === 'income' ? '+' : '-'}{symbol}{t.amount.toLocaleString()}
								</div>
							</div>
						))}
						{mergedEntries.length === 0 && (
							<div className="text-center py-12 card border-dashed border-stone-200 dark:border-stone-800">
								<div className="size-16 bg-stone-50 dark:bg-stone-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
									<span className="material-symbols-outlined text-stone-300 text-3xl">cloud_done</span>
								</div>
								<p className="text-stone-400 text-sm font-medium">All items were already synced!</p>
							</div>
						)}
					</div>
				}
			/>
		);
	};


	return (
		<div className="max-w-4xl mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="flex items-center justify-between px-1">
				<div>
					<h2 className="text-2xl font-bold font-brand-title brand-gradient">Settings</h2>
					<p className="text-stone-400 text-xs">Manage your preferences and data.</p>
				</div>
				<button
					onClick={toggleDarkMode}
					className="size-10 rounded-xl bg-brand-surface-light dark:bg-brand-surface-dark border border-[#AF8F42]/30 dark:border-[#AF8F42]/40 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all active:scale-95 shadow-sm"
					title="Toggle Dark Mode"
				>
					<span className="material-symbols-outlined text-[20px]">
						{isDark ? 'light_mode' : 'dark_mode'}
					</span>
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-5">

				{/* Categories Shortcut */}
				<button
					onClick={() => onNavigate('category-picker')}
					className="card-section p-4 flex flex-col justify-between text-left hover:border-primary-600 dark:hover:border-primary-400 group transition-all active:scale-[0.98]"
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
				<div className="card-section p-4 flex flex-col justify-between relative group">
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
				<div className="card-section p-4 space-y-4 md:col-span-2">
					<div>
						<p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Data Management</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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

			{/* Local Rolling Backup Card */}
			<div className="card-section p-6 bg-stone-900 text-white dark:bg-brand-surface-dark relative overflow-hidden group">
				<div className="absolute bottom-0 right-0 w-64 h-64 bg-[#AF8F42]/10 rounded-full -mb-32 -mr-32 blur-3xl group-hover:bg-[#AF8F42]/20 transition-all"></div>
				<div className="relative z-10">
					<div className="flex items-start justify-between mb-4">
						<div className="flex items-center gap-3">
							<span className={`material-symbols-outlined text-2xl ${statusConfig.color} ${statusConfig.spin ? 'animate-spin' : ''}`}>
								{statusConfig.icon}
							</span>
							<div>
								<h3 className="text-xl font-bold">Rolling Local Backup</h3>
								<p className="text-stone-400 text-xs mt-1">Daily backups, 30 days retention.</p>
							</div>
						</div>

						{/* Toggle Switch */}
						<button
							onClick={handleToggleBackup}
							className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${isEnabled ? 'bg-[#AF8F42]' : 'bg-stone-600'
								}`}
							title={isEnabled ? 'Disable auto backup' : 'Enable auto backup'}
						>
							<span
								className={`inline-block size-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${isEnabled ? 'translate-x-6' : 'translate-x-1'
									}`}
							/>
						</button>
					</div>

					{!Capacitor.isNativePlatform() && !(window as any).showDirectoryPicker && (
						<div className="mb-4 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs p-3 rounded-xl">
							<span className="material-symbols-outlined text-sm inline-block align-text-bottom mr-1">warning</span>
							Scheduled auto-backup is only supported in Chromium browsers (Chrome, Edge). On this browser, you must backup manually.
						</div>
					)}

					{isEnabled && (
						<div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
							<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
								<div className="flex items-center gap-3 text-sm flex-1">
									<span className={`${statusConfig.color} font-medium`}>{statusConfig.text}</span>
									{lastBackupTime && backupStatus !== 'syncing' && (
										<span className="text-stone-400 text-xs truncate">• Last: {formatLastBackup(lastBackupTime)}</span>
									)}
								</div>

								<div className="flex items-center gap-2 bg-stone-800/80 rounded-lg p-1 pr-3 border border-stone-700">
									<button
										onClick={onLocationClick}
										className="p-2 bg-stone-700 hover:bg-[#AF8F42] hover:text-white rounded-md transition-colors text-stone-300 flex items-center justify-center shrink-0 disabled:opacity-50"
										title="Change Backup Location"
									>
										<span className="material-symbols-outlined text-lg">folder_open</span>
									</button>
									<div className="flex flex-col min-w-0 flex-1">
										<span className="text-[10px] uppercase text-stone-500 font-bold tracking-widest leading-none">Location</span>
										<span className="text-xs text-stone-300 truncate font-mono">
											{directoryName || 'Not selected'}
										</span>
									</div>
								</div>
							</div>

							{isEnabled && (
								<div className="flex items-center justify-between gap-3 text-sm bg-stone-800/50 p-3 rounded-xl border border-stone-700/50">
									<div className="flex items-center gap-3">
										<span className="material-symbols-outlined text-stone-400">schedule</span>
										<span className="text-stone-300 font-medium">Daily Backup Time</span>
									</div>
									<TimePicker
										value={backupTime}
										onChange={setBackupTime}
									/>
								</div>
							)}

							<div className="flex gap-2 mt-4">
								<button
									onClick={performManualBackup}
									disabled={backupStatus === 'syncing' || !hasDirectoryAccess || transactions.length === 0}
									className="bg-[#AF8F42] hover:bg-[#917536] disabled:bg-[#AF8F42]/50 text-white px-3 py-2 rounded-lg font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm disabled:cursor-not-allowed flex-1"
									title={transactions.length === 0 ? "No data to backup" : ""}
								>
									<span className="material-symbols-outlined text-sm">save</span>
									Backup
								</button>

								<button
									onClick={onRestoreClick}
									className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 flex-1"
								>
									<span className="material-symbols-outlined text-sm">restore</span>
									Restore
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Web Version Link - Only show on APK */}
			{Capacitor.isNativePlatform() && (
				<div className="card-section p-4 flex justify-center">
					<a
						href="https://cost-pilot-xi.vercel.app"
						target="_blank"
						rel="noopener noreferrer"
						className="text-[10px] font-bold text-stone-400 hover:text-[#AF8F42] dark:hover:text-[#AF8F42] uppercase tracking-widest transition-colors flex items-center gap-1.5 group"
					>
						<span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform">language</span>
						Go to Web Version
					</a>
				</div>
			)}

			<ConfirmModal
				isOpen={showOverwriteConfirm}
				onClose={() => {
					setShowOverwriteConfirm(false);
					setBackupMetadata(null);
				}}
				onConfirm={async () => {
					enableBackup();
					setShowOverwriteConfirm(false);
					setBackupMetadata(null);
				}}
				title="Today's Backup Will Be Overwritten"
				message={`A backup from today already exists in this folder. Enabling auto-backup will overwrite it with your current device data.`}
				confirmLabel="Overwrite & Enable"
				cancelLabel="Cancel"
				variant="danger"
				extraContent={
					<button 
						onClick={(e) => { e.stopPropagation(); setShowManual(true); }}
						className="text-xs font-bold text-rose-600 hover:underline"
					>
						How to merge or avoid overwriting?
					</button>
				}
			/>

			<ConfirmModal
				isOpen={showRestoreConfirm}
				onClose={() => {
					setShowRestoreConfirm(false);
					setRecentBackupFile(null);
					enableBackup();
				}}
				onConfirm={async () => {
					if (recentBackupFile) {
						const stats = await restoreFromBackup(recentBackupFile);
						if (stats && typeof stats === 'object') {
							setMergedEntries(stats.newTransactions || []);
							setShowMergedModal(true);
						}
					}
					setShowRestoreConfirm(false);
					setRecentBackupFile(null);
				}}
				title="Existing Backup Found"
				message="We found an existing CostPilot backup file. To combine its contents with your current data, choose 'Merge & Restore'. This will not overwrite your local updates."
				confirmLabel="Merge & Restore"
				cancelLabel="Not Now"
				variant="primary"
				extraContent={
					<button 
						onClick={(e) => { e.stopPropagation(); setShowManual(true); }}
						className="text-xs font-bold text-primary-600 hover:underline"
					>
						How backup merging works?
					</button>
				}
			/>
			<ManualModal />
			<MergedResultsModal />
		</div>
	);
};

export default Settings;
