import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { View } from '../entities/types';
import { useCloudBackup } from '../application/contexts/CloudBackupContext';
import Footer from './Footer';

interface LayoutProps {
    children: React.ReactNode;
    currentView: View;
    onNavigate: (view: View) => void;
    onAddEntry: () => void;
    userEmail?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, onAddEntry, userEmail }) => {
    const { isCloudEnabled, backupStatus, statusMessage, lastBackupTime, retryBackup, pullUpdates } = useCloudBackup();
    const [showPopover, setShowPopover] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const cloudBtnRef = useRef<HTMLButtonElement>(null);
    const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    // Close sidebar on navigation (for mobile/tablet)
    const handleNavigate = (view: View) => {
        onNavigate(view);
        setIsSidebarOpen(false);
    };

    const navItems: { view: View; icon: string; label: string }[] = [
        { view: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
        { view: 'history', icon: 'history', label: 'History' },
        { view: 'analysis', icon: 'analytics', label: 'Analysis' },
        { view: 'settings', icon: 'settings', label: 'Settings' },
    ];

    // Track the last directly-selected main nav item
    // Sub-views (overview, category-picker, etc.) keep whatever nav was last active
    const mainNavViews = new Set(navItems.map(item => item.view));
    const lastMainNavRef = useRef<View>(
        mainNavViews.has(currentView) ? currentView : 'dashboard'
    );

    // Update ref only when currentView is a main nav item
    useEffect(() => {
        if (mainNavViews.has(currentView)) {
            lastMainNavRef.current = currentView;
        }
    }, [currentView]);

    // For legal/support sub-views, always highlight settings; for others, keep last nav
    const activeNavView = (() => {
        if (mainNavViews.has(currentView)) return currentView;
        if (['terms', 'privacy', 'support'].includes(currentView)) return currentView;
        return lastMainNavRef.current;
    })();

    // Close popover on outside click
    useEffect(() => {
        if (!showPopover) return;
        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                popoverRef.current && !popoverRef.current.contains(target) &&
                cloudBtnRef.current && !cloudBtnRef.current.contains(target)
            ) {
                setShowPopover(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showPopover]);

    // Calculate popover position when opened
    useEffect(() => {
        if (showPopover && cloudBtnRef.current) {
            const rect = cloudBtnRef.current.getBoundingClientRect();
            const popoverWidth = 256;
            const vw = window.innerWidth;
            let left = rect.left;
            if (left + popoverWidth > vw - 16) left = rect.right - popoverWidth;
            if (left < 16) left = 16;
            setPopoverPos({ top: rect.bottom + 8, left });
        }
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

    const handleCloudBtnClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        cloudBtnRef.current = e.currentTarget;
        setShowPopover(prev => !prev);
    }, []);

    const renderCloudButton = () => (
        <button
            onClick={handleCloudBtnClick}
            className={`size-9 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-all active:scale-90 ${cloudIconData.color}`}
            title="Cloud backup status"
        >
            <span className={`material-symbols-outlined text-[20px] ${cloudIconData.spin ? 'animate-spin' : ''}`}>
                {cloudIconData.icon}
            </span>
        </button>
    );

    const cloudPopoverJSX = showPopover ? ReactDOM.createPortal(
        <div
            ref={popoverRef}
            onMouseDown={e => e.stopPropagation()}
            style={{ position: 'fixed', top: popoverPos.top, left: popoverPos.left, zIndex: 9999 }}
            className="w-64 bg-brand-surface-light dark:bg-brand-surface-dark rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 p-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
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
            {isCloudEnabled && backupStatus !== 'syncing' && backupStatus !== 'error' && (
                <button
                    onClick={() => { setShowPopover(false); pullUpdates(); }}
                    className="mt-3 w-full bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-lg font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">sync</span>
                    Sync Now
                </button>
            )}
        </div>,
        document.body
    ) : null;

    return (
        <>
            <div className="h-screen flex flex-col bg-brand-base-light dark:bg-brand-base-dark overflow-hidden">
                <div className="flex-1 flex w-full max-w-[1440px] mx-auto relative overflow-hidden">
                    {/* Responsive Sidebar (Mobile: hidden | Tablet: compressed | Desktop: full) */}
                    <aside className={`
                    hidden sm:flex flex-col bg-brand-surface-light dark:bg-brand-surface-dark border-r border-[#AF8F42]/30 dark:border-[#AF8F42]/40 transition-all duration-300 p-4 lg:p-5 shrink-0 overflow-y-auto hide-scrollbar
                    sm:w-20 lg:w-64
                `}>
                        <div className="flex items-center justify-center lg:justify-between mb-8 lg:px-2">
                            <div className="flex items-center gap-3">
                                <img src="/costpilot_logo.png" alt="CostPilot" className="size-10 rounded-lg shadow-lg shadow-primary-500/20 object-cover" />
                                <h1 className="hidden lg:block text-xl font-bold tracking-tight text-stone-900 dark:text-white">CostPilot</h1>
                            </div>
                            {/* Cloud Sync Button - Desktop Sidebar Only */}
                            <div className="hidden lg:block">
                                {renderCloudButton()}
                            </div>
                        </div>

                        <nav className="flex-1 space-y-2">
                            {navItems.map((item) => (
                                <button
                                    key={item.view}
                                    onClick={() => handleNavigate(item.view)}
                                    className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-4 py-2 rounded-xl font-bold transition-all relative group ${currentView === item.view || activeNavView === item.view
                                        ? 'text-[#AF8F42] dark:text-[#D4AF37]'
                                        : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                                        }`}
                                >
                                    {(currentView === item.view || activeNavView === item.view) && (
                                        <div className="absolute inset-0 bg-[#AF8F42]/10 dark:bg-[#AF8F42]/5 backdrop-blur-md rounded-xl border border-[#AF8F42]/20 dark:border-[#AF8F42]/10 animate-fade-in"></div>
                                    )}
                                    <span className="material-symbols-outlined text-2xl relative z-10">{item.icon}</span>
                                    <span className="hidden lg:block relative z-10">{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        {/* Sidebar Middle - Trust Section (Desktop Only) */}
                        <div className="hidden lg:block my-4 px-3 py-3 rounded-xl border border-[#AF8F42]/20 dark:border-[#AF8F42]/10 bg-gradient-to-br from-stone-50 to-white dark:from-stone-800/50 dark:to-stone-900/50 relative overflow-hidden group">
                            <div className="absolute -top-8 -right-8 size-16 bg-[#AF8F42]/10 rounded-full blur-xl group-hover:bg-[#AF8F42]/20 transition-all"></div>
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="size-7 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-1.5 border border-primary-200 dark:border-primary-800">
                                    <span className="material-symbols-outlined text-sm">verified_user</span>
                                </div>
                                <p className="text-[10px] font-bold text-stone-900 dark:text-white uppercase tracking-wider mb-0.5">Local-First</p>
                                <p className="text-[8px] text-stone-500 dark:text-stone-400 font-medium leading-tight">
                                    Private & Encrypted.
                                </p>
                            </div>
                        </div>

                        {/* Legal & Support Section (Desktop Only) */}
                        <div className="hidden lg:block pb-6 space-y-3 px-2">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-4">Legal & Support</p>
                            <div className="space-y-1">
                                <button
                                    onClick={() => handleNavigate('terms')}
                                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all relative group ${currentView === 'terms'
                                        ? 'text-[#AF8F42] dark:text-[#D4AF37]'
                                        : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                                        }`}
                                >
                                    {currentView === 'terms' && (
                                        <div className="absolute inset-x-0 inset-y-1 bg-[#AF8F42]/10 dark:bg-[#AF8F42]/5 backdrop-blur-md rounded-xl border border-[#AF8F42]/20 dark:border-[#AF8F42]/10 animate-fade-in"></div>
                                    )}
                                    <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform relative z-10">article</span>
                                    <span className="text-[12px] relative z-10">Terms of Service</span>
                                </button>
                                <button
                                    onClick={() => handleNavigate('privacy')}
                                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all relative group ${currentView === 'privacy'
                                        ? 'text-[#AF8F42] dark:text-[#D4AF37]'
                                        : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                                        }`}
                                >
                                    {currentView === 'privacy' && (
                                        <div className="absolute inset-x-0 inset-y-1 bg-[#AF8F42]/10 dark:bg-[#AF8F42]/5 backdrop-blur-md rounded-xl border border-[#AF8F42]/20 dark:border-[#AF8F42]/10 animate-fade-in"></div>
                                    )}
                                    <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform relative z-10">policy</span>
                                    <span className="text-[12px] relative z-10">Privacy Policy</span>
                                </button>
                                <button
                                    onClick={() => handleNavigate('support')}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-[12px] font-bold text-stone-500 hover:text-[#AF8F42] transition-colors group"
                                >
                                    <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform">headset_mic</span>
                                    Get Help
                                </button>
                            </div>
                        </div>

                        {userEmail && (
                            <div className="mt-auto pt-6 border-t border-stone-100 dark:border-stone-800">
                                <div className="flex items-center justify-center lg:justify-start gap-3 px-2">
                                    <div className="size-9 rounded-xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-lg text-stone-500">person</span>
                                    </div>
                                    <div className="hidden lg:flex flex-1 flex-col min-w-0">
                                        <p className="text-sm font-semibold text-stone-900 dark:text-white truncate">{userEmail.split('@')[0]}</p>
                                        <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">{userEmail}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 flex flex-col min-w-0 relative h-full">
                        <header className="flex lg:hidden items-center justify-between py-2 px-4 bg-brand-surface-light/80 dark:bg-brand-surface-dark/80 backdrop-blur-md border-b border-[#AF8F42]/30 dark:border-[#AF8F42]/40 sticky top-0 z-30 transition-colors">
                            <div className="flex items-center gap-3">
                                {/* Brand show only on mobile (when sidebar is hidden) */}
                                <div className="flex sm:hidden items-center gap-2">
                                    <img src="/costpilot_logo.png" alt="CostPilot" className="size-8 rounded-md object-cover" />
                                    <span className="font-bold text-stone-900 dark:text-white">CostPilot</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pr-1">
                                {renderCloudButton()}
                            </div>
                        </header>

                        <div className="flex-1 px-5 py-4 md:px-6 md:py-6 lg:px-14 pb-24 sm:pb-6 overflow-y-auto w-full max-w-5xl mx-auto">
                            {children}
                            {currentView === 'settings' && <Footer onNavigate={handleNavigate} />}
                        </div>

                        {/* Floating Action Button (FAB) */}
                        {(['dashboard', 'history'] as View[]).includes(currentView) && (
                            <button
                                onClick={onAddEntry}
                                className="fixed bottom-24 sm:bottom-10 right-6 md:right-10 size-14 bg-[#AF8F42] text-white rounded-full shadow-2xl shadow-[#AF8F42]/30 flex items-center justify-center hover:scale-110 hover:bg-[#917536] active:scale-95 transition-all z-40 group animate-bounce-in"
                            >
                                <span className="material-symbols-outlined text-3xl font-bold group-hover:rotate-90 transition-transform duration-300">add</span>
                            </button>
                        )}

                        {/* Bottom Nav (Mobile Only) */}
                        <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-14 bg-brand-surface-light dark:bg-brand-surface-dark border-t border-stone-200/60 dark:border-stone-800/60 z-30 flex items-center justify-around px-4 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] transition-colors">
                            {navItems.map((item) => (
                                <button
                                    key={item.view}
                                    onClick={() => handleNavigate(item.view)}
                                    className={`flex flex-col items-center gap-1 p-2 min-w-[72px] transition-all relative rounded-lg ${currentView === item.view || activeNavView === item.view
                                        ? 'text-primary-600 dark:text-primary-400'
                                        : 'text-stone-400 dark:text-stone-500'
                                        }`}
                                >
                                    {(currentView === item.view || activeNavView === item.view) && (
                                        <div className="absolute inset-x-0 inset-y-2 bg-primary-800/10 dark:bg-white/10 backdrop-blur-md rounded-xl border border-primary-500/10 dark:border-white/20 animate-scale-in"></div>
                                    )}
                                    <span className="material-symbols-outlined text-2xl relative z-10">{item.icon}</span>
                                    <span className="text-[10px] font-bold relative z-10">{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        {/* Overlay Backdrop */}
                        {isSidebarOpen && (
                            <div
                                className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 md:hidden animate-backdrop"
                                onClick={() => setIsSidebarOpen(false)}
                            />
                        )}
                    </main>
                </div>
            </div >
            {cloudPopoverJSX}
        </>
    );
};

export default Layout;
