import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Category } from '../../entities/types';

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
  const [tooltipIcon, setTooltipIcon] = useState<string | null>(null);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const icons = ['restaurant', 'directions_bus', 'shopping_cart', 'movie', 'health_and_safety', 'shopping_bag', 'payments', 'trending_up', 'flight', 'home', 'fitness_center', 'work', 'savings', 'account_balance', 'bolt', 'water_drop', 'wifi'];

  const handlePointerDown = (e: React.PointerEvent, iconName: string) => {
    // Clear any existing timer
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    const rect = e.currentTarget.getBoundingClientRect();
    pressTimerRef.current = setTimeout(() => {
      setTooltipIcon(iconName);
      setTooltipRect(rect);
    }, 500); // 0.5s delay
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setTooltipIcon(null);
    setTooltipRect(null);
  };

  const formatIconLabel = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-brand-surface-light dark:bg-brand-surface-dark rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-xl font-bold text-stone-900 dark:text-white">
            {editingCategory ? 'Edit Category' : 'New Category'}
          </h2>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 space-y-6">
          {step === 1 && !editingCategory && !defaultType ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setType('expense'); handleNext(); }}
                className="p-6 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 flex flex-col items-center gap-3 hover:scale-[1.02] transition-all"
              >
                <span className="material-symbols-outlined text-4xl text-rose-600 dark:text-rose-400">arrow_downward</span>
                <span className="font-bold text-xs uppercase tracking-widest text-rose-600">Expense</span>
              </button>
              <button
                onClick={() => { setType('income'); handleNext(); }}
                className="p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 flex flex-col items-center gap-3 hover:scale-[1.02] transition-all"
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
                    <div key={i} className="relative group">
                      <button
                        onPointerDown={(e) => handlePointerDown(e, i)}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        onClick={() => setIcon(i)}
                        className={`size-10 rounded-lg flex items-center justify-center transition-all ${icon === i
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
                          }`}
                      >
                        <span className="material-symbols-outlined text-xl">{i}</span>
                      </button>

                      {tooltipIcon === i && tooltipRect && createPortal(
                        <div
                          className="fixed z-[100] px-2 py-1 bg-stone-900 border border-stone-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-md whitespace-nowrap shadow-xl animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
                          style={{
                            left: tooltipRect.left + tooltipRect.width / 2,
                            top: tooltipRect.top - 8,
                            transform: 'translate(-50%, -100%)'
                          }}
                        >
                          {formatIconLabel(i)}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-stone-900" />
                        </div>,
                        document.body
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-1 flex gap-3">
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
                  Save
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
