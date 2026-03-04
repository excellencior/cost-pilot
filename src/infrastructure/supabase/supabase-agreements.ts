import { supabase } from './client';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

// Helper to generate a stable device ID, especially for web where localStorage clears change the Capacitor UUID
const getStableDeviceId = async (): Promise<string> => {
    const info = await Device.getId();
    let deviceId = info.identifier;

    // For web, clearing local storage clears the Capacitor UUID. 
    // We create a deterministic fingerprint to avoid duplicate agreement rows on every sign-in.
    if (Capacitor.getPlatform() === 'web') {
        try {
            const nav = window.navigator;
            const screen = window.screen;
            const rawId = `${nav.userAgent}-${screen.width}x${screen.height}-${nav.language}`;

            // Simple fast string hash
            let hash = 0;
            for (let i = 0; i < rawId.length; i++) {
                const char = rawId.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit int
            }
            deviceId = `web-fp-${Math.abs(hash).toString(16)}`;
        } catch (e) {
            // Fallback to the Capacitor generated one if something fails
            console.warn('[AgreementService] Failed to generate web fingerprint, using default.', e);
        }
    }

    return deviceId;
};

export const AgreementService = {
    /**
     * Checks if the current device has already agreed to the policies.
     * This queries the `device_agreements` table anonymously using the device UUID.
     */
    checkDeviceAgreement: async (): Promise<boolean> => {
        if (!supabase) return false;
        try {
            const deviceId = await getStableDeviceId();

            const { data, error } = await supabase
                .from('device_agreements')
                .select('device_id')
                .eq('device_id', deviceId)
                .maybeSingle();

            if (error) {
                console.error('[AgreementService] Error checking device agreement:', error);
                return false;
            }

            return !!data;
        } catch (error) {
            console.error('[AgreementService] Failed to check device agreement:', error);
            return false;
        }
    },

    /**
     * Records the agreement for the current device and user after a successful login.
     */
    recordAgreement: async (userId: string): Promise<boolean> => {
        if (!supabase) return false;
        try {
            const deviceId = await getStableDeviceId();

            const { error } = await supabase
                .from('device_agreements')
                .upsert({
                    device_id: deviceId,
                    user_id: userId,
                    agreed_at: new Date().toISOString()
                }, { onConflict: 'device_id' });

            if (error) {
                console.error('[AgreementService] Error recording agreement:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('[AgreementService] Failed to record agreement:', error);
            return false;
        }
    }
};
