export interface SyncConflict {
    id: string;
    localVersion: any;
    remoteVersion: any;
    type: 'transaction' | 'category';
}

export interface RemoteSyncPort {
    pushChanges(userId: string): Promise<boolean>;
    pullChanges(userId: string): Promise<boolean>;
    getSyncDiff(userId: string): Promise<SyncConflict[] | null>;
    applyReconciliation(userId: string, actions: { id: string; action: string }[]): Promise<boolean>;
    isEnabled(): boolean;
    setEnabled(enabled: boolean): void;
    getLastBackupTime(): string | null;
    resetSyncState(): void;
}
