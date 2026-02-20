import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from 'recharts';
import { Transaction } from '../types';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f43f5e', '#f59e0b', '#10b981'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface AnalysisProps {
  transactions: Transaction[];
  currency: string;
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

const Analysis: React.FC<AnalysisProps> = ({ transactions, currency }) => {
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
      const date = new Date(t.date);
      if (filterMode === 'month') {
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      } else {
        return date >= new Date(startDate) && date <= new Date(endDate);
      }
    });
  }, [transactions, filterMode, selectedMonth, selectedYear, startDate, endDate]);

  const categoryData: CategorySummary[] = useMemo(() => {
    return (Object.values(
      filteredTransactions.reduce((acc, t) => {
        if (t.type === 'expense') {
          const name = t.category.name;
          if (!acc[name]) {
            acc[name] = {
              name,
              value: 0,
              icon: t.category.icon,
              color: t.category.color,
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
  }, [filteredTransactions]);

  const totalExpense = categoryData.reduce((sum, item) => sum + item.value, 0);

  const trendData = useMemo(() => {
    const weeks: { name: string; value: number }[] = [];
    const expenses = filteredTransactions.filter(t => t.type === 'expense');

    for (let w = 1; w <= 4; w++) {
      const weekStart = (w - 1) * 7 + 1;
      const weekEnd = w * 7;
      const weekExpenses = expenses.filter(t => {
        const day = new Date(t.date).getDate();
        return day >= weekStart && day <= weekEnd;
      });
      const total = weekExpenses.reduce((sum, t) => sum + t.amount, 0);
      weeks.push({ name: `W${w}`, value: total });
    }
    return weeks;
  }, [filteredTransactions]);

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Controls */}
      <section className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl w-fit">
          <button
            onClick={() => setFilterMode('month')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterMode === 'month' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setFilterMode('custom')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterMode === 'custom' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
          >
            Custom Range
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filterMode === 'month' ? (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
              <span className="text-slate-400 text-xs font-bold">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          )}
        </div>
      </section>

      {/* Main Analysis Card */}
      <section className="card p-6 md:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3 flex flex-col justify-between py-2">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Expenses</p>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {currencySymbol}{totalExpense.toLocaleString()}
              </h2>
            </div>

            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mt-8">
              <button
                onClick={() => setActiveTab('pie')}
                className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'pie' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">pie_chart</span>
                Distribution
              </button>
              <button
                onClick={() => setActiveTab('trend')}
                className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'trend' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">show_chart</span>
                Trend
              </button>
            </div>
          </div>

          <div className="lg:w-2/3 h-64 md:h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'pie' ? (
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              ) : (
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>

            {activeTab === 'pie' && totalExpense > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {totalExpense > 999 ? `${(totalExpense / 1000).toFixed(1)}k` : totalExpense}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Spending Breakdown */}
      <section className="space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white px-1">Category Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryData.map((item, i) => (
            <div key={i} className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white leading-none">{item.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0}% of total
                    </p>
                  </div>
                </div>
                <p className="font-bold text-lg text-slate-900 dark:text-white">{currencySymbol}{item.value.toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${totalExpense > 0 ? (item.value / totalExpense) * 100 : 0}%`,
                      backgroundColor: COLORS[i % COLORS.length]
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.descriptions.slice(0, 2).map((d, index) => (
                    <span key={index} className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-500 whitespace-nowrap">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Analysis;
