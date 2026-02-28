import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [accepted, setAccepted] = useState(false);

    const handleContinue = () => {
        if (accepted) {
            localStorage.setItem('hasAcceptedTerms', 'true');
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-brand-base-light dark:bg-brand-base-dark text-stone-900 dark:text-stone-100 flex flex-col items-center p-6 sm:p-10">
            <div className="flex-grow flex flex-col items-center justify-center w-full max-w-2xl text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Brand Header */}
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-primary-600 dark:text-primary-500">
                            account_balance_wallet
                        </span>
                        <h1 className="text-5xl font-black tracking-tight">CostPilot</h1>
                    </div>
                    <p className="text-lg text-stone-500 dark:text-stone-400 max-w-lg mx-auto leading-relaxed">
                        A privacy-first personal finance platform for tracking expenses, managing budgets, and analyzing your financial history with clarity.
                    </p>
                </div>

                {/* Key Features / Data Policy */}
                <div className="card-section p-8 text-left space-y-6 bg-brand-surface-light/50 dark:bg-brand-surface-dark/50 border border-stone-200 dark:border-stone-800">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[#AF8F42] mb-2">
                            What Data We Collect
                        </h2>
                        <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                            CostPilot is built with privacy in mind. We only collect the minimal data necessary to provide you with seamless cloud syncing across your devices:
                        </p>
                        <ul className="mt-4 space-y-3">
                            <li className="flex gap-3 items-start">
                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                <span className="text-sm text-stone-600 dark:text-stone-300">
                                    <strong className="text-stone-900 dark:text-white">Google Profile Data:</strong> We use your Google account strictly for secure authentication. We store your basic profile info (email and name) to identify your account.
                                </span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                <span className="text-sm text-stone-600 dark:text-stone-300">
                                    <strong className="text-stone-900 dark:text-white">Financial Data:</strong> Your transactions and categories are encrypted and securely synced to our cloud only if you explicitly enable Cloud Backup. We use manual cloud syncing to ensure you are always in control of when your data leaves your device.
                                </span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                <span className="text-sm text-stone-600 dark:text-stone-300">
                                    <strong className="text-stone-900 dark:text-white">Conflict Resolution:</strong> If syncing conflicts occur, CostPilot provides transparent reconciliation, giving you the final say on which data to keep.
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Call To Action */}
                <div className="pt-6 space-y-6 w-full max-w-sm mx-auto">
                    <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors">
                        <div className="relative flex items-center justify-center mt-0.5">
                            <input
                                type="checkbox"
                                className="peer appearance-none size-5 border-2 border-stone-300 dark:border-stone-600 rounded checked:border-primary-500 checked:bg-primary-500 transition-all cursor-pointer"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                            />
                            <span className="material-symbols-outlined absolute text-white text-[16px] pointer-events-none opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all">
                                check
                            </span>
                        </div>
                        <span className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed select-none">
                            I understand and accept the{' '}
                            <button onClick={(e) => { e.preventDefault(); navigate('/terms'); }} className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">Terms of Service</button>
                            {' '}and{' '}
                            <button onClick={(e) => { e.preventDefault(); navigate('/privacy'); }} className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">Privacy Policy</button>.
                        </span>
                    </label>

                    <button
                        onClick={handleContinue}
                        disabled={!accepted}
                        className={`w-full py-4 text-lg shadow-xl shadow-primary-500/20 flex items-center justify-center gap-3 transition-all ${accepted
                                ? 'btn-primary hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed border-none'
                            }`}
                    >
                        <span>Continue to App</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>

                    <div className="flex items-center justify-center gap-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                        <button onClick={() => navigate('/privacy')} className="hover:text-[#AF8F42] transition-colors">Privacy Policy</button>
                        <span className="size-1 rounded-full bg-stone-300 dark:bg-stone-700"></span>
                        <button onClick={() => navigate('/terms')} className="hover:text-[#AF8F42] transition-colors">Terms of Service</button>
                    </div>
                </div>
            </div>

            {/* Footer text */}
            <div className="w-full py-6 text-[10px] text-stone-400 dark:text-stone-500 font-medium tracking-widest uppercase text-center mt-auto">
                &copy; {new Date().getFullYear()} CostPilot • Designed for visual clarity
            </div>
        </div>
    );
};

export default LandingPage;
