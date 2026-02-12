
import React, { useState } from 'react';
import { Category } from '../types';

interface CategoryManagementProps {
  categories: Category[];
  onBack: () => void;
  onAddCategory: (defaultType?: 'expense' | 'income') => void;
  onEditCategory: (category: Category) => void;
}


const CategoryManagement: React.FC<CategoryManagementProps> = ({ categories, onBack, onAddCategory, onEditCategory }) => {
  const [filter, setFilter] = useState<'expense' | 'income'>('expense');

  const filteredCategories = categories.filter(cat => cat.type === filter);

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto h-full hide-scrollbar pb-32">
      <div className="flex items-center gap-4 px-1">
        <button
          onClick={onBack}
          className="size-10 rounded-full bg-white/50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-white hover:bg-white transition-colors border border-white/20"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Categories</h2>
          <p className="text-xs text-slate-500 font-mono">Manage labels</p>
        </div>
      </div>

      {/* Filter Tabs - "All" removed as requested */}
      <div className="flex p-1.5 bg-slate-100 dark:bg-black/20 rounded-2xl relative">
        {(['expense', 'income'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all relative z-10 ${filter === f
              ? 'bg-white dark:bg-slate-700 text-primary shadow-lg ring-1 ring-black/5'
              : 'text-slate-400'
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onEditCategory(cat)}
            className="glass-card p-5 rounded-[2rem] flex flex-col items-center gap-3 relative group overflow-hidden transition-all hover:bg-white dark:hover:bg-white/10 cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className={`size-14 rounded-2xl flex items-center justify-center ${cat.color} shadow-sm group-hover:scale-110 transition-transform shrink-0`}>
              <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-[0.1em] text-center truncate w-full px-1">{cat.name}</span>
            <div className="absolute top-3 right-3 size-7 rounded-full bg-slate-100/50 dark:bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </div>
          </div>
        ))}

        <button
          onClick={() => onAddCategory(filter)}
          className="p-5 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-primary/40 hover:text-primary transition-all min-h-[140px] group"
        >
          <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">add_circle</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">New {filter}</span>
        </button>
      </div>

      <div className="glass-card rounded-2xl p-5 mt-2 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5">info</span>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Deleting categories is disabled to prevent data corruption. You can rename labels to reuse them.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
