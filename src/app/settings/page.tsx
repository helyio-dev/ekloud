'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, ThemePalette } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import {
    User, Lock, Save, Loader2, CheckCircle2, AlertCircle,
    ExternalLink, Copy, Share2, Globe, Sparkles, Trophy, Zap,
    Settings, Palette, Sun, Moon, Check, Monitor, Smartphone,
    Stars, Leaf, Sunset, Waves, Flower2, Terminal,
    MoonStar, Flame, Cpu, Coffee, Droplets, Flower, Layers, Heart, Link as LinkIcon,
    Github, Twitch, Linkedin,
    type LucideIcon
} from 'lucide-react';
import { formatXP, calculateLevelProgress } from '@/lib/gamification';

const THEMES: {
    id: ThemePalette;
    name: string;
    icon: LucideIcon;
    dark: { bg: string; surface: string; accent: string };
    light: { bg: string; surface: string; accent: string };
}[] = [
    {
        id: 'normal',
        name: 'Normal',
        icon: Monitor,
        dark: { bg: '#0f1117', surface: '#1a1d24', accent: '#818cf8' },
        light: { bg: '#f8fafc', surface: '#ffffff', accent: '#4f46e5' },
    },
    {
        id: 'amoled',
        name: 'AMOLED',
        icon: Smartphone,
        dark: { bg: '#000000', surface: '#080808', accent: '#6366f1' },
        light: { bg: '#ffffff', surface: '#f8f8f8', accent: '#4338ca' },
    },
    {
        id: 'nebula',
        name: 'Nebula',
        icon: Stars,
        dark: { bg: '#030406', surface: '#0a0c10', accent: '#6366f1' },
        light: { bg: '#e2e8f0', surface: '#f1f5f9', accent: '#3730a3' },
    },
    {
        id: 'aurora',
        name: 'Aurora',
        icon: Leaf,
        dark: { bg: '#021208', surface: '#0b2015', accent: '#10b981' },
        light: { bg: '#d1fae5', surface: '#ecfdf5', accent: '#059669' },
    },
    {
        id: 'sunset',
        name: 'Sunset',
        icon: Sunset,
        dark: { bg: '#150609', surface: '#220c10', accent: '#f97316' },
        light: { bg: '#fff7ed', surface: '#ffedd5', accent: '#ea580c' },
    },
    {
        id: 'ocean',
        name: 'Ocean',
        icon: Waves,
        dark: { bg: '#020d1a', surface: '#081929', accent: '#22d3ee' },
        light: { bg: '#e0f2fe', surface: '#f0f9ff', accent: '#0284c7' },
    },
    {
        id: 'sakura',
        name: 'Sakura',
        icon: Flower2,
        dark: { bg: '#1a0812', surface: '#28101e', accent: '#ec4899' },
        light: { bg: '#fdf2f8', surface: '#fce7f3', accent: '#db2777' },
    },
    {
        id: 'hacker',
        name: 'Hacker',
        icon: Terminal,
        dark: { bg: '#000000', surface: '#0a0f0a', accent: '#00ff41' },
        light: { bg: '#0d1f0d', surface: '#162416', accent: '#39d353' },
    },
    {
        id: 'midnight',
        name: 'Midnight',
        icon: MoonStar,
        dark: { bg: '#05060f', surface: '#0e1029', accent: '#818cf8' },
        light: { bg: '#eef2ff', surface: '#f5f7ff', accent: '#4f46e5' },
    },
    {
        id: 'lava',
        name: 'Lava',
        icon: Flame,
        dark: { bg: '#0f0202', surface: '#1e0505', accent: '#ef4444' },
        light: { bg: '#fff1f2', surface: '#ffe4e6', accent: '#dc2626' },
    },
    {
        id: 'cyber',
        name: 'Cyber',
        icon: Cpu,
        dark: { bg: '#06000f', surface: '#10011e', accent: '#d946ef' },
        light: { bg: '#fdf4ff', surface: '#fae8ff', accent: '#a21caf' },
    },
    {
        id: 'coffee',
        name: 'Coffee',
        icon: Coffee,
        dark: { bg: '#0f0a05', surface: '#1e1008', accent: '#d97706' },
        light: { bg: '#fef9f0', surface: '#fef3c7', accent: '#92400e' },
    },
    {
        id: 'mint',
        name: 'Mint',
        icon: Droplets,
        dark: { bg: '#011a16', surface: '#052e26', accent: '#2dd4bf' },
        light: { bg: '#f0fdfa', surface: '#ccfbf1', accent: '#0d9488' },
    },
    {
        id: 'lavender',
        name: 'Lavender',
        icon: Flower,
        dark: { bg: '#0d0814', surface: '#1a0f22', accent: '#c084fc' },
        light: { bg: '#faf5ff', surface: '#f3e8ff', accent: '#7c3aed' },
    },
    {
        id: 'slate',
        name: 'Slate',
        icon: Layers,
        dark: { bg: '#020617', surface: '#0f172a', accent: '#38bdf8' },
        light: { bg: '#f8fafc', surface: '#f1f5f9', accent: '#0284c7' },
    },
    {
        id: 'rose',
        name: 'Rose',
        icon: Heart,
        dark: { bg: '#0f0208', surface: '#1e0510', accent: '#fb7185' },
        light: { bg: '#fff1f2', surface: '#ffe4e6', accent: '#e11d48' },
    },
];

