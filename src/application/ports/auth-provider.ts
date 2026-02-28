import { User, Session } from '@supabase/supabase-js';

export interface AuthSession {
    user: User | null;
    session: Session | null;
}

export interface AuthProviderPort {
    signIn(): Promise<void>;
    signOut(): Promise<void>;
    getSession(): Promise<AuthSession>;
    onAuthStateChange(
        callback: (event: string, session: Session | null) => void
    ): () => void;
}
