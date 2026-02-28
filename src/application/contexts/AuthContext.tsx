
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../infrastructure/supabase/client';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { ProfileService } from '../../infrastructure/supabase/supabase-profile';
import { Preferences } from '@capacitor/preferences';
import { toast } from 'react-hot-toast';
import { AgreementService } from '../../infrastructure/supabase/supabase-agreements';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: () => Promise<void>;
    logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        // Check active sessions immediately on mount
        const initSession = async () => {
            try {
                setLoading(true);
                console.log('[AuthContext] Restoring session...');
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('[AuthContext] Session restoration error:', error);
                }

                if (session) {
                    console.log('[AuthContext] Session restored for user:', session.user.id);
                    setSession(session);
                    setUser(session.user);
                } else {
                    console.log('[AuthContext] No active session found');
                }
            } catch (err) {
                console.error('[AuthContext] Unexpected error during session restoration:', err);
            } finally {
                setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[AuthContext] Auth state changed: ${event}`);
            setSession(session);
            const newUser = session?.user ?? null;
            setUser(newUser);
            setLoading(false);

            // Auto-recovery and Settings Sync logic
            if (newUser && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
                // Record the device agreement for this newly signed-in device
                await AgreementService.recordAgreement(newUser.id);
                // Sync the flag to local storage to bypass LandingPage on future visits
                await Preferences.set({ key: 'hasAcceptedTerms', value: 'true' });

                const profile = await ProfileService.getProfile(newUser.id);
                if (profile) {
                    if (profile.currency) {
                        try {
                            const { LocalRepository } = await import('../../infrastructure/local/local-repository');
                            if (LocalRepository.getSettings().currency !== profile.currency) {
                                LocalRepository.updateSettings({ currency: profile.currency });
                            }
                        } catch (e) {
                            console.error('[AuthContext] Failed to sync currency on login', e);
                        }
                    }

                    if (profile.deletion_scheduled_at) {
                        const success = await ProfileService.cancelDeletion(newUser.id);
                        if (success) {
                            toast.success('Account deletion cancelled. Welcome back!', {
                                duration: 6000,
                                icon: '🎉',
                                style: {
                                    borderRadius: '12px',
                                    background: '#1c1917',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    border: '1px solid #AF8F42'
                                }
                            });
                        }
                    }
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async () => {
        try {
            if (Capacitor.isNativePlatform()) {
                // Native Capacitor Flow for Android/iOS
                const result = await FirebaseAuthentication.signInWithGoogle();
                const idToken = result.credential?.idToken;

                if (!idToken) {
                    throw new Error('No ID token received from Google Auth');
                }

                const { error } = await supabase!.auth.signInWithIdToken({
                    provider: 'google',
                    token: idToken,
                });

                if (error) throw error;
            } else {
                // Standard Web Flow
                if (!supabase) throw new Error('Supabase not configured');
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: `${window.location.origin}/auth`,
                        queryParams: {
                            access_type: 'offline',
                            prompt: 'consent',
                        },
                    },
                });
                if (error) throw error;
            }
        } catch (error: any) {
            console.error('Sign in error:', error);
            if (Capacitor.isNativePlatform()) {
                alert(`Current Error: ${error.message || JSON.stringify(error)}`);
            }
            throw error;
        }
    };

    const logOut = async () => {
        try {
            // Force reset any hanging sync state
            const { CloudBackupService } = await import('../../infrastructure/supabase/supabase-sync');
            CloudBackupService.resetSyncState();

            if (Capacitor.isNativePlatform()) {
                await FirebaseAuthentication.signOut().catch(e => console.error('Firebase signOut error:', e));
            }
            if (supabase) {
                // We use a shorter timeout or just don't await indefinitely for signOut
                // to ensure the UI updates and prevents the "stuck" feeling
                try {
                    await Promise.race([
                        supabase.auth.signOut(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timeout')), 3000))
                    ]);
                } catch (e) {
                    console.error('Supabase global signOut error/timeout:', e);
                    // Force local cleanup if the network request hangs or fails
                    await supabase.auth.signOut({ scope: 'local' }).catch(console.error);
                }
            }
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            // ALWAYS clear local state regardless of server response
            setSession(null);
            setUser(null);
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signIn, logOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
