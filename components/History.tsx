import React, { useMemo, useState } from 'react';
import { Transaction, Category } from '../types';

interface HistoryProps {
    transactions: Transaction[];
    onTransactionClick: (t: Transaction) => void;
    currencySymbol: string;
    categories: Category[];
}

const History: React.FC<HistoryProps> = ({ transactions, onTransactionClick, currencySymbol, categories }) => {
    const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

    const isFiltering = searchQuery.length > 0 || selectedCategoryId !== 'all';

    const filteredResults = useMemo(() => {
        return transactions.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.category.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategoryId === 'all' || t.category.id === selectedCategoryId;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, searchQuery, selectedCategoryId]);

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
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                    onClick={() => setSelectedMonthKey(null)}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors group mb-2"
                >
                    <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
                    <span className="font-bold text-sm uppercase tracking-wider">Back to Summary</span>
                </button>

                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white capitalize">
                            {data.monthName} <span className="text-slate-400 font-light">{data.year}</span>
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Detailed transactions for this period</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Savings</p>
                            <p className={`text-xl font-bold ${data.savings >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                                {data.savings >= 0 ? '+' : ''}{currencySymbol}{data.savings.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.transactions.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => onTransactionClick(t)}
                            className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900 transition-all hover:shadow-lg hover:shadow-primary-500/5 group text-left"
                        >
                            <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'income'
                                ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                                }`}>
                                <span className="material-symbols-outlined text-2xl">{t.category.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-white truncate">{t.title}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                                    {t.category.name} • {t.date}
                                </p>
                            </div>
                            <div className={`font-bold text-lg ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString()}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search and Filters Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4">
                <header className="px-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Financial History</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Search and Filter Transactions</p>
                    </div>
                </header>

                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors">search</span>
                        <input
                            type="text"
                            placeholder="Find transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white"
                        />
                    </div>
                    <div className="md:w-64">
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isFiltering ? (
                /* Search Results View */
                <div className="space-y-4 animate-scale-in">
                    <div className="flex items-center justify-between px-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredResults.length > 0 ? (
                            filteredResults.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => onTransactionClick(t)}
                                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900 transition-all group text-left shadow-sm"
                                >
                                    <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'income'
                                        ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                        : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                                        }`}>
                                        <span className="material-symbols-outlined text-2xl">{t.category.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 dark:text-white truncate">{t.title}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                                            {t.category.name} • {t.date}
                                        </p>
                                    </div>
                                    <div className={`font-bold text-lg ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                        {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString()}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 opacity-30">
                                <span className="material-symbols-outlined text-6xl">search_off</span>
                                <p className="font-bold uppercase mt-2">No matches found</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Monthly Summary View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {monthKeys.length > 0 ? (
                        monthKeys.map(key => {
                            const data = monthlySummaries[key];
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedMonthKey(key)}
                                    className="card p-0 overflow-hidden group hover:border-primary-300 dark:hover:border-primary-800 transition-all hover:shadow-xl hover:shadow-primary-500/5 text-left"
                                >
                                    <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{data.monthName}</h3>
                                            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">{data.year}</p>
                                        </div>
                                        <div className="size-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-all">
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </div>
                                    </div>

                                    <div className="p-6 grid grid-cols-2 gap-6 font-bold">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Inflow</p>
                                            <p className="text-lg text-green-600">+{currencySymbol}{data.income.toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Outflow</p>
                                            <p className="text-lg text-rose-600">-{currencySymbol}{data.expense.toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Savings</p>
                                            <p className={`text-lg ${data.savings >= 0 ? 'text-primary-600' : 'text-amber-600'}`}>
                                                {currencySymbol}{data.savings.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Entries</p>
                                            <p className="text-lg text-slate-700 dark:text-slate-300">{data.transactions.length}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="col-span-full card p-20 flex flex-col items-center justify-center text-slate-400 border-dashed border-2 opacity-50">
                            <span className="material-symbols-outlined text-6xl mb-4 opacity-20">history_edu</span>
                            <p className="text-lg font-black uppercase tracking-widest">Zero Operations</p>
                            <p className="text-sm font-medium">Add records to start tracking history</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default History;
