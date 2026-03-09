import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Cloud, Mail, Lock, User, Loader2 } from 'lucide-react';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        
        if (username.length < 3) {
            setError("Le pseudo doit contenir au moins 3 caractères.");
            setIsLoading(false);
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            setSuccess(true);
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                <div className="w-full max-w-md bg-surface border border-white/5 rounded-2xl p-8 shadow-2xl text-center">
                    <div className="bg-green-500/10 p-3 rounded-xl border border-green-500/20 mb-6 inline-block">
                        <Mail className="w-8 h-8 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Vérifiez vos emails</h1>
                    <p className="text-text-muted mb-8">
                        Nous avons envoyé un lien de confirmation à <strong>{email}</strong>.
                        Veuillez cliquer sur le lien pour activer votre compte.
                    </p>
                    <Link to="/login" className="text-accent hover:underline font-medium">Retour à la connexion</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="w-full max-w-md bg-surface border border-white/5 rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-accent/10 p-3 rounded-xl border border-accent/20 mb-4">
                        <Cloud className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-2xl font-bold text-center">Créer un compte Ekloud</h1>
                    <p className="text-text-muted text-sm text-center mt-2">Commencez votre voyage dans la tech gratuitement.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-text-muted">Pseudo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                                placeholder="Votre pseudo"
                            />
                        </div>
                        <p className="text-[10px] text-text-muted mt-2">Ce pseudo sera visible par les autres joueurs.</p>
                    </div>

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
                                placeholder="votre@email.com"
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
                                placeholder="Choisir un mot de passe fort"
                            />
                        </div>
                        <p className="text-[10px] text-text-muted mt-2">Au moins 6 caractères.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "S'inscrire"}
                    </button>
                </form>

                <p className="text-center mt-8 text-sm text-text-muted">
                    Déjà un compte ?{' '}
                    <Link to="/login" className="text-accent hover:underline font-medium">Se connecter</Link>
                </p>
            </div>
        </div>
    );
}
