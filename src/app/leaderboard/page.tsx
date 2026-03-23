import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Trophy, Medal, Flame, Loader2, Crown, Users, Globe } from 'lucide-react';
import { formatXP, calculateLevelFromXp } from '@/lib/gamification';

type LeaderboardUser = {
    id: string;
    xp: number;
    level: number;
    streak: number;
    username: string | null;
    clan: string | null;
};

type ViewType = 'global' | 'friends';

export default function LeaderboardPage() {
    const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<ViewType>('global');
    const { user, isLoading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading) return;

        async function fetchLeaders() {
            setIsLoading(true);
            try {
                if (view === 'global') {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('id, xp, level, streak, username, clan')
                        .order('xp', { ascending: false })
                        .limit(50);
                    if (error) throw error;
                    setLeaders(data as LeaderboardUser[] || []);
                } else {
                    if (!user) {
                        setLeaders([]);
                        setIsLoading(false);
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
                console.error('LeaderboardPage: fetchLeaders error:', err);
                setLeaders([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchLeaders();
    }, [view, user?.id, authLoading]);

    return (
        <div className="min-h-screen bg-background text-text flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-accent/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12 relative z-10">
                <div className="text-center mb-12 animate-in slide-in-from-bottom-4 fade-in duration-700">
                    <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-accent/10 rounded-full border border-accent/20 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                        <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
                        Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">Fame</span>
                    </h1>
                    <p className="text-text-muted text-lg max-w-2xl mx-auto mb-8">
                        Les meilleurs hackers de la plateforme. Gagnez de l'XP en complétant des modules et des quiz pour grimper dans le classement !
                    </p>

                    <div className="flex items-center justify-center gap-2 p-1 bg-surface/50 border border-border rounded-2xl w-fit mx-auto backdrop-blur-sm">
                        <button
                            onClick={() => setView('global')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'global'
                                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                : 'text-text-muted hover:text-text hover:bg-surface-hover'
                                }`}
                        >
                            <Globe className="w-4 h-4" />
                            Mondial
                        </button>
                        <button
                            onClick={() => setView('friends')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'friends'
                                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                : 'text-text-muted hover:text-text hover:bg-surface-hover'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Amis
                        </button>
                    </div>
                </div>

                <div className="bg-surface/50 border border-border rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl min-h-[400px] relative">
                    <div key={view} className="animate-in fade-in duration-500 fill-mode-both">
                        <div className="overflow-x-auto">
                            <table className={`w-full text-left border-collapse whitespace-nowrap transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                                <thead>
                                    <tr className="border-b border-border bg-surface-hover/10">
                                        <th className="p-3 sm:p-6 text-xs sm:text-sm font-bold text-text-muted uppercase tracking-wider w-12 sm:w-16 text-center">Rang</th>
                                        <th className="p-3 sm:p-6 text-xs sm:text-sm font-bold text-text-muted uppercase tracking-wider">Hacker</th>
                                        <th className="hidden md:table-cell p-4 sm:p-6 text-xs sm:text-sm font-bold text-text-muted uppercase tracking-wider text-center">TechSquad</th>
                                        <th className="hidden md:table-cell p-4 sm:p-6 text-xs sm:text-sm font-bold text-text-muted uppercase tracking-wider text-center">Niveau</th>
                                        <th className="hidden md:table-cell p-4 sm:p-6 text-xs sm:text-sm font-bold text-text-muted uppercase tracking-wider text-right">Série</th>
                                        <th className="p-3 sm:p-6 text-xs sm:text-sm font-bold text-text-muted uppercase tracking-wider text-right">XP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!isLoading && leaders.map((leader, index) => {
                                        const isCurrentUser = !!(user && user.id === leader.id);
                                        return (
                                            <tr
                                                key={leader.id}
                                                className={`border-b border-border last:border-0 hover:bg-surface-hover/20 transition-colors ${isCurrentUser ? 'bg-accent/5 relative' : ''}`}
                                            >
                                                <td className="p-3 sm:p-6 text-center relative">
                                                    {isCurrentUser && (
                                                        <div className="absolute inset-y-0 left-0 w-1 bg-accent rounded-r-full" />
                                                    )}
                                                    {index === 0 ? (
                                                        <Crown className="w-5 h-5 sm:w-8 sm:h-8 text-yellow-400 mx-auto drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                                                    ) : index === 1 ? (
                                                        <Medal className="w-5 h-5 sm:w-7 sm:h-7 text-gray-300 mx-auto" />
                                                    ) : index === 2 ? (
                                                        <Medal className="w-5 h-5 sm:w-7 sm:h-7 text-amber-700 mx-auto" />
                                                    ) : (
                                                        <span className="text-text-muted font-bold text-xs sm:text-base">{index + 1}</span>
                                                    )}
                                                </td>
                                                <td className="p-3 sm:p-6">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-accent to-purple-500 opacity-80 shrink-0" />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className={`font-bold text-sm sm:text-base truncate max-w-[120px] sm:max-w-none ${isCurrentUser ? 'text-accent' : 'text-text'}`}>
                                                                {leader.username ?? (isCurrentUser ? 'Vous' : `Hacker #${leader.id.substring(0, 4)}`)}
                                                            </span>
                                                            <div className="md:hidden flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[10px] bg-surface-hover/50 border border-border px-1.5 py-[1px] rounded text-text-muted">Lvl {calculateLevelFromXp(leader.xp || 0)}</span>
                                                                {leader.clan && <span className="text-[10px] text-text-muted border border-border px-1.5 py-[1px] rounded">{leader.clan}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell p-4 sm:p-6 text-center">
                                                    {leader.clan ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-xs font-bold whitespace-nowrap">
                                                            <span className={`w-2.5 h-2.5 rounded-full ${leader.clan === 'ROOT' ? 'bg-orange-400' :
                                                                leader.clan === 'VOID' ? 'bg-violet-400' :
                                                                    leader.clan === 'CORE' ? 'bg-blue-400' :
                                                                        leader.clan === 'CYPHER' ? 'bg-green-400' : 'bg-accent'
                                                                }`} />
                                                            {leader.clan}
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-400/70 font-mono text-[10px] tracking-widest font-bold whitespace-nowrap bg-red-400/10 px-2 py-1 rounded-md border border-red-500/20">
                                                            INACTIVE
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="hidden md:table-cell p-4 sm:p-6 text-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-border text-sm font-bold">
                                                        {calculateLevelFromXp(leader.xp || 0)}
                                                    </span>
                                                </td>
                                                <td className="hidden md:table-cell p-4 sm:p-6 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 text-orange-400 font-bold">
                                                        <Flame className={`w-4 h-4 ${(leader.streak || 0) > 2 ? 'fill-orange-400/20' : ''}`} />
                                                        <span>{leader.streak || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 sm:p-6 text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="font-black text-text bg-surface-hover/50 py-1 px-2 sm:py-1.5 sm:px-3 rounded-lg border border-border text-[11px] sm:text-base whitespace-nowrap">
                                                            {formatXP(leader.xp || 0)} XP
                                                        </span>
                                                        <span className="md:hidden flex items-center gap-1 text-[10px] text-orange-400 font-bold px-1"><Flame className="w-3 h-3"/> {leader.streak || 0}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {isLoading && (
                                <div className="absolute inset-x-0 top-[200px] flex justify-center pointer-events-none">
                                    <div className="bg-background/20 backdrop-blur-sm p-4 rounded-full">
                                        <Loader2 className="w-8 h-8 text-accent animate-spin" />
                                    </div>
                                </div>
                            )}

                            {!isLoading && leaders.length === 0 && (
                                <div className="text-center py-20 text-text-muted">
                                    {view === 'global'
                                        ? 'Aucun hacker classé pour le moment.'
                                        : "Vous n'avez pas encore d'amis dans votre classement."}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
