import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { Transaction } from '../types';

const COLORS = ['#137fec', '#ff2d55', '#00f2ff', '#af52de', '#ffcc00', '#10b981'];

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
  descriptions: string[]; // Recent transaction titles
}

const Analysis: React.FC<AnalysisProps> = ({ transactions, currency }) => {
  const [activeTab, setActiveTab] = useState<'trend' | 'pie'>('pie');
  const [filterMode, setFilterMode] = useState<'month' | 'custom'>('month');

  const currencySymbol = getCurrencySymbol(currency);

  // Month selection
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Custom date range
  const [startDate, setStartDate] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0]
  );

  // Filter transactions based on mode
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

  // Group by category for pie chart
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
          if (t.title && acc[name].descriptions.length < 3) {
            acc[name].descriptions.push(t.title);
          }
        }
        return acc;
      }, {} as Record<string, CategorySummary>)
    ) as CategorySummary[]).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const totalExpense = categoryData.reduce((sum, item) => sum + item.value, 0);

  // Weekly data for trend
  const trendData = useMemo(() => {
    const weeks: { name: string; value: number }[] = [];
    const expenses = filteredTransactions.filter(t => t.type === 'expense');

    // Simple 4-week split
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

  // Available years for selection
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto hide-scrollbar pb-32">
      {/* Filter Mode Tabs */}
      <div className="p-1 glass-card rounded-2xl flex items-center shadow-sm">
        <button
          onClick={() => setFilterMode('month')}
          className={`flex-1 py-3 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${filterMode === 'month' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'
            }`}
        >
          <span className="material-symbols-outlined text-sm">calendar_month</span>
          Month
        </button>
        <button
          onClick={() => setFilterMode('custom')}
          className={`flex-1 py-3 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${filterMode === 'custom' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'
            }`}
        >
          <span className="material-symbols-outlined text-sm">date_range</span>
          Custom
        </button>
      </div>

      {/* Filter Controls */}
      <div className="glass-card rounded-2xl p-4">
        {filterMode === 'month' ? (
          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="flex-1 bg-slate-100 dark:bg-white/5 rounded-xl px-4 py-3 text-sm font-bold border-none focus:ring-2 ring-primary/20"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-28 bg-slate-100 dark:bg-white/5 rounded-xl px-4 py-3 text-sm font-bold border-none focus:ring-2 ring-primary/20"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-100 dark:bg-white/5 rounded-xl px-4 py-3 text-sm font-bold border-none focus:ring-2 ring-primary/20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-100 dark:bg-white/5 rounded-xl px-4 py-3 text-sm font-bold border-none focus:ring-2 ring-primary/20"
              />
            </div>
          </div>
        )}
      </div>

      {/* Chart Tabs */}
      <div className="p-1 glass-card rounded-2xl flex items-center shadow-sm">
        <button
          onClick={() => setActiveTab('pie')}
          className={`flex-1 py-3 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'pie' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'
            }`}
        >
          <span className="material-symbols-outlined text-sm">pie_chart</span>
          Distro
        </button>
        <button
          onClick={() => setActiveTab('trend')}
          className={`flex-1 py-3 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'trend' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'
            }`}
        >
          <span className="material-symbols-outlined text-sm">show_chart</span>
          Trend
        </button>
      </div>

      {/* Chart Section */}
      <div className="glass-card rounded-[2.5rem] p-6 shadow-sm min-h-[360px] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 p-6">
          <p className="font-mono text-[9px] uppercase text-slate-400 tracking-[0.2em] mb-1">Total Expenses</p>
          <h2 className="font-mono text-3xl font-bold text-slate-900 dark:text-white">{currencySymbol}{totalExpense.toLocaleString()}</h2>
        </div>

        <div className="w-full h-56 mt-10">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'pie' ? (
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            ) : (
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#137fec" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#137fec" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                <Tooltip />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spending Cards List */}
      <div className="flex flex-col gap-4">
        <h3 className="font-mono text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] pl-1">Spending Cards</h3>
        {categoryData.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">info</span>
            <p className="text-sm text-slate-400">No expenses in this period</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {categoryData.map((item, i) => (
              <div key={i} className="glass-card rounded-3xl p-5 flex flex-col gap-4 hover:translate-y-[-2px] transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`size-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${item.color}`}
                    >
                      <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold text-base text-slate-900 dark:text-white leading-tight">{item.name}</p>
                      {item.descriptions.length > 0 && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[180px]">
                          {item.descriptions.join(', ')}
                        </p>
                      )}
                      <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                        {totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0}% of budget
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">{currencySymbol}{item.value.toLocaleString()}</p>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${totalExpense > 0 ? (item.value / totalExpense) * 100 : 0}%`,
                      backgroundColor: COLORS[i % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;
