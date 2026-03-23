import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Search, UserPlus, CheckCircle, XCircle, Loader2, UserMinus } from 'lucide-react';
import { calculateLevelFromXp } from '@/lib/gamification';

type Profile = {
    id: string;
    username: string | null;
    level: number;
    xp: number;
    clan: string | null;
};

type Friendship = {
    id: string;
    user_id1: string;
    user_id2: string;
    status: 'pending' | 'accepted';
    created_at: string;
    profiles?: Profile;
};

export default function FriendsPage() {
    const { user, isLoading: authLoading, refreshSession } = useAuth();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [friends, setFriends] = useState<Profile[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<{ id: string, profile: Profile }[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<{ id: string, profile: Profile }[]>([]);

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    const fetchFriendsData = async () => {
        if (!user) {
            setIsLoadingData(false);
            return;
        }

        setIsLoadingData(true);
        try {
            
            let { data: friendships, error } = await supabase
                .from('friendships')
                .select(`
                id,
                user_id1,
                user_id2,
                status,
                profile1:profiles!friendships_user_id1_fkey(id, username, level, xp, clan),
                profile2:profiles!friendships_user_id2_fkey(id, username, level, xp, clan)
            `)
                .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);

            if (error) {
                if (error.message?.includes('JWT expired') || error.code === 'PGRST303') {
                    console.log("FRIENDS: JWT expired, refreshing...");
                    const session = await refreshSession();
                    if (session) {
                        const retry = await supabase
                            .from('friendships')
                            .select(`
                                id, user_id1, user_id2, status,
                                profile1:profiles!friendships_user_id1_fkey(id, username, level, xp, clan),
                                profile2:profiles!friendships_user_id2_fkey(id, username, level, xp, clan)
                            `)
                            .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);
                        friendships = retry.data;
                        error = retry.error;
                    }
                }
            }

            if (error) {
                console.error("Error fetching friendships:", error);
                return;
            }

            if (!friendships) {
                setFriends([]);
                return;
            }

            const accepted: Profile[] = [];
            const incoming: { id: string, profile: Profile }[] = [];
            const outgoing: { id: string, profile: Profile }[] = [];

            friendships.forEach((f: any) => {
                const isSender = f.user_id1 === user.id;
                const otherProfile = isSender ? f.profile2 : f.profile1;

                if (!otherProfile) return;

                if (f.status === 'accepted') {
                    accepted.push(otherProfile);
                } else if (f.status === 'pending') {
                    if (isSender) {
                        outgoing.push({ id: f.id, profile: otherProfile });
                    } else {
                        incoming.push({ id: f.id, profile: otherProfile });
                    }
                }
            });

            setFriends(accepted);
            setIncomingRequests(incoming);
            setOutgoingRequests(outgoing);
        } catch (err) {
            console.error("Critical error in fetchFriendsData:", err);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchFriendsData();
        }
    }, [user?.id, authLoading]);

    
    useEffect(() => {
        const timer = setTimeout(async () => {
            const query = searchQuery.trim();

            
            if (!query || !user) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                console.log("SEARCH FOR:", query, "AS USER:", user.id);

                let { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, level, xp, clan')
                    .ilike('username', `%${query}%`)
                    .limit(50);

                
                if (error && (error.message?.includes('JWT expired') || error.code === 'PGRST303')) {
                    console.log("SEARCH: JWT expired, refreshing...");
                    const session = await refreshSession();
                    if (session) {
                        const retry = await supabase
                            .from('profiles')
                            .select('id, username, level, xp, clan')
                            .ilike('username', `%${query}%`)
                            .limit(50);
                        data = retry.data;
                        error = retry.error;
                    }
                }

                console.log("SEARCH DATA:", data);
                console.log("SEARCH ERROR:", error);

                if (!error && data) {
                    setSearchResults(data);
                } else {
                    setSearchResults([]);
                }
            } catch (err) {
                console.error("SEARCH CRITICAL ERROR:", err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, user]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const sendFriendRequest = async (targetUserId: string) => {
        if (!user) return;

        
        
        const targetProfile = searchResults.find(p => p.id === targetUserId);

        const { error } = await supabase
            .from('friendships')
            .insert({ user_id1: user.id, user_id2: targetUserId, status: 'pending' });

        if (!error) {
            
            setSearchQuery('');
            setSearchResults([]);
            fetchFriendsData();
        } else {
            alert("Impossible d'envoyer la demande (peut-être déjà amis ou en attente ?)");
        }
    };

    const respondToRequest = async (friendshipId: string, accept: boolean) => {
        if (!user) return;

        
        const request = incomingRequests.find(r => r.id === friendshipId);
        if (request) {
            if (accept) {
                setFriends(prev => [...prev, request.profile]);
            }
            setIncomingRequests(prev => prev.filter(r => r.id !== friendshipId));
        }

        if (accept) {
            await supabase
                .from('friendships')
                .update({ status: 'accepted' })
                .eq('id', friendshipId);
        } else {
            await supabase
                .from('friendships')
                .delete()
                .eq('id', friendshipId);
        }
        
        fetchFriendsData();
    };

    const removeFriend = async (friendId: string) => {
        if (!user || !confirm("Êtes-vous sûr de vouloir retirer cet ami ?")) return;

        
        setFriends(prev => prev.filter(f => f.id !== friendId));

        await supabase
            .from('friendships')
            .delete()
            .or(`and(user_id1.eq.${user.id},user_id2.eq.${friendId}),and(user_id1.eq.${friendId},user_id2.eq.${user.id})`);

        fetchFriendsData();
    };


    return (
        <div className="min-h-screen bg-background text-text flex flex-col relative overflow-hidden">
            {}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[150px] pointer-events-none opacity-20 bg-accent/40 mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[180px] pointer-events-none opacity-10 bg-indigo-500/30 mix-blend-screen" />
            <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full blur-[120px] pointer-events-none opacity-5 bg-rose-500/20 mix-blend-screen" />

            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>

            <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-16 w-full relative z-10 flex-1 flex flex-col">
                {}
                <div className="mb-16 flex flex-col md:flex-row items-center md:items-start justify-between gap-8 animate-in slide-in-from-bottom-8 fade-in duration-1000">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="relative p-5 bg-surface/80 backdrop-blur-xl rounded-3xl border border-border shadow-2xl overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-text/5 to-transparent pointer-events-none" />
                                <Users className="w-12 h-12 text-text drop-shadow-[0_0_15px_var(--accent-glow)]" />
                            </div>
                        </div>
                        <div className="pt-2">
                            <h1 className="text-4xl md:text-6xl font-black mb-3 pb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-text via-text/90 to-text/60 drop-shadow-sm">
                                Mon_.réseau
                            </h1>
                            <p className="text-text-muted text-lg max-w-lg leading-relaxed font-medium">
                                Développe ton influence. Trouve d'autres agents, rejoins leurs lignes de code et hissez vos TechSquads au sommet.
                            </p>
                        </div>
                    </div>

                    {}
                    <div className="hidden lg:flex items-center gap-6 px-8 py-4 bg-surface/40 backdrop-blur-2xl border border-border rounded-full shadow-2xl">
                        <div className="text-center">
                            <div className="text-2xl font-black text-text">{friends.length}</div>
                            <div className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Connexions</div>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="text-center">
                            <div className="text-2xl font-black text-text">{incomingRequests.length}</div>
                            <div className="text-[10px] uppercase font-bold tracking-widest text-orange-400">En attente</div>
                        </div>
                    </div>
                </div>

                {isLoadingData ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-32 animate-in fade-in duration-500">
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute inset-0 border-4 border-border rounded-full" />
                            <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin" />
                        </div>
                        <p className="text-text-muted font-medium tracking-wide animate-pulse">Décryptage des connexions...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {}
                        <div className="lg:col-span-4 flex flex-col gap-8">

                            {}
                            <div className="relative bg-surface/30 backdrop-blur-2xl border border-border p-1 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-8 fade-in fill-mode-both overflow-hidden group/search" style={{ animationDelay: '100ms' }}>
                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover/search:opacity-100 transition-opacity duration-700 pointer-events-none" />

                                <div className="p-6 md:p-8">
                                    <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-text tracking-tight">
                                        Trouver un agent
                                    </h2>
                                    <form onSubmit={handleSearch} className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition duration-500 pointer-events-none" />
                                        <div className="relative flex items-center bg-background/80 backdrop-blur-xl border border-border rounded-2xl p-1 shadow-inner focus-within:border-accent/50 focus-within:bg-background/95 transition-all duration-300">
                                            <div className="pl-4 pr-2 text-text-muted">
                                                <Search className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Entrez un pseudo..."
                                                className="w-full bg-transparent py-3 pr-4 focus:outline-none text-text placeholder:text-text-muted/60 font-medium text-base"
                                            />
                                            <button
                                                type="submit"
                                                disabled={isSearching || !searchQuery.trim()}
                                                className="shrink-0 aspect-square h-12 flex items-center justify-center bg-text text-background hover:bg-text/90 disabled:bg-surface-hover disabled:text-text-muted rounded-xl transition-all shadow-md active:scale-95 font-bold"
                                            >
                                                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Go'}
                                            </button>
                                        </div>
                                    </form>

                                    {}
                                    {searchResults.length > 0 && (
                                        <div className="mt-6 flex flex-col gap-3">
                                            {searchResults.map((result, i) => (
                                                <div
                                                    key={result.id}
                                                    className="relative flex items-center justify-between p-4 bg-surface-hover/30 hover:bg-surface-hover/50 border border-border hover:border-accent/40 rounded-2xl transition-all duration-300 group cursor-default animate-in slide-in-from-bottom-4 fade-in fill-mode-both"
                                                    style={{ animationDelay: `${i * 50}ms` }}
                                                >
                                                    <div className="min-w-0 flex-1 pr-4">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-bold text-base text-text truncate">{result.username}</p>
                                                            {result.id === user?.id && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 border border-accent/30 text-accent font-bold tracking-wider">C'est vous</span>}
                                                            {result.clan && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted font-bold tracking-wider shadow-inner">{result.clan}</span>}
                                                        </div>
                                                        <p className="text-xs text-text-muted font-medium">Niveau <span className="text-text">{calculateLevelFromXp(result.xp || 0)}</span></p>
                                                    </div>
                                                    <button
                                                        onClick={() => sendFriendRequest(result.id)}
                                                        disabled={result.id === user?.id}
                                                        className="shrink-0 p-3 bg-surface border border-border text-text hover:bg-accent hover:text-white disabled:opacity-30 rounded-xl transition-all shadow-sm active:scale-95"
                                                        title={result.id === user?.id ? "Vous ne pouvez pas vous ajouter" : "Envoyer une requête"}
                                                    >
                                                        <UserPlus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {searchResults.length === 0 && searchQuery && !isSearching && (
                                        <div className="mt-8 text-center pb-2">
                                            <div className="w-12 h-12 rounded-full border border-dashed border-border flex items-center justify-center mx-auto mb-3 opacity-50">
                                                <Search className="w-5 h-5 text-text-muted" />
                                            </div>
                                            <p className="text-sm font-medium text-text-muted">Aucun agent trouvé avec ce pseudo.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {}
                            {incomingRequests.length > 0 && (
                                <div className="bg-orange-500/5 backdrop-blur-2xl border border-orange-500/20 px-6 py-7 rounded-[2.5rem] shadow-xl animate-in slide-in-from-bottom-8 fade-in fill-mode-both relative overflow-hidden" style={{ animationDelay: '200ms' }}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] pointer-events-none rounded-full" />

                                    <h2 className="text-sm font-black mb-5 text-orange-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                                        Demandes reçues
                                    </h2>
                                    <div className="space-y-3 relative z-10">
                                        {incomingRequests.map(({ id, profile }) => (
                                            <div key={id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-background/90 backdrop-blur-md rounded-2xl border border-orange-500/10 hover:border-orange-500/30 transition-all shadow-sm group">
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-bold text-base text-text truncate" title={profile.username || 'Inconnu'}>
                                                            {profile.username || 'Inconnu'}
                                                        </p>
                                                        {profile.clan && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-hover/30 border border-border text-text-muted font-bold truncate tracking-wider">{profile.clan}</span>}
                                                    </div>
                                                    <p className="text-sm text-text-muted">Niveau <span className="text-text font-bold">{calculateLevelFromXp(profile.xp || 0)}</span></p>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <button
                                                        onClick={() => respondToRequest(id, true)}
                                                        className="flex-1 sm:flex-none flex items-center justify-center p-2.5 bg-green-500/10 text-green-400 hover:bg-green-500 border border-green-500/20 hover:border-green-500 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                        title="Accepter"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => respondToRequest(id, false)}
                                                        className="flex-1 sm:flex-none flex items-center justify-center p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 border border-red-500/20 hover:border-red-500 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                        title="Refuser"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {}
                            {outgoingRequests.length > 0 && (
                                <div className="bg-surface/20 backdrop-blur-xl border border-border p-6 rounded-[2rem] opacity-80 hover:opacity-100 transition-opacity duration-500 animate-in slide-in-from-bottom-8 fade-in fill-mode-both" style={{ animationDelay: '300ms' }}>
                                    <h2 className="text-xs font-black mb-4 text-text-muted uppercase tracking-[0.15em]">Pings envoyés ({outgoingRequests.length})</h2>
                                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {outgoingRequests.map(({ id, profile }) => (
                                            <div key={id} className={`flex items-center justify-between p-3 bg-background/50 rounded-2xl border border-transparent hover:border-border transition-colors group`}>
                                                <div className="min-w-0 mr-3 flex-1 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-accent/50 group-hover:bg-accent transition-colors" />
                                                    <span className="font-semibold text-sm text-text-muted group-hover:text-text transition-colors truncate block">{profile.username}</span>
                                                </div>
                                                <button
                                                    onClick={() => respondToRequest(id, false)}
                                                    className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-400/60 hover:text-red-400 hover:bg-red-400/10 px-2 py-1 rounded-md transition-all shrink-0 opacity-0 group-hover:opacity-100"
                                                >
                                                    Annuler
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {}
                        <div className="lg:col-span-8">
                            <div className="bg-surface/30 backdrop-blur-2xl border border-border p-8 md:p-10 rounded-[2.5rem] h-full shadow-2xl animate-in slide-in-from-bottom-8 fade-in fill-mode-both relative overflow-hidden" style={{ animationDelay: '200ms' }}>
                                {}
                                <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                                {friends.length === 0 ? (
                                    <div className="flex flex-col flex-1 items-center justify-center text-center py-20 px-6 h-[50vh] min-h-[400px]">
                                        <div className="relative group mb-8">
                                            <div className="absolute inset-0 bg-surface-hover/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                                            <div className="relative w-28 h-28 bg-surface/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-border shadow-2xl">
                                                <Users className="w-12 h-12 text-text-muted/60 drop-shadow-md" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-text mb-3">Réseau en attente</h3>
                                        <p className="text-base text-text-muted max-w-md mx-auto leading-relaxed">
                                            Vos connexions sont vides. Lancez une recherche pour ajouter des agents à votre liste et comparer votre XP.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                                        {friends.sort((a, b) => b.level - a.level).map((friend, index) => {
                                            
                                            let squadTheme = {
                                                badge: 'bg-surface-hover/50 border-border text-text',
                                                hoverShadow: 'hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:border-accent/30',
                                                gradient: 'from-text/0 to-text/0 hover:from-text/5',
                                                pill: 'bg-surface-hover/50 text-text-muted'
                                            };

                                            if (friend.clan === 'ROOT') squadTheme = { badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]', hoverShadow: 'hover:shadow-[0_10px_40px_rgba(249,115,22,0.15)] hover:border-orange-500/40', gradient: 'hover:from-orange-500/5 hover:to-transparent', pill: 'bg-orange-500/20 text-orange-400 border border-orange-500/20 text-[10px]' };
                                            if (friend.clan === 'VOID') squadTheme = { badge: 'bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.15)]', hoverShadow: 'hover:shadow-[0_10px_40px_rgba(139,92,246,0.15)] hover:border-violet-500/40', gradient: 'hover:from-violet-500/5 hover:to-transparent', pill: 'bg-violet-500/20 text-violet-400 border border-violet-500/20 text-[10px]' };
                                            if (friend.clan === 'CORE') squadTheme = { badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]', hoverShadow: 'hover:shadow-[0_10px_40px_rgba(59,130,246,0.15)] hover:border-blue-500/40', gradient: 'hover:from-blue-500/5 hover:to-transparent', pill: 'bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[10px]' };
                                            if (friend.clan === 'CYPHER') squadTheme = { badge: 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)]', hoverShadow: 'hover:shadow-[0_10px_40px_rgba(34,197,94,0.15)] hover:border-green-500/40', gradient: 'hover:from-green-500/5 hover:to-transparent', pill: 'bg-green-500/20 text-green-400 border border-green-500/20 text-[10px]' };

                                            return (
                                                <div
                                                    key={friend.id}
                                                    className={`relative flex items-center justify-between p-5 bg-surface/50 backdrop-blur-lg rounded-[1.5rem] border border-border transition-all duration-500 group overflow-hidden hover:-translate-y-1 ${squadTheme.hoverShadow} animate-in fade-in zoom-in-95 fill-mode-both cursor-default`}
                                                    style={{ animationDelay: `${300 + (index * 50)}ms` }}
                                                >
                                                    {}
                                                    <div className={`absolute inset-0 bg-gradient-to-r ${squadTheme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                                                    <div className="relative z-10 flex items-center gap-4 text-left min-w-0 flex-1">
                                                        <div className={`w-16 h-16 rounded-[1.25rem] border flex flex-col items-center justify-center shrink-0 backdrop-blur-md transition-transform duration-500 group-hover:scale-105 ${squadTheme.badge}`}>
                                                            <span className="text-[10px] uppercase font-black tracking-widest opacity-70 mb-0.5">LVL</span>
                                                            <span className="font-black text-2xl leading-none">{calculateLevelFromXp(friend.xp || 0)}</span>
                                                        </div>
                                                        <div className="overflow-hidden min-w-0 pr-2">
                                                            <p className="font-black text-xl text-text truncate mb-1" title={friend.username || 'Inconnu'}>
                                                                {friend.username || 'Inconnu'}
                                                            </p>
                                                            {friend.clan ? (
                                                                <span className={`inline-flex items-center justify-center uppercase font-black tracking-wider px-2.5 py-0.5 rounded-md truncate max-w-full ${squadTheme.pill}`}>
                                                                    {friend.clan}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                                                                    Squad Inactive
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {}
                                                    <div className="relative z-10 shrink-0 flex items-center pl-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                removeFriend(friend.id);
                                                            }}
                                                            className="w-12 h-12 flex items-center justify-center text-text-muted opacity-0 group-hover:opacity-100 hover:text-white bg-transparent hover:bg-red-500 border border-transparent hover:border-red-400 rounded-2xl transition-all duration-300 active:scale-90"
                                                            title="Supprimer la connexion"
                                                        >
                                                            <UserMinus className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
