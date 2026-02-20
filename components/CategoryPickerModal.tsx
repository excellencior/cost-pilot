import React from 'react';
import { Category } from '../types';

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
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                        Select {type} Category
                    </h3>
                    <button
                        onClick={onClose}
                        className="size-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {filteredCategories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                    onSelect(cat);
                                    onClose();
                                }}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95 ${selectedCategoryId === cat.id
                                        ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800 text-primary-600 dark:text-primary-400'
                                        : 'bg-white dark:bg-slate-800 border-slate-50 dark:border-slate-800 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`size-12 rounded-xl flex items-center justify-center shadow-sm ${selectedCategoryId === cat.id ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}>
                                    <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-center line-clamp-1">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                        Manage your categories in <span className="text-primary-600 font-bold">Settings</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CategoryPickerModal;
