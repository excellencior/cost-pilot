import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-brand-surface-light dark:bg-brand-surface-dark border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-8 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-400 flex flex-col items-center text-center">

                {/* Decorative Icon */}
                <div className="size-20 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <span className="material-symbols-outlined text-4xl font-light">waving_hand</span>
                </div>

                <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight mb-3">
                    Welcome to CostPilot!
                </h2>

                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-8 max-w-sm">
                    Your personal finance journey starts here. CostPilot helps you track expenses, analyze spending habits, and manage your money with complete privacy and visual clarity. Let's get started by adding your first transaction.
                </p>

                <button
                    onClick={onClose}
                    className="w-full btn-primary py-3.5 text-[15px] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
                >
                    <span>Let's Go</span>
                    <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                </button>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default WelcomeModal;
