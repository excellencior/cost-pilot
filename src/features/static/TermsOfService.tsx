import React from 'react';

interface TermsOfServiceProps {
    onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
    return (
        <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-10">
                <button
                    onClick={onBack}
                    className="size-10 rounded-lg bg-brand-surface-light dark:bg-brand-surface-dark border border-[#AF8F42]/30 dark:border-[#AF8F42]/40 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all active:scale-95 shadow-sm"
                >
                    <span className="material-symbols-outlined">home</span>
                </button>
                <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">Terms of Service</h1>
            </div>

            <div className="card p-8 md:p-10 space-y-8 bg-brand-surface-light dark:bg-brand-surface-dark border-[#AF8F42]/20 dark:border-[#AF8F42]/10">
                <section>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-600">gavel</span>
                        1. Acceptance of Terms
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                        By accessing or using CostPilot, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the application. CostPilot is provided on an "as-is" and "as-available" basis.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-600">database</span>
                        2. Use of Service & Data Syncing
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
                        CostPilot is a personal finance tracking tool. It operates primarily as a local-first application, meaning your data is stored directly on your device.
                    </p>
                    <div className="bg-primary-500/5 dark:bg-primary-950/20 border-l-4 border-primary-500 p-4 rounded-r-xl">
                        <p className="text-sm font-semibold text-stone-900 dark:text-white mb-2 underline">Manual Data Sync & Conflict Resolution:</p>
                        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                            CostPilot provides a <strong>manual</strong> Cloud Backup using Supabase infrastructure. By initiating a sync, you agree to the storage of your encrypted data on these servers. You remain fully responsible for resolving any data conflicts during the sync process using the provided reconciliation tools to ensure your data's integrity.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-600">shield_person</span>
                        3. User Responsibility
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                        You are responsible for maintaining the security of your account and your device. You are solely responsible for the accuracy of the financial information you enter into the application. CostPilot does not provide financial or tax advice.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-600">edit_note</span>
                        4. Modifications to Terms
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                        We reserve the right to modify these terms at any time. Significant changes will be announced within the application. Continued use of the service after such changes constitutes acceptance of the new terms.
                    </p>
                </section>

                <div className="pt-10 border-t border-stone-100 dark:border-stone-800 text-center">
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest">
                        Last Updated: February 23, 2026
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
