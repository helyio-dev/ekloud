import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Plus, BookOpen, Users, Loader2, LayoutDashboard } from 'lucide-react';
import UserManagementTab from './components/UserManagementTab';
import SkillManagementTab from './components/SkillManagementTab';

type TabId = 'modules' | 'skills' | 'users';

export default function AdminDashboard() {
    const { user, isAdmin, isContributor, isLoading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabId>('modules');
    const [modules, setModules] = useState<any[]>([]);
    const [userCount, setUserCount] = useState<number | null>(null);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAdmin && !isContributor) {
            navigate('/dashboard');
        }
    }, [isAdmin, isContributor, isLoading, navigate]);

    useEffect(() => {
        if (!isAdmin && !isContributor) return;
        const fetchData = async () => {
            setIsFetching(true);
            try {
                const [{ data: modData }, { count }] = await Promise.all([
                    supabase.from('modules').select('*').order('order_index'),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                ]);
                setModules(modData || []);
                setUserCount(count ?? 0);
            } catch (err) {
                console.error('Admin fetchData error:', err);
            } finally {
                setIsFetching(false);
            }
        };
        fetchData();
    }, [isAdmin, isContributor]);

    const handleDeleteModule = async (id: string, title: string) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le module "${title}" ? Cette action est irréversible.`)) {
            return;
        }

        try {
            const { error } = await supabase.from('modules').delete().eq('id', id);
            if (error) throw error;
            setModules(modules.filter(m => m.id !== id));
        } catch (err) {
            console.error('Error deleting module:', err);
            alert('Erreur lors de la suppression du module.');
        }
    };

    if (!isLoading && !isAdmin && !isContributor) return null;

    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'modules', label: 'Modules', icon: <BookOpen className="w-4 h-4" /> },
    ];

    if (isAdmin) {
        tabs.push({ id: 'skills', label: 'Arbre de Compétences', icon: <LayoutDashboard className="w-4 h-4" /> });
        tabs.push({ id: 'users', label: 'Utilisateurs', icon: <Users className="w-4 h-4" /> });
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <LayoutDashboard className="w-5 h-5 text-accent" />
                            <span className="text-xs font-bold text-accent uppercase tracking-widest">{isAdmin ? 'Administrateur' : 'Contributeur'}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/admin/modules/new" className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-accent/20 text-sm">
                            <Plus className="w-4 h-4" /> Module
                        </Link>
                        <Link to="/admin/lessons/new" className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text rounded-xl font-bold transition-all text-sm">
                            <Plus className="w-4 h-4" /> Leçon
                        </Link>
                        <Link to="/admin/quizzes/new" className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text rounded-xl font-bold transition-all text-sm">
                            <Plus className="w-4 h-4" /> Quiz
                        </Link>
                    </div>
                </header>

                {/* Main Content Sections */}
                <div>
                    <div className="flex gap-1 p-1 bg-surface/50 border border-border rounded-xl w-fit mb-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                    : 'text-text-muted hover:text-text hover:bg-surface-hover'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Section */}
                    {isFetching && activeTab === 'modules' ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-10 h-10 text-accent animate-spin" />
                        </div>
                    ) : activeTab === 'modules' ? (
                        <section className="bg-surface border border-border rounded-3xl p-6 md:p-8">
                            <h2 className="text-xl font-bold mb-6">Modules Actuels ({modules.length})</h2>
                            <div className="space-y-3">
                                {modules.map((mod) => (
                                    <div key={mod.id} className="flex items-center justify-between p-4 bg-background/50 border border-border rounded-2xl hover:border-accent/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center font-bold text-accent text-sm shrink-0">
                                                {mod.order_index}
                                            </div>
                                            <div>
                                                <h3 className="font-bold">{mod.title}</h3>
                                                <p className="text-sm text-text-muted line-clamp-1">{mod.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Link
                                                to={`/admin/modules/${mod.id}/content`}
                                                className="px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg text-accent hover:bg-accent hover:text-white transition-all text-xs font-black uppercase tracking-wider"
                                            >
                                                Gérer le contenu
                                            </Link>
                                            <Link
                                                to={`/admin/modules/${mod.id}/edit`}
                                                className="px-3 py-1.5 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors text-sm font-bold"
                                            >
                                                Éditer
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteModule(mod.id, mod.title)}
                                                className="px-3 py-1.5 hover:bg-red-400/10 rounded-lg text-text-muted hover:text-red-400 transition-colors text-sm font-bold"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {modules.length === 0 && (
                                    <p className="text-center text-text-muted py-12">Aucun module créé.</p>
                                )}
                            </div>
                        </section>
                    ) : activeTab === 'skills' ? (
                        <section className="bg-surface border border-border rounded-3xl p-6 md:p-8">
                            <SkillManagementTab />
                        </section>
                    ) : (
                        <section className="bg-surface border border-border rounded-3xl p-6 md:p-8">
                            <h2 className="text-xl font-bold mb-6">Gestion des Utilisateurs</h2>
                            <UserManagementTab />
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: 'blue' | 'purple' }) {
    const gradient = {
        blue: 'from-blue-500/10',
        purple: 'from-purple-500/10',
    };
    return (
        <div className={`p-6 bg-surface border border-border rounded-2xl bg-gradient-to-br ${gradient[color]} to-transparent`}>
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-background rounded-xl border border-border">{icon}</div>
                <span className="text-sm font-medium text-text-muted">{title}</span>
            </div>
            <div className="text-4xl font-black text-text">{value}</div>
        </div>
    );
}
