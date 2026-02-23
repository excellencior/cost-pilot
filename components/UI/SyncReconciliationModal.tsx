import React, { useState } from 'react';
import { Transaction } from '../../types';

export interface SyncDiff {
    addedLocally: any[];
    deletedLocally: any[];
    deletedRemotely: any[];
    modifiedLocally: { local: any; remote: any }[];
    remoteOnly: any[];
}

export type ReconciliationAction = 'keep_local' | 'restore_cloud' | 'confirm_delete' | 'discard_local';

interface SyncReconciliationModalProps {
    isOpen: boolean;
    diff: SyncDiff;
    onClose: () => void;
    onApply: (actions: { id: string, action: ReconciliationAction }[]) => void;
}

const SyncReconciliationModal: React.FC<SyncReconciliationModalProps> = ({
    isOpen,
    diff,
    onClose,
    onApply
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isApplying, setIsApplying] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Auto-select all on data load
    React.useEffect(() => {
        if (diff) {
            const allItems = [
                ...diff.addedLocally,
                ...diff.deletedLocally,
                ...diff.deletedRemotely,
                ...diff.remoteOnly,
            ];
            setSelectedIds(new Set(allItems.map(i => i.id)));
        }
    }, [diff]);

    if (!isOpen && !isClosing) return null;

    const allItems = [
        ...diff.addedLocally.map(item => ({ ...item, diffType: 'addedLocally' })),
        ...diff.deletedLocally.map(item => ({ ...item, diffType: 'deletedLocally' })),
        ...diff.deletedRemotely.map(item => ({ ...item, diffType: 'deletedRemotely' })),
        ...diff.remoteOnly.map(item => ({ ...item, diffType: 'remoteOnly' })),
    ];

    const toggleSelect = (id: string) => {
        if (isApplying || isClosing) return;
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (isApplying || isClosing) return;
        if (selectedIds.size === allItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allItems.map(i => i.id)));
        }
    };

    const handleAction = async (isApprove: boolean) => {
        if (isApplying || isClosing) return;

        if (!isApprove) {
            handleClose();
            return;
        }

        const actions: { id: string, action: ReconciliationAction }[] = [];
        allItems.forEach(item => {
            if (!selectedIds.has(item.id)) return;
            if (item.diffType === 'addedLocally') actions.push({ id: item.id, action: 'keep_local' });
            else if (item.diffType === 'deletedLocally') actions.push({ id: item.id, action: 'confirm_delete' });
            else if (item.diffType === 'deletedRemotely') actions.push({ id: item.id, action: 'discard_local' });
            else if (item.diffType === 'remoteOnly') actions.push({ id: item.id, action: 'restore_cloud' });
        });

        if (actions.length > 0) {
            setIsApplying(true);
            await new Promise(r => setTimeout(r, 600));

            setIsClosing(true);
            setTimeout(() => {
                onApply(actions);
                setIsApplying(false);
                setIsClosing(false);
            }, 300);
        } else {
            // If nothing selected but approved, just close
            handleClose();
        }
    };

    const handleClose = () => {
        if (isApplying) return;
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    const getDiffBadge = (type: string) => {
        switch (type) {
            case 'addedLocally': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">New Local</span>;
            case 'deletedLocally': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">Deleted Local</span>;
            case 'deletedRemotely': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Deleted Cloud</span>;
            case 'remoteOnly': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Cloud Only</span>;
            default: return null;
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isClosing ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <div className={`absolute inset-0 bg-stone-900/60 backdrop-blur-md transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />

            <div className={`relative w-full max-w-2xl bg-brand-base-light dark:bg-brand-base-dark rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-stone-200 dark:border-stone-800 transition-all duration-300 ${isClosing ? 'scale-95' : 'scale-100 animate-in zoom-in-95'}`}>
                {/* Header */}
                <div className="p-6 border-b border-stone-100 dark:border-stone-800/50 bg-white/50 dark:bg-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-stone-900 dark:text-white">Sync Reconciliation</h3>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Found data differences between your device and the cloud.</p>
                        </div>
                        {!isApplying && (
                            <button onClick={handleClose} className="size-8 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center text-stone-400 transition-colors">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        )}
                    </div>

                    {/* Warning Message */}
                    <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl items-start">
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 text-lg">warning</span>
                        <p className="text-xs leading-5 text-amber-800 dark:text-amber-400 font-medium">
                            Please be careful during sync operations as data will be overwritten or deleted based on your selection.
                        </p>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <button onClick={toggleSelectAll} disabled={isApplying} className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors disabled:opacity-30">
                            {selectedIds.size === allItems.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{selectedIds.size} selected</span>
                    </div>

                    {allItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => toggleSelect(item.id)}
                            className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${isApplying ? 'opacity-50 cursor-default' : 'cursor-pointer'
                                } ${selectedIds.has(item.id)
                                    ? 'bg-primary-50/50 border-primary-200 dark:bg-primary-900/10 dark:border-primary-800'
                                    : 'bg-white dark:bg-stone-900/50 border-stone-100 dark:border-stone-800 hover:border-stone-200 dark:hover:border-stone-700'
                                }`}
                        >
                            <div className={`size-5 rounded flex items-center justify-center border transition-all ${selectedIds.has(item.id)
                                ? 'bg-primary-600 border-primary-600 text-white'
                                : 'bg-transparent border-stone-300 dark:border-stone-600'
                                }`}>
                                {selectedIds.has(item.id) && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-stone-900 dark:text-white text-sm truncate">{item.title || 'Untitled'}</h4>
                                    {getDiffBadge(item.diffType)}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                                    <span>{new Date(item.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{item.amount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className={`flex items-center gap-2 ${item.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'} font-bold`}>
                                {item.type === 'expense' ? '-' : '+'}{item.amount.toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 bg-stone-50 dark:bg-stone-900/50 border-t border-stone-100 dark:border-stone-800/50 flex gap-4">
                    <button
                        onClick={() => handleAction(false)}
                        disabled={isApplying}
                        className="flex-1 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-2xl font-bold text-xs hover:bg-stone-50 dark:hover:bg-stone-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        Stay Offline / Cancel
                    </button>
                    <button
                        onClick={() => handleAction(true)}
                        disabled={isApplying}
                        className="flex-1 py-3 bg-primary-600 text-white shadow-lg shadow-primary-500/20 rounded-2xl font-bold text-xs hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                        {isApplying ? (
                            <>
                                <span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Applying...
                            </>
                        ) : 'Approve & Sync'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SyncReconciliationModal;
