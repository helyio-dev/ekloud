import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { User, Lock, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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
                    <h1 className="text-4xl font-black mb-2">MON COMPTE</h1>
                    <p className="text-text-muted text-lg">Gérez vos informations personnelles et sécurisez votre compte.</p>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                    <div className="bg-surface border border-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] md:text-sm font-bold text-text-muted uppercase mb-1">Niveau</span>
                        <span className="text-2xl md:text-4xl font-black text-accent">{level}</span>
                    </div>
                    <div className="bg-surface border border-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] md:text-sm font-bold text-text-muted uppercase mb-1">Streak</span>
                        <span className="text-2xl md:text-4xl font-black text-orange-400">{streak} 🔥</span>
                    </div>
                    <div className="bg-surface border border-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-center overflow-hidden">
                        <span className="text-[10px] md:text-sm font-bold text-text-muted uppercase mb-1">XP Total</span>
                        <span className="text-2xl md:text-4xl font-black text-white px-1 max-w-full overflow-hidden text-ellipsis">{formatXP(xp)}</span>
                    </div>
                </div>

                {/* Level Progress */}
                <div className="bg-surface border border-white/5 p-8 rounded-3xl">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <span className="text-sm font-bold text-text-muted uppercase">PROGRESSION AU NIVEAU SUIVANT</span>
                            <h3 className="text-xl font-bold">LVL {level + 1}</h3>
                        </div>
                        <span className="text-sm font-bold text-text-muted">
                            {formatXP(currentLevelXp)} / {formatXP(requiredXpForNext)} XP
                        </span>
                    </div>
                    <div className="h-4 w-full bg-background rounded-full overflow-hidden border border-white/5">
                        <div
                            className="h-full bg-accent relative transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Username Update */}
                    <div className="bg-surface border border-white/5 p-6 md:p-8 rounded-3xl flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
                                <User className="w-5 h-5 text-blue-400" />
                            </div>
                            <h2 className="text-lg md:text-xl font-bold">CHANGER MON PSEUDO</h2>
                        </div>

                        <form onSubmit={handleUpdateUsername} className="space-y-4 flex-grow">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-text-muted">NOUVEAU PSEUDO</label>
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-bold text-white placeholder:opacity-30"
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
                    <div className="bg-surface border border-white/5 p-6 md:p-8 rounded-3xl flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-purple-500/10 p-2 rounded-xl border border-purple-500/20">
                                <Lock className="w-5 h-5 text-purple-400" />
                            </div>
                            <h2 className="text-lg md:text-xl font-bold">SÉCURITÉ</h2>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-4 flex-grow">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-text-muted">NOUVEAU MOT DE PASSE</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-white placeholder:opacity-30"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-text-muted">CONFIRMER LE MOT DE PASSE</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-white placeholder:opacity-30"
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
                                className="w-full py-3 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/5 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-4"
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
