import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
    Loader2, UserX, Share2, Sparkles, Zap, Flame,
    BookOpen, CheckCircle, Terminal, Ghost,
    Cpu, ShieldCheck, ArrowLeft, Hash,
} from 'lucide-react';
import { calculateLevelProgress } from '@/lib/gamification';

type Profile = {
    id: string; username: string; xp: number; level: number;
    streak: number; clan: string | null; created_at: string;
};
type Mod = { title: string };

const SQUAD: Record<string, { color: string; hex: string; rgb: string; icon: React.ElementType; tagline: string }> = {
    ROOT:   { color: 'text-orange-400', hex: '#fb923c', rgb: '251,146,60',  icon: Terminal,    tagline: 'Les architectes des fondations' },
    VOID:   { color: 'text-violet-400', hex: '#a78bfa', rgb: '167,139,250', icon: Ghost,       tagline: "Les maîtres de l'ombre"         },
    CORE:   { color: 'text-blue-400',   hex: '#60a5fa', rgb: '96,165,250',  icon: Cpu,         tagline: 'Les bâtisseurs de logique'      },
    CYPHER: { color: 'text-green-400',  hex: '#4ade80', rgb: '74,222,128',  icon: ShieldCheck, tagline: 'Les sentinelles du réseau'      },
};

function fmtXP(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}

function Counter({ to, duration = 1000 }: { to: number; duration?: number }) {
    const [v, setV] = useState(0);
    useEffect(() => {
        if (to === 0) return;
        const steps = 36;
        let i = 0;
        const t = setInterval(() => {
            i++;
            setV(Math.round((i / steps) * to));
            if (i >= steps) clearInterval(t);
        }, duration / steps);
        return () => clearInterval(t);
    }, [to, duration]);
    return <>{v}</>;
}

