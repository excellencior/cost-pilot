import { supabase } from './client';
import { Device } from '@capacitor/device';

export const AgreementService = {
    /**
     * Checks if the current device has already agreed to the policies.
     * This queries the `device_agreements` table anonymously using the device UUID.
     */
    checkDeviceAgreement: async (): Promise<boolean> => {
        if (!supabase) return false;
        try {
            const info = await Device.getId();
            const deviceId = info.identifier;

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
            const info = await Device.getId();
            const deviceId = info.identifier;

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
