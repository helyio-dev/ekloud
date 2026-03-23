import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { User, Lock, Save, Loader2, CheckCircle2, AlertCircle, ExternalLink, Copy, Share2, Globe, Sparkles, Trophy, Zap } from 'lucide-react';
import { formatXP, calculateLevelProgress } from '@/lib/gamification';

export default function AccountPage() {
    const { user, username, xp, level, streak, refreshProfile } = useAuth();

    // Username state
    const [newUsername, setNewUsername] = useState(username || '');
    const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [usernameSuccess, setUsernameSuccess] = useState(false);

    // Password state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Copy notification state
    const [showCopyToast, setShowCopyToast] = useState(false);

    const { progress, currentLevelXp, requiredXpForNext } = calculateLevelProgress(xp || 0);

    const handleUpdateUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (newUsername === username) return;
        if (newUsername.length < 3) {
            setUsernameError("Le pseudo doit contenir au moins 3 caractères.");
            return;
        }

        setIsUpdatingUsername(true);
        setUsernameError(null);
        setUsernameSuccess(false);

        // Check if username is already taken (uniqueness check)
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', newUsername)
            .single();

        if (existingUser) {
            setUsernameError("Ce pseudo est déjà utilisé.");
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

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("Les mots de passe ne correspondent pas.");
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
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2 uppercase tracking-tight text-text">{username}</h1>
                    <p className="text-text-muted text-lg">Gérez vos informations personnelles et sécurisez votre compte.</p>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                    <div className="bg-surface border border-border p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] md:text-sm font-bold text-text-muted uppercase mb-1">Niveau</span>
                        <span className="text-2xl md:text-4xl font-black text-accent">{level}</span>
                    </div>
                    <div className="bg-surface border border-border p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] md:text-sm font-bold text-text-muted uppercase mb-1">Streak</span>
                        <span className="text-2xl md:text-4xl font-black text-orange-400">{streak} 🔥</span>
                    </div>
                    <div className="bg-surface border border-border p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-center overflow-hidden">
                        <span className="text-[10px] md:text-sm font-bold text-text-muted uppercase mb-1">XP Total</span>
                        <span className="text-2xl md:text-4xl font-black text-text px-1 max-w-full overflow-hidden text-ellipsis">{formatXP(xp)}</span>
                    </div>
                </div>

                {/* Public Profile Link Section - CLEAN VERSION */}
                {username && (
                    <div className="bg-surface border border-border p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 relative">
                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex w-14 h-14 bg-surface-hover/30 rounded-2xl items-center justify-center border border-border shrink-0">
                                <Share2 className="w-6 h-6 text-text-muted" />
                            </div>
                            <div className="space-y-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    <Globe className="w-4 h-4 text-accent" />
                                    <span className="text-[10px] font-black tracking-[0.2em] text-accent uppercase">Réseau Ekloud • Profil Public</span>
                                </div>
                                <h3 className="text-xl font-bold text-text uppercase tracking-tight">Partager mon profil</h3>
                                <div className="mt-2 text-xs font-mono text-text-muted/80 bg-surface px-3 py-1.5 rounded-lg border border-border inline-block">
                                    ekloud.qzz.io/u/{username}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`https://ekloud.qzz.io/u/${username}`);
                                    setShowCopyToast(true);
                                    setTimeout(() => setShowCopyToast(false), 3000);
                                }}
                                className={`px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 ${
                                    showCopyToast 
                                    ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
                                    : 'bg-surface border border-border text-text hover:bg-surface-hover'
                                }`}
                            >
                                {showCopyToast ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>COPIÉ !</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 opacity-70" />
                                        <span>COPIER LE LIEN</span>
                                    </>
                                )}
                            </button>
                            
                            <button
                                onClick={() => window.open(`/u/${username}`, '_blank')}
                                className="px-6 py-3.5 bg-accent text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-accent/90 transition-all active:scale-95"
                            >
                                <ExternalLink className="w-4 h-4" />
                                VOIR LE PROFIL
                            </button>
                        </div>

                        {/* Minimal toast notification */}
                        {showCopyToast && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Sparkles className="w-3 h-3" /> LIEN COPIÉ
                            </div>
                        )}
                    </div>
                )}

                {/* Level Progress */}
                <div className="bg-surface border border-border p-8 rounded-3xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-accent/10 p-2 rounded-xl border border-accent/20">
                            <Trophy className="w-5 h-5 text-accent" />
                        </div>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-text">Votre Progression</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm font-bold">
                            <span className="bg-surface-hover/30 px-4 py-1.5 rounded-xl border border-border text-text-muted">LVL {level}</span>
                            <span className="bg-accent/10 px-4 py-1.5 rounded-xl border border-accent/20 text-accent shadow-[0_0_15px_var(--accent-glow)]">LVL {level + 1}</span>
                        </div>

                        <div className="h-4 w-full bg-background rounded-full overflow-hidden border border-border relative">
                            <div
                                className="h-full bg-accent relative transition-all duration-1000 shadow-[0_0_15px_var(--accent-glow)]"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-surface/20 animate-pulse"></div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                            <span className="text-xs font-bold text-text-muted order-2 md:order-1">
                                <span className="text-text">{formatXP(currentLevelXp)}</span> / {formatXP(requiredXpForNext)} XP
                            </span>
                            <span className="text-xs font-black text-accent uppercase tracking-wider order-1 md:order-2 flex items-center gap-2">
                                <Zap className="w-3 h-3" />
                                +{formatXP(requiredXpForNext - currentLevelXp)} XP restants
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Username Update */}
                    <div className="bg-surface border border-border p-6 md:p-8 rounded-3xl flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
                                <User className="w-5 h-5 text-blue-400" />
                            </div>
                            <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-text">Pseudo</h2>
                        </div>

                        <form onSubmit={handleUpdateUsername} className="space-y-4 flex-grow">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-text-muted">NOUVEAU PSEUDO</label>
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-bold text-text placeholder:opacity-30"
                                    placeholder="Nouveau pseudo"
                                />
                            </div>

                            {usernameError && (
                                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                                    <AlertCircle className="w-4 h-4" />
                                    {usernameError}
                                </div>
                            )}

                            {usernameSuccess && (
                                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Pseudo mis à jour !
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isUpdatingUsername || newUsername === username}
                                className="w-full py-3 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {isUpdatingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Enregistrer le pseudo
                            </button>
                        </form>
                    </div>

                    {/* Password Update */}
                    <div className="bg-surface border border-border p-6 md:p-8 rounded-3xl flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-purple-500/10 p-2 rounded-xl border border-purple-500/20">
                                <Lock className="w-5 h-5 text-purple-400" />
                            </div>
                            <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-text">Mot de passe</h2>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-4 flex-grow">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-text-muted">NOUVEAU MOT DE PASSE</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-text placeholder:opacity-30"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-text-muted">CONFIRMER LE MOT DE PASSE</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-text placeholder:opacity-30"
                                    placeholder="••••••••"
                                />
                            </div>

                            {passwordError && (
                                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                                    <AlertCircle className="w-4 h-4" />
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Mot de passe mis à jour !
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isUpdatingPassword || !newPassword}
                                className="w-full py-3 bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed border border-border text-text rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Mettre à jour le mot de passe
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
