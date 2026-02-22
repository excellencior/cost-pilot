import React, { useMemo, useState } from 'react';
import { Transaction, Category } from '../types';
import { formatDate } from '../utils';
import Dropdown from './UI/Dropdown';

interface HistoryProps {
    transactions: Transaction[];
    onTransactionClick: (t: Transaction) => void;
    onBack: () => void;
    currencySymbol: string;
    categories: Category[];
}

const History: React.FC<HistoryProps> = ({ transactions, onTransactionClick, onBack, currencySymbol, categories }) => {
    const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date' | 'amount' | 'title'>('date');

    const isFiltering = searchQuery.length > 0 || selectedCategoryId !== 'all';

    const filteredResults = useMemo(() => {
        return transactions.filter(t => {
            const title = t.title || '';
            const categoryName = t.category?.name || '';
            const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                categoryName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategoryId === 'all' || t.category?.id === selectedCategoryId;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => {
            if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
            if (sortBy === 'amount') return b.amount - a.amount;
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            return 0;
        });
    }, [transactions, searchQuery, selectedCategoryId, sortBy]);

    const monthlySummaries = useMemo(() => {
        const groups: {
            [key: string]: {
                transactions: Transaction[],
                income: number,
                expense: number,
                savings: number,
                monthName: string,
                year: number
            }
        } = {};

        // Sort transactions by date descending
        const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        sorted.forEach(t => {
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleString('default', { month: 'long' });
            const year = date.getFullYear();

            if (!groups[monthKey]) {
                groups[monthKey] = {
                    transactions: [],
                    income: 0,
                    expense: 0,
                    savings: 0,
                    monthName,
                    year
                };
            }

            groups[monthKey].transactions.push(t);
            if (t.type === 'income') groups[monthKey].income += t.amount;
            else groups[monthKey].expense += t.amount;
        });

        // Calculate savings
        Object.keys(groups).forEach(key => {
            groups[key].savings = groups[key].income - groups[key].expense;
        });

        return groups;
    }, [transactions]);

    const monthKeys = Object.keys(monthlySummaries).sort().reverse();

    // Specific Month Detail View
    if (selectedMonthKey && monthlySummaries[selectedMonthKey] && !isFiltering) {
        const data = monthlySummaries[selectedMonthKey];
        return (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                    onClick={() => setSelectedMonthKey(null)}
                    className="flex items-center gap-2 text-stone-500 hover:text-primary-600 transition-colors group mb-2"
                >
                    <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
                    <span className="font-bold text-sm uppercase tracking-wider">Back to Summary</span>
                </button>

                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
                    <div>
                        <h2 className="text-3xl font-extrabold text-stone-900 dark:text-white capitalize">
                            {data.monthName} <span className="text-stone-400 font-light">{data.year}</span>
                        </h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400">Detailed transactions for this period</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Net Savings</p>
                            <p className={`text-xl font-bold ${data.savings >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                                {data.savings >= 0 ? '+' : ''}{currencySymbol}{data.savings.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col gap-3">
                    {data.transactions.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => onTransactionClick(t)}
                            className="flex items-center gap-4 p-3 bg-brand-surface-light dark:bg-brand-surface-dark rounded-xl border border-stone-100 dark:border-stone-800 hover:border-primary-200/50 dark:hover:border-primary-900/50 transition-all hover:shadow-lg hover:shadow-primary-500/5 group text-left"
                        >
                            <div className={`size-12 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'income'
                                ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                                }`}>
                                <span className="material-symbols-outlined text-2xl">{t.category.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-stone-900 dark:text-white truncate">{t.title}</p>
                                <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium uppercase tracking-wider">
                                    {t.category.name} • {formatDate(t.date)}
                                </p>
                            </div>
                            <div className={`font-bold text-lg ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-stone-900 dark:text-white'}`}>
                                {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString()}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4 px-1">
                <button
                    onClick={onBack}
                    className="size-10 rounded-lg bg-brand-surface-light dark:bg-brand-surface-dark border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-stone-900 dark:text-white leading-tight">History</h2>
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-widest">Transaction Ledger</p>
                </div>
            </div>

            {/* Search and Filters Header */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 space-y-1">
                    <label className="text-[0.75rem] font-bold text-stone-400 uppercase tracking-wider block px-1">Search</label>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary-600 transition-colors">search</span>
                        <input
                            type="text"
                            placeholder="Find transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-brand-surface-light dark:bg-brand-surface-dark border border-stone-200 dark:border-stone-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-primary-500/10 transition-all text-stone-900 dark:text-white shadow-sm"
                        />
                    </div>
                </div>
                <div className="md:w-64">
                    <Dropdown
                        label="Category"
                        options={[
                            { id: 'all', name: 'All Categories' },
                            ...categories.map(c => ({ id: c.id, name: c.name }))
                        ]}
                        value={selectedCategoryId}
                        onChange={setSelectedCategoryId}
                    />
                </div>
                {isFiltering && (
                    <div className="md:w-48 animate-in slide-in-from-right-2 duration-300">
                        <Dropdown
                            label="Sort By"
                            options={[
                                { id: 'date', name: 'Newest First' },
                                { id: 'amount', name: 'Highest Amount' },
                                { id: 'title', name: 'Alphabetical' }
                            ]}
                            value={sortBy}
                            onChange={(val) => setSortBy(val as any)}
                        />
                    </div>
                )}
            </div>

            {
                isFiltering ? (
                    /* Search Results View */
                    <div className="space-y-4 animate-scale-in" >
                        <div className="flex items-center justify-between px-1">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                                Found {filteredResults.length} matches
                            </p>
                            {(searchQuery || selectedCategoryId !== 'all') && (
                                <button
                                    onClick={() => { setSearchQuery(''); setSelectedCategoryId('all'); }}
                                    className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:underline"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            {filteredResults.length > 0 ? (
                                filteredResults.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => onTransactionClick(t)}
                                        className="flex items-center gap-4 p-3 md:p-3.5 bg-brand-surface-light dark:bg-brand-surface-dark rounded-xl border border-stone-100 dark:border-stone-800 hover:border-primary-200/50 dark:hover:border-primary-900/50 transition-all group text-left shadow-sm"
                                    >
                                        <div className={`size-12 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'income'
                                            ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                            : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                                            }`}>
                                            <span className="material-symbols-outlined text-2xl">{t.category.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-stone-900 dark:text-white truncate">{t.title}</p>
                                            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium uppercase tracking-wider">
                                                {t.category.name} • {formatDate(t.date)}
                                            </p>
                                        </div>
                                        <div className={`font-bold text-lg ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-stone-900 dark:text-white'}`}>
                                            {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString()}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-stone-400 opacity-30">
                                    <span className="material-symbols-outlined text-6xl">search_off</span>
                                    <p className="font-bold uppercase mt-2">No matches found</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Monthly Summary View */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                        {monthKeys.length > 0 ? (
                            monthKeys.map(key => {
                                const data = monthlySummaries[key];
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedMonthKey(key)}
                                        className="card p-0 overflow-hidden group hover:border-primary-300 dark:hover:border-primary-800 transition-all hover:shadow-xl hover:shadow-primary-500/5 text-left"
                                    >
                                        <div className="p-4 md:p-5 border-b border-stone-50 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/30">
                                            <div>
                                                <h3 className="text-xl font-bold text-stone-900 dark:text-white">{data.monthName}</h3>
                                                <p className="text-xs text-stone-500 font-medium tracking-wide uppercase">{data.year}</p>
                                            </div>
                                            <div className="size-10 rounded-full bg-brand-base-light dark:bg-stone-800 flex items-center justify-center text-stone-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-all">
                                                <span className="material-symbols-outlined">chevron_right</span>
                                            </div>
                                        </div>

                                        <div className="p-4 md:p-5 grid grid-cols-2 gap-4 md:gap-5 font-bold">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-stone-400 uppercase tracking-widest">Inflow</p>
                                                <p className="text-lg text-green-600">+{currencySymbol}{data.income.toLocaleString()}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-stone-400 uppercase tracking-widest">Outflow</p>
                                                <p className="text-lg text-rose-600">-{currencySymbol}{data.expense.toLocaleString()}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-stone-400 uppercase tracking-widest">Savings</p>
                                                <p className={`text-lg ${data.savings >= 0 ? 'text-primary-600' : 'text-amber-600'}`}>
                                                    {currencySymbol}{data.savings.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-stone-400 uppercase tracking-widest">Entries</p>
                                                <p className="text-lg text-stone-700 dark:text-stone-300">{data.transactions.length}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="col-span-full card p-20 flex flex-col items-center justify-center text-stone-400 border-dashed border-2 opacity-50">
                                <span className="material-symbols-outlined text-6xl mb-4 opacity-20">history_edu</span>
                                <p className="text-lg font-black uppercase tracking-widest">Zero Operations</p>
                                <p className="text-sm font-medium">Add records to start tracking history</p>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
};

export default History;
