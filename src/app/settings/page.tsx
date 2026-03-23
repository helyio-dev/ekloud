'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, ThemePalette } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import {
    User, Lock, Save, Loader2, CheckCircle2, AlertCircle,
    ExternalLink, Copy, Share2, Globe, Sparkles, Trophy, Zap,
    Settings, Palette, Sun, Moon, Check, Monitor, Smartphone,
    Stars, Leaf, Sunset, Waves, Flower2, Terminal,
    MoonStar, Flame, Cpu, Coffee, Droplets, Flower, Layers, Heart,
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
                                <span className="text-2xl md:text-4xl font-black text-orange-400">{streak} 🔥</span>
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
                                    <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20"><User className="w-5 h-5 text-blue-400" /></div>
                                    <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-text">Pseudo</h2>
                                </div>
                                <form onSubmit={handleUpdateUsername} className="space-y-4 flex-grow">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-text-muted">NOUVEAU PSEUDO</label>
                                        <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-bold text-text placeholder:opacity-30" placeholder="Nouveau pseudo" />
                                    </div>
                                    {usernameError && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20"><AlertCircle className="w-4 h-4" />{usernameError}</div>}
                                    {usernameSuccess && <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20"><CheckCircle2 className="w-4 h-4" />Pseudo mis à jour !</div>}
                                    <button type="submit" disabled={isUpdatingUsername || newUsername === username} className="w-full py-3 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-4">
                                        {isUpdatingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Enregistrer
                                    </button>
                                </form>
                            </div>

                            <div className="bg-surface border border-border p-6 md:p-8 rounded-3xl flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-purple-500/10 p-2 rounded-xl border border-purple-500/20"><Lock className="w-5 h-5 text-purple-400" /></div>
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
                                    {passwordError && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20"><AlertCircle className="w-4 h-4" />{passwordError}</div>}
                                    {passwordSuccess && <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20"><CheckCircle2 className="w-4 h-4" />Mis à jour !</div>}
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
