import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Lock as LockIcon, Loader2, Award, ChevronRight, ChevronDown } from 'lucide-react';

type Module = {
    id: string;
    name?: string; // certains modules pourraient utiliser name au lieu de title dans d'autres contextes, mais on garde title par cohérence
    title: string;
    description: string;
    category: string;
    difficulty: 'Découverte' | 'Fondamentaux' | 'Avancé' | 'Expert';
    order_index: number;
    prerequisite_id?: string | null;
};

type UserModule = {
    module_id: string;
    unlocked: boolean;
    completed: boolean;
};

export default function CoursesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [modules, setModules] = useState<Module[]>([]);
    const [userModules, setUserModules] = useState<Record<string, UserModule>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
    const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            setIsLoading(true);
            try {
                const [
                    { data: modData },
                    { data: userModData }
                ] = await Promise.all([
                    supabase.from('modules').select('*').order('order_index', { ascending: true }),
                    supabase.from('user_modules').select('*').eq('user_id', user.id)
                ]);

                setModules(modData || []);
                const userModMap: Record<string, UserModule> = {};
                userModData?.forEach(um => { userModMap[um.module_id] = um; });
                setUserModules(userModMap);
            } catch (err) {
                console.error("Courses fetchData error:", err);
            } finally {
                setIsLoading(false);
            }
        }

        if (!authLoading && user) fetchData();

        const channel = supabase
            .channel('courses-updates')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'user_modules', 
                filter: `user_id=eq.${user?.id}` 
            }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, authLoading]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.difficulty-dropdown')) {
                setIsDifficultyOpen(false);
            }
        };

        if (isDifficultyOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDifficultyOpen]);

    const categories = Array.from(new Set(modules.map(m => m.category))).sort();
    const difficulties = ['Découverte', 'Fondamentaux', 'Avancé', 'Expert'];

    const filteredModules = modules.filter(mod => {
        const matchesCategory = filterCategory === 'all' || mod.category === filterCategory;
        const matchesDifficulty = filterDifficulty === 'all' || mod.difficulty === filterDifficulty;
        const matchesSearch = mod.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              mod.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesDifficulty && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-background text-text p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black mb-2 uppercase tracking-tight">Catalogue des Cours</h1>
                        <p className="text-text-muted text-lg text-balance">Maîtrisez les technologies de demain avec nos parcours guidés.</p>
                    </div>
                </div>

                <div className="mb-10 space-y-6">
                    {/* ligne de recherche et difficulté */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <input 
                                type="text"
                                placeholder="Rechercher un cours..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-surface border border-border rounded-2xl outline-none focus:border-accent/50 focus:bg-surface-hover transition-all font-medium text-text placeholder:text-text-muted/50"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors">
                                <BookOpen size={20} />
                            </div>
                        </div>
                        
                        <div className="relative min-w-[240px] difficulty-dropdown">
                            <button 
                                onClick={() => setIsDifficultyOpen(!isDifficultyOpen)}
                                className={`w-full pl-6 pr-12 py-4 bg-surface border rounded-2xl outline-none transition-all font-bold text-left text-sm flex items-center justify-between group
                                    ${isDifficultyOpen ? 'border-accent/50 bg-surface-hover' : 'border-border'}`}
                            >
                                <span className={filterDifficulty === 'all' ? 'text-text-muted/50' : 'text-text'}>
                                    {filterDifficulty === 'all' ? 'Toutes les difficultés' : filterDifficulty}
                                </span>
                                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isDifficultyOpen ? 'rotate-180 text-accent' : 'text-text-muted'}`} />
                            </button>

                            {isDifficultyOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-surface border border-border rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => { setFilterDifficulty('all'); setIsDifficultyOpen(false); }}
                                        className={`w-full px-4 py-3 rounded-xl text-left text-sm font-bold transition-colors mb-1
                                            ${filterDifficulty === 'all' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-surface-hover hover:text-text'}`}
                                    >
                                        Toutes les difficultés
                                    </button>
                                    {difficulties.map(d => (
                                        <button
                                            key={d}
                                            onClick={() => { setFilterDifficulty(d); setIsDifficultyOpen(false); }}
                                            className={`w-full px-4 py-3 rounded-xl text-left text-sm font-bold transition-colors mb-1
                                                ${filterDifficulty === d ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-surface-hover hover:text-text'}`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ligne de catégorie */}
                    <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar pb-2">
                        <button
                            onClick={() => setFilterCategory('all')}
                            className={`px-5 py-2.5 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all border
                                ${filterCategory === 'all' 
                                    ? 'bg-accent text-white border-accent shadow-[0_0_20px_rgba(66,202,237,0.3)]' 
                                    : 'bg-surface border-border text-text-muted hover:text-text hover:bg-surface-hover'}`}
                        >
                            Tous
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-5 py-2.5 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all border whitespace-nowrap
                                    ${filterCategory === cat 
                                        ? 'bg-accent text-white border-accent shadow-[0_0_20px_rgba(66,202,237,0.3)]' 
                                        : 'bg-surface border-border text-text-muted hover:text-text hover:bg-surface-hover'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-accent animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredModules.map((mod, index) => {
                            const userMod = userModules[mod.id];
                            const isUnlocked = userMod?.unlocked || !mod.prerequisite_id;
                            const isCompleted = userMod?.completed;

                            const difficultyColors = {
                                'Découverte': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
                                'Fondamentaux': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
                                'Avancé': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
                                'Expert': 'text-rose-400 bg-rose-400/10 border-rose-400/20'
                            };

                            return (
                                <Link
                                    key={mod.id}
                                    to={isUnlocked ? `/modules/${mod.id}` : '#'}
                                    className={`group p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col ${isUnlocked
                                            ? 'bg-surface/50 border-border hover:border-accent/40 hover:bg-surface/80 hover:translate-y-[-4px]'
                                            : 'bg-surface/10 border-border opacity-60 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-3 rounded-2xl bg-background border border-border ${isUnlocked ? 'text-accent' : 'text-text-muted'}`}>
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {isCompleted && (
                                                <div className="flex items-center gap-1.5 text-green-400 text-[9px] font-black bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20 uppercase tracking-wider">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Complété
                                                </div>
                                            )}
                                            {!isUnlocked && <LockIcon className="w-4 h-4 text-text-muted" />}
                                            <div className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-wider ${difficultyColors[mod.difficulty] || 'text-text-muted border-border bg-surface-hover'}`}>
                                                {mod.difficulty || 'Non défini'}
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors leading-tight">{mod.title}</h3>
                                    <p className="text-text-muted text-sm mb-8 line-clamp-2 flex-grow leading-relaxed">{mod.description}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-accent/60 uppercase tracking-widest">Domaine</span>
                                            <span className="text-xs font-black text-text/90 tracking-widest uppercase">
                                                {mod.category || 'GÉNÉRAL'}
                                            </span>
                                        </div>
                                        {isUnlocked ? (
                                            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        ) : (
                                            <div className="text-[10px] font-black text-text-muted uppercase tracking-wider">Verrouillé</div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {!isLoading && modules.length === 0 && (
                    <div className="text-center py-20 bg-surface/20 rounded-3xl border border-dashed border-border">
                        <Award className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <p className="text-text-muted italic">Aucun cours disponible pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
