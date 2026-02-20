import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { CloudBackupService, BackupStatus } from '../services/cloudBackupService';

interface CloudBackupContextType {
    isCloudEnabled: boolean;
    backupStatus: BackupStatus;
    statusMessage: string;
    lastBackupTime: string | null;
    toggleCloudBackup: () => void;
    triggerBackup: () => void;
    retryBackup: () => void;
    onDataPulled?: () => void;
}

const CloudBackupContext = createContext<CloudBackupContextType | undefined>(undefined);

interface CloudBackupProviderProps {
    children: ReactNode;
    onDataPulled?: () => void;
}

export const CloudBackupProvider: React.FC<CloudBackupProviderProps> = ({ children, onDataPulled }) => {
    const { user } = useAuth();
    const [isCloudEnabled, setIsCloudEnabled] = useState(() => CloudBackupService.isEnabled());
    const [backupStatus, setBackupStatus] = useState<BackupStatus>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => CloudBackupService.getLastBackupTime());
    const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasCheckedNewDevice = useRef(false);

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

    // When cloud is toggled ON and user is authenticated, start immediate backup
    const toggleCloudBackup = useCallback(() => {
        const newValue = !isCloudEnabled;
        setIsCloudEnabled(newValue);
        CloudBackupService.setEnabled(newValue);

        if (newValue && user) {
            // "System event" — toggling on triggers the backup
            CloudBackupService.startBackup(user.id);
        } else if (!newValue) {
            setBackupStatus('idle');
            setStatusMessage('');
        }
    }, [isCloudEnabled, user]);

    const triggerBackup = useCallback(() => {
        if (!isCloudEnabled || !user) return;
        CloudBackupService.startBackup(user.id);
    }, [isCloudEnabled, user]);

    const retryBackup = useCallback(() => {
        if (!user) return;
        CloudBackupService.startBackup(user.id);
    }, [user]);

    return (
        <CloudBackupContext.Provider value={{
            isCloudEnabled,
            backupStatus,
            statusMessage,
            lastBackupTime,
            toggleCloudBackup,
            triggerBackup,
            retryBackup,
            onDataPulled,
        }}>
            {children}
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
