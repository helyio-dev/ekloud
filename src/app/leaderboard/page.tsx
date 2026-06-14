import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Trophy, Medal, Flame, Loader2, Crown, Users, Globe, Target, Sparkles } from 'lucide-react';
import { formatXP, calculateLevelFromXp } from '@/lib/gamification';

/**
 * structure de données pour un utilisateur du classement.
 */
type LeaderboardUser = {
    id: string;
    xp: number;
    level: number;
    streak: number;
    username: string | null;
    clan: string | null;
};

/**
 * types de vues disponibles pour le classement.
 */
type ViewType = 'global' | 'friends';

/**
 * page du classement (leaderboard).
 * affiche les hackers les plus performants de la plateforme avec un système de rangs.
 * permet de basculer entre une vue mondiale et une vue restreinte au cercle d'amis.
 */
export default function LeaderboardPage() {
    const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<ViewType>('global');
    const { user, isLoading: authLoading } = useAuth();

    /**
     * synchronise les données du classement avec supabase selon la vue sélectionnée.
     */
    useEffect(() => {
        if (authLoading) return;

        async function fetchLeaders() {
            setIsLoading(true);
            try {
                if (view === 'global') {
                    // récupération des 50 meilleurs profils par xp décroissant
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('id, xp, level, streak, username, clan')
                        .order('xp', { ascending: false })
                        .limit(50);
                    
                    if (error) throw error;
                    setLeaders(data as LeaderboardUser[] || []);
                } else {
                    // filtrage des données pour n'afficher que le cercle social de l'utilisateur
                    if (!user) {
                        setLeaders([]);
                        return;
                    }

                    const { data: friendships, error: friendError } = await supabase
                        .from('friendships')
                        .select('user_id1, user_id2')
                        .eq('status', 'accepted')
                        .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);
                    
                    if (friendError) throw friendError;

                    const friendIds = new Set<string>();
                    friendIds.add(user.id);
                    friendships?.forEach(f => {
                        friendIds.add(f.user_id1);
                        friendIds.add(f.user_id2);
                    });

                    const { data, error } = await supabase
                        .from('profiles')
                        .select('id, xp, level, streak, username, clan')
                        .in('id', Array.from(friendIds))
                        .order('xp', { ascending: false });
                    
                    if (error) throw error;
                    setLeaders(data as LeaderboardUser[] || []);
                }
            } catch (err) {
                console.error('leaderboard fetch error:', err);
                setLeaders([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchLeaders();
    }, [view, user?.id, authLoading]);

    return (
        <div className="min-h-screen bg-background text-text flex flex-col relative overflow-hidden font-sans">
            {/* effets atmosphériques de fond */}
            <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-accent/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-50" />
            <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-purple-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none opacity-30" />

            <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-16 relative z-10">
                {/* en-tête de la page avec animation d'entrée */}
                <header className="text-center mb-16 animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-both">
                    <div className="inline-flex items-center justify-center p-5 bg-accent/10 rounded-[2rem] border border-accent/20 mb-8 shadow-[0_0_50px_rgba(99,102,241,0.15)] relative group overflow-hidden">
                        <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <Trophy className="w-12 h-12 text-accent relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                    </div>
                    
                    <h1 className="text-5xl sm:text-7xl font-black mb-6 tracking-tight font-equinox uppercase">
                        hall of <span className="text-gradient">fame</span>
                    </h1>
                    
                    <p className="text-text-muted/80 text-xl max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
                        les hackers de l'élite. progressez dans vos parcours, validez vos parcours et dominez le classement mondial.
                    </p>

                    {/* sélecteur de vue (tabs) */}
                    <nav className="flex items-center justify-center gap-3 p-1.5 bg-surface/40 backdrop-blur-3xl border border-border/60 rounded-[2.5rem] w-fit mx-auto shadow-2xl">
                        <button
                            onClick={() => setView('global')}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all duration-500 ${view === 'global'
                                ? 'bg-accent text-white shadow-[0_10px_30px_rgba(99,102,241,0.3)] scale-105'
                                : 'text-text-muted hover:text-text hover:bg-surface-hover/50'
                                }`}
                        >
                            <Globe size={18} />
                            mondial
                        </button>
                        <button
                            onClick={() => setView('friends')}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all duration-500 ${view === 'friends'
                                ? 'bg-accent text-white shadow-[0_10px_30px_rgba(99,102,241,0.3)] scale-105'
                                : 'text-text-muted hover:text-text hover:bg-surface-hover/50'
                                }`}
                        >
                            <Users size={18} />
                            amis
                        </button>
                    </nav>
                </header>

                {/* conteneur de données (tableau interactif) */}
                <section className="bg-surface/30 border border-border/80 rounded-[4rem] overflow-hidden backdrop-blur-3xl shadow-[0_50px_100px_-30px_rgba(0,0,0,0.4)] min-h-[500px] relative">
                    <div key={view} className="animate-in fade-in zoom-in-95 duration-700 fill-mode-both">
                        <div className="overflow-x-auto no-scrollbar">
                            <table className={`w-full text-left border-collapse whitespace-nowrap transition-all duration-500 ${isLoading ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
                                <thead>
                                    <tr className="border-b border-border/60 bg-surface-hover/20">
                                        <th className="p-8 text-[10px] font-black text-text-muted uppercase tracking-[0.4em] w-24 text-center">rang</th>
                                        <th className="p-8 text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">nom du hacker</th>
                                        <th className="hidden lg:table-cell p-8 text-[10px] font-black text-text-muted uppercase tracking-[0.4em] text-center">tech-squad</th>
                                        <th className="hidden lg:table-cell p-8 text-[10px] font-black text-text-muted uppercase tracking-[0.4em] text-center">niveau</th>
                                        <th className="hidden md:table-cell p-8 text-[10px] font-black text-text-muted uppercase tracking-[0.4em] text-right">série</th>
                                        <th className="p-8 text-[10px] font-black text-text-muted uppercase tracking-[0.4em] text-right">potentiel xp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {!isLoading && leaders.map((leader, index) => {
                                        const isCurrentUser = !!(user && user.id === leader.id);
                                        const level = calculateLevelFromXp(leader.xp || 0);
                                        
                                        return (
                                            <tr
                                                key={leader.id}
                                                className={`group hover:bg-accent/5 transition-all duration-500 relative ${isCurrentUser ? 'bg-accent-[0.03]' : ''}`}
                                            >
                                                <td className="p-8 text-center relative">
                                                    {isCurrentUser && (
                                                        <div className="absolute inset-y-4 left-0 w-1.5 bg-accent rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                                                    )}
                                                    <div className="flex items-center justify-center">
                                                        {index === 0 ? (
                                                            <div className="relative">
                                                                <Crown className="w-10 h-10 text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-bounce duration-[3000ms] ease-in-out" />
                                                                <div className="absolute -inset-2 bg-amber-400/20 blur-xl rounded-full opacity-30 animate-pulse" />
                                                            </div>
                                                        ) : index === 1 ? (
                                                            <Medal className="w-8 h-8 text-slate-300 drop-shadow-[0_0_10px_rgba(148,163,184,0.4)]" />
                                                        ) : index === 2 ? (
                                                            <Medal className="w-8 h-8 text-amber-700/80 drop-shadow-[0_0_10px_rgba(180,83,9,0.3)]" />
                                                        ) : (
                                                            <span className="text-text-muted font-black text-lg opacity-40 group-hover:opacity-100 transition-opacity">{index + 1}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                
                                                <td className="p-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent via-purple-600 to-indigo-600 p-[1px] shadow-lg group-hover:rotate-6 transition-transform duration-500">
                                                            <div className="w-full h-full rounded-[0.9rem] bg-surface flex items-center justify-center overflow-hidden">
                                                                <div className="w-full h-full bg-accent/10 flex items-center justify-center text-accent font-black text-xl">
                                                                    {leader.username?.substring(0, 1).toUpperCase() || 'H'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1 min-w-0">
                                                            <span className={`font-black text-lg tracking-tight truncate max-w-[200px] sm:max-w-none group-hover:text-accent transition-colors ${isCurrentUser ? 'text-accent' : 'text-text'}`}>
                                                                {leader.username ?? (isCurrentUser ? 'votre profil' : `hacker_#${leader.id.substring(0, 4)}`)}
                                                            </span>
                                                            <div className="lg:hidden flex items-center gap-3">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/60 bg-surface-hover/80 px-2 py-0.5 rounded-md border border-border/40">lvl {level}</span>
                                                                {leader.clan && <span className="text-[9px] font-black uppercase tracking-widest text-accent/80 border border-accent/20 bg-accent/5 px-2 py-0.5 rounded-md">{leader.clan}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="hidden lg:table-cell p-8 text-center">
                                                    {leader.clan ? (
                                                        <span className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-surface-hover/40 border border-border/60 text-[10px] font-black tracking-widest uppercase shadow-sm group-hover:border-accent/30 group-hover:bg-accent/5 transition-all">
                                                            <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${leader.clan === 'ROOT' ? 'bg-orange-500 box-shadow-[0_0_10px_rgba(249,115,22,0.5)]' :
                                                                leader.clan === 'VOID' ? 'bg-violet-500 box-shadow-[0_0_10px_rgba(139,92,246,0.5)]' :
                                                                    leader.clan === 'CORE' ? 'bg-blue-500 box-shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                                                                        leader.clan === 'CYPHER' ? 'bg-emerald-500 box-shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-accent'
                                                                }`} />
                                                            {leader.clan}
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-500/40 font-black text-[9px] tracking-[0.2em] uppercase px-4 py-1.5 rounded-full border border-red-500/10 bg-red-500/5">
                                                            inactive
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="hidden lg:table-cell p-8 text-center">
                                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-[1rem] bg-surface-hover/40 border border-border/60 text-base font-black group-hover:border-accent/40 group-hover:text-accent transition-all shadow-inner">
                                                        {level}
                                                    </div>
                                                </td>

                                                <td className="hidden md:table-cell p-8 text-right">
                                                    <div className="flex items-center justify-end gap-2 text-orange-400 font-black text-lg">
                                                        <Flame className={`w-6 h-6 ${(leader.streak || 0) > 3 ? 'fill-orange-400/20 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)] animate-pulse' : ''}`} />
                                                        <span className="tracking-tighter">{leader.streak || 0}</span>
                                                    </div>
                                                </td>
                                                
                                                <td className="p-8 text-right">
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="font-black text-text bg-surface-hover/60 py-2.5 px-5 rounded-[1.25rem] border border-border/80 text-base tracking-tight flex items-center gap-3 group-hover:border-accent/40 group-hover:bg-accent/5 transition-all shadow-sm">
                                                            <Sparkles size={16} className="text-accent opacity-60 group-hover:opacity-100 transition-opacity" />
                                                            {formatXP(leader.xp || 0)} <span className="text-text-muted/50 group-hover:text-accent/50">xp</span>
                                                        </div>
                                                        <div className="md:hidden flex items-center gap-2 text-[10px] text-orange-400 font-black uppercase tracking-widest px-2">
                                                            <Flame size={12} /> {leader.streak || 0} jours
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* indicateur de chargement centralisé */}
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-surface/20 backdrop-blur-[2px] z-20">
                                    <div className="bg-surface p-8 rounded-[3rem] border border-border/60 shadow-2xl flex flex-col items-center gap-6">
                                        <Loader2 className="w-12 h-12 text-accent animate-spin opacity-40" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted">synchronisation...</span>
                                    </div>
                                </div>
                            )}

                            {/* état vide (empty state) */}
                            {!isLoading && leaders.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-40 gap-8 animate-in fade-in duration-1000">
                                    <div className="w-20 h-20 bg-surface-hover rounded-full flex items-center justify-center border border-border/60">
                                        <Target className="w-10 h-10 text-text-muted/40" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-2xl font-black text-text-muted uppercase tracking-widest">zone isolée</p>
                                        <p className="text-sm text-text-muted/60 font-medium max-w-xs mx-auto leading-relaxed">
                                            {view === 'global'
                                                ? 'aucun hacker n\'a encore franchi les portes du classement mondial.'
                                                : "votre radar ne détecte aucun ami actif dans cette fréquence."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
                
                {/* pied de page informatif ou actions supplémentaires */}
                <footer className="mt-16 text-center animate-in fade-in slide-in-from-top-4 duration-1000 delay-500 fill-mode-both">
                    <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.5em] flex items-center justify-center gap-4">
                        <span className="w-12 h-px bg-border/20" />
                        ekloud global ranking protocol v2.4
                        <span className="w-12 h-px bg-border/20" />
                    </p>
                </footer>
            </main>
        </div>
    );
}
