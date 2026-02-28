import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../application/contexts/AuthContext';

/**
 * Handles the post-OAuth redirect at /auth.
 * Supabase JS automatically reads the hash fragment (#access_token=...)
 * via onAuthStateChange in AuthContext. This component just waits for the
 * session to be established, then redirects to the main app.
 */
const AuthCallback: React.FC = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/', { replace: true });
        }
    }, [loading, user, navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '1rem',
            fontFamily: 'Outfit, sans-serif',
        }}>
            <div style={{
                width: '2.5rem',
                height: '2.5rem',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: '#6366f1',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
                Signing you in…
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default AuthCallback;