export default function PublicProfilePage() {
    const { username } = useParams<{ username: string }>();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [mods, setMods]       = useState<Mod[]>([]);
    const [rank, setRank]       = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(false);
    const [ready, setReady]     = useState(false);
    const [copied, setCopied]   = useState(false);
    const canvasRef             = useRef<HTMLCanvasElement>(null);

    /* particles */
    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        c.width = c.offsetWidth; c.height = c.offsetHeight;
        const hex = profile?.clan ? (SQUAD[profile.clan]?.hex ?? '#6366f1') : '#6366f1';
        const pts = Array.from({ length: 50 }, () => ({
            x: Math.random() * c.width, y: Math.random() * c.height,
            vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
            r: Math.random() * 1.5 + .5, a: Math.random() * .35 + .05,
        }));
        let raf: number;
        const loop = () => {
            ctx.clearRect(0, 0, c.width, c.height);
            pts.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = c.width; if (p.x > c.width) p.x = 0;
                if (p.y < 0) p.y = c.height; if (p.y > c.height) p.y = 0;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = hex + Math.round(p.a * 255).toString(16).padStart(2, '0');
                ctx.fill();
            });
            raf = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(raf);
    }, [profile?.clan]);

    /* data */
    useEffect(() => {
        if (!username) return;
        setLoading(true);
        (async () => {
            try {
                const { data: p, error: e } = await supabase
                    .from('profiles').select('id,username,xp,level,streak,clan,created_at')
                    .eq('username', username).single();
                if (e || !p) { setError(true); return; }
                setProfile(p);
                const [r1, r2] = await Promise.all([
                    supabase.from('user_modules').select('modules(title)').eq('user_id', p.id).eq('completed', true),
                    supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('xp', p.xp),
                ]);
                setMods((r1.data || []).map((m: any) => m.modules).filter(Boolean));
                setRank((r2.count ?? 0) + 1);
                setTimeout(() => setReady(true), 80);
            } catch { setError(true); }
            finally { setLoading(false); }
        })();
    }, [username]);

    const share = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true); setTimeout(() => setCopied(false), 2500);
    };

    if (loading) return (
        <div className="h-screen bg-background flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-accent animate-spin opacity-40" />
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-text-muted/30 animate-pulse">Chargement...</p>
        </div>
    );

    if (error || !profile) return (
        <div className="h-screen bg-background flex flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
                <UserX className="w-8 h-8 text-rose-400" />
            </div>
            <div><h1 className="text-2xl font-black uppercase tracking-tighter mb-1">Introuvable</h1>
                <p className="text-text-muted text-sm">Ce profil n'existe pas.</p></div>
            <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-black hover:border-accent/30 transition-all">
                <ArrowLeft className="w-3.5 h-3.5" /> Retour
            </Link>
        </div>
    );

    const sq  = profile.clan ? SQUAD[profile.clan] : null;
    const Ico = sq?.icon;
    const hex = sq?.hex ?? '#6366f1';
    const rgb = sq?.rgb ?? '99,102,241';
    const lp  = calculateLevelProgress(profile.xp);
    const ini = profile.username.charAt(0).toUpperCase();

    return (
        <div className="h-screen bg-background text-text font-sans overflow-hidden flex flex-col">
            <style>{`
                @keyframes xp-in { from { width:0 } to { width:${lp.progress}% } }
                @keyframes in-up { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
                @keyframes in-scale { from { opacity:0; transform:scale(.88) } to { opacity:1; transform:none } }
                @keyframes cnt-in { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }
                .xp-bar  { animation: xp-in 1.3s cubic-bezier(.16,1,.3,1) .5s both }
                .in-up   { animation: in-up .55s cubic-bezier(.16,1,.3,1) both }
                .in-scl  { animation: in-scale .5s cubic-bezier(.34,1.56,.64,1) both }
                .cnt-in  { animation: cnt-in .5s ease .6s both }
            `}</style>

            {/* bg canvas */}
            <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none"
                style={{ opacity: ready ? .5 : 0, transition: 'opacity 1.2s ease' }} />

            {/* top glow */}
            <div className="fixed inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse 70% 40% at 50% 0%, rgba(${rgb},.15), transparent 65%)` }} />

            {/* ── Top bar ── */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.04] shrink-0">
                <Link to="/" className="inline-flex items-center gap-1.5 text-text-muted/40 hover:text-text text-[10px] font-black uppercase tracking-widest transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Ekloud
                </Link>
                <button onClick={share}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105"
                    style={{ color: hex, background: `rgba(${rgb},.1)`, border: `1px solid rgba(${rgb},.25)` }}>
                    <Share2 className="w-3.5 h-3.5" /> Partager
                </button>
            </div>

            {/* ── Main grid ── */}
            <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-0 min-h-0">

                {/* ════ LEFT PANEL — Identity ════ */}
                <div className="flex flex-col items-center justify-center px-8 py-8 border-r border-white/[0.04] gap-6">

                    {/* Avatar */}
                    <div className="in-scl relative" style={{ animationDelay: '0ms' }}>
                        <div className="pulse-glow absolute inset-0 rounded-[28px]"
                            style={{ boxShadow: `0 0 0 6px rgba(${rgb},.1), 0 0 50px rgba(${rgb},.2)` }} />
                        <div className="relative w-28 h-28 rounded-[24px] flex items-center justify-center text-5xl font-black select-none"
                            style={{
                                background: `linear-gradient(135deg, rgba(${rgb},.22), rgba(${rgb},.05))`,
                                border: `2px solid rgba(${rgb},.35)`,
                                boxShadow: `inset 0 1px 0 rgba(255,255,255,.07), 0 16px 48px rgba(${rgb},.25)`,
                            }}>
                            {ini}
                        </div>
                        {sq && Ico && (
                            <div className="in-scl absolute -bottom-3 -right-3 w-10 h-10 rounded-xl flex items-center justify-center border-2 border-background"
                                style={{ background: `rgba(${rgb},.2)`, borderColor: hex + '44', boxShadow: `0 4px 14px rgba(${rgb},.3)`, animationDelay: '200ms' }}>
                                <Ico className="w-5 h-5" style={{ color: hex }} />
                            </div>
                        )}
                    </div>

                    {/* Name */}
                    <div className="text-center in-up" style={{ animationDelay: '80ms' }}>
                        {sq && <p className="text-[9px] font-black uppercase tracking-[0.45em] mb-2 opacity-50" style={{ color: hex }}>{sq.tagline}</p>}
                        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none"
                            style={{ textShadow: `0 0 60px rgba(${rgb},.45)` }}>
                            {profile.username}
                        </h1>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap justify-center gap-2 in-up" style={{ animationDelay: '140ms' }}>
                        {sq ? (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${sq.color}`}
                                style={{ background: `rgba(${rgb},.12)`, border: `1px solid rgba(${rgb},.28)` }}>
                                {Ico && <Ico className="w-3 h-3" />}{profile.clan}
                            </span>
                        ) : (
                            <span className="inline-flex px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-text-muted/30 bg-white/[.03] border border-white/[.06]">Aucune squad</span>
                        )}
                        <span className="inline-flex px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-text-muted/40 bg-white/[.03] border border-white/[.06]">
                            Niveau {profile.level}
                        </span>
                        {profile.streak > 0 && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/10 border border-orange-400/20">
                                <Flame className="w-3 h-3" />{profile.streak}j
                            </span>
                        )}
                    </div>

                    {/* XP bar */}
                    <div className="w-full in-up" style={{ animationDelay: '200ms' }}>
                        <div className="flex items-end justify-between mb-1.5">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black cnt-in" style={{ color: hex }}>
                                    {ready ? <Counter to={profile.xp} /> : 0}
                                </span>
                                <span className="text-text-muted/30 text-xs font-black">XP</span>
                            </div>
                            <span className="text-[9px] text-text-muted/25 font-black">
                                {lp.currentLevelXp}/{lp.requiredXpForNext} → niv.{profile.level + 1}
                            </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full overflow-hidden"
                            style={{ background: `rgba(${rgb},.1)`, border: `1px solid rgba(${rgb},.12)` }}>
                            <div className="xp-bar h-full rounded-full"
                                style={{ background: `linear-gradient(90deg,${hex}99,${hex})`, boxShadow: `0 0 12px rgba(${rgb},.6)` }} />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[8px] font-black text-text-muted/20 uppercase tracking-widest">Niv.{profile.level}</span>
                            <span className="text-[8px] font-black text-text-muted/20 uppercase tracking-widest">{Math.round(lp.progress)}%</span>
                        </div>
                    </div>
                </div>

                {/* ════ RIGHT PANEL — Stats + Modules ════ */}
                <div className="flex flex-col min-h-0 px-6 py-8 gap-6">

                    {/* Stat cards row */}
                    <div className="grid grid-cols-3 gap-3 shrink-0">
                        {[
                            { icon: Hash,     label: 'Rang',    value: rank ?? 0,            color: hex,       rgb, isXP: false },
                            { icon: BookOpen, label: 'Modules', value: mods.length,           color: '#60a5fa', rgb: '96,165,250', isXP: false },
                            { icon: Zap,      label: 'XP',      value: profile.xp,            color: hex,       rgb, isXP: true  },
                        ].map(({ icon: Icon, label, value, color, rgb: cr, isXP }, i) => (
                            <div key={label}
                                className="in-scl relative overflow-hidden flex flex-col items-center justify-center gap-1 py-6 rounded-2xl"
                                style={{
                                    animationDelay: `${180 + i * 70}ms`,
                                    background: `rgba(${cr},.07)`,
                                    border: `1px solid rgba(${cr},.18)`,
                                    boxShadow: `inset 0 1px 0 rgba(255,255,255,.04)`,
                                }}>
                                <Icon className="absolute opacity-[.04] w-14 h-14 -bottom-1 -right-1" style={{ color }} />
                                <Icon className="w-4 h-4 mb-0.5 opacity-40" style={{ color }} />
                                <span className="text-2xl font-black cnt-in" style={{ color, animationDelay: `${600 + i * 80}ms` }}>
                                    {ready ? (isXP ? fmtXP(value) : <Counter to={value} />) : (isXP ? '0' : 0)}
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-text-muted/25">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Modules list — scrollable within right panel */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center gap-2 mb-3 shrink-0">
                            <div className="w-0.5 h-4 rounded-full" style={{ backgroundColor: hex }} />
                            <span className="text-[9px] font-black uppercase tracking-[0.35em] text-text-muted/40">Modules complétés</span>
                            <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{ color: hex, background: `rgba(${rgb},.1)`, border: `1px solid rgba(${rgb},.18)` }}>
                                {mods.length}
                            </span>
                        </div>

                        {mods.length > 0 ? (
                            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 content-start"
                                style={{ scrollbarWidth: 'thin', scrollbarColor: `rgba(${rgb},.2) transparent` }}>
                                {mods.map((m, i) => (
                                    <div key={i}
                                        className="in-up flex items-center gap-3 px-4 py-2.5 rounded-xl hover:scale-[1.01] transition-transform"
                                        style={{
                                            animationDelay: `${400 + i * 35}ms`,
                                            background: 'rgba(255,255,255,.02)',
                                            border: '1px solid rgba(255,255,255,.04)',
                                        }}>
                                        <CheckCircle className="w-3.5 h-3.5 shrink-0 opacity-50" style={{ color: hex }} />
                                        <span className="text-sm truncate text-text-muted/55">{m.title}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-text-muted/25 text-sm text-center">Aucun module terminé pour le moment.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-text-muted/15 text-center shrink-0">
                        ekloud · réseau d'apprentissage
                    </p>
                </div>
            </div>

            {/* Toast */}
            {copied && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl backdrop-blur-xl text-sm font-black animate-in fade-in slide-in-from-bottom-4 duration-300 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <Sparkles className="w-4 h-4" /> Lien copié !
                </div>
            )}
        </div>
    );
}
