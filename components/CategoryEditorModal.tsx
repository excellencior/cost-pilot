import React, { useState, useEffect } from 'react';
import { Category } from '../types';

interface CategoryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<Category, 'id'> | Category) => void;
  editingCategory?: Category | null;
  defaultType?: 'expense' | 'income';
}

const CategoryEditorModal: React.FC<CategoryEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCategory,
  defaultType
}) => {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('category');
  const [color, setColor] = useState('text-primary-600');

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setIcon(editingCategory.icon);
      setColor(editingCategory.color);
      setType(editingCategory.type);
      setStep(2);
    } else if (defaultType) {
      setType(defaultType);
      setStep(2);
      setName('');
      setIcon('category');
      setColor('text-blue-600');
    } else {
      setName('');
      setIcon('category');
      setColor('text-blue-600');
      setType('expense');
      setStep(1);
    }
  }, [editingCategory, isOpen, defaultType]);

  if (!isOpen) return null;

  const handleNext = () => setStep(2);

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingCategory) {
      onSave({ ...editingCategory, name, icon, color });
    } else {
      onSave({ name, icon, color, type });
    }
    onClose();
  };

  const icons = ['restaurant', 'directions_bus', 'shopping_cart', 'movie', 'health_and_safety', 'shopping_bag', 'payments', 'trending_up', 'flight', 'home', 'fitness_center', 'work', 'savings', 'account_balance', 'electric_bolt_outlined', 'water_drop', 'wifi'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {editingCategory ? 'Edit Category' : 'New Category'}
          </h2>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 && !editingCategory && !defaultType ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setType('expense'); handleNext(); }}
                className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 flex flex-col items-center gap-3 hover:scale-[1.02] transition-all"
              >
                <span className="material-symbols-outlined text-4xl text-rose-600 dark:text-rose-400">arrow_downward</span>
                <span className="font-bold text-xs uppercase tracking-widest text-rose-600">Expense</span>
              </button>
              <button
                onClick={() => { setType('income'); handleNext(); }}
                className="p-8 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 flex flex-col items-center gap-3 hover:scale-[1.02] transition-all"
              >
                <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">arrow_upward</span>
                <span className="font-bold text-xs uppercase tracking-widest text-green-600">Income</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="label-text">Category Name</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Subscriptions"
                  className="input-field"
                />
              </div>

              <div className="space-y-1.5">
                <label className="label-text">Select Icon</label>
                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                  {icons.map(i => (
                    <button
                      key={i}
                      onClick={() => setIcon(i)}
                      className={`size-10 rounded-xl flex items-center justify-center transition-all ${icon === i
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                      <span className="material-symbols-outlined text-xl">{i}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn-primary flex-1"
                >
                  Save Category
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryEditorModal;
