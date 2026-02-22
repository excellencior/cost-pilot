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
          className="size-10 rounded-lg bg-brand-surface-light dark:bg-brand-surface-dark border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white leading-tight">Categories</h2>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Manage your labels</p>
        </div>
      </div>
      {/* Type Filter */}
      <div className="flex p-1 bg-stone-100 dark:bg-stone-800 rounded-lg w-fit">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-6 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filter === t
              ? 'bg-brand-surface-light dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm'
              : 'text-stone-500'
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onEditCategory(cat)}
            className="flex flex-col items-center gap-3 p-4 bg-brand-surface-light dark:bg-brand-surface-dark rounded-2xl border border-stone-100 dark:border-stone-800 hover:border-primary-200 dark:hover:border-primary-800 transition-all active:scale-95 group shadow-sm"
          >
            <div className={`size-14 rounded-xl flex items-center justify-center bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors`}>
              <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
            </div>
            <span className="text-xs font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wider">{cat.name}</span>
          </button>
        ))}

        <button
          onClick={onAddCategory}
          className="p-5 rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center gap-3 text-stone-400 hover:border-primary-300 hover:text-primary-600 dark:hover:border-primary-800 dark:hover:text-primary-400 transition-all min-h-[120px] group"
        >
          <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">add</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">New {filter}</span>
        </button>
      </div>

      <div className="card p-5 bg-stone-50 dark:bg-stone-900/50 border-none">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-stone-400 text-sm mt-0.5">info</span>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-relaxed">
            Deleting categories is disabled to prevent data corruption. You can rename labels to reuse them.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
