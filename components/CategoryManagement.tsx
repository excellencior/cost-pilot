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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 px-1">
        <button
          onClick={onBack}
          className="size-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Categories</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Manage your labels</p>
        </div>
      </div>

      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        {(['expense', 'income'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 text-xs font-bold rounded-md transition-all capitalize ${filter === f
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500'
              }`}
          >
            {f}s
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onEditCategory(cat)}
            className="card p-5 flex flex-col items-center gap-3 group hover:border-primary-200 dark:hover:border-primary-900 transition-all text-center"
          >
            <div className={`size-14 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors`}>
              <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{cat.name}</span>
          </button>
        ))}

        <button
          onClick={() => onAddCategory(filter)}
          className="p-5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-primary-300 hover:text-primary-600 dark:hover:border-primary-800 dark:hover:text-primary-400 transition-all min-h-[120px] group"
        >
          <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">add</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">New {filter}</span>
        </button>
      </div>

      <div className="card p-5 bg-slate-50 dark:bg-slate-900 border-none">
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
