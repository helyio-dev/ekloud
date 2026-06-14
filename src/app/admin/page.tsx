import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
    Plus, BookOpen, Users, Loader2, LayoutDashboard, Database, 
    Shield, Zap, Sparkles, Trash2, Edit3, Settings, LogOut, Search,
    ChevronRight, ArrowLeft
} from 'lucide-react';
import UserManagementTab from './components/UserManagementTab';
import SkillManagementTab from './components/SkillManagementTab';

type TabType = 'modules' | 'users' | 'skills';

export default function AdminDashboard() {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('modules');
    const [modules, setModules] = useState<any[]>([]);
    const [userCount, setUserCount] = useState<number | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    const fetchData = useCallback(async () => {
        setIsFetching(true);
        try {
            const [{ data: mods }, { count: users }] = await Promise.all([
                supabase.from('modules').select('*').order('order_index', { ascending: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true })
            ]);
            setModules(mods || []);
            setUserCount(users);
        } catch (err) {
            console.error('AdminDashboard: Fetch error:', err);
        } finally {
            setIsFetching(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteModule = async (id: string, title: string) => {
        if (!confirm(`Confirmer la suppression du module : ${title} ?`)) return;
        try {
            const { error } = await supabase.from('modules').delete().eq('id', id);
            if (error) throw error;
            setModules(prev => prev.filter(m => m.id !== id));
        } catch (err: any) {
            alert(`Erreur: ${err.message}`);
        }
    };

    const tabs = [
        { id: 'modules', label: 'Modules' },
        { id: 'skills', label: 'Compétences' },
        { id: 'users', label: 'Utilisateurs' },
    ];

    return (
        <div className="min-h-screen bg-background text-text flex flex-col font-sans selection:bg-accent/30">
            {/* Slim Application Bar */}
            <header className="h-14 border-b border-border/60 bg-surface flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 pr-4 border-r border-border/40">
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-accent font-equinox">Ekloud</span>
                        <Link to="/" className="flex items-center gap-2 px-3 py-1 bg-background border border-border/60 hover:border-text/30 rounded-md text-[8px] font-black uppercase tracking-widest text-text-muted hover:text-text transition-all">
                            <ArrowLeft size={10} /> Quitter
                        </Link>
                    </div>
                    <div className="flex items-center gap-6 pl-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-accent/10 text-accent' 
                                    : 'text-text-muted hover:text-text hover:bg-surface'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-40">
                        <span>{userCount ?? 0} Users</span>
                        <div className="w-1 h-1 bg-border rounded-full" />
                        <span>{modules.length} Modules</span>
                    </div>
                    <div className="h-4 w-px bg-border/40" />
                    <div className="flex items-center gap-3 group">
                        <span className="text-[10px] font-black uppercase text-text-muted group-hover:text-text transition-colors">{user?.email?.split('@')[0]}</span>
                        <div className="w-8 h-8 rounded-lg bg-background border border-border/80 flex items-center justify-center text-accent/60 group-hover:border-accent group-hover:text-accent transition-all">
                            <Shield size={14} />
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-[1400px] mx-auto">
                        {activeTab === 'modules' ? (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between border-b border-border/40 pb-6">
                                    <div className="flex items-center gap-3">
                                        <BookOpen size={16} className="text-accent" />
                                        <h1 className="text-sm font-black uppercase tracking-widest text-text">Modules</h1>
                                    </div>
                                    <Link 
                                        to="/admin/modules/new" 
                                        className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-accent/20"
                                    >
                                        <Plus size={14} /> Nouveau
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {isFetching ? (
                                        [1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-surface/50 border border-border/40 rounded-xl animate-pulse" />)
                                    ) : modules.map((mod) => (
                                        <div 
                                            key={mod.id} 
                                            className="bg-surface border border-border/60 p-5 rounded-xl flex flex-col justify-between group hover:border-accent/40 transition-all"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 bg-background border border-border rounded-lg flex items-center justify-center font-black text-accent text-xs">
                                                        {mod.order_index}
                                                    </div>
                                                    <h3 className="font-black uppercase tracking-tight text-sm line-clamp-1">{mod.title}</h3>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link to={`/admin/modules/${mod.id}/edit`} className="p-2 hover:bg-background rounded-lg text-text-muted hover:text-text transition-colors">
                                                        <Edit3 size={14} />
                                                    </Link>
                                                    <button onClick={() => handleDeleteModule(mod.id, mod.title)} className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <Link 
                                                to={`/admin/modules/${mod.id}/content`}
                                                className="w-full py-2 bg-background border border-border/60 rounded-lg text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-accent hover:border-accent transition-all text-center"
                                            >
                                                Paramétrer le contenu
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : activeTab === 'skills' ? (
                            <SkillManagementTab />
                        ) : (
                            <UserManagementTab />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
