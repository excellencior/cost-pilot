import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full mt-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-brand-surface-light/50 dark:bg-stone-900/50 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">
                <p className="text-sm font-bold text-stone-900 dark:text-white">
                    CostPilot <span className="text-primary-600 dark:text-primary-400">by Apurbo</span>
                </p>
                <p className="text-[10px] text-primary-600/80 dark:text-primary-400/80 font-bold uppercase tracking-wider mt-0.5">
                    Dedicated to my father
                </p>
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-2">
                    <span className="material-symbols-outlined text-xs">verified_user</span>
                    <span>Encrypted & Local</span>
                </div>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-2 font-medium tracking-widest uppercase italic">
                    Designed for visual clarity
                </p>
            </div>
            <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-2 font-medium tracking-widest uppercase text-center">
                &copy; {new Date().getFullYear()} CostPilot • All Rights Reserved
            </p>
        </footer>
    );
};

export default Footer;
