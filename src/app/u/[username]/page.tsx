import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
    Loader2, Trophy, Flame, Zap, Shield, UserX, ArrowLeft,
    Share2, CheckCircle, BookOpen, Calendar, Medal, Star, Hash
} from 'lucide-react';
import { formatXP, calculateLevelProgress } from '@/lib/gamification';
import { getUserBadges, RARITY_CONFIG, type UserBadge } from '@/lib/badges';
import BadgeCard from '@/components/BadgeCard';

type Profile = {
    id: string;
    username: string;
    xp: number;
    level: number;
    streak: number;
    clan: string | null;
    created_at: string;
};

const CLAN_CONFIG: Record<string, { color: string; bg: string; border: string; hex: string; label: string }> = {
    ROOT:   { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', hex: '#fb923c', label: 'Les architectes des fondations' },
    VOID:   { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', hex: '#a78bfa', label: "Les maîtres de l'ombre" },
    CORE:   { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   hex: '#60a5fa', label: 'Les bâtisseurs de logique' },
    CYPHER: { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  hex: '#4ade80', label: 'Les sentinelles du réseau' },
};

const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };

export default function PublicProfilePage() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();

    const [profile, setProfile]             = useState<Profile | null>(null);
    const [badges, setBadges]               = useState<UserBadge[]>([]);
    const [completedModules, setModules]    = useState(0);
    const [completedLessons, setLessons]    = useState(0);
    const [rank, setRank]                   = useState<number | null>(null);
    const [isLoading, setIsLoading]         = useState(true);
    const [error, setError]                 = useState(false);
    const [copied, setCopied]               = useState(false);
    const [tab, setTab]                     = useState<'overview' | 'badges'>('overview');

    useEffect(() => {
        async function load() {
            if (!username) return;
            setIsLoading(true);
            try {
                const { data: p, error: e } = await supabase
                    .from('profiles').select('*').eq('username', username).single();
                if (e || !p) { setError(true); return; }
                setProfile(p);

                const [b, m, l, r] = await Promise.all([
                    getUserBadges(p.id),
                    supabase.from('user_modules').select('*', { count: 'exact', head: true }).eq('user_id', p.id).eq('completed', true),
                    supabase.from('user_lessons').select('*', { count: 'exact', head: true }).eq('user_id', p.id).eq('completed', true),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('xp', p.xp),
                ]);
                setBadges(b);
                setModules(m.count || 0);
                setLessons(l.count || 0);
                setRank((r.count || 0) + 1);
            } catch { setError(true); }
            finally { setIsLoading(false); }
        }
        load();
    }, [username]);

    if (isLoading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent animate-spin opacity-40" />
        </div>
    );

    if (error || !profile) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-5">
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
                <UserX className="w-8 h-8 text-rose-500" />
            </div>
            <div>
                <h1 className="text-xl font-black uppercase tracking-tight mb-1">Hacker introuvable</h1>
                <p className="text-text-muted text-sm max-w-xs">Ce pseudo n'existe pas sur le réseau Ekloud.</p>
            </div>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-bold hover:border-accent/40 transition-all">
                <ArrowLeft className="w-4 h-4" /> Retour
            </button>
        </div>
    );

    const { progress, currentLevelXp, requiredXpForNext } = calculateLevelProgress(profile.xp);
    const clan   = profile.clan ? CLAN_CONFIG[profile.clan] : null;
    const accentHex = clan?.hex || '#818cf8';
    const since  = new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const sorted = [...badges].sort((a, b) =>
        (RARITY_ORDER[a.badge_definitions.rarity as keyof typeof RARITY_ORDER] || 3) -
        (RARITY_ORDER[b.badge_definitions.rarity as keyof typeof RARITY_ORDER] || 3)
    );
    const topBadges = sorted.slice(0, 5);

    return (
        <div className="min-h-screen bg-background text-text font-sans pb-20">

            {/* ══════════════════════════════════════════
                HERO — Banner Discord-like + avatar qui dépasse
            ══════════════════════════════════════════ */}
            <div className="relative">
                {/* Banner */}
                <div className="h-32 md:h-44 w-full overflow-hidden relative"
                    style={{
                        background: `linear-gradient(135deg, ${accentHex}30 0%, ${accentHex}10 40%, transparent 70%)`,
                        backgroundColor: 'var(--surface)',
                    }}>
                    {/* Motif grille subtil */}
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: `radial-gradient(circle, ${accentHex} 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
                </div>

                {/* Avatar flottant Discord-like */}
                <div className="absolute left-6 md:left-10 -bottom-1 translate-y-1/2">
                    <div className="relative">
                        <div
                            className="w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-3xl border-4 border-background flex items-center justify-center text-3xl md:text-5xl font-black shadow-2xl"
                            style={{ backgroundColor: `${accentHex}25`, color: accentHex }}
                        >
                            {profile.username.charAt(0).toUpperCase()}
                        </div>
                        {/* Badge niveau */}
                        <div className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-lg border-2 border-background text-[10px] font-black shadow-lg"
                            style={{ backgroundColor: accentHex, color: '#fff' }}>
                            {profile.level}
                        </div>
                    </div>
                </div>

                {/* Bouton partager top-right */}
                <div className="absolute top-4 right-6">
                    <button
                        onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all ${copied ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-background/60 border-border/60 text-text-muted hover:text-text hover:border-accent/40'}`}>
                        {copied ? <><CheckCircle className="w-3.5 h-3.5" />Copié</> : <><Share2 className="w-3.5 h-3.5" />Partager</>}
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                INFOS IDENTITÉ (sous le banner)
            ══════════════════════════════════════════ */}
            <div className="max-w-4xl mx-auto px-6">
                {/* Espace pour l'avatar */}
                <div className="pt-12 md:pt-16 pb-6 border-b border-border/40">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-3">
                                {profile.username}
                            </h1>
                            {/* Badges identité */}
                            <div className="flex flex-wrap items-center gap-2">
                                {profile.clan && clan && (
                                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${clan.bg} ${clan.color} ${clan.border}`}>
                                        <Shield className="w-3 h-3" />{profile.clan}
                                    </span>
                                )}
                                {rank && rank <= 100 && (
                                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${rank <= 10 ? 'bg-amber-400/10 border-amber-400/20 text-amber-400' : 'bg-accent/10 border-accent/20 text-accent'}`}>
                                        <Medal className="w-3 h-3" />#{rank}
                                    </span>
                                )}
                                {profile.streak >= 7 && (
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-orange-500/10 border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest">
                                        <Flame className="w-3 h-3" />{profile.streak} jours
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted/50 uppercase tracking-widest">
                                    <Calendar className="w-3 h-3" />{since}
                                </span>
                            </div>
                        </div>

                        {/* XP + barre niveau — visible desktop */}
                        <div className="hidden sm:block min-w-[200px]">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-text-muted/50 mb-1.5">
                                <span>Niv. {profile.level} → {profile.level + 1}</span>
                                <span>{formatXP(currentLevelXp)} / {formatXP(requiredXpForNext)}</span>
                            </div>
                            <div className="h-2.5 bg-border/30 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${progress}%`, backgroundColor: accentHex, boxShadow: `0 0 10px ${accentHex}60` }} />
                            </div>
                        </div>
                    </div>

                    {/* Stats 4 colonnes Duolingo-like */}
                    <div className="grid grid-cols-4 gap-3 mt-6">
                        {[
                            { val: formatXP(profile.xp), label: 'XP',      icon: <Zap className="w-3.5 h-3.5" />,     color: 'text-accent' },
                            { val: profile.streak,        label: 'Streak',  icon: <Flame className="w-3.5 h-3.5" />,   color: 'text-orange-400' },
                            { val: completedModules,      label: 'Modules', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'text-emerald-400' },
                            { val: badges.length,         label: 'Badges',  icon: <Trophy className="w-3.5 h-3.5" />,  color: 'text-amber-400' },
                        ].map(s => (
                            <div key={s.label} className="flex flex-col items-center gap-1 py-3 px-2 bg-surface rounded-2xl border border-border/60">
                                <div className={`flex items-center gap-1 text-lg font-black ${s.color}`}>{s.val}</div>
                                <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-text-muted/60 ${s.color}`}>
                                    {s.icon}{s.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════════
                    ONGLETS
                ══════════════════════════════════════════ */}
                <div className="flex gap-6 border-b border-border/40 mt-6 mb-8">
                    {(['overview', 'badges'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`pb-3 text-sm font-black uppercase tracking-widest transition-all border-b-2 -mb-px ${tab === t ? 'text-accent border-accent' : 'text-text-muted/60 border-transparent hover:text-text'}`}>
                            {t === 'overview' ? 'Aperçu' : `Badges · ${badges.length}`}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════════
                    ONGLET APERÇU
                ══════════════════════════════════════════ */}
                {tab === 'overview' && (
                    <div className="grid md:grid-cols-5 gap-6">

                        {/* Colonne principale */}
                        <div className="md:col-span-3 space-y-5">

                            {/* Top badges façon Duolingo */}
                            {topBadges.length > 0 && (
                                <div className="bg-surface border border-border rounded-2xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-amber-400" />
                                            <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">Badges récents</span>
                                        </div>
                                        <button onClick={() => setTab('badges')} className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline">
                                            Voir tout →
                                        </button>
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                        {topBadges.map(ub => (
                                            <BadgeCard key={ub.badge_id} badge={ub.badge_definitions} earnedAt={ub.earned_at} size="lg" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stats parcours */}
                            <div className="bg-surface border border-border rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <BookOpen className="w-4 h-4 text-accent" />
                                    <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">Parcours d'apprentissage</span>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Modules complétés', val: completedModules, color: 'bg-emerald-400', max: 20 },
                                        { label: 'Leçons terminées',  val: completedLessons, color: 'bg-accent',      max: 100 },
                                        { label: 'XP accumulé',       val: profile.xp,       color: 'bg-amber-400',  max: 10000, fmt: formatXP },
                                    ].map(stat => (
                                        <div key={stat.label}>
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-muted/60 mb-1.5">
                                                <span>{stat.label}</span>
                                                <span className="text-text">{stat.fmt ? stat.fmt(stat.val) : stat.val}</span>
                                            </div>
                                            <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${stat.color} transition-all duration-700`}
                                                    style={{ width: `${Math.min(100, (stat.val / stat.max) * 100)}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar droite */}
                        <div className="md:col-span-2 space-y-4">

                            {/* Barre de niveau (mobile visible ici) */}
                            <div className="sm:hidden bg-surface border border-border rounded-2xl p-4">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-text-muted/50 mb-2">
                                    <span>Niv. {profile.level}</span>
                                    <span>{formatXP(currentLevelXp)} / {formatXP(requiredXpForNext)}</span>
                                </div>
                                <div className="h-2 bg-border/30 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: accentHex }} />
                                </div>
                            </div>

                            {/* Rang */}
                            {rank && (
                                <div className={`p-5 rounded-2xl border ${rank <= 10 ? 'bg-amber-400/5 border-amber-400/20' : rank <= 50 ? 'bg-accent/5 border-accent/20' : 'bg-surface border-border'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Hash className={`w-4 h-4 ${rank <= 10 ? 'text-amber-400' : 'text-accent'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">Classement mondial</span>
                                    </div>
                                    <div className={`text-4xl font-black ${rank <= 10 ? 'text-amber-400' : rank <= 50 ? 'text-accent' : 'text-text'}`}>
                                        #{rank}
                                    </div>
                                    <div className="text-[10px] font-bold text-text-muted/60 mt-1">
                                        {rank <= 10 ? '🔥 Top 10' : rank <= 50 ? '⭐ Top 50' : rank <= 100 ? '💪 Top 100' : `sur ${rank + 1}+ hackers`}
                                    </div>
                                </div>
                            )}

                            {/* Clan */}
                            {profile.clan && clan && (
                                <div className={`p-5 rounded-2xl border ${clan.bg} ${clan.border}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Shield className={`w-4 h-4 ${clan.color}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">TechSquad</span>
                                    </div>
                                    <div className={`text-2xl font-black ${clan.color} mb-1`}>{profile.clan}</div>
                                    <p className="text-[10px] text-text-muted/60 font-medium leading-relaxed">{clan.label}</p>
                                </div>
                            )}

                            {/* Collection badges résumé */}
                            {badges.length > 0 && (
                                <div className="p-5 bg-surface border border-border rounded-2xl">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Trophy className="w-4 h-4 text-amber-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">Collection</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['legendary', 'epic', 'rare', 'common'] as const).map(r => {
                                            const count = badges.filter(b => b.badge_definitions.rarity === r).length;
                                            if (!count) return null;
                                            const conf = RARITY_CONFIG[r];
                                            return (
                                                <div key={r} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${conf.bg} ${conf.border}`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${conf.color}`}>{conf.label}</span>
                                                    <span className={`text-sm font-black ${conf.color}`}>{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════
                    ONGLET BADGES — groupés par rareté
                ══════════════════════════════════════════ */}
                {tab === 'badges' && (
                    <div className="space-y-8">
                        {sorted.length === 0 ? (
                            <div className="text-center py-16 bg-surface/20 rounded-2xl border border-dashed border-border">
                                <Trophy className="w-10 h-10 text-text-muted/20 mx-auto mb-3" />
                                <p className="text-text-muted text-sm">Aucun badge obtenu pour l'instant.</p>
                            </div>
                        ) : (
                            (['legendary', 'epic', 'rare', 'common'] as const).map(rarity => {
                                const group = sorted.filter(b => b.badge_definitions.rarity === rarity);
                                if (!group.length) return null;
                                const conf = RARITY_CONFIG[rarity];
                                return (
                                    <div key={rarity}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${conf.color}`}>{conf.label}</span>
                                            <div className="flex-1 h-px bg-border/40" />
                                            <span className={`text-[9px] font-black ${conf.color} opacity-60`}>{group.length}</span>
                                        </div>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
                                            {group.map(ub => (
                                                <BadgeCard key={ub.badge_id} badge={ub.badge_definitions} earnedAt={ub.earned_at} size="md" />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Toast copié */}
            {copied && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-xl">
                    <CheckCircle className="w-4 h-4" /><span className="font-black text-sm uppercase tracking-widest">Lien copié !</span>
                </div>
            )}
        </div>
    );
}
