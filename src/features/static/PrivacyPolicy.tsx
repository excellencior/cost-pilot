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
                        <span className="material-symbols-outlined text-primary-600">save</span>
                        2. 100% Local Storage & Backups
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
                        Your transactions and financial data are stored solely on your local device. We offer a Local Auto-Backup feature for data safety:
                    </p>
                    <ul className="list-disc list-inside space-y-3 pl-2 text-sm text-stone-600 dark:text-stone-300">
                        <li>Data is saved locally to a folder of your explicit choosing on your device. We do not automatically upload any financial data to any cloud providers.</li>
                        <li>Automated daily backups run in the background (or foreground on web) to keep a rolling 30-day history of your financial data on your own hard drive.</li>
                        <li>You retain absolute governance over where these backup files live and how they are handled.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-600">lock</span>
                        3. Zero Access & Zero Telemetry
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                        There are no servers, no telemetry, and no accounts. The developer (Apurbo) and any third-party providers do not monitor, read, or analyze your individual financial transactions. CostPilot operates strictly offline after the initial load.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-600">delete_forever</span>
                        4. Your Rights
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                        You have full control over your data. You can delete your transactions or clear your app storage at any time, which permanently removes your data from your local device repository.
                    </p>
                </section>

                <div className="pt-10 border-t border-stone-100 dark:border-stone-800 text-center">
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest">
                        Last Updated: March 8, 2026
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