export default function SettingsPage() {
    const { user, username, xp, level, streak, refreshProfile } = useAuth();
    const { palette, mode, setPalette, toggleMode } = useTheme();
    const [activeTab, setActiveTab] = useState<'account' | 'appearance'>('account');

    // Linked accounts state
    const [identities, setIdentities] = useState<any[]>([]);
    const [isLinking, setIsLinking] = useState<string | null>(null);

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

    const [showCopyToast, setShowCopyToast] = useState(false);

    const { progress, currentLevelXp, requiredXpForNext } = calculateLevelProgress(xp || 0);

    const fetchIdentities = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.identities) {
            setIdentities(user.identities);
        }
    };

    useEffect(() => {
        fetchIdentities();
    }, []);

    const handleLinkAccount = async (provider: string) => {
        setIsLinking(provider);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider as any,
            options: {
                redirectTo: `${window.location.origin}/settings`,
                skipBrowserRedirect: false,
            },
        });
        if (error) {
            console.error('Error linking account:', error.message);
            setIsLinking(null);
        }
    };

    const isProviderLinked = (provider: string) => {
        return identities.some(id => id.provider === provider);
    };

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

        const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', user.id);
        if (error) { setUsernameError(error.message); }
        else { setUsernameSuccess(true); await refreshProfile(); }
        setIsUpdatingUsername(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) { setPasswordError("Le mot de passe doit contenir au moins 6 caractères."); return; }
        if (newPassword !== confirmPassword) { setPasswordError("Les mots de passe ne correspondent pas."); return; }
        setIsUpdatingPassword(true);
        setPasswordError(null);
        setPasswordSuccess(false);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) { setPasswordError(error.message); }
        else { setPasswordSuccess(true); setNewPassword(''); setConfirmPassword(''); }
        setIsUpdatingPassword(false);
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center">
                            <Settings className="w-5 h-5 text-accent" />
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-text">Paramètres</h1>
                    </div>
                    <p className="text-text-muted ml-13">Gérez votre compte et personnalisez votre expérience.</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 p-1 bg-surface border border-border rounded-2xl w-fit mb-8">
                    <button
                        onClick={() => setActiveTab('account')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'account' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-muted hover:text-text'}`}
                    >
                        <User className="w-4 h-4" />
                        Compte
                    </button>
                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'appearance' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-muted hover:text-text'}`}
                    >
                        <Palette className="w-4 h-4" />
                        Apparence
                    </button>
                </div>

                {/* ===== TAB: COMPTE ===== */}
                {activeTab === 'account' && (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 md:gap-6">
                            <div className="bg-surface border border-border p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] md:text-sm font-bold text-text-muted uppercase mb-1">Niveau</span>
                                <span className="text-2xl md:text-4xl font-black text-accent">{level}</span>
                            </div>
                            <div className="bg-surface border border-border p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] md:text-sm font-bold text-text-muted uppercase mb-1">Streak</span>
                                <span className="text-2xl md:text-4xl font-black text-orange-600 dark:text-orange-400">{streak} 🔥</span>
                            </div>
                            <div className="bg-surface border border-border p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-center overflow-hidden">
                                <span className="text-[10px] md:text-sm font-bold text-text-muted uppercase mb-1">XP Total</span>
                                <span className="text-2xl md:text-4xl font-black text-text px-1 max-w-full overflow-hidden text-ellipsis">{formatXP(xp)}</span>
                            </div>
                        </div>

                        {/* Public Profile Link */}
                        {username && (
                            <div className="bg-surface border border-border p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative">
                                <div className="flex items-center gap-6">
                                    <div className="hidden md:flex w-14 h-14 bg-surface-hover/30 rounded-2xl items-center justify-center border border-border shrink-0">
                                        <Share2 className="w-6 h-6 text-text-muted" />
                                    </div>
                                    <div className="space-y-1 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-2">
                                            <Globe className="w-4 h-4 text-accent" />
                                            <span className="text-[10px] font-black tracking-[0.2em] text-accent uppercase">Profil Public</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-text uppercase tracking-tight">Partager mon profil</h3>
                                        <div className="mt-2 text-xs font-mono text-text-muted/80 bg-surface px-3 py-1.5 rounded-lg border border-border inline-block">
                                            ekloud.qzz.io/u/{username}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(`https://ekloud.qzz.io/u/${username}`); setShowCopyToast(true); setTimeout(() => setShowCopyToast(false), 3000); }}
                                        className={`px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 ${showCopyToast ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-surface border border-border text-text hover:bg-surface-hover'}`}
                                    >
                                        {showCopyToast ? <><CheckCircle2 className="w-4 h-4" /><span>COPIÉ !</span></> : <><Copy className="w-4 h-4 opacity-70" /><span>COPIER</span></>}
                                    </button>
                                    <button
                                        onClick={() => window.open(`/u/${username}`, '_blank')}
                                        className="px-6 py-3.5 bg-accent text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-accent/90 transition-all active:scale-95"
                                    >
                                        <ExternalLink className="w-4 h-4" /> VOIR
                                    </button>
                                </div>
                                {showCopyToast && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <Sparkles className="w-3 h-3" /> LIEN COPIÉ
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Linked Accounts */}
                        <div className="bg-surface border border-border p-8 rounded-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-accent/10 p-2 rounded-xl border border-accent/20">
                                    <LinkIcon className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold uppercase tracking-tight text-text">Comptes liés</h2>
                                    <p className="text-xs text-text-muted">Associez plusieurs comptes pour sécuriser votre progression.</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { id: 'github', name: 'GitHub', icon: <Github className="w-5 h-5" /> },
                                    { id: 'discord', name: 'Discord', icon: <div className="w-5 h-5 flex items-center justify-center"><svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.923 2.991.076.076 0 0 0 .084-.027c.458-.627.866-1.287 1.21-1.982.028-.056.012-.112-.04-.132a13.104 13.104 0 0 1-1.859-.884.078.078 0 0 1-.008-.128c.125-.094.25-.192.37-.294a.076.076 0 0 1 .1-.01c3.931 1.807 8.18 1.807 12.069 0a.076.076 0 0 1 .1.01c.12.102.245.2.372.294a.077.077 0 0 1-.008.128c-.59.352-1.187.647-1.86.884-.052.02-.068.076-.04.132.344.695.752 1.355 1.21 1.982a.076.076 0 0 0 .084.027 19.856 19.856 0 0 0 6.023-2.991.082.082 0 0 0 .031-.057c.475-5.23-.839-9.742-3.601-13.66a.066.066 0 0 0-.032-.027zm-12.064 10.1c-1.184 0-2.164-1.09-2.164-2.427 0-1.337.957-2.427 2.164-2.427 1.219 0 2.185 1.09 2.165 2.427 0 1.337-.957 2.427-2.165 2.427zm7.983 0c-1.184 0-2.164-1.09-2.164-2.427 0-1.337.957-2.427 2.164-2.427 1.219 0 2.185 1.09 2.165 2.427 0 1.337-.957 2.427-2.165 2.427z" /></svg></div> },
                                    { id: 'azure', name: 'Microsoft', icon: <div className="w-5 h-5 flex items-center justify-center scale-75"><svg viewBox="0 0 23 23" fill="currentColor"><path fill="#f35325" d="M1 1h10v10H1z" /><path fill="#81bc06" d="M12 1h10v10H12z" /><path fill="#05a6f0" d="M1 12h10v10H1z" /><path fill="#ffba08" d="M12 12h10v10H12z" /></svg></div> },
                                    { id: 'gitlab', name: 'GitLab', icon: <div className="w-5 h-5 flex items-center justify-center scale-90"><svg viewBox="0 0 24 24" fill="#e24329"><path d="m23.498 13.528-.158-.485L12 1.36 1.356 12.347l2.844 8.76L12 24l7.8-2.893 3.698-7.579Zm-11.5-12.168 1.95 6.023H9.55l1.95-6.023h.498ZM8.677 8.355l-2.617 8.08L12 24l5.94-7.565-2.617-8.08H8.677ZM1.356 12.347h6.444l4.2 11.653-9.288-11.653Zm14.844 0h6.444l-9.288 11.653 2.844-11.653Z" /></svg></div> },
                                    { id: 'linkedin_oidc', name: 'LinkedIn', icon: <Linkedin className="w-5 h-5" /> },
                                    { id: 'twitch', name: 'Twitch', icon: <Twitch className="w-5 h-5" /> },
                                ].map((p) => {
                                    const linked = isProviderLinked(p.id);
                                    return (
                                        <div key={p.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${linked ? 'bg-accent/5 border-accent/20' : 'bg-background border-border opacity-60 hover:opacity-100'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`${linked ? 'text-accent' : 'text-text-muted'}`}>
                                                    {p.icon}
                                                </div>
                                                <span className={`text-sm font-bold ${linked ? 'text-text' : 'text-text-muted'}`}>{p.name}</span>
                                            </div>
                                            {linked ? (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-accent uppercase">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Lié
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleLinkAccount(p.id)}
                                                    disabled={isLinking !== null}
                                                    className="text-[10px] font-black text-text-muted hover:text-accent uppercase underline underline-offset-4 tracking-wider transition-colors disabled:opacity-50"
                                                >
                                                    {isLinking === p.id ? 'Connexion...' : 'Lier'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Level Progress */}
                        <div className="bg-surface border border-border p-8 rounded-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-accent/10 p-2 rounded-xl border border-accent/20"><Trophy className="w-5 h-5 text-accent" /></div>
                                <h2 className="text-xl font-bold uppercase tracking-tight text-text">Progression</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="bg-surface-hover/30 px-4 py-1.5 rounded-xl border border-border text-text-muted">LVL {level}</span>
                                    <span className="bg-accent/10 px-4 py-1.5 rounded-xl border border-accent/20 text-accent">LVL {level + 1}</span>
                                </div>
                                <div className="h-4 w-full bg-background rounded-full overflow-hidden border border-border">
                                    <div className="h-full bg-accent relative transition-all duration-1000 shadow-[0_0_15px_var(--accent-glow)]" style={{ width: `${progress}%` }}>
                                        <div className="absolute inset-0 bg-surface/20 animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                                    <span className="text-xs font-bold text-text-muted"><span className="text-text">{formatXP(currentLevelXp)}</span> / {formatXP(requiredXpForNext)} XP</span>
                                    <span className="text-xs font-black text-accent uppercase tracking-wider flex items-center gap-2"><Zap className="w-3 h-3" />+{formatXP(requiredXpForNext - currentLevelXp)} XP restants</span>
                                </div>
                            </div>
                        </div>

                        {/* Forms */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-surface border border-border p-6 md:p-8 rounded-3xl flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-blue-600/10 dark:bg-blue-500/10 p-2 rounded-xl border border-blue-600/20 dark:border-blue-500/20"><User className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                                    <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-text">Pseudo</h2>
                                </div>
                                <form onSubmit={handleUpdateUsername} className="space-y-4 flex-grow">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-text-muted">NOUVEAU PSEUDO</label>
                                        <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-bold text-text placeholder:opacity-30" placeholder="Nouveau pseudo" />
                                    </div>
                                    {usernameError && <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20"><AlertCircle className="w-4 h-4" />{usernameError}</div>}
                                    {usernameSuccess && <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm bg-green-500/10 p-3 rounded-lg border-green-500/20"><CheckCircle2 className="w-4 h-4" />Pseudo mis à jour !</div>}
                                    <button type="submit" disabled={isUpdatingUsername || newUsername === username} className="w-full py-3 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-4">
                                        {isUpdatingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Enregistrer
                                    </button>
                                </form>
                            </div>

                            <div className="bg-surface border border-border p-6 md:p-8 rounded-3xl flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-purple-600/10 dark:bg-purple-500/10 p-2 rounded-xl border border-purple-600/20 dark:border-purple-500/20"><Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
                                    <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-text">Mot de passe</h2>
                                </div>
                                <form onSubmit={handleUpdatePassword} className="space-y-4 flex-grow">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-text-muted">NOUVEAU MDP</label>
                                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-text placeholder:opacity-30" placeholder="••••••••" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-text-muted">CONFIRMER</label>
                                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-text placeholder:opacity-30" placeholder="••••••••" />
                                    </div>
                                    {passwordError && <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border-red-500/20"><AlertCircle className="w-4 h-4" />{passwordError}</div>}
                                    {passwordSuccess && <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm bg-green-500/10 p-3 rounded-lg border-green-500/20"><CheckCircle2 className="w-4 h-4" />Mis à jour !</div>}
                                    <button type="submit" disabled={isUpdatingPassword || !newPassword} className="w-full py-3 bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed border border-border text-text rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-4">
                                        {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Mettre à jour
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== TAB: APPARENCE ===== */}
                {activeTab === 'appearance' && (
                    <div className="space-y-8">

                        {/* Mode Jour / Nuit */}
                        <div className="bg-surface border border-border p-6 md:p-8 rounded-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-accent/10 p-2 rounded-xl border border-accent/20">
                                    {mode === 'dark' ? <Moon className="w-5 h-5 text-accent" /> : <Sun className="w-5 h-5 text-accent" />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold uppercase tracking-tight text-text">Mode d'affichage</h2>
                                    <p className="text-xs text-text-muted">Bascule entre le mode sombre et clair pour le thème actuel.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => mode !== 'dark' && toggleMode()}
                                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border font-bold text-sm transition-all ${mode === 'dark' ? 'bg-accent/10 border-accent/40 text-accent shadow-[0_0_20px_var(--accent-glow)]' : 'bg-background border-border text-text-muted hover:border-accent/20'}`}
                                >
                                    <Moon className="w-5 h-5" />
                                    Sombre
                                    {mode === 'dark' && <Check className="w-4 h-4 ml-1" />}
                                </button>
                                <button
                                    onClick={() => mode !== 'light' && toggleMode()}
                                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border font-bold text-sm transition-all ${mode === 'light' ? 'bg-accent/10 border-accent/40 text-accent shadow-[0_0_20px_var(--accent-glow)]' : 'bg-background border-border text-text-muted hover:border-accent/20'}`}
                                >
                                    <Sun className="w-5 h-5" />
                                    Clair
                                    {mode === 'light' && <Check className="w-4 h-4 ml-1" />}
                                </button>
                            </div>
                        </div>

                        {/* Theme Selector */}
                        <div className="bg-surface border border-border p-6 md:p-8 rounded-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-accent/10 p-2 rounded-xl border border-accent/20"><Palette className="w-5 h-5 text-accent" /></div>
                                <div>
                                    <h2 className="text-xl font-bold uppercase tracking-tight text-text">Thème de couleurs</h2>
                                    <p className="text-xs text-text-muted">Chaque thème possède sa variante sombre et claire.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {THEMES.map((theme) => {
                                    const isActive = palette === theme.id;
                                    const preview = mode === 'dark' ? theme.dark : theme.light;
                                    return (
                                        <button
                                            key={theme.id}
                                            onClick={() => setPalette(theme.id)}
                                            className={`relative group rounded-2xl overflow-hidden border-2 transition-all duration-300 ${isActive ? 'border-accent shadow-[0_0_25px_var(--accent-glow)] scale-[1.02]' : 'border-border hover:border-accent/40 hover:scale-[1.01]'}`}
                                        >
                                            {/* Preview */}
                                            <div className="h-24 p-3 flex flex-col gap-2" style={{ backgroundColor: preview.bg }}>
                                                <div className="h-2.5 rounded-full w-3/4" style={{ backgroundColor: preview.surface }}></div>
                                                <div className="h-2.5 rounded-full w-1/2" style={{ backgroundColor: preview.surface }}></div>
                                                <div className="mt-auto flex gap-1.5">
                                                    <div className="h-5 rounded-md w-8" style={{ backgroundColor: preview.accent }}></div>
                                                    <div className="h-5 rounded-md flex-1" style={{ backgroundColor: preview.surface }}></div>
                                                </div>
                                            </div>
                                            {/* Label */}
                                            <div className="p-3 text-left" style={{ backgroundColor: preview.surface }}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <theme.icon className="w-3.5 h-3.5" style={{ color: preview.accent }} />
                                                        <span className="text-sm font-black" style={{ color: preview.accent }}>
                                                            {theme.name}
                                                        </span>
                                                    </div>
                                                    {isActive && (
                                                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: preview.accent }}>
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
