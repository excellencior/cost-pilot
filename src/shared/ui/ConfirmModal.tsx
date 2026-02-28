import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'primary'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-xs bg-brand-surface-light dark:bg-brand-surface-dark rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <div className="space-y-4 text-center">
                    <div className="mx-auto size-14 rounded-full bg-stone-50 dark:bg-stone-800 flex items-center justify-center">
                        <span className={`material-symbols-outlined text-3xl ${variant === 'danger' ? 'text-rose-500' : 'text-primary-600'}`}>
                            {variant === 'danger' ? 'warning' : 'info'}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-stone-900 dark:text-white">{title}</h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400">{message}</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all active:scale-95"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shadow-lg ${variant === 'danger'
                                ? 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600'
                                : 'bg-primary-600 shadow-primary-500/20 hover:bg-primary-700'
                                }`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
