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
  const [color, setColor] = useState('bg-slate-100 text-slate-500');

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setIcon(editingCategory.icon);
      setColor(editingCategory.color);
      setType(editingCategory.type);
      setStep(2); // Jump straight to details for editing
    } else if (defaultType) {
      // Skip step 1 if defaultType is provided
      setType(defaultType);
      setStep(2);
      setName('');
      setIcon('category');
      setColor('bg-blue-100 text-blue-500');
    } else {
      setName('');
      setIcon('category');
      setColor('bg-blue-100 text-blue-500');
      setType('expense');
      setStep(1);
    }
  }, [editingCategory, isOpen, defaultType]);

  if (!isOpen) return null;

  const handleNext = () => setStep(2);

  const handleSave = () => {
    if (editingCategory) {
      onSave({ ...editingCategory, name, icon, color });
    } else {
      onSave({ name, icon, color, type });
    }
    onClose();
  };

  const icons = ['restaurant', 'directions_bus', 'shopping_cart', 'movie', 'health_and_safety', 'shopping_bag', 'payments', 'trending_up', 'flight', 'home', 'fitness_center', 'work'];
  const colors = [
    'bg-red-100 text-red-500',
    'bg-blue-100 text-blue-500',
    'bg-green-100 text-green-500',
    'bg-orange-100 text-orange-500',
    'bg-purple-100 text-purple-500',
    'bg-teal-100 text-teal-500',
    'bg-cyan-100 text-cyan-500',
    'bg-pink-100 text-pink-500'
  ];

  return (
    <div className="fixed inset-0 z-[120] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full rounded-t-[2.5rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />

        {step === 1 && !editingCategory && !defaultType ? (
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold text-center">Select Type</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setType('expense'); handleNext(); }}
                className="p-8 rounded-3xl border-2 border-transparent bg-red-50 dark:bg-red-900/10 hover:border-red-500/50 flex flex-col items-center gap-3 transition-all"
              >
                <span className="material-symbols-outlined text-4xl text-red-500">output</span>
                <span className="font-bold text-sm uppercase tracking-widest text-red-600">Expense</span>
              </button>
              <button
                onClick={() => { setType('income'); handleNext(); }}
                className="p-8 rounded-3xl border-2 border-transparent bg-green-50 dark:bg-green-900/10 hover:border-green-500/50 flex flex-col items-center gap-3 transition-all"
              >
                <span className="material-symbols-outlined text-4xl text-green-500">input</span>
                <span className="font-bold text-sm uppercase tracking-widest text-green-600">Income</span>
              </button>
            </div>
            <button onClick={onClose} className="py-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Cancel</button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => !editingCategory && !defaultType ? setStep(1) : onClose()}
                className="text-slate-400 text-sm font-bold uppercase tracking-widest"
              >
                {editingCategory || defaultType ? 'Cancel' : 'Back'}
              </button>
              <h2 className="text-base font-bold uppercase tracking-widest">
                {editingCategory ? 'Edit Category' : `New ${type} label`}
              </h2>
              <button onClick={handleSave} className="text-primary text-sm font-bold uppercase tracking-widest">Save</button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Label Name</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Subscriptions"
                className="glass-input rounded-2xl px-5 py-4 text-sm font-bold w-full focus:ring-2 ring-primary/20 border-transparent bg-slate-100 dark:bg-white/5"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pick Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {icons.map(i => (
                  <button
                    key={i}
                    onClick={() => setIcon(i)}
                    className={`size-10 rounded-xl flex items-center justify-center transition-all ${icon === i ? 'bg-primary text-white shadow-lg scale-110' : 'bg-slate-50 dark:bg-white/5 text-slate-400'}`}
                  >
                    <span className="material-symbols-outlined text-xl">{i}</span>
                  </button>
                ))}
              </div>
            </div>


          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryEditorModal;
