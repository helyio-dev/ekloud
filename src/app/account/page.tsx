import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { User, Lock, Save, Loader2, CheckCircle2, AlertCircle, ExternalLink, Copy, Globe, Sparkles, Trophy, Zap, Share2 } from 'lucide-react';
import { formatXP, calculateLevelProgress } from '@/lib/gamification';

/**
 * page de gestion du compte utilisateur.
 * permet de modifier le pseudo, le mot de passe et de voir sa progression.
 */
export default function AccountPage() {
    const { user, username, xp, level, streak, refreshProfile } = useAuth();

    // état de modification du pseudo
    const [newUsername, setNewUsername] = useState(username || '');
    const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [usernameSuccess, setUsernameSuccess] = useState(false);

    // état de modification du mot de passe
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // état visuel pour le retour de copie
    const [showCopyToast, setShowCopyToast] = useState(false);

    const { progress, currentLevelXp, requiredXpForNext } = calculateLevelProgress(xp || 0);

    /**
     * gère la mise à jour du nom d'utilisateur dans la base de données.
     * vérifie la validité du format et l'unicité du pseudo.
     */
    const handleUpdateUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (newUsername === username) return;

        // validation : 3-20 caractères, alphanumérique + tirets
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        if (!usernameRegex.test(newUsername)) {
            setUsernameError("format invalide : 3-20 caractères (lettres, chiffres, tirets).");
            return;
        }

        setIsUpdatingUsername(true);
        setUsernameError(null);
        setUsernameSuccess(false);

        // vérification de disponibilité du pseudo via supabase
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', newUsername)
            .single();

        if (existingUser) {
            setUsernameError("ce pseudo est déjà utilisé par un autre explorateur.");
            setIsUpdatingUsername(false);
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ username: newUsername })
            .eq('id', user.id);

        if (error) {
            setUsernameError(error.message);
        } else {
            setUsernameSuccess(true);
            await refreshProfile();
        }
        setIsUpdatingUsername(false);
    };

    /**
     * gère le changement de mot de passe via l'authentification supabase.
     */
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            setPasswordError("le mot de passe doit contenir au moins 8 caractères.");
            return;
        }
        if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            setPasswordError("le mot de passe doit contenir au moins une majuscule et un chiffre.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("les mots de passe ne correspondent pas.");
            return;
        }

        setIsUpdatingPassword(true);
        setPasswordError(null);
        setPasswordSuccess(false);

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            setPasswordError(error.message);
        } else {
            setPasswordSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
        }
        setIsUpdatingPassword(false);
    };

    return (
        <div className="min-h-screen bg-background p-6 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto space-y-10">
                <header>
                    <h1 className="text-4xl font-black mb-2 uppercase tracking-tight text-text leading-tight">{username}</h1>
                    <p className="text-text-muted text-lg font-medium opacity-80">gérez vos identifiants et suivez votre évolution sur le réseau ekloud.</p>
                </header>

                {/* grille des statistiques rapides */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-surface border border-border p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm">
                        <span className="text-xs font-black text-text-muted uppercase tracking-[0.1em] mb-2">niveau actuel</span>
                        <span className="text-4xl font-black text-accent">{level}</span>
                    </div>
                    <div className="bg-surface border border-border p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm">
                        <span className="text-xs font-black text-text-muted uppercase tracking-[0.1em] mb-2">série (streak)</span>
                        <span className="text-4xl font-black text-orange-400">{streak} 🔥</span>
                    </div>
                    <div className="bg-surface border border-border p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm overflow-hidden">
                        <span className="text-xs font-black text-text-muted uppercase tracking-[0.1em] mb-2">expérience totale</span>
                        <span className="text-4xl font-black text-text truncate max-w-full">{formatXP(xp)}</span>
                    </div>
                </div>

                {/* section profil public / partage */}
                {username && (
                    <section className="bg-surface border border-border p-6 md:p-10 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                        <div className="flex items-center gap-6 z-10">
                            <div className="hidden lg:flex w-16 h-16 bg-surface-hover/50 rounded-2xl items-center justify-center border border-border shrink-0 shadow-inner">
                                <Share2 className="w-7 h-7 text-text-muted" />
                            </div>
                            <div className="space-y-2 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    <Globe className="w-4 h-4 text-accent" />
                                    <span className="text-[10px] font-black tracking-widest text-accent uppercase">réseau ekloud • profil authentifié</span>
                                </div>
                                <h3 className="text-2xl font-black text-text uppercase tracking-tight">partager mon profil</h3>
                                <code className="block mt-2 text-[11px] font-mono text-accent bg-accent/5 px-4 py-2 rounded-xl border border-accent/10">
                                    ekloud.qzz.io/u/{username}
                                </code>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto z-10">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`https://ekloud.qzz.io/u/${username}`);
                                    setShowCopyToast(true);
                                    setTimeout(() => setShowCopyToast(false), 3000);
                                }}
                                className={`px-8 py-4 rounded-xl font-black text-xs tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${showCopyToast
                                        ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                                        : 'bg-surface-hover border border-border text-text hover:bg-border/20'
                                    }`}
                            >
                                {showCopyToast ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>COPIÉ !</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 opacity-50" />
                                        <span>COPIER LE LIEN</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => window.open(`/u/${username}`, '_blank')}
                                className="px-8 py-4 bg-accent text-white rounded-xl font-black text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-accent/90 transition-all active:scale-95 shadow-[0_0_20px_var(--accent-glow)]"
                            >
                                <ExternalLink className="w-4 h-4" />
                                VOIR LE PROFIL
                            </button>
                        </div>

                        {/* toast de confirmation minimaliste */}
                        {showCopyToast && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-500 text-white px-5 py-2 rounded-full text-[10px] font-black flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-lg">
                                <Sparkles className="w-3 h-3" /> LIEN COPIÉ DANS LE PRESSE-PAPIER
                            </div>
                        )}
                    </section>
                )}

                {/* état de la progression (xp) */}
                <section className="bg-surface border border-border p-8 md:p-10 rounded-[32px] space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-accent/10 p-2.5 rounded-xl border border-accent/20">
                            <Trophy className="w-6 h-6 text-accent" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-text">votre ascension</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center text-xs font-black">
                            <span className="bg-surface-hover px-5 py-2 rounded-xl border border-border text-text-muted">NIVEAU {level}</span>
                            <span className="bg-accent/20 px-5 py-2 rounded-xl border border-accent/30 text-accent shadow-[0_0_15px_rgba(56,189,248,0.2)]">NIVEAU {level + 1}</span>
                        </div>

                        <div className="h-4 w-full bg-background/50 rounded-full overflow-hidden border border-border/50 relative p-1">
                            <div
                                className="h-full bg-accent rounded-full relative transition-all duration-1000 shadow-[0_0_15px_var(--accent-glow)]"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <span className="text-xs font-bold text-text-muted order-2 md:order-1">
                                <span className="text-text font-black">{formatXP(currentLevelXp)}</span> / {formatXP(requiredXpForNext)} XP accumulés
                            </span>
                            <span className="text-xs font-black text-accent uppercase tracking-widest order-1 md:order-2 flex items-center gap-2 bg-accent/5 px-4 py-2 rounded-full border border-accent/10">
                                <Zap className="w-3 h-3" />
                                {formatXP(requiredXpForNext - currentLevelXp)} XP restants avant le prochain palier
                            </span>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* formulaire : identité visuelle */}
                    <div className="bg-surface border border-border p-8 rounded-[32px] flex flex-col shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                                <User className="w-6 h-6 text-blue-400" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-text">pseudo</h2>
                        </div>

                        <form onSubmit={handleUpdateUsername} className="space-y-6 flex-grow">
                            <div className="space-y-2">
                                <label htmlFor="new-username" className="block text-[10px] font-black tracking-widest text-text-muted uppercase">nouvelle identité</label>
                                <input
                                    id="new-username"
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="w-full px-5 py-4 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all font-bold text-text placeholder:opacity-20"
                                    placeholder="ex: neocloud_explorer"
                                    maxLength={20}
                                />
                            </div>

                            {usernameError && (
                                <div className="flex items-center gap-3 text-red-400 text-xs font-bold bg-red-400/5 p-4 rounded-2xl border border-red-400/10">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {usernameError}
                                </div>
                            )}

                            {usernameSuccess && (
                                <div className="flex items-center gap-3 text-green-400 text-xs font-bold bg-green-400/5 p-4 rounded-2xl border border-green-400/10">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    identité visuelle mise à jour.
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isUpdatingUsername || newUsername === username}
                                className="w-full py-4 bg-accent hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
                            >
                                {isUpdatingUsername ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                METTRE À JOUR LE PSEUDO
                            </button>
                        </form>
                    </div>

                    {/* formulaire : sécurité du compte */}
                    <div className="bg-surface border border-border p-8 rounded-[32px] flex flex-col shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
                                <Lock className="w-6 h-6 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-text">sécurité</h2>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-6 flex-grow">
                            <div className="space-y-2">
                                <label htmlFor="new-password" className="block text-[10px] font-black tracking-widest text-text-muted uppercase">nouveau mot de passe</label>
                                <input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all text-text placeholder:opacity-20 font-bold"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="confirm-password" className="block text-[10px] font-black tracking-widest text-text-muted uppercase">confirmation</label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all text-text placeholder:opacity-20 font-bold"
                                    placeholder="••••••••"
                                />
                            </div>

                            {passwordError && (
                                <div className="flex items-center gap-3 text-red-400 text-xs font-bold bg-red-400/5 p-4 rounded-2xl border border-red-400/10">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="flex items-center gap-3 text-green-400 text-xs font-bold bg-green-400/5 p-4 rounded-2xl border border-green-400/10">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    sécurité renforcée avec succès.
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isUpdatingPassword || !newPassword}
                                className="w-full py-4 bg-surface-hover hover:bg-border/20 disabled:opacity-30 disabled:cursor-not-allowed border border-border text-text rounded-2xl font-black text-xs tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                {isUpdatingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                MODIFIER LE MOT DE PASSE
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
