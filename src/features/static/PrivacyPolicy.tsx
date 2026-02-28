import React from 'react';

interface PrivacyPolicyProps {
    onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
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
                <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">Privacy Policy</h1>
            </div>

            <div className="card p-8 md:p-10 space-y-8 bg-brand-surface-light dark:bg-brand-surface-dark border-[#AF8F42]/20 dark:border-[#AF8F42]/10">
                <section>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-600">visibility_off</span>
                        1. Our Privacy Mission
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                        CostPilot is built on the principle of absolute financial privacy. Your financial data is sensitive, and we believe it should be yours and yours alone.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-600">cloud_done</span>
                        2. Data Storage & Supabase
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
                        By default, your transactions and financial data are stored solely on your local device. We offer a manual Cloud Backup feature:
                    </p>
                    <ul className="list-disc list-inside space-y-3 pl-2 text-sm text-stone-600 dark:text-stone-300">
                        <li>Data is synced to <strong>Supabase</strong> only when you explicitly press the "Sync Now" button. We do not automatically upload your data.</li>
                        <li>This enables secure synchronization across your devices and protects against data loss on your terms.</li>
                        <li>Data is handled according to Supabase's industry-standard security protocols.</li>
                        <li>In the event of sync conflicts between your local and cloud data, CostPilot provides a reconciliation screen where you choose exactly which data to keep.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-600">lock</span>
                        3. Zero Access Policy
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                        The developer (Apurbo) and any third-party providers (like Supabase) do not monitor, read, or analyze your individual financial transactions. CostPilot does not sell your data to advertisers or third parties.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-600">delete_forever</span>
                        4. Your Rights
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                        You have full control over your data. You can delete your transactions or entire account at any time, which will remove your data from both your local device and the Supabase cloud infrastructure.
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

export default PrivacyPolicy;
