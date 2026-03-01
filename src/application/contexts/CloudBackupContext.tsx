import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { CloudBackupService, BackupStatus, errorMask } from '../../infrastructure/supabase/supabase-sync';
import { LocalRepository } from '../../infrastructure/local/local-repository';
import { Capacitor } from '@capacitor/core';
import SyncReconciliationModal, { SyncDiff, ReconciliationAction } from '../../shared/ui/SyncReconciliationModal';
import { toast } from 'react-hot-toast';

interface CloudBackupContextType {
    isCloudEnabled: boolean;
    backupStatus: BackupStatus;
    statusMessage: string;
    lastBackupTime: string | null;
    toggleCloudBackup: () => void;
    triggerBackup: () => void;
    retryBackup: () => void;
    pullUpdates: () => void;
    onDataPulled?: () => void;
}

const CloudBackupContext = createContext<CloudBackupContextType | undefined>(undefined);

interface CloudBackupProviderProps {
    children: ReactNode;
    onDataPulled?: () => void;
}

export const CloudBackupProvider: React.FC<CloudBackupProviderProps> = ({ children, onDataPulled }) => {
    const { user, loading: authLoading } = useAuth();
    const [isCloudEnabled, setIsCloudEnabled] = useState(() => CloudBackupService.isEnabled());
    const [backupStatus, setBackupStatus] = useState<BackupStatus>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => CloudBackupService.getLastBackupTime());
    const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasCheckedNewDevice = useRef(false);

    // Reconciliation state
    const [isReconciling, setIsReconciling] = useState(false);
    const [syncDiff, setSyncDiff] = useState<SyncDiff | null>(null);

    // Subscribe to status changes from the backup service
    useEffect(() => {
        const unsubscribe = CloudBackupService.onStatusChange((status, message) => {
            setBackupStatus(status);
            setStatusMessage(message || '');

            if (status === 'success') {
                setLastBackupTime(CloudBackupService.getLastBackupTime());

                // Auto-reset to idle after 5 seconds
                if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
                successTimeoutRef.current = setTimeout(() => {
                    setBackupStatus('idle');
                    setStatusMessage('');
                }, 5000);
            }
        });

        return () => {
            unsubscribe();
            if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        };
    }, []);

    // Reset cloud status when user logs out (synchronize with auth state)
    useEffect(() => {
        if (authLoading) return;

        // If auth is loaded and there's no user, cloud MUST be disabled
        if (!user && isCloudEnabled) {
            console.log('[CloudBackup] No user session found, disabling cloud backup state');
            setIsCloudEnabled(false);
            CloudBackupService.setEnabled(false);
            setBackupStatus('idle');
            setStatusMessage('');
        }
    }, [user, authLoading, isCloudEnabled]);

    // Cross-device sync check disabled — manual sync only
    /*
    useEffect(() => {
        if (!user || !isCloudEnabled || hasCheckedNewDevice.current) return;
        hasCheckedNewDevice.current = true;

        if (CloudBackupService.isLocalEmpty()) {
            // New device detected — pull all data from remote
            CloudBackupService.pullFromRemote(user.id).then((success) => {
                if (success && onDataPulled) {
                    onDataPulled();
                }
            });
        }
    }, [user, isCloudEnabled, onDataPulled]);
    */

    const performSync = useCallback((userId: string) => {
        // Force-clear any stale sync guard from previous failed operations
        CloudBackupService.resetSyncState();

        // Check if this is a new device (no local transactions)
        if (CloudBackupService.isLocalEmpty()) {
            // Pull remote data first, then refresh UI
            CloudBackupService.pullFromRemote(userId).then((success) => {
                if (success && onDataPulled) {
                    onDataPulled();
                }
            });
        } else {
            // Existing device — push local data to cloud
            CloudBackupService.startBackup(userId);
        }
    }, [onDataPulled]);

    // When cloud is toggled ON and user is authenticated, check for diffs or start immediate backup
    const toggleCloudBackup = useCallback(async () => {
        const newValue = !isCloudEnabled;

        if (newValue) {
            if (!user) {
                toast.error('Please sign in to enable cloud backup', {
                    style: { borderRadius: '12px', background: '#1c1917', color: '#fff' }
                });
                return;
            }

            try {
                // Web Only: reconciliation flow
                if (!Capacitor.isNativePlatform() && !CloudBackupService.isLocalEmpty()) {
                    setBackupStatus('syncing');
                    setStatusMessage('Checking sync status...');

                    const diffPromise = CloudBackupService.getSyncDiff(user.id);
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Sync diff timeout')), 10000));

                    const diff = await Promise.race([diffPromise, timeoutPromise]) as any;

                    const hasDiff = diff && (
                        diff.addedLocally.length > 0 ||
                        diff.deletedLocally.length > 0 ||
                        diff.deletedRemotely.length > 0 ||
                        diff.remoteOnly.length > 0 ||
                        diff.modifiedLocally.length > 0
                    );

                    if (hasDiff) {
                        setSyncDiff(diff);
                        setIsReconciling(true);
                        setBackupStatus('idle');
                        return;
                    }

                    // Reset if no diffs were found (so the spinner doesn't run forever)
                    setBackupStatus('idle');
                    setStatusMessage('');
                }

                setIsCloudEnabled(true);
                CloudBackupService.setEnabled(true);
                // If local is empty, pull regardless of platform.
                if (CloudBackupService.isLocalEmpty()) {
                    performSync(user.id);
                }
            } catch (error: any) {
                console.error('[CloudBackup] Toggle error:', error);
                setBackupStatus('error');
                setStatusMessage(errorMask(error));
            }
        } else {
            setIsCloudEnabled(false);
            CloudBackupService.setEnabled(false);
            CloudBackupService.resetSyncState();
            setBackupStatus('idle');
            setStatusMessage('');
        }
    }, [isCloudEnabled, user, performSync]);

    const handleApplyReconciliation = async (actions: { id: string, action: ReconciliationAction }[]) => {
        if (!user) return;
        setIsReconciling(false);

        // Mark deselected items as is_synced: true so startBackup won't push them
        if (syncDiff) {
            const selectedIds = new Set(actions.map(a => a.id));

            // Collect all unselected upload-type items that need skipping
            const itemsToSkip: any[] = [];

            // Deselected addedLocally: user chose NOT to push
            syncDiff.addedLocally
                .filter(item => !selectedIds.has(item.id))
                .forEach(item => itemsToSkip.push(item));

            // Deselected modifiedLocally: user chose NOT to push changes
            syncDiff.modifiedLocally
                .filter(pair => !selectedIds.has(pair.local.id))
                .forEach(pair => itemsToSkip.push(pair.local));

            // Deselected deletedLocally: user chose NOT to confirm delete
            syncDiff.deletedLocally
                .filter(item => !selectedIds.has(item.id))
                .forEach(item => {
                    const raw = LocalRepository.getRawExpenses()[item.id];
                    if (raw) itemsToSkip.push(raw);
                });

            // Bulk mark all skipped items as synced (won't be picked up by startBackup)
            if (itemsToSkip.length > 0) {
                LocalRepository.bulkUpsert(itemsToSkip, 'expense', true);
            }
        }

        const success = await CloudBackupService.applyReconciliation(user.id, actions);
        if (success) {
            if (onDataPulled) onDataPulled();
            setIsCloudEnabled(true);
            CloudBackupService.setEnabled(true);
            performSync(user.id);
        }
    };

    const triggerBackup = useCallback(() => {
        if (!isCloudEnabled || !user) return;
        CloudBackupService.startBackup(user.id);
    }, [isCloudEnabled, user]);

    const retryBackup = useCallback(() => {
        if (!user) return;
        CloudBackupService.startBackup(user.id);
    }, [user]);

    const pullUpdates = useCallback(async () => {
        if (!user || !isCloudEnabled) return;

        // Force-clear any stale sync guard from previous failed operations
        CloudBackupService.resetSyncState();

        // Visual feedback immediately
        setBackupStatus('syncing');
        setStatusMessage('Checking for updates...');

        try {
            // Apply reconciliation flow for "Sync Now" across ALL platforms
            // Add a timeout to diff check to prevent indefinite loading
            const diffPromise = CloudBackupService.getSyncDiff(user.id);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 15000));

            const diff = await Promise.race([diffPromise, timeoutPromise]) as any;
            const hasDiff = diff && (
                diff.addedLocally.length > 0 ||
                diff.deletedLocally.length > 0 ||
                diff.deletedRemotely.length > 0 ||
                diff.remoteOnly.length > 0 ||
                diff.modifiedLocally.length > 0
            );

            if (hasDiff) {
                setSyncDiff(diff);
                setIsReconciling(true);
                setBackupStatus('idle');
                return;
            }

            // No diffs found — data is already in sync
            // Just push any pending local changes (non-destructive, no replaceAll)
            const success = await CloudBackupService.startBackup(user.id);
            if (onDataPulled) onDataPulled();
        } catch (error: any) {
            console.error('[CloudBackup] Sync Now failed:', error);
            setBackupStatus('error');
            setStatusMessage(errorMask(error));
        }
    }, [user, isCloudEnabled, onDataPulled]);

    return (
        <CloudBackupContext.Provider value={{
            isCloudEnabled,
            backupStatus,
            statusMessage,
            lastBackupTime,
            toggleCloudBackup,
            triggerBackup,
            retryBackup,
            pullUpdates,
        }}>
            {children}
            {syncDiff && (
                <SyncReconciliationModal
                    isOpen={isReconciling}
                    diff={syncDiff}
                    onClose={() => setIsReconciling(false)}
                    onApply={handleApplyReconciliation}
                />
            )}
        </CloudBackupContext.Provider>
    );
};

export const useCloudBackup = (): CloudBackupContextType => {
    const context = useContext(CloudBackupContext);
    if (context === undefined) {
        throw new Error('useCloudBackup must be used within a CloudBackupProvider');
    }
    return context;
};
