import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { localBackupService } from '../../infrastructure/local/local-backup';
import { LocalRepository } from '../../infrastructure/local/local-repository';
import { toast } from 'react-hot-toast';
import { App as CapacitorApp } from '@capacitor/app';

interface LocalBackupContextType {
    isEnabled: boolean;
    backupTime: string;
    lastBackupDate: string | null;
    backupStatus: 'idle' | 'syncing' | 'success' | 'error';
    statusMessage: string | null;
    hasDirectoryAccess: boolean;

    enableBackup: () => void;
    disableBackup: () => void;
    setBackupTime: (time: string) => void;
    performManualBackup: () => Promise<void>;
    restoreFromBackup: (file: File) => Promise<void>;
    requestDirectoryAccess: () => Promise<boolean>;
    getDirectoryName: () => string | null;
    getMostRecentBackup: () => Promise<File | null>;
    parseBackupFile: (file: File) => Promise<any>;
}

const LocalBackupContext = createContext<LocalBackupContextType | undefined>(undefined);

export const LocalBackupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [backupTime, setBackupTimeState] = useState('02:00'); // Default 2 AM
    const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
    const [backupStatus, setBackupStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [hasDirectoryAccess, setHasDirectoryAccess] = useState(false);

    // Load initial settings
    useEffect(() => {
        const settings = LocalRepository.getSettings();
        setIsEnabled(settings.autoBackupEnabled || false);
        setBackupTimeState(settings.backupTime || '02:00');
        setLastBackupDate(settings.lastBackupDate || null);

        // Check if we already have access to a directory (on web)
        localBackupService.hasAccess().then(hasAccess => {
            setHasDirectoryAccess(hasAccess);
        });
    }, []);

    const enableBackup = () => {
        setIsEnabled(true);
        LocalRepository.updateSettings({ autoBackupEnabled: true });
        toast.success('Auto backup enabled');
    };

    const disableBackup = () => {
        setIsEnabled(false);
        LocalRepository.updateSettings({ autoBackupEnabled: false });
        toast.success('Auto backup disabled');
    };

    const setBackupTime = (time: string) => {
        setBackupTimeState(time);
        LocalRepository.updateSettings({ backupTime: time });
        toast.success('Backup time updated');
    };

    const requestDirectoryAccess = async () => {
        const granted = await localBackupService.requestAccess();
        setHasDirectoryAccess(granted);
        if (granted) {
            toast.success('Backup location saved');
        } else {
            toast.error('Failed to access location');
        }
        return granted;
    };

    const performManualBackup = useCallback(async () => {
        if (!await localBackupService.hasAccess()) {
            toast.error('Please select a backup location first');
            return;
        }

        // Check if a backup is actually needed
        const settings = LocalRepository.getSettings();
        const rawExpenses = localStorage.getItem('costpilot_expenses');
        const rawCategories = localStorage.getItem('costpilot_categories');
        const expenses = rawExpenses ? JSON.parse(rawExpenses) : [];
        const categories = rawCategories ? JSON.parse(rawCategories) : [];

        // If there are no settings, no categories, and no expenses, AND there is no last backup, don't run
        if (!settings && categories.length === 0 && expenses.length === 0) {
            toast.error('No data to backup.');
            return;
        }

        const currentDataHash = await localBackupService.getCurrentDataHash();
        if (settings && settings.lastBackupHash === currentDataHash) {
            toast.success('Your data is already safely backed up!', { icon: '✨' });
            return;
        }

        setBackupStatus('syncing');
        setStatusMessage('Creating backup...');

        try {
            await localBackupService.createBackup();
            const dateStr = new Date().toISOString();
            setLastBackupDate(dateStr);
            setBackupStatus('success');
            setStatusMessage('Backup successful');
            toast.success('Local backup created successfully');

            setTimeout(() => {
                setBackupStatus('idle');
                setStatusMessage(null);
            }, 3000);
        } catch (error: any) {
            console.error('Backup failed:', error);
            setBackupStatus('error');
            setStatusMessage('Backup failed');
            toast.error('Failed to create backup: ' + (error.message || 'Unknown error'));
        }
    }, []);

    const restoreFromBackup = useCallback(async (file: File) => {
        setBackupStatus('syncing');
        setStatusMessage('Restoring data...');

        try {
            await localBackupService.restoreBackup(file);
            setBackupStatus('success');
            setStatusMessage('Restore complete');
            toast.success('Data restored successfully! Refreshing...');

            setTimeout(() => {
                // Reload window to ensure all data is freshly loaded from localStorage
                window.location.reload();
            }, 1000);
        } catch (error: any) {
            console.error('Restore failed:', error);
            setBackupStatus('error');
            setStatusMessage('Restore failed');
            toast.error('Failed to restore data: ' + (error.message || 'Invalid file'));
        }
    }, []);

    // Catch-up logic: Run a backup immediately if today's backup is missing and the scheduled time has already passed
    const runCatchupIfNeeded = useCallback(async () => {
        if (!isEnabled || !hasDirectoryAccess) return;

        const now = new Date();
        const currentHHMM = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        // If current time is past the scheduled backup time
        if (currentHHMM >= backupTime) {
            const todayStr = now.toISOString().split('T')[0];
            const lastBackupDateObj = lastBackupDate ? new Date(lastBackupDate) : null;
            const lastBackupDateStr = lastBackupDateObj ? lastBackupDateObj.toISOString().split('T')[0] : null;

            if (todayStr !== lastBackupDateStr) {
                console.log('Catch-up backup triggered (scheduled time missed)');
                await performManualBackup();
            }
        }
    }, [isEnabled, hasDirectoryAccess, backupTime, lastBackupDate, performManualBackup]);

    // Scheduler Effect + App State Listener
    useEffect(() => {
        if (!isEnabled || !hasDirectoryAccess) return;

        const checkBackupSchedule = async () => {
            const now = new Date();
            const currentHHMM = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

            // exact minute match for the cron
            if (currentHHMM === backupTime) {
                // Check if we already backed up today
                const todayStr = now.toISOString().split('T')[0];
                const lastBackupDateObj = lastBackupDate ? new Date(lastBackupDate) : null;
                const lastBackupDateStr = lastBackupDateObj ? lastBackupDateObj.toISOString().split('T')[0] : null;

                if (todayStr !== lastBackupDateStr) {
                    console.log('Scheduled backup triggered at', currentHHMM);
                    await performManualBackup();
                }
            }
        };

        // 1. Check strict schedule every minute while app is open
        const intervalId = setInterval(checkBackupSchedule, 60000);

        // 2. Run catch-up immediately when component mounts (App opened)
        runCatchupIfNeeded();

        // 3. Listen for App Resume (useful on mobile when app comes back from background)
        const appStateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                runCatchupIfNeeded();
            }
        });

        return () => {
            clearInterval(intervalId);
            appStateListener.then(listener => listener.remove());
        };
    }, [isEnabled, hasDirectoryAccess, backupTime, lastBackupDate, performManualBackup, runCatchupIfNeeded]);

    const value = {
        isEnabled,
        backupTime,
        lastBackupDate,
        backupStatus,
        statusMessage,
        hasDirectoryAccess,
        enableBackup,
        disableBackup,
        setBackupTime,
        performManualBackup,
        restoreFromBackup,
        requestDirectoryAccess,
        getDirectoryName: () => localBackupService.getDirectoryName(),
        getMostRecentBackup: () => localBackupService.getMostRecentBackup(),
        parseBackupFile: (file: File) => localBackupService.parseBackupFile(file)
    };

    return (
        <LocalBackupContext.Provider value={value}>
            {children}
        </LocalBackupContext.Provider>
    );
};

export const useLocalBackup = () => {
    const context = useContext(LocalBackupContext);
    if (context === undefined) {
        throw new Error('useLocalBackup must be used within a LocalBackupProvider');
    }
    return context;
};
