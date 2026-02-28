import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { CloudBackupService, BackupStatus } from '../../infrastructure/supabase/supabase-sync';
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
    const isInitialAuthCheck = useRef(true);

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

    // Reset cloud status when user logs out (but only AFTER auth has finished loading and initial check)
    useEffect(() => {
        if (authLoading) return;

        // After auth is no longer loading for the first time, we consider it initialized
        if (isInitialAuthCheck.current) {
            isInitialAuthCheck.current = false;
            return;
        }

        if (!user && isCloudEnabled) {
            console.log('[CloudBackup] User logged out, disabling cloud backup toggle');
            setIsCloudEnabled(false);
            CloudBackupService.setEnabled(false);
            setBackupStatus('idle');
            setStatusMessage('');
        }
    }, [user, authLoading, isCloudEnabled]);

    // Cross-device sync: detect new device (empty local DB) on login
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

    const performSync = useCallback((userId: string) => {
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
                        diff.remoteOnly.length > 0
                    );

                    // If the only differences are modifiedLocally, skip reconciliation — just push
                    const onlyModified = diff && !hasDiff && diff.modifiedLocally.length > 0;

                    if (hasDiff) {
                        setSyncDiff(diff);
                        setIsReconciling(true);
                        setBackupStatus('idle');
                        return;
                    }

                    if (onlyModified) {
                        // fall through
                    }
                }

                setIsCloudEnabled(true);
                CloudBackupService.setEnabled(true);
                performSync(user.id);
            } catch (error) {
                console.error('[CloudBackup] Toggle error:', error);
                setBackupStatus('error');
                setStatusMessage('Failed to enable sync');
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

        const success = await CloudBackupService.applyReconciliation(user.id, actions);
        if (success) {
            // Refresh UI state first to show any restored/modified items
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

        // Visual feedback immediately
        setBackupStatus('syncing');
        setStatusMessage('Checking for updates...');

        try {
            // Web Only: reconciliation flow for "Sync Now"
            if (!Capacitor.isNativePlatform()) {
                // Add a timeout to diff check to prevent indefinite loading
                const diffPromise = CloudBackupService.getSyncDiff(user.id);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 15000));

                const diff = await Promise.race([diffPromise, timeoutPromise]) as any;
                const hasDiff = diff && (
                    diff.addedLocally.length > 0 ||
                    diff.deletedLocally.length > 0 ||
                    diff.deletedRemotely.length > 0 ||
                    diff.remoteOnly.length > 0
                );

                // If the only differences are modifiedLocally, skip reconciliation — just push
                const onlyModified = diff && !hasDiff && diff.modifiedLocally.length > 0;

                if (hasDiff) {
                    setSyncDiff(diff);
                    setIsReconciling(true);
                    setBackupStatus('idle');
                    return;
                }

                // Modified-only: no user input needed, just push directly
                if (onlyModified) {
                    await CloudBackupService.startBackup(user.id);
                    if (onDataPulled) onDataPulled();
                    return;
                }
            }

            const success = await CloudBackupService.pullFromRemote(user.id);
            if (success) {
                if (onDataPulled) onDataPulled();
                setBackupStatus('success');
                setStatusMessage('Data is up to date');
            } else {
                // Status is handled inside pullFromRemote service
            }
        } catch (error: any) {
            console.error('[CloudBackup] Sync Now failed:', error);
            setBackupStatus('error');
            setStatusMessage(error.message === 'Sync timeout' ? 'Sync timed out' : 'An unexpected error occurred');
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
