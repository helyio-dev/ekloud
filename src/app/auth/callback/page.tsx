import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, ShieldCheck } from 'lucide-react';

/**
 * page de traitement du retour d'authentification (oauth / magic link).
 * gère l'échange de code pour une session et redirige vers le dashboard.
 */
export default function AuthCallbackPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const handleAuthCallback = async () => {
            const hash = window.location.hash;
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');

            // gestion du hash (souvent utilisé par supabase en mode implicite ou magic link legacy)
            if (hash && hash.includes('access_token')) {
                const { data, error } = await supabase.auth.getSession();
                if (error || !data.session) {
                    console.error('erreur récupération session (hash):', error?.message);
                    navigate('/login?error=verification_failed');
                } else {
                    navigate('/dashboard');
                }
                return;
            }

            // échange du code d'autorisation contre une session active
            if (code) {
                console.log('auth_callback: code détecté, échange en cours...');
                
                // mécanisme de sécurité contre les délais de réponse excessive (timeout supabase)
                const timeoutHandler = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("délai d'attente dépassé (timeout 10s)")), 10000)
                );

                try {
                    await Promise.race([
                        supabase.auth.exchangeCodeForSession(code),
                        timeoutHandler
                    ]);
                    console.log('auth_callback: succès de l\'échange, redirection...');
                    navigate('/dashboard');
                } catch (err: any) {
                    console.error('auth_callback_error:', err.message);
                    navigate('/login?error=' + encodeURIComponent(err.message));
                }
                return;
            }

            // cas par défaut : aucun token ou code trouvé
            navigate('/login?error=auth_token_missing');
        };

        handleAuthCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background font-sans">
            <div className="relative mb-8">
                <Loader2 className="w-16 h-16 text-accent animate-spin opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-accent animate-pulse" />
                </div>
            </div>
            
            <h1 className="text-2xl font-black uppercase tracking-tight text-text mb-2">vérification sécurisée</h1>
            <p className="text-text-muted font-medium text-sm text-center max-w-sm opacity-80">
                un instant, nous synchronisons vos accès avec le réseau ekloud...
            </p>
        </div>
    );
}
