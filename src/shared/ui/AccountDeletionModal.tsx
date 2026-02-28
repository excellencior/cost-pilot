import React, { useState, useEffect } from 'react';

interface AccountDeletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    userEmail: string;
}

const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({ isOpen, onClose, onConfirm, userEmail }) => {
    const [step, setStep] = useState<'confirm' | 'success'>('confirm');
    const [verificationInput, setVerificationInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const expectedString = `DELETE ACCOUNT ${userEmail}`;
    const isValid = verificationInput === expectedString;

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep('confirm');
            setVerificationInput('');
            setIsDeleting(false);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleContinue = async () => {
        if (!isValid) return;

        setIsDeleting(true);
        setError(null);
        try {
            await onConfirm();
            setStep('success');
        } catch (err: any) {
            setError(err.message || 'Failed to schedule deletion. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const getDeadlineDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-white dark:bg-brand-surface-dark rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-[#AF8F42]/20 animate-in zoom-in-95 duration-300">
                {step === 'confirm' ? (
                    <div className="p-8">
                        <div className="size-16 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6 mx-auto">
                            <span className="material-symbols-outlined text-4xl">warning</span>
                        </div>

                        <h3 className="text-2xl font-bold text-stone-900 dark:text-white text-center mb-4">Confirmation</h3>

                        <div className="space-y-4 text-center mb-8">
                            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                                You are going through the delete account process. Please write down <span className="font-bold text-stone-900 dark:text-white font-mono break-all group relative">DELETE ACCOUNT (<span className="text-primary-600 dark:text-primary-400">your account</span>)</span> for verification.
                            </p>
                        </div>

                        <div className="space-y-2 mb-8">
                            <input
                                autoFocus
                                type="text"
                                value={verificationInput}
                                onChange={(e) => setVerificationInput(e.target.value)}
                                placeholder={expectedString}
                                className={`w-full px-4 py-4 rounded-xl border font-mono text-sm transition-all focus:outline-none focus:ring-2 ${verificationInput.length > 0 && !isValid
                                    ? 'border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-900/10 focus:ring-rose-500/20'
                                    : 'border-stone-200 dark:border-[#AF8F42]/30 bg-stone-50/50 dark:bg-stone-900/30 focus:ring-[#AF8F42]/20'
                                    } dark:text-white`}
                            />
                            {verificationInput.length > 0 && !isValid && (
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest pl-1">Invalid input</p>
                            )}
                            {error && (
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest pl-1">{error}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-4 font-bold text-sm">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleContinue}
                                disabled={!isValid || isDeleting}
                                className={`flex-1 py-3 rounded-xl transition-all active:scale-95 ${isValid
                                    ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                    : 'text-stone-300 cursor-not-allowed'
                                    }`}
                            >
                                {isDeleting ? 'PROCESSING...' : 'CONTINUE'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8">
                        <div className="size-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 mx-auto">
                            <span className="material-symbols-outlined text-4xl">check_circle</span>
                        </div>

                        <h3 className="text-2xl font-bold text-stone-900 dark:text-white text-center mb-4">Successfully deleted!</h3>

                        <div className="space-y-4 text-center mb-10">
                            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                                Account will be completely deleted in <span className="font-bold text-stone-900 dark:text-white italic">{getDeadlineDate()}</span>. You can cancel deletion by logging in again within 30 days. After that, you won't be able to retrieve your data.
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-xl text-emerald-600 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all active:scale-95 text-sm"
                        >
                            OK
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountDeletionModal;
