
import React, { useState, useEffect } from 'react';
import { Category, Transaction } from '../types';
import { CATEGORIES } from '../constants';

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  categories?: Category[];
}

const NewEntryModal: React.FC<NewEntryModalProps> = ({ isOpen, onClose, onSave, categories: propCategories }) => {
  const categories = propCategories && propCategories.length > 0 ? propCategories : CATEGORIES;
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('0.00');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(categories.find(c => c.type === 'expense') || categories[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Update category when type changes
  useEffect(() => {
    const firstOfType = categories.find(c => c.type === type);
    if (firstOfType) {
      setCategory(firstOfType);
    }
  }, [type, categories]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      title: title || (type === 'expense' ? 'New Expense' : 'New Income'),
      amount: parseFloat(amount),
      type,
      category,
      date,
      location: 'Manual Entry'
    });
    // Reset
    setTitle('');
    setAmount('0.00');
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-auto">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative w-full bg-white dark:bg-[#1e293b] backdrop-blur-2xl border-t border-white/50 dark:border-white/10 rounded-t-[3rem] shadow-2xl flex flex-col gap-0 animate-in zoom-in-95 slide-in-from-bottom-20 fade-in duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] max-h-[85vh] overflow-hidden">
        {/* Header Section - Fixed */}
        <div className="shrink-0 p-6 pb-2 relative z-20 bg-white/50 dark:bg-[#1e293b]/50 backdrop-blur-xl">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0"></div>

          <div className="flex items-center justify-between mt-2 px-2">
            <button onClick={onClose} className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">Cancel</button>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">New Entry</h2>
            <button onClick={handleSave} className="text-sm font-bold text-primary hover:text-blue-500 transition-colors">Save</button>
          </div>
        </div>

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-y-auto p-6 pt-2 flex flex-col gap-6">
          {/* Type Toggle */}
          <div className="p-1.5 bg-slate-100 dark:bg-black/20 rounded-2xl flex relative overflow-hidden shrink-0">
            <div
              className={`w-1/2 h-11 absolute top-1.5 transition-all duration-300 ease-out ${type === 'expense' ? 'left-1.5' : 'left-[calc(50%-1.5px)]'}`}
            >
              <div className="w-full h-full bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-black/5 dark:border-white/5"></div>
            </div>
            <button
              onClick={() => setType('expense')}
              className={`flex-1 relative z-10 py-3 text-sm font-bold text-center transition-colors ${type === 'expense' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
            >
              Expense
            </button>
            <button
              onClick={() => setType('income')}
              className={`flex-1 relative z-10 py-3 text-sm font-bold text-center transition-colors ${type === 'income' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
            >
              Income
            </button>
          </div>

          {/* Amount Input */}
          <div className="flex flex-col items-center py-4 shrink-0">
            <div className="flex items-baseline gap-2 text-slate-900 dark:text-white">
              <span className="text-4xl font-bold font-mono text-slate-400">$</span>
              <input
                className="bg-transparent border-none p-0 text-6xl font-bold font-mono w-[6ch] text-center focus:ring-0 placeholder-slate-200"
                type="text"
                inputMode="decimal"
                onKeyDown={(e) => {
                  const validKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', '.'];
                  if (!/[\d]/.test(e.key) && !validKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                  }
                }}
                value={amount === '0.00' ? '' : amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setAmount(val);
                  }
                }}
                placeholder="0.00"
                autoFocus
              />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">Amount</p>
          </div>

          {/* Details */}
          <div className="space-y-4 pb-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">Date</label>
                <div className="glass-input rounded-2xl px-4 py-3">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm font-medium focus:ring-0 color-scheme-dark"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">Description</label>
                <div className="glass-input rounded-2xl px-4 py-3">
                  <input
                    type="text"
                    placeholder="What for?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm font-medium focus:ring-0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">Category</label>
              <div className="grid grid-cols-3 gap-2 h-48 overflow-y-auto pr-2 custom-scrollbar border rounded-2xl p-2 border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 content-start">
                {categories.filter(c => c.type === type).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${category.id === cat.id
                      ? 'bg-primary/10 border-primary/40 ring-2 ring-primary/20'
                      : 'bg-white dark:bg-white/5 border-transparent shadow-sm'
                      }`}
                  >
                    <span className={`material-symbols-outlined ${category.id === cat.id ? 'text-primary' : 'text-slate-400'}`}>
                      {cat.icon}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-tight text-center truncate w-full ${category.id === cat.id ? 'text-primary' : 'text-slate-400'}`}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewEntryModal;
