import React from 'react';
import { Category } from '../../entities/types';

interface CategoryPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (category: Category) => void;
    categories: Category[];
    selectedCategoryId?: string;
    type: 'expense' | 'income';
}

const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    categories,
    selectedCategoryId,
    type
}) => {
    if (!isOpen) return null;

    const filteredCategories = categories.filter(c => c.type === type);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-stone-900/40 animate-backdrop"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-brand-surface-light dark:bg-brand-surface-dark rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800">
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white capitalize">
                        Select {type} Category
                    </h3>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-3 gap-2">
                        {filteredCategories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                    onSelect(cat);
                                    onClose();
                                }}
                                className={`flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all active:scale-[0.98] ${selectedCategoryId === cat.id
                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400'
                                    : 'bg-brand-surface-light dark:bg-stone-800 border-stone-50 dark:border-stone-800 text-stone-500 hover:border-stone-200 hover:bg-stone-50'
                                    }`}
                            >
                                <div className={`size-10 rounded-lg flex items-center justify-center shadow-sm ${selectedCategoryId === cat.id ? 'bg-primary-600 text-white' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                                    }`}>
                                    <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-center break-words leading-tight">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-5 bg-stone-50 dark:bg-stone-800/30 border-t border-stone-100 dark:border-stone-800 text-center">
                    <p className="text-xs text-stone-500 font-medium">
                        Manage your categories in <span className="text-primary-600 font-bold">Settings</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CategoryPickerModal;
