import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Cloud, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            if (error.message.includes('Email not confirmed')) {
                setError("Veuillez confirmer votre adresse email avant de vous connecter.");
            } else {
                setError(error.message);
            }
            setIsLoading(false);
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="w-full max-w-md bg-surface border border-white/5 rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-accent/10 p-3 rounded-xl border border-accent/20 mb-4">
                        <Cloud className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-2xl font-bold text-center">Bon retour sur Ekloud</h1>
                    <p className="text-text-muted text-sm text-center mt-2">Reprenez votre apprentissage là où vous vous êtes arrêté.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-text-muted">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                                placeholder="nom@exemple.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-text-muted">Mot de passe</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Se connecter"}
                    </button>
                </form>

                <p className="text-center mt-8 text-sm text-text-muted">
                    Pas encore de compte ?{' '}
                    <Link to="/signup" className="text-accent hover:underline font-medium">S'inscrire</Link>
                </p>
            </div>
        </div>
    );
}
