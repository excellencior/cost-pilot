import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

// The background script that runs periodically on Android via Capacitor Background Runner

addEventListener('backupSync', async (resolve, reject) => {
    try {
        console.log('[BackgroundRunner] Waking up to check backup schedule...');

        // 1. Read Settings to check if auto-backup is enabled
        const settingsRes = await Preferences.get({ key: 'costpilot_settings' });
        if (!settingsRes.value) {
            console.log('[BackgroundRunner] No settings found. Aborting.');
            return resolve();
        }

        const settings = JSON.parse(settingsRes.value);
        if (!settings.autoBackupEnabled) {
            console.log('[BackgroundRunner] Auto-backup is disabled in settings. Aborting.');
            return resolve();
        }

        const backupTime = settings.backupTime || '02:00';
        const lastBackupDate = settings.lastBackupDate;

        // 2. Check Time
        const now = new Date();
        const currentHHMM = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const todayStr = now.toISOString().split('T')[0];

        const lastBackupDateObj = lastBackupDate ? new Date(lastBackupDate) : null;
        const lastBackupDateStr = lastBackupDateObj ? lastBackupDateObj.toISOString().split('T')[0] : null;

        // 3. Logic: If current time is >= backupTime, and we haven't backed up today, DO IT.
        if (currentHHMM >= backupTime && todayStr !== lastBackupDateStr) {
            console.log(`[BackgroundRunner] Time condition met. Executing background backup for ${todayStr}...`);
            await performBackgroundBackup(settings, now.toISOString());
            console.log('[BackgroundRunner] Background backup completed successfully.');
        } else {
            console.log('[BackgroundRunner] Conditions not met (too early or already backed up today).');
        }

        resolve();
    } catch (err) {
        console.error('[BackgroundRunner] Failed to run backup task:', err);
        reject();
    }
});


async function performBackgroundBackup(settings, timestamp) {
    // A. Gather Data from Preferences (which wraps SharedPreferences/UserDefaults identical to localStorage in the main app context)
    const expensesRes = await Preferences.get({ key: 'costpilot_expenses' });
    const categoriesRes = await Preferences.get({ key: 'costpilot_categories' });

    const payload = {
        version: 1,
        timestamp: timestamp,
        settings: settings,
        categories: categoriesRes.value ? JSON.parse(categoriesRes.value) : [],
        transactions: expensesRes.value ? JSON.parse(expensesRes.value) : []
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const dateStr = timestamp.split('T')[0];
    const fileName = `costpilot_backup_${dateStr}.json`;

    // B. Write File (using standard Capacitor Filesystem API which is available in runner)
    await Filesystem.writeFile({
        path: fileName,
        data: jsonString,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
    });

    // C. Update Last Backup Date in Settings
    settings.lastBackupDate = timestamp;
    await Preferences.set({
        key: 'costpilot_settings',
        value: JSON.stringify(settings)
    });

    // D. Prune Old Backups (30 days)
    const cutoff = new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000));
    const result = await Filesystem.readdir({
        path: '',
        directory: Directory.Documents
    });

    for (const file of result.files) {
        if (file.name.startsWith('costpilot_backup_') && file.name.endsWith('.json')) {
            const fileDateStr = file.name.replace('costpilot_backup_', '').replace('.json', '');
            const fileDate = new Date(fileDateStr);
            if (fileDate < cutoff) {
                await Filesystem.deleteFile({
                    path: file.name,
                    directory: Directory.Documents
                });
            }
        }
    }
}
