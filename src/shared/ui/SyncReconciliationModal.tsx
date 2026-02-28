import React, { useState, useMemo } from 'react';

export interface SyncDiff {
    addedLocally: any[];
    deletedLocally: any[];
    deletedRemotely: any[];
    modifiedLocally: { local: any; remote: any }[];
    remoteOnly: any[];
}

export type ReconciliationAction = 'keep_local' | 'restore_cloud' | 'confirm_delete' | 'discard_local';

interface SyncItem {
    id: string;
    title?: string;
    amount?: number;
    type?: string;
    date?: string;
    syncDirection: 'upload' | 'download';
    diffType: string;
    isDelete?: boolean;
}

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

    const { uploadItems, downloadItems, allItems } = useMemo(() => {
        const upload: SyncItem[] = [
            ...diff.addedLocally.map(item => ({
                id: item.id, title: item.title, amount: item.amount,
                type: item.type, date: item.date,
                syncDirection: 'upload' as const, diffType: 'addedLocally',
            })),
            ...diff.modifiedLocally.map(pair => ({
                id: pair.local.id, title: pair.local.title, amount: pair.local.amount,
                type: pair.local.type, date: pair.local.date,
                syncDirection: 'upload' as const, diffType: 'modifiedLocally',
            })),
            ...diff.deletedLocally.map(item => ({
                id: item.id, title: item.title, amount: item.amount,
                type: item.type, date: item.date,
                syncDirection: 'upload' as const, diffType: 'deletedLocally', isDelete: true,
            })),
        ];
        const download: SyncItem[] = [
            ...diff.remoteOnly.map(item => ({
                id: item.id, title: item.title, amount: item.amount,
                type: item.type, date: item.date,
                syncDirection: 'download' as const, diffType: 'remoteOnly',
            })),
            ...diff.deletedRemotely.map(item => ({
                id: item.id, title: item.title, amount: item.amount,
                type: item.type, date: item.date,
                syncDirection: 'download' as const, diffType: 'deletedRemotely', isDelete: true,
            })),
        ];
        return { uploadItems: upload, downloadItems: download, allItems: [...upload, ...download] };
    }, [diff]);

    // Auto-select all on diff change
    React.useEffect(() => {
        if (diff) {
            const ids = [
                ...diff.addedLocally.map(i => i.id),
                ...diff.modifiedLocally.map(p => p.local.id),
                ...diff.deletedLocally.map(i => i.id),
                ...diff.remoteOnly.map(i => i.id),
                ...diff.deletedRemotely.map(i => i.id),
            ];
            setSelectedIds(new Set(ids));
        }
    }, [diff]);

    if (!isOpen && !isClosing) return null;

    const toggleSelect = (id: string) => {
        if (isApplying || isClosing) return;
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSection = (items: SyncItem[]) => {
        if (isApplying || isClosing) return;
        const sectionIds = items.map(i => i.id);
        const allSelected = sectionIds.every(id => selectedIds.has(id));
        const next = new Set(selectedIds);
        if (allSelected) {
            sectionIds.forEach(id => next.delete(id));
        } else {
            sectionIds.forEach(id => next.add(id));
        }
        setSelectedIds(next);
    };

    const selectedCount = allItems.filter(i => selectedIds.has(i.id)).length;

    const handleSync = async () => {
        if (isApplying || isClosing) return;

        const actions: { id: string, action: ReconciliationAction }[] = [];
        allItems.forEach(item => {
            if (!selectedIds.has(item.id)) return;
            switch (item.diffType) {
                case 'addedLocally': actions.push({ id: item.id, action: 'keep_local' }); break;
                case 'modifiedLocally': actions.push({ id: item.id, action: 'keep_local' }); break;
                case 'deletedLocally': actions.push({ id: item.id, action: 'confirm_delete' }); break;
                case 'remoteOnly': actions.push({ id: item.id, action: 'restore_cloud' }); break;
                case 'deletedRemotely': actions.push({ id: item.id, action: 'discard_local' }); break;
            }
        });

        if (actions.length > 0) {
            setIsApplying(true);
            await new Promise(r => setTimeout(r, 500));
            setIsClosing(true);
            setTimeout(() => {
                onApply(actions);
                setIsApplying(false);
                setIsClosing(false);
            }, 300);
        } else {
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

    const getBadge = (item: SyncItem) => {
        if (item.isDelete) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                    <span className="material-symbols-outlined text-[10px]">delete</span>
                    Remove
                </span>
            );
        }
        if (item.diffType === 'modifiedLocally') {
            return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Modified</span>;
        }
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">New</span>;
    };

    const renderItem = (item: SyncItem) => (
        <div
            key={item.id}
            onClick={() => toggleSelect(item.id)}
            className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${isApplying ? 'opacity-50 cursor-default' : 'cursor-pointer'
                } ${selectedIds.has(item.id)
                    ? 'bg-primary-50/50 border-primary-200 dark:bg-primary-900/10 dark:border-primary-800'
                    : 'bg-white dark:bg-stone-900/50 border-stone-100 dark:border-stone-800 hover:border-stone-200 dark:hover:border-stone-700'
                } ${item.isDelete ? 'opacity-75' : ''}`}
        >
            <div className={`size-5 rounded flex items-center justify-center border shrink-0 transition-all ${selectedIds.has(item.id)
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'bg-transparent border-stone-300 dark:border-stone-600'
                }`}>
                {selectedIds.has(item.id) && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={`font-bold text-stone-900 dark:text-white text-sm truncate ${item.isDelete ? 'line-through opacity-60' : ''}`}>
                        {item.title || 'Untitled'}
                    </h4>
                    {getBadge(item)}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                    {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
                    {item.date && item.amount != null && <span>•</span>}
                    {item.amount != null && <span>{item.amount.toLocaleString()}</span>}
                </div>
            </div>

            <div className={`text-sm font-bold shrink-0 ${item.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
                {item.type === 'expense' ? '-' : '+'}{item.amount?.toLocaleString() || '0'}
            </div>
        </div>
    );

    const renderSectionHeader = (
        icon: string,
        label: string,
        description: string,
        items: SyncItem[],
        color: string
    ) => {
        if (items.length === 0) return null;
        const sectionSelected = items.filter(i => selectedIds.has(i.id)).length;
        const allSelected = sectionSelected === items.length;

        return (
            <div className="mb-2">
                <div className="flex items-center justify-between px-1 mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`size-7 rounded-lg flex items-center justify-center ${color}`}>
                            <span className="material-symbols-outlined text-base">{icon}</span>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-stone-900 dark:text-white">{label}</h4>
                            <p className="text-[10px] text-stone-400">{description}</p>
                        </div>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleSection(items); }}
                        disabled={isApplying}
                        className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors disabled:opacity-30"
                    >
                        {allSelected ? 'Deselect' : 'Select All'} ({sectionSelected}/{items.length})
                    </button>
                </div>
                <div className="space-y-2">
                    {items.map(renderItem)}
                </div>
            </div>
        );
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isClosing ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <div className={`absolute inset-0 bg-stone-900/60 backdrop-blur-md transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />

            <div className={`relative w-full max-w-2xl bg-brand-base-light dark:bg-brand-base-dark rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-stone-200 dark:border-stone-800 transition-all duration-300 ${isClosing ? 'scale-95' : 'scale-100 animate-in zoom-in-95'}`}>
                {/* Header */}
                <div className="p-5 border-b border-stone-100 dark:border-stone-800/50 bg-white/50 dark:bg-white/5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-lg font-bold text-stone-900 dark:text-white">Sync Differences</h3>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                {allItems.length} item{allItems.length !== 1 ? 's' : ''} differ between your device and the cloud.
                            </p>
                        </div>
                        {!isApplying && (
                            <button onClick={handleClose} className="size-8 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center text-stone-400 transition-colors">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3 p-3 bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 rounded-xl items-start">
                        <span className="material-symbols-outlined text-stone-400 text-base mt-0.5">info</span>
                        <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400 font-medium">
                            Select the items you want to sync. Unselected items will be skipped and shown again on the next sync.
                        </p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {renderSectionHeader(
                        'cloud_upload',
                        'Upload',
                        'Send to cloud',
                        uploadItems,
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    )}

                    {uploadItems.length > 0 && downloadItems.length > 0 && (
                        <div className="border-t border-stone-100 dark:border-stone-800" />
                    )}

                    {renderSectionHeader(
                        'cloud_download',
                        'Download',
                        'Get from cloud',
                        downloadItems,
                        'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 bg-stone-50 dark:bg-stone-900/50 border-t border-stone-100 dark:border-stone-800/50 flex gap-3">
                    <button
                        onClick={handleClose}
                        disabled={isApplying}
                        className="flex-1 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-2xl font-bold text-xs hover:bg-stone-50 dark:hover:bg-stone-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={isApplying || selectedCount === 0}
                        className="flex-[1.5] py-3 bg-primary-600 text-white shadow-lg shadow-primary-500/20 rounded-2xl font-bold text-xs hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                        {isApplying ? (
                            <>
                                <span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Syncing...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm">sync</span>
                                Sync Selected ({selectedCount})
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SyncReconciliationModal;
