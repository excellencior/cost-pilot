import { supabase } from './client';

export interface Profile {
    id: string;
    currency?: string;
    theme?: string;
    deletion_scheduled_at?: string | null;
    updated_at: string;
}

export const ProfileService = {
    /**
     * Fetch the user's profile, including deletion status.
     * If the profile doesn't exist (e.g. wiped during DB rebuild), it automatically creates one.
     */
    getProfile: async (userId: string): Promise<Profile | null> => {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            // PGRST116 means zero rows returned from a single() call
            if (error && error.code === 'PGRST116') {
                console.log('[ProfileService] Profile missing for existing user, creating now...');
                const { data: newProfile, error: upsertError } = await supabase
                    .from('profiles')
                    .upsert({ id: userId, updated_at: new Date().toISOString() })
                    .select('*')
                    .single();

                if (upsertError) throw upsertError;
                return newProfile as Profile;
            } else if (error) {
                throw error;
            }

            return data as Profile;
        } catch (error) {
            console.error('[ProfileService] Error fetching profile:', error);
            return null;
        }
    },

    /**
     * Schedule account deletion (sets deletion_scheduled_at to now).
     */
    scheduleDeletion: async (userId: string): Promise<boolean> => {
        if (!supabase) return false;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    deletion_scheduled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[ProfileService] Error scheduling deletion:', error);
            return false;
        }
    },

    /**
     * Cancel a scheduled deletion (sets deletion_scheduled_at to null).
     */
    cancelDeletion: async (userId: string): Promise<boolean> => {
        if (!supabase) return false;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    deletion_scheduled_at: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[ProfileService] Error cancelling deletion:', error);
            return false;
        }
    }
};
