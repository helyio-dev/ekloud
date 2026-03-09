import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const handleAuthCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');

            if (!code) {
                navigate('/login?error=No code provided');
                return;
            }

            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
                console.error('Error exchanging code for session:', error.message);
                navigate('/login?error=Verification failed');
            } else {
                navigate('/dashboard');
            }
        };

        handleAuthCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
            <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
            <h1 className="text-xl font-bold">Vérification de votre compte...</h1>
            <p className="text-text-muted mt-2">Un instant, nous finalisons votre inscription.</p>
        </div>
    );
}
