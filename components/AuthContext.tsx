
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { ProfileService } from '../services/profileService';
import { toast } from 'react-hot-toast';

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

        // Check active sessions
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            const newUser = session?.user ?? null;
            setUser(newUser);
            setLoading(false);

            // Auto-recovery logic
            if (newUser) {
                const profile = await ProfileService.getProfile(newUser.id);
                if (profile?.deletion_scheduled_at) {
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
                        redirectTo: `${import.meta.env.VITE_SITE_URL}/auth`,
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
            const { CloudBackupService } = await import('../services/cloudBackupService');
            CloudBackupService.resetSyncState();

            if (Capacitor.isNativePlatform()) {
                await FirebaseAuthentication.signOut().catch(e => console.error('Firebase signOut error:', e));
            }
            if (supabase) {
                // We use a shorter timeout or just don't await indefinitely for signOut
                // to ensure the UI updates and prevents the "stuck" feeling
                await Promise.race([
                    supabase.auth.signOut(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timeout')), 3000))
                ]).catch(e => console.error('Supabase signOut error:', e));
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
