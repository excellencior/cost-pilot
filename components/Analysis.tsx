import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction } from '../types';
import Dropdown from './UI/Dropdown';
import DatePicker from './UI/DatePicker';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f43f5e', '#f59e0b', '#10b981'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface AnalysisProps {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  onBack: () => void;
}

const getCurrencySymbol = (code: string) => {
  const symbols: Record<string, string> = { 'USD': '$', 'BDT': '৳', 'EUR': '€' };
  return symbols[code] || '$';
};

interface CategorySummary {
  name: string;
  value: number;
  icon: string;
  color: string;
  descriptions: string[];
}

const Analysis: React.FC<AnalysisProps> = ({ transactions, categories, currency, onBack }) => {
  const [activeTab, setActiveTab] = useState<'trend' | 'pie'>('pie');
  const [filterMode, setFilterMode] = useState<'month' | 'custom'>('month');

  const currencySymbol = getCurrencySymbol(currency);
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [startDate, setStartDate] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Timezone-safe date parsing from YYYY-MM-DD
      const [year, month, day] = t.date.split('-').map(Number);

      if (filterMode === 'month') {
        return (month - 1) === selectedMonth && year === selectedYear;
      } else {
        const transDate = new Date(year, month - 1, day);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return transDate >= start && transDate <= end;
      }
    });
  }, [transactions, filterMode, selectedMonth, selectedYear, startDate, endDate]);

  const categoryData: CategorySummary[] = useMemo(() => {
    return (Object.values(
      filteredTransactions.reduce((acc, t) => {
        if (t.type === 'expense') {
          // Use latest category metadata from prop if available, fallback to snapshot
          const latestCat = categories.find(c => c.id === t.category.id) || t.category;
          const name = latestCat.name;

          if (!acc[name]) {
            acc[name] = {
              name,
              value: 0,
              icon: latestCat.icon,
              color: latestCat.color,
              descriptions: []
            };
          }
          acc[name].value += t.amount;
          if (t.title && !acc[name].descriptions.includes(t.title) && acc[name].descriptions.length < 3) {
            acc[name].descriptions.push(t.title);
          }
        }
        return acc;
      }, {} as Record<string, CategorySummary>)
    ) as CategorySummary[]).sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  const totalExpense = categoryData.reduce((sum, item) => sum + item.value, 0);

  const trendData = useMemo(() => {
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const aggregated = expenses.reduce((acc, t) => {
      const dateKey = t.date; // already YYYY-MM-DD
      if (!acc[dateKey]) {
        acc[dateKey] = 0;
      }
      acc[dateKey] += t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(aggregated).map(([dateStr, value]) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return {
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value
      };
    });
  }, [filteredTransactions]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentDate.getFullYear());
    transactions.forEach(t => {
      const year = parseInt(t.date.split('-')[0]);
      if (!isNaN(year)) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-500">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 px-1">
        <button
          onClick={onBack}
          className="size-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Analysis</h2>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Financial Insights</p>
        </div>
      </div>
      {/* Unified Control Bar */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full md:w-auto">
          {(['month', 'custom'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`flex-1 md:flex-none px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filterMode === mode ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {mode === 'month' ? 'Monthly' : 'Search Range'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {filterMode === 'month' ? (
            <div className="flex gap-2">
              <Dropdown
                options={MONTHS.map((m, i) => ({ id: String(i), name: m }))}
                value={String(selectedMonth)}
                onChange={(val) => setSelectedMonth(parseInt(val))}
                placeholder="Month"
                className="w-36"
              />
              <Dropdown
                options={availableYears.map(y => ({ id: String(y), name: String(y) }))}
                value={String(selectedYear)}
                onChange={(val) => setSelectedYear(parseInt(val))}
                placeholder="Year"
                className="w-24"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <DatePicker value={startDate} onChange={setStartDate} className="w-44" />
              <span className="text-slate-400 text-[10px] font-bold">TO</span>
              <DatePicker value={endDate} onChange={setEndDate} className="w-44" />
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <section className="lg:col-span-3 card p-4 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Period Spending</p>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white">
                {currencySymbol}{totalExpense.toLocaleString()}
              </h2>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('pie')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${activeTab === 'pie' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <span className="material-symbols-outlined text-lg">pie_chart</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Category</span>
              </button>
              <button
                onClick={() => setActiveTab('trend')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${activeTab === 'trend' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <span className="material-symbols-outlined text-lg">show_chart</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Trend</span>
              </button>
            </div>
          </div>

          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'pie' ? (
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={6} dataKey="value" stroke="none">
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                </PieChart>
              ) : (
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                </AreaChart>
              )}
            </ResponsiveContainer>
            {activeTab === 'pie' && totalExpense > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Exp</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {totalExpense > 9999 ? `${(totalExpense / 1000).toFixed(1)}k` : totalExpense}
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-2 card flex flex-col p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category Detail</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{categoryData.length} ACTIVE</p>
          </div>

          <div className="space-y-4">
            {categoryData.length > 0 ? (
              categoryData.map((item, i) => (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 group-hover:text-primary-600 transition-colors">
                        <span className="material-symbols-outlined text-lg">{item.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {Math.round((item.value / totalExpense) * 100)}% coverage
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{currencySymbol}{item.value.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-slate-500 flex gap-1 justify-end">
                        {item.descriptions.slice(0, 1).map((d, index) => <span key={index} className="truncate max-w-[80px]">{d}</span>)}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-slate-50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(item.value / totalExpense) * 100}%`,
                        backgroundColor: COLORS[i % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-20">
                <span className="material-symbols-outlined text-5xl">monitoring</span>
                <p className="text-sm font-bold uppercase mt-2">No data recorded</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analysis;
