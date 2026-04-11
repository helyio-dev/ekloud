import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Plus, BookOpen, Users, Loader2, LayoutDashboard, Database, Shield, Zap, Sparkles, Trash2, Edit3, Settings } from 'lucide-react';
import UserManagementTab from './components/UserManagementTab';
import SkillManagementTab from './components/SkillManagementTab';

/**
 * identifiants de navigation interne pour le panneau d'administration.
 */
type TabId = 'modules' | 'skills' | 'users';

/**
 * console d'administration ekloud.
 * point d'entrée centralisé pour la gestion du contenu pédagogique, de l'arbre de compétences et des privilèges utilisateurs.
 * implémente des guards de sécurité basés sur les rôles (admin/contributeur).
 */
export default function AdminDashboard() {
    const { user, isAdmin, isContributor, isLoading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabId>('modules');
    const [modules, setModules] = useState<any[]>([]);
    const [userCount, setUserCount] = useState<number | null>(null);
    const [isFetching, setIsFetching] = useState(true);

    // redirection si l'utilisateur n'a pas les privilèges requis
    useEffect(() => {
        if (!isLoading && !isAdmin && !isContributor) {
            navigate('/dashboard');
        }
    }, [isAdmin, isContributor, isLoading, navigate]);

    /**
     * agrège les statistiques globales et le catalogue de modules.
     */
    const fetchAdminData = useCallback(async () => {
        if (!isAdmin && !isContributor) return;
        setIsFetching(true);
        
        try {
            const [{ data: modData }, { count }] = await Promise.all([
                supabase.from('modules').select('*').order('order_index'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
            ]);
            
            setModules(modData || []);
            setUserCount(count ?? 0);
        } catch (err) {
            console.error('erreur lors de la récupération des données admin:', err);
        } finally {
            setIsFetching(false);
        }
    }, [isAdmin, isContributor]);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    /**
     * procédure de suppression d'un module avec double confirmation système.
     */
    const handleDeleteModule = async (id: string, title: string) => {
        const confirmed = window.confirm(`confirmation de destruction : voulez-vous vraiment supprimer le module "${title}" ? cette action est irréversible et affectera la progression des utilisateurs.`);
        if (!confirmed) return;

        try {
            const { error } = await supabase.from('modules').delete().eq('id', id);
            if (error) throw error;
            setModules(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error('erreur lors de la destruction du module:', err);
        }
    };

    if (!isLoading && !isAdmin && !isContributor) return null;

    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'modules', label: 'modules', icon: <BookOpen className="w-4 h-4" /> },
    ];

    if (isAdmin) {
        tabs.push({ id: 'skills', label: 'compétences', icon: <Database className="w-4 h-4" /> });
        tabs.push({ id: 'users', label: 'utilisateurs', icon: <Users className="w-4 h-4" /> });
    }

    return (
        <div className="min-h-screen bg-background text-text font-sans selection:bg-accent/30 p-6 md:p-12 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* en-tête contextuel avec actions rapides */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 animate-in fade-in slide-in-from-top-6 duration-700">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full w-fit">
                            <Shield className="w-4 h-4 text-accent" />
                            <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">{isAdmin ? 'administration centrale' : 'accès contributeur'}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-equinox leading-none">console terminal</h1>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Link to="/admin/modules/new" className="group flex items-center gap-3 px-8 py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-accent/20 active:scale-95">
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> module
                        </Link>
                        <Link to="/admin/lessons/new" className="flex items-center gap-3 px-8 py-4 bg-surface hover:bg-surface-hover border border-border/60 text-text rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95">
                            <Plus className="w-4 h-4" /> leçon
                        </Link>
                        <Link to="/admin/quizzes/new" className="flex items-center gap-3 px-8 py-4 bg-surface hover:bg-surface-hover border border-border/60 text-text rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95">
                            <Plus className="w-4 h-4" /> quiz
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* navigation latérale / tabs */}
                    <aside className="lg:col-span-1 space-y-6">
                        <div className="bg-surface/40 backdrop-blur-3xl border border-border/60 p-2 rounded-[2rem] flex flex-col gap-1 shadow-sm">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group ${activeTab === tab.id
                                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                        : 'text-text-muted hover:text-text hover:bg-surface-hover/50'
                                    }`}
                                >
                                    <span className={`transition-transform duration-500 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110 opacity-60'}`}>{tab.icon}</span>
                                    {tab.label}
                                    {activeTab === tab.id && <Zap className="absolute right-6 w-3 h-3 text-white/40 animate-pulse" />}
                                </button>
                            ))}
                        </div>

                        {/* résumé statistique rapide */}
                        <div className="bg-surface/20 border border-border/40 p-8 rounded-[2rem] space-y-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest">utilisateurs enregistrés</span>
                                <div className="text-3xl font-black font-equinox">{userCount ?? '...'}</div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest">modules actifs</span>
                                <div className="text-3xl font-black font-equinox">{modules.length}</div>
                            </div>
                        </div>
                    </aside>

                    {/* conteneur de contenu principal */}
                    <main className="lg:col-span-3 space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000 fill-mode-both">
                        {isFetching && activeTab === 'modules' ? (
                            <div className="min-h-[400px] flex items-center justify-center bg-surface/30 rounded-[3rem] border border-border/40">
                                <Loader2 className="w-12 h-12 text-accent animate-spin opacity-20" />
                            </div>
                        ) : activeTab === 'modules' ? (
                            <section className="bg-surface/40 backdrop-blur-3xl border border-border/80 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                                    <BookOpen size={200} />
                                </div>

                                <div className="flex items-center justify-between mb-12">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-black uppercase tracking-widest">gestion des modules</h2>
                                        <p className="text-[11px] font-bold text-text-muted/60 uppercase tracking-widest">architecture pédagogique active</p>
                                    </div>
                                    <div className="bg-accent/5 px-4 py-2 rounded-full border border-accent/20 text-[10px] font-black text-accent uppercase tracking-widest">
                                        {modules.length} déployés
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    {modules.map((mod, idx) => (
                                        <div 
                                            key={mod.id} 
                                            className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-surface/60 hover:bg-surface border border-border/40 hover:border-accent/40 rounded-[2rem] transition-all shadow-sm hover:shadow-xl hover:shadow-accent/5 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                                            style={{ animationDelay: `${idx * 100}ms` }}
                                        >
                                            <div className="flex items-center gap-6 mb-6 md:mb-0">
                                                <div className="w-14 h-14 bg-background border border-border/60 rounded-2xl flex items-center justify-center font-black text-accent text-lg shadow-inner group-hover:scale-105 transition-transform">
                                                    {mod.order_index}
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="font-black text-lg uppercase tracking-tight group-hover:text-accent transition-colors">{mod.title}</h3>
                                                    <p className="text-[11px] text-text-muted line-clamp-1 font-medium italic opacity-60">id: {mod.id}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <Link
                                                    to={`/admin/modules/${mod.id}/content`}
                                                    className="flex-grow md:flex-grow-0 px-6 py-3 bg-accent/5 border border-accent/10 rounded-xl text-accent hover:bg-accent hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                                >
                                                    <Settings size={14} /> contenu
                                                </Link>
                                                <Link
                                                    to={`/admin/modules/${mod.id}/edit`}
                                                    className="p-3 bg-surface-hover/30 hover:bg-surface-hover border border-border/40 rounded-xl text-text-muted hover:text-text transition-all"
                                                    title="éditer les paramètres"
                                                >
                                                    <Edit3 size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteModule(mod.id, mod.title)}
                                                    className="p-3 bg-rose-500/5 hover:bg-rose-500 border border-rose-500/10 hover:border-rose-500/50 rounded-xl text-rose-500 hover:text-white transition-all shadow-sm"
                                                    title="supprimer définitivement"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {modules.length === 0 && (
                                        <div className="text-center py-24 bg-background/20 rounded-[2rem] border border-dashed border-border/60">
                                            <Sparkles className="w-12 h-12 text-text-muted/20 mx-auto mb-6" />
                                            <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">archive de modules vide.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        ) : activeTab === 'skills' ? (
                            <section className="bg-surface/40 backdrop-blur-3xl border border-border/80 rounded-[3rem] p-8 md:p-12 shadow-2xl">
                                <SkillManagementTab />
                            </section>
                        ) : (
                            <section className="bg-surface/40 backdrop-blur-3xl border border-border/80 rounded-[3rem] p-8 md:p-12 shadow-2xl">
                                <UserManagementTab />
                            </section>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
