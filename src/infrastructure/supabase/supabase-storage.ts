import { Preferences } from '@capacitor/preferences';

/**
 * Custom storage adapter for Supabase Auth using Capacitor Preferences.
 * This provides durable storage on native mobile platforms where localStorage
 * might be unreliable or cleared.
 */
export const CapacitorStorage = {
    getItem: async (key: string): Promise<string | null> => {
        const { value } = await Preferences.get({ key });
        return value;
    },
    setItem: async (key: string, value: string): Promise<void> => {
        await Preferences.set({ key, value });
    },
    removeItem: async (key: string): Promise<void> => {
        await Preferences.remove({ key });
    },
};
