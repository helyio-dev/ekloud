import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, ChevronDown, ChevronUp, Shield, User, Users, Loader2, BookOpen, GraduationCap, Flame, Target, Settings2, Sparkles } from 'lucide-react';
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
        <div className="space-y-12 animate-in fade-in duration-700">
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

            <div className="flex items-center justify-between border-b border-border/40 pb-6">
                <div className="flex items-center gap-2 text-accent">
                    <Users size={14} />
                    <h1 className="text-sm font-black uppercase tracking-widest text-text">Utilisateurs</h1>
                </div>
                <div className="bg-surface px-4 py-1.5 rounded-lg border border-border/60 text-[10px] font-black uppercase tracking-widest text-text">
                    {filteredUsers.length} <span className="opacity-40">Objets</span>
                </div>
            </div>

            <div className="pb-2">
                <input
                    type="text"
                    placeholder="Filtrer par nom ou email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-surface border border-border/60 px-4 py-2.5 rounded-lg text-xs font-black text-text placeholder-text-muted/30 focus:outline-none focus:border-accent/40 transition-all uppercase tracking-widest"
                />
            </div>

            <div className="bg-surface rounded-xl border border-border/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/60 bg-background/30 text-text text-[9px] font-black uppercase tracking-widest">
                                <th className="px-6 py-4">Identité</th>
                                <th className="px-6 py-4">Accès</th>
                                <th className="px-6 py-4 cursor-pointer hover:text-accent transition-colors" onClick={() => toggleSort('xp')}>
                                    <div className="flex items-center gap-2">XP <SortIcon col="xp" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-accent transition-colors" onClick={() => toggleSort('level')}>
                                    <div className="flex items-center gap-2">LVL <SortIcon col="level" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-accent transition-colors" onClick={() => toggleSort('streak')}>
                                    <div className="flex items-center gap-2">Str <SortIcon col="streak" /></div>
                                </th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {filteredUsers.map((u, idx) => (
                                <tr key={idx} className="hover:bg-accent/[0.02] transition-colors group">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-accent font-black text-sm shrink-0">
                                                {(u.username ?? u.email ?? '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-text uppercase tracking-tight text-xs">{u.username ?? 'Anonyme'}</span>
                                                <span className="text-[8px] font-bold text-text-muted lowercase opacity-40 leading-none">{u.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        {u.role === 'admin' ? (
                                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[8px] font-black uppercase border border-amber-500/20">Admin</span>
                                        ) : u.role === 'contributor' ? (
                                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded text-[8px] font-black uppercase border border-purple-500/20">Contrib</span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-background border border-border text-text-muted rounded text-[8px] font-black uppercase">User</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="font-black text-xs text-text">{u.xp.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-3 font-black text-text/80 text-xs">{u.level}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-1.5 text-rose-500 font-black text-xs">
                                            {u.streak} <Flame size={12} className={u.streak > 0 ? 'text-rose-500' : 'opacity-20'} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => setSelectedUser(u)}
                                            className="px-4 py-1.5 bg-background hover:bg-accent text-[8px] font-black uppercase tracking-widest text-text-muted hover:text-white rounded-lg transition-all border border-border hover:border-accent inline-flex items-center gap-2"
                                        >
                                            Gérer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="py-20 text-center">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Aucun utilisateur détecté</p>
                    </div>
                )}
            </div>
        </div>
    );
}
