import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';

interface HistoryProps {
    transactions: Transaction[];
    onTransactionClick: (t: Transaction) => void;
    currencySymbol: string;
}

const History: React.FC<HistoryProps> = ({ transactions, onTransactionClick, currencySymbol }) => {
    const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

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

    if (selectedMonthKey && monthlySummaries[selectedMonthKey]) {
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="px-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Transaction History</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Browse your monthly financial performance</p>
            </header>

            {monthKeys.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {monthKeys.map(key => {
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

                                <div className="p-6 grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Income</p>
                                        <p className="text-lg font-bold text-green-600">+{currencySymbol}{data.income.toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expenses</p>
                                        <p className="text-lg font-bold text-rose-600">-{currencySymbol}{data.expense.toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Savings</p>
                                        <p className={`text-lg font-bold ${data.savings >= 0 ? 'text-primary-600' : 'text-amber-600'}`}>
                                            {currencySymbol}{data.savings.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entries</p>
                                        <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{data.transactions.length}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="card p-20 flex flex-col items-center justify-center text-slate-400 border-dashed">
                    <span className="material-symbols-outlined text-6xl mb-4 opacity-20">history_edu</span>
                    <p className="text-lg font-medium">No transactions found</p>
                    <p className="text-sm">Start adding some expenses or income to see them here.</p>
                </div>
            )}
        </div>
    );
};

export default History;
