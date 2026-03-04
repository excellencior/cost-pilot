import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Using local storage fallback.');
}

import { CapacitorStorage } from './supabase-storage';
import { Capacitor } from '@capacitor/core';

// On Native (iOS/Android), localStorage can be wiped by the OS, so we use Capacitor Preferences.
// On Web, Preferences uses IndexedDB, but users clear localStorage for testing, leading to deadlocks.
// So on Web, we stick to standard localStorage to keep the app state completely synchronized.
const storageAdapter = Capacitor.isNativePlatform() ? CapacitorStorage : window.localStorage;

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: storageAdapter,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    })
    : null;
