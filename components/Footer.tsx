import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full mt-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="max-w-7xl flex flex-col items-center justify-center gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Built by <span className="text-primary-600 dark:text-primary-400">Apurbo Banik Turjo</span>
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-sm">mail</span>
                    <a href="mailto:turjo44@gmail.com" className="hover:text-primary-500 transition-colors">
                        turjo44@gmail.com
                    </a>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium tracking-widest uppercase">
                    &copy; {new Date().getFullYear()} CostPilot • All Rights Reserved
                </p>
            </div>
        </footer>
    );
};

export default Footer;
