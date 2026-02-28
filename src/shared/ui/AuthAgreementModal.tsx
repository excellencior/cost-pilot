import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

interface AuthAgreementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
}

const AuthAgreementModal: React.FC<AuthAgreementModalProps> = ({ isOpen, onClose, onContinue }) => {
    const navigate = useNavigate();
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setAccepted(false); // Reset state when opening
        } else {
            document.body.style.overflow = 'unset';
            setAccepted(false);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with full-screen blur to match DatePicker */}
            <div
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity animate-backdrop"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-brand-surface-light dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-3xl shadow-2xl p-6 w-full max-w-[780px] flex flex-col max-h-[90vh] animate-scale-in">
                {/* Header */}
                <div className="flex flex-col items-center justify-center mb-6 text-center">
                    <div className="size-12 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-[24px]">verified_user</span>
                    </div>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                        Privacy & Data Agreement
                    </h2>
                    <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                        Before connecting your Google account for Cloud Backup, please review how we handle your data. CostPilot is built with a privacy-first mindset.
                    </p>
                </div>

                {/* Content area: scrolls if needed */}
                <div className="overflow-y-auto px-1 space-y-4 mb-4 custom-scrollbar">
                    <ul className="space-y-4">
                        <li className="flex gap-3 items-start p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800/80">
                            <span className="material-symbols-outlined text-green-500 text-lg shrink-0 mt-0.5">account_circle</span>
                            <span className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                <strong className="text-stone-900 dark:text-white block mb-0.5">Google Profile Data</strong> We use your Google account strictly for secure authentication. We store your basic profile info (email and name).
                            </span>
                        </li>
                        <li className="flex gap-3 items-start p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800/80">
                            <span className="material-symbols-outlined text-green-500 text-lg shrink-0 mt-0.5">lock</span>
                            <span className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                <strong className="text-stone-900 dark:text-white block mb-0.5">End-to-End Control</strong> Your transactions and categories are encrypted. Cloud Backup is entirely manual—you have full control over when data leaves your device.
                            </span>
                        </li>
                        <li className="flex gap-3 items-start p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800/80">
                            <span className="material-symbols-outlined text-green-500 text-lg shrink-0 mt-0.5">sync_alt</span>
                            <span className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                <strong className="text-stone-900 dark:text-white block mb-0.5">Conflict Resolution</strong> If syncing conflicts occur, CostPilot provides transparent reconciliation, giving you the final say.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Checkbox & Footer Buttons */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-4">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                        <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                            <input
                                type="checkbox"
                                className="peer appearance-none size-5 border-2 border-primary-300 dark:border-primary-700/50 rounded checked:border-primary-500 checked:bg-primary-500 transition-all cursor-pointer"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                            />
                            <span className="material-symbols-outlined absolute text-white text-[16px] pointer-events-none opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all">
                                check
                            </span>
                        </div>
                        <span className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed select-none pt-0.5">
                            I understand and accept the{' '}
                            <button onClick={(e) => { e.preventDefault(); navigate('/terms'); }} className="text-primary-600 dark:text-primary-400 font-bold hover:underline">Terms of Service</button>
                            {' '}and{' '}
                            <button onClick={(e) => { e.preventDefault(); navigate('/privacy'); }} className="text-primary-600 dark:text-primary-400 font-bold hover:underline">Privacy Policy</button>.
                        </span>
                    </label>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="w-1/3 py-2.5 rounded-xl text-sm font-bold text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onContinue}
                            disabled={!accepted}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${accepted
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 active:scale-[0.98]'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed'
                                }`}
                        >
                            Continue with Google
                            <span className="material-symbols-outlined text-[18px]">login</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default AuthAgreementModal;
