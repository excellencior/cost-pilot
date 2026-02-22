import React, { useState, useRef, useEffect } from 'react';
import { View } from '../types';
import { useCloudBackup } from './CloudBackupContext';
import Footer from './Footer';

interface LayoutProps {
    children: React.ReactNode;
    currentView: View;
    onNavigate: (view: View) => void;
    onAddEntry: () => void;
    userEmail?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, onAddEntry, userEmail }) => {
    const { isCloudEnabled, backupStatus, statusMessage, lastBackupTime, retryBackup } = useCloudBackup();
    const [showPopover, setShowPopover] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const navItems: { view: View; icon: string; label: string }[] = [
        { view: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
        { view: 'history', icon: 'history', label: 'History' },
        { view: 'analysis', icon: 'analytics', label: 'Analysis' },
        { view: 'settings', icon: 'settings', label: 'Settings' },
    ];

    // Close popover on outside click
    useEffect(() => {
        if (!showPopover) return;
        const handleClick = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setShowPopover(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showPopover]);

    const cloudIcon = () => {
        if (!isCloudEnabled) return { icon: 'cloud_off', color: 'text-stone-400 opacity-50', spin: false };
        switch (backupStatus) {
            case 'syncing': return { icon: 'cloud_sync', color: 'text-amber-500', spin: true };
            case 'success': return { icon: 'cloud_done', color: 'text-green-500', spin: false };
            case 'error': return { icon: 'cloud_off', color: 'text-rose-500', spin: false };
            case 'idle':
            default: return { icon: 'cloud_done', color: 'text-green-500', spin: false };
        }
    };

    const formatLastBackup = (iso: string | null) => {
        if (!iso) return 'Never';
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        return d.toLocaleDateString();
    };

    const getPopoverStatusText = () => {
        if (!isCloudEnabled) return 'Syncing is turned off';
        switch (backupStatus) {
            case 'syncing': return statusMessage || 'Syncing your data...';
            case 'success': return statusMessage || 'All data backed up';
            case 'error': return statusMessage || 'Backup failed';
            case 'idle':
            default: return 'Cloud backup is active';
        }
    };

    const cloudIconData = cloudIcon();

    const CloudButton = () => (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setShowPopover(!showPopover)}
                className={`size-9 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-all active:scale-90 ${cloudIconData.color}`}
                title="Cloud backup status"
            >
                <span className={`material-symbols-outlined text-[20px] ${cloudIconData.spin ? 'animate-spin' : ''}`}>
                    {cloudIconData.icon}
                </span>
            </button>

            {showPopover && (
                <div className="absolute right-0 md:left-0 top-11 w-64 bg-brand-surface-light dark:bg-brand-surface-dark rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`material-symbols-outlined text-base ${cloudIconData.color} ${cloudIconData.spin ? 'animate-spin' : ''}`}>
                            {cloudIconData.icon}
                        </span>
                        <span className="text-sm font-bold text-stone-900 dark:text-white">Cloud Backup</span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-300 mb-2">{getPopoverStatusText()}</p>
                    {isCloudEnabled && lastBackupTime && (
                        <p className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">
                            Last backup: {formatLastBackup(lastBackupTime)}
                        </p>
                    )}
                    {backupStatus === 'error' && (
                        <button
                            onClick={() => { retryBackup(); setShowPopover(false); }}
                            className="mt-3 w-full bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/20 text-stone-900 dark:text-white px-4 py-2 rounded-lg font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            Retry Sync
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="h-screen flex flex-col md:flex-row bg-brand-base-light dark:bg-brand-base-dark overflow-hidden">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-brand-surface-light dark:bg-brand-surface-dark border-r border-stone-200/60 dark:border-stone-800/60 z-30 transition-colors p-5">
                <div className="flex items-center justify-between mb-6 px-2">
                    <div className="flex items-center gap-3">
                        <img src="/costpilot_logo.png" alt="CostPilot" className="size-10 rounded-lg shadow-lg shadow-primary-500/20 object-cover" />
                        <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">CostPilot</h1>
                    </div>
                    <CloudButton />
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.view}
                            onClick={() => onNavigate(item.view)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold transition-all relative group ${currentView === item.view
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                                }`}
                        >
                            {currentView === item.view && (
                                <div className="absolute inset-0 bg-primary-500/5 dark:bg-white/5 backdrop-blur-md rounded-lg border border-primary-500/5 dark:border-white/10 animate-fade-in"></div>
                            )}
                            <span className="material-symbols-outlined text-2xl relative z-10">{item.icon}</span>
                            <span className="relative z-10">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {userEmail && (
                    <div className="mt-auto pt-6 border-t border-stone-100 dark:border-stone-800">
                        <div className="flex items-center gap-3 px-2">
                            <div className="size-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-lg text-stone-500">person</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-stone-900 dark:text-white truncate">{userEmail.split('@')[0]}</p>
                                <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">{userEmail}</p>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 relative h-full md:ml-64">
                <header className="md:hidden flex items-center justify-between py-2 px-4 bg-brand-surface-light/80 dark:bg-brand-surface-dark/80 backdrop-blur-md border-b border-stone-200/60 dark:border-stone-800/60 sticky top-0 z-30 transition-colors">
                    <div className="flex items-center gap-2">
                        <img src="/costpilot_logo.png" alt="CostPilot" className="size-8 rounded-md object-cover" />
                        <span className="font-bold text-stone-900 dark:text-white">CostPilot</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CloudButton />
                        {userEmail && (
                            <div className="size-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-lg text-stone-400">person</span>
                            </div>
                        )}
                    </div>
                </header>

                <div className="flex-1 px-5 py-4 md:px-10 md:py-6 lg:px-14 pb-24 md:pb-6 overflow-y-auto w-full max-w-5xl mx-auto">
                    {children}
                    {currentView === 'settings' && <Footer />}
                </div>

                {/* Floating Action Button — only on relevant pages */}
                {(['dashboard'] as View[]).includes(currentView) && (
                    <button
                        onClick={onAddEntry}
                        className="fixed bottom-20 sm:bottom-24 right-6 md:bottom-10 md:right-10 size-14 bg-primary-600 text-white rounded-xl shadow-2xl shadow-primary-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
                    >
                        <span className="material-symbols-outlined text-3xl font-bold group-hover:rotate-90 transition-transform duration-300">add</span>
                    </button>
                )}

                {/* Bottom Nav (Mobile) */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-brand-surface-light dark:bg-brand-surface-dark border-t border-stone-200/60 dark:border-stone-800/60 z-30 flex items-center justify-around px-4 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] transition-colors">
                    {navItems.map((item) => (
                        <button
                            key={item.view}
                            onClick={() => onNavigate(item.view)}
                            className={`flex flex-col items-center gap-1 p-2 min-w-[72px] transition-all relative rounded-lg ${currentView === item.view
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-stone-400 dark:text-stone-500'
                                }`}
                        >
                            {currentView === item.view && (
                                <div className="absolute inset-x-3 inset-y-2 bg-primary-500/5 dark:bg-white/10 backdrop-blur-md rounded-lg border border-primary-500/5 dark:border-white/10 animate-scale-in"></div>
                            )}
                            <span className="material-symbols-outlined text-2xl relative z-10">{item.icon}</span>
                            <span className="text-[10px] font-bold relative z-10">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </main>
        </div>
    );
};

export default Layout;
