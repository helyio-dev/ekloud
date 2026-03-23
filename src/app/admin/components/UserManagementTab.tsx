import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, ChevronDown, ChevronUp, Shield, User, Loader2, BookOpen } from 'lucide-react';
import UserDetailModal from './UserDetailModal';

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

type SortKey = 'xp' | 'level' | 'streak' | 'created_at';

export default function UserManagementTab() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [filtered, setFiltered] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('xp');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, username, role, xp, level, streak, created_at')
                .order('xp', { ascending: false });
            if (error) throw error;
            setUsers(data as AdminUser[] || []);
        } catch (err) {
            console.error('UserManagementTab: fetchUsers error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        let result = users.filter(u =>
            (u.username ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (u.email ?? '').toLowerCase().includes(search.toLowerCase())
        );
        result = [...result].sort((a, b) => {
            const aVal = sortKey === 'created_at' ? new Date(a[sortKey]).getTime() : (a[sortKey] as number);
            const bVal = sortKey === 'created_at' ? new Date(b[sortKey]).getTime() : (b[sortKey] as number);
            return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
        });
        setFiltered(result);
    }, [users, search, sortKey, sortDir]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ChevronDown className="w-3 h-3 opacity-30" />;
        return sortDir === 'desc'
            ? <ChevronDown className="w-3 h-3 text-accent" />
            : <ChevronUp className="w-3 h-3 text-accent" />;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
            </div>
        );
    }

    return (
        <>
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

            <div className="space-y-6">
                {}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Rechercher par username ou email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-text placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors"
                    />
                </div>

                {}
                <p className="text-sm text-text-muted">{filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''}</p>

                {}
                <div className="overflow-x-auto rounded-2xl border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-surface text-text-muted uppercase text-xs tracking-wider whitespace-nowrap">
                                <th className="p-4 text-left">Utilisateur</th>
                                <th className="p-4 text-left">Rôle</th>
                                <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('xp')}>
                                    <span className="flex items-center justify-end gap-1">XP <SortIcon col="xp" /></span>
                                </th>
                                <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('level')}>
                                    <span className="flex items-center justify-end gap-1">Niveau <SortIcon col="level" /></span>
                                </th>
                                <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('streak')}>
                                    <span className="flex items-center justify-end gap-1">Série <SortIcon col="streak" /></span>
                                </th>
                                <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('created_at')}>
                                    <span className="flex items-center justify-end gap-1">Inscrit <SortIcon col="created_at" /></span>
                                </th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border whitespace-nowrap">
                            {filtered.map(u => (
                                <tr key={u.id} className="hover:bg-surface-hover/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                {(u.username ?? u.email ?? '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-text">{u.username ?? <span className="text-text-muted italic">Sans pseudo</span>}</p>
                                                <p className="text-xs text-text-muted">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {u.role === 'admin' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-400/10 text-yellow-400 rounded-lg text-xs font-bold">
                                                <Shield className="w-3 h-3" /> Admin
                                            </span>
                                        ) : u.role === 'contributor' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-400/10 text-green-400 rounded-lg text-xs font-bold">
                                                <BookOpen className="w-3 h-3" /> Contributeur
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-surface/50 text-text-muted rounded-lg text-xs font-bold">
                                                <User className="w-3 h-3" /> Étudiant
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right font-bold text-text">{u.xp.toLocaleString()}</td>
                                    <td className="p-4 text-right text-text-muted">{u.level}</td>
                                    <td className="p-4 text-right text-orange-400 font-bold">{u.streak}🔥</td>
                                    <td className="p-4 text-right text-text-muted text-xs">
                                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setSelectedUser(u)}
                                            className="px-3 py-1.5 bg-accent/10 hover:bg-accent text-accent hover:text-white rounded-lg text-xs font-bold transition-all border border-accent/20 hover:border-transparent"
                                        >
                                            Gérer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <div className="text-center py-16 text-text-muted">
                            Aucun utilisateur trouvé.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
