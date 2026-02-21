
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

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
        // Check active sessions
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
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

                const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: idToken,
                });

                if (error) throw error;
            } else {
                // Standard Web Flow
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
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
            if (Capacitor.isNativePlatform()) {
                await FirebaseAuthentication.signOut();
            }
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
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
