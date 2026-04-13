import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, ChevronDown, ChevronUp, Shield, User, Loader2, BookOpen, GraduationCap, Flame, Target, Settings2, Sparkles } from 'lucide-react';
import UserDetailModal from './UserDetailModal';

/**
 * profil utilisateur enrichi pour la console d'administration.
 */
export type AdminUser = {
    id: string;
    email: string;
    username: string | null;
    role: string;
    xp: number;
    level: number;
    streak: number;
    created_at: string;
};

/**
 * clés de tri autorisées pour l'indexation utilisateur.
 */
type SortKey = 'xp' | 'level' | 'streak' | 'created_at';

/**
 * onglet de gestion des utilisateurs.
 * fournit une interface de filtrage, tri et accès aux détails granulaires des profils ekloud.
 */
export default function UserManagementTab() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('xp');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

    /**
     * extrait la liste exhaustive des profils via supabase.
     */
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, username, role, xp, level, streak, created_at')
                .order('xp', { ascending: false })
                .limit(100);
            if (error) throw error;
            setUsers(data as AdminUser[] || []);
        } catch (err) {
            console.error('UserManagementTab: erreur fetchUsers:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    /**
     * calcule le sous-ensemble filtré et trié dynamiquement (memoized).
     */
    const filteredUsers = useMemo(() => {
        let result = users.filter(u =>
            (u.username ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (u.email ?? '').toLowerCase().includes(search.toLowerCase())
        );

        return result.sort((a, b) => {
            const aVal = sortKey === 'created_at' ? new Date(a[sortKey]).getTime() : (a[sortKey] as number);
            const bVal = sortKey === 'created_at' ? new Date(b[sortKey]).getTime() : (b[sortKey] as number);
            return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
        });
    }, [users, search, sortKey, sortDir]);

    /**
     * permute l'ordre de tri ou change la dimension de référence.
     */
    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    /**
     * rendu conditionnel de l'indicateur de tri.
     */
    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ChevronDown className="w-3 h-3 opacity-20" />;
        return sortDir === 'desc'
            ? <ChevronDown className="w-3 h-3 text-accent animate-in fade-in" />
            : <ChevronUp className="w-3 h-3 text-accent animate-in fade-in" />;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="w-12 h-12 text-accent animate-spin opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted/40 italic">indexation de la base...</span>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {selectedUser && (
                <UserDetailModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onUserUpdated={(updated) => {
                        setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
                        setSelectedUser(prev => prev ? { ...prev, ...updated } : null);
                    }}
                    onUserDeleted={(id) => {
                        setUsers(prev => prev.filter(u => u.id !== id));
                        setSelectedUser(null);
                    }}
                />
            )}

            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="relative w-full max-w-xl group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40 group-focus-within:text-accent transition-colors" />
                    <input
                        type="text"
                        placeholder="rechercher une identité (username / email)..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-background border border-border/60 rounded-[1.5rem] text-sm font-medium text-text placeholder-text-muted/40 focus:outline-none focus:border-accent/40 focus:bg-surface/30 transition-all shadow-sm"
                    />
                </div>
                
                <div className="flex items-center gap-3 bg-surface/40 px-6 py-3 rounded-full border border-border/40">
                    <Target size={14} className="text-text-muted/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">
                        {filteredUsers.length} <span className="opacity-40">affiché{filteredUsers.length !== 1 ? 's' : ''}</span>
                        {users.length >= 100 && <span className="text-amber-500/60 ml-2"> (pool limité à 100)</span>}
                    </span>
                </div>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-surface/20 backdrop-blur-3xl shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/80 bg-surface/60 text-text-muted/40 text-[9px] font-black uppercase tracking-[0.3em]">
                                <th className="p-8">utilisateur</th>
                                <th className="p-8">statut</th>
                                <th className="p-8 cursor-pointer hover:text-accent transition-colors group" onClick={() => toggleSort('xp')}>
                                    <div className="flex items-center gap-2">capital xp <SortIcon col="xp" /></div>
                                </th>
                                <th className="p-8 cursor-pointer hover:text-accent transition-colors group" onClick={() => toggleSort('level')}>
                                    <div className="flex items-center gap-2">niveau <SortIcon col="level" /></div>
                                </th>
                                <th className="p-8 cursor-pointer hover:text-accent transition-colors group" onClick={() => toggleSort('streak')}>
                                    <div className="flex items-center gap-2">série <SortIcon col="streak" /></div>
                                </th>
                                <th className="p-8 cursor-pointer hover:text-accent transition-colors group" onClick={() => toggleSort('created_at')}>
                                    <div className="flex items-center gap-2">inscription <SortIcon col="created_at" /></div>
                                </th>
                                <th className="p-8 text-right">opérations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 font-sans italic">
                            {filteredUsers.map((u, idx) => (
                                <tr key={u.id} className="hover:bg-accent/5 transition-all group animate-in fade-in slide-in-from-bottom-2 fill-mode-both" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <td className="p-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-purple-500/20 border border-accent/20 flex items-center justify-center text-accent font-black text-sm shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                                {(u.username ?? u.email ?? '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-base text-text uppercase tracking-tight group-hover:text-accent transition-colors">{u.username ?? <span className="opacity-20 italic">anonyme</span>}</span>
                                                <span className="text-[10px] font-bold text-text-muted/40 lowercase tracking-widest">{u.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        {u.role === 'admin' ? (
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                                                <Shield className="w-3 h-3" /> admin
                                            </div>
                                        ) : u.role === 'contributor' ? (
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                <BookOpen className="w-3 h-3" /> contributeur
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-surface-hover/30 text-text-muted/60 rounded-full text-[9px] font-black uppercase tracking-widest border border-border/40">
                                                <GraduationCap className="w-3 h-3" /> étudiant
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-8">
                                        <div className="flex flex-col">
                                            <span className="font-black text-lg text-text whitespace-nowrap">{u.xp.toLocaleString()} <span className="text-[10px] opacity-20">u</span></span>
                                        </div>
                                    </td>
                                    <td className="p-8 font-black text-text-muted/60 text-lg">{u.level}</td>
                                    <td className="p-8">
                                        <div className="flex items-center gap-2 text-rose-500 font-black text-lg">
                                            {u.streak} <Flame className={`w-4 h-4 ${u.streak > 0 ? 'animate-pulse' : 'opacity-20'}`} />
                                        </div>
                                    </td>
                                    <td className="p-8 text-[11px] font-bold text-text-muted/40 uppercase tracking-widest">
                                        {new Date(u.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="p-8 text-right">
                                        <button
                                            onClick={() => setSelectedUser(u)}
                                            className="px-6 py-3 bg-surface-hover/50 hover:bg-accent text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-white rounded-[1rem] transition-all border border-border/40 hover:border-accent hover:shadow-lg hover:shadow-accent/20 active:scale-95 flex items-center gap-2 ml-auto"
                                        >
                                            <Settings2 size={12} /> gérer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="bg-background/20 py-24 flex flex-col items-center gap-6 justify-center text-center">
                        <Sparkles className="w-12 h-12 text-text-muted/20 animate-pulse" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.4em]">aucun utilisateur détecté</p>
                            <p className="text-xs text-text-muted/20 font-medium italic">ajustez vos paramètres de recherche</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
