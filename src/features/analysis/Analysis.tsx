import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction, Category } from '../../entities/types';
import Dropdown from '../../shared/ui/Dropdown';
import DatePicker from '../../shared/ui/DatePicker';

const COLORS = ['#8C7851', '#C5A059', '#D9C698', '#B08D4D', '#A18F6B', '#6F5F40'];

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

  const hasData = filteredTransactions.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-500">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 px-1">
        <button
          onClick={onBack}
          className="size-10 rounded-lg bg-brand-surface-light dark:bg-brand-surface-dark border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white leading-tight">Analysis</h2>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-widest">Financial Insights</p>
        </div>
      </div>
      {/* Unified Control Bar */}
      <section className="bg-brand-surface-light dark:bg-brand-surface-dark rounded-xl border border-stone-200 dark:border-stone-800 p-3 shadow-sm flex flex-col md:flex-row flex-wrap gap-4 items-center justify-between transition-colors">
        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-lg w-full md:w-auto">
          {(['month', 'custom'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`flex-1 md:flex-none px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filterMode === mode ? 'bg-brand-surface-light dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
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
                className="w-32"
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
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <DatePicker value={startDate} onChange={setStartDate} className="w-full sm:w-40" />
              <span className="text-stone-400 text-[10px] font-bold sm:px-1">TO</span>
              <DatePicker value={endDate} onChange={setEndDate} className="w-full sm:w-40" />
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <section className="lg:col-span-3 card p-3 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Period Spending</p>
              <h2 className="text-3xl lg:text-4xl font-black text-stone-900 dark:text-white">
                {currencySymbol}{totalExpense.toLocaleString()}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Desktop Toggle */}
              <div className="hidden md:flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('pie')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${activeTab === 'pie' ? 'bg-brand-surface-light dark:bg-stone-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
                >
                  <span className="material-symbols-outlined text-lg">pie_chart</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Category</span>
                </button>
                <button
                  onClick={() => setActiveTab('trend')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${activeTab === 'trend' ? 'bg-brand-surface-light dark:bg-stone-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
                >
                  <span className="material-symbols-outlined text-lg">show_chart</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Trend</span>
                </button>
              </div>

              {/* Mobile Dropdown */}
              <div className="md:hidden">
                <Dropdown
                  options={[
                    { id: 'pie', name: 'Category' },
                    { id: 'trend', name: 'Trend' }
                  ]}
                  value={activeTab}
                  onChange={(val) => setActiveTab(val as 'pie' | 'trend')}
                  className="w-32"
                />
              </div>
            </div>
          </div>

          <div className="h-64 relative flex items-center justify-center">
            {hasData ? (
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
                        <stop offset="5%" stopColor="#8C7851" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8C7851" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Area type="monotone" dataKey="value" stroke="#8C7851" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="text-center px-10 animate-in fade-in duration-700">
                {activeTab === 'pie' ? (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">Category Distribution</p>
                    <h3 className="text-2xl font-light tracking-tight leading-snug opacity-40 dark:text-white">
                      Visualizing your <span className="font-black">{filterMode === 'month' ? 'Monthly' : 'Range'} Anatomy</span>.
                    </h3>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.1em] leading-relaxed max-w-[280px] mx-auto">
                      This chart maps your spending into logical buckets, revealing exactly what percentage of your wealth is allocated to different lifestyle needs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">Spending Patterns</p>
                    <h3 className="text-2xl font-light tracking-tight leading-snug opacity-40 dark:text-white">
                      Mapping your <span className="font-black italic">{filterMode === 'month' ? 'Monthly' : 'Range'} Rhythm</span>.
                    </h3>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.1em] leading-relaxed max-w-[280px] mx-auto">
                      Daily plotting reveals the 'heartbeat' of your finances—showing the peaks and valleys of your spending to help you identify recurring habits.
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'pie' && totalExpense > 0 && hasData && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total Exp</span>
                <span className="text-2xl font-black text-stone-900 dark:text-white">
                  {totalExpense > 9999 ? `${(totalExpense / 1000).toFixed(1)}k` : totalExpense}
                </span>
              </div>
            )}
          </div>
        </section>
        {/* Flexible Breakdown List */}
        <section className="lg:col-span-2 card flex flex-col p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Category Detail</p>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{categoryData.length} ACTIVE</p>
          </div>

          <div className="space-y-4">
            {categoryData.length > 0 ? (
              categoryData.map((item, i) => (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-stone-50 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400 border border-stone-100 dark:border-stone-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 group-hover:text-primary-600 transition-colors">
                        <span className="material-symbols-outlined text-lg">{item.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900 dark:text-white leading-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                          {Math.round((item.value / totalExpense) * 100)}% coverage
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-stone-900 dark:text-white">{currencySymbol}{item.value.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-stone-500 flex gap-1 justify-end">
                        {item.descriptions.slice(0, 1).map((d, index) => <span key={index} className="truncate max-w-[80px]">{d}</span>)}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-stone-50 dark:bg-stone-800/50 rounded-full overflow-hidden">
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
