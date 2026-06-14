import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Lock, Loader2, Search, ChevronRight, Flame, Trophy, Zap, LayoutGrid, List } from 'lucide-react';

type Module = {
    id: string;
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

const DIFF = {
    Découverte:   { color: 'text-sky-400',     bg: 'bg-sky-400/10',     border: 'border-sky-400/20',     bar: 'bg-sky-400',     label: 'Débutant',      dot: 'bg-sky-400' },
    Fondamentaux: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', bar: 'bg-emerald-400', label: 'Intermédiaire', dot: 'bg-emerald-400' },
    Avancé:       { color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20',   bar: 'bg-amber-400',   label: 'Avancé',        dot: 'bg-amber-400' },
    Expert:       { color: 'text-rose-400',    bg: 'bg-rose-400/10',    border: 'border-rose-400/20',    bar: 'bg-rose-400',    label: 'Expert',        dot: 'bg-rose-400' },
};

export default function CoursesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [modules, setModules] = useState<Module[]>([]);
    const [userModules, setUserModules] = useState<Record<string, UserModule>>({});
    const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
    const [completedLessonCounts, setCompletedLessonCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            setIsLoading(true);
            try {
                const [{ data: modData }, { data: userModData }, { data: lessonData }, { data: userLessonData }] = await Promise.all([
                    supabase.from('modules').select('*').order('order_index', { ascending: true }),
                    supabase.from('user_modules').select('*').eq('user_id', user.id),
                    supabase.from('lessons').select('module_id'),
                    supabase.from('user_lessons').select('lesson_id, completed').eq('user_id', user.id),
                ]);
                setModules(modData || []);
                const umMap: Record<string, UserModule> = {};
                userModData?.forEach(um => { umMap[um.module_id] = um; });
                setUserModules(umMap);
                const counts: Record<string, number> = {};
                lessonData?.forEach(l => { counts[l.module_id] = (counts[l.module_id] || 0) + 1; });
                setLessonCounts(counts);
                // pour calculer le % de progression par module
                const completedByLesson = new Set(userLessonData?.filter(ul => ul.completed).map(ul => ul.lesson_id) || []);
                const completedCounts: Record<string, number> = {};
                lessonData?.forEach(l => {
                    if (completedByLesson.has(l.module_id)) {
                        completedCounts[l.module_id] = (completedCounts[l.module_id] || 0) + 1;
                    }
                });
                setCompletedLessonCounts(completedCounts);
            } catch (err) {
                console.error('Courses fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        }
        if (!authLoading && user) fetchData();
    }, [user?.id, authLoading]);

    const categories = Array.from(new Set(modules.map(m => m.category).filter(Boolean))).sort();

    const filtered = modules.filter(m => {
        const um = userModules[m.id];
        const isUnlocked = !!um?.unlocked || !m.prerequisite_id;
        if (filterCategory !== 'all' && m.category !== filterCategory) return false;
        if (filterDifficulty !== 'all' && m.difficulty !== filterDifficulty) return false;
        if (filterStatus === 'completed' && !um?.completed) return false;
        if (filterStatus === 'inprogress' && (!isUnlocked || um?.completed || !um)) return false;
        if (filterStatus === 'locked' && isUnlocked) return false;
        if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase()) && !m.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const stats = {
        total: modules.length,
        completed: modules.filter(m => userModules[m.id]?.completed).length,
        inProgress: modules.filter(m => {
            const um = userModules[m.id];
            return um && !um.completed && (um.unlocked || !modules.find(mod => mod.id === m.id)?.prerequisite_id);
        }).length,
    };

    return (
        <div className="min-h-screen bg-background text-text font-sans">

            {/* ── Header ── */}
            <div className="border-b border-border/40 bg-surface/30">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">Catalogue des cours</h1>
                            <p className="text-text-muted">Parcours structurés pour maîtriser les technologies cloud & DevOps.</p>
                        </div>
                        {/* stat pills */}
                        <div className="flex items-center gap-3">
                            <button onClick={() => setFilterStatus(filterStatus === 'completed' ? 'all' : 'completed')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${filterStatus === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-surface border-border text-text-muted hover:border-emerald-500/30 hover:text-emerald-400'}`}>
                                <CheckCircle className="w-3.5 h-3.5" /> {stats.completed} terminés
                            </button>
                            <button onClick={() => setFilterStatus(filterStatus === 'inprogress' ? 'all' : 'inprogress')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${filterStatus === 'inprogress' ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface border-border text-text-muted hover:border-accent/30 hover:text-accent'}`}>
                                <Flame className="w-3.5 h-3.5" /> {stats.inProgress} en cours
                            </button>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-border bg-surface text-text-muted">
                                <BookOpen className="w-3.5 h-3.5" /> {stats.total} total
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 flex gap-8">

                {/* ── Sidebar filtres ── */}
                <aside className="hidden lg:flex flex-col gap-6 w-56 shrink-0">
                    {/* Recherche */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/60" />
                        <input type="text" placeholder="Rechercher..." value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 bg-surface border border-border/80 rounded-xl outline-none focus:border-accent/40 text-sm text-text placeholder:text-text-muted/40 transition-all" />
                    </div>

                    {/* Catégories */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 mb-3">Catégorie</p>
                        <div className="space-y-1">
                            {['all', ...categories].map(cat => (
                                <button key={cat} onClick={() => setFilterCategory(cat)}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all ${filterCategory === cat ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-surface-hover hover:text-text'}`}>
                                    {cat === 'all' ? 'Toutes les catégories' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulté */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 mb-3">Niveau</p>
                        <div className="space-y-1">
                            {[{ key: 'all', label: 'Tous les niveaux', dot: '' }, ...Object.entries(DIFF).map(([k, v]) => ({ key: k, label: v.label, dot: v.dot }))].map(item => (
                                <button key={item.key} onClick={() => setFilterDifficulty(item.key)}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${filterDifficulty === item.key ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-surface-hover hover:text-text'}`}>
                                    {item.dot && <span className={`w-2 h-2 rounded-full ${item.dot} shrink-0`} />}
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ── Contenu principal ── */}
                <div className="flex-1 min-w-0">
                    {/* barre top */}
                    <div className="flex items-center justify-between mb-5">
                        <p className="text-sm text-text-muted">
                            <span className="font-black text-text">{filtered.length}</span> cours
                            {searchQuery && <span> pour "<span className="text-accent">{searchQuery}</span>"</span>}
                        </p>
                        <div className="flex items-center gap-2">
                            {/* recherche mobile */}
                            <div className="relative lg:hidden">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/60" />
                                <input type="text" placeholder="Rechercher..." value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-3 py-2 bg-surface border border-border/80 rounded-xl outline-none focus:border-accent/40 text-sm text-text placeholder:text-text-muted/40 w-40 transition-all" />
                            </div>
                            <button onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg border transition-all ${viewMode === 'grid' ? 'bg-accent/10 border-accent/20 text-accent' : 'border-border text-text-muted hover:text-text'}`}>
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg border transition-all ${viewMode === 'list' ? 'bg-accent/10 border-accent/20 text-accent' : 'border-border text-text-muted hover:text-text'}`}>
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-accent animate-spin opacity-40" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-24 rounded-2xl border border-dashed border-border">
                            <Trophy className="w-10 h-10 text-text-muted/20 mx-auto mb-3" />
                            <p className="text-text-muted text-sm">Aucun cours trouvé.</p>
                            <button onClick={() => { setFilterCategory('all'); setFilterDifficulty('all'); setFilterStatus('all'); setSearchQuery(''); }}
                                className="mt-4 text-accent text-xs font-black uppercase tracking-widest hover:underline">
                                Réinitialiser les filtres
                            </button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {filtered.map(mod => <CourseCard key={mod.id} mod={mod} userMod={userModules[mod.id]} lessonCount={lessonCounts[mod.id] || 0} completedCount={completedLessonCounts[mod.id] || 0} />)}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map(mod => <CourseRow key={mod.id} mod={mod} userMod={userModules[mod.id]} lessonCount={lessonCounts[mod.id] || 0} completedCount={completedLessonCounts[mod.id] || 0} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Carte grille ──
function CourseCard({ mod, userMod, lessonCount, completedCount }: { mod: Module; userMod?: UserModule; lessonCount: number; completedCount: number }) {
    const isCompleted = !!userMod?.completed;
    const isUnlocked = !!userMod?.unlocked || !mod.prerequisite_id;
    const isInProgress = isUnlocked && !isCompleted && !!userMod;
    const conf = DIFF[mod.difficulty] || DIFF['Découverte'];
    const pct = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;

    return (
        <Link to={isUnlocked ? `/modules/${mod.id}` : '#'}
            className={`group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 ${
                isUnlocked ? 'bg-surface border-border hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5' : 'bg-surface/40 border-border/30 opacity-50 cursor-not-allowed'
            }`}>
            {/* top bar difficulté */}
            <div className={`h-1 w-full ${conf.bar} ${!isUnlocked ? 'opacity-30' : ''}`} />

            <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${conf.bg} ${conf.color} ${conf.border}`}>
                        {conf.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {isCompleted && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Terminé</span>}
                        {isInProgress && <span className="text-[9px] font-black uppercase tracking-widest text-accent flex items-center gap-1"><Flame className="w-3 h-3" />En cours</span>}
                        {!isUnlocked && <Lock className="w-3.5 h-3.5 text-text-muted/50" />}
                    </div>
                </div>

                <div className="flex-1">
                    <h3 className={`font-black text-base leading-tight mb-1.5 transition-colors ${isUnlocked ? 'group-hover:text-accent' : 'text-text-muted/60'}`}>
                        {mod.title}
                    </h3>
                    <p className="text-text-muted text-xs leading-relaxed line-clamp-2">{mod.description}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40">
                    {/* barre de progression */}
                    {isUnlocked && lessonCount > 0 && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-text-muted/60">
                                <span>{completedCount}/{lessonCount} leçons</span>
                                <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-text-muted/50">{mod.category}</span>
                        {isUnlocked && (
                            <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-all ${isCompleted ? 'text-emerald-400' : 'text-accent group-hover:gap-2'}`}>
                                {isCompleted ? 'Maîtrisé' : isInProgress ? 'Continuer' : 'Commencer'}
                                <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ── Ligne liste ──
function CourseRow({ mod, userMod, lessonCount, completedCount }: { mod: Module; userMod?: UserModule; lessonCount: number; completedCount: number }) {
    const isCompleted = !!userMod?.completed;
    const isUnlocked = !!userMod?.unlocked || !mod.prerequisite_id;
    const isInProgress = isUnlocked && !isCompleted && !!userMod;
    const conf = DIFF[mod.difficulty] || DIFF['Découverte'];
    const pct = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;

    return (
        <Link to={isUnlocked ? `/modules/${mod.id}` : '#'}
            className={`group flex items-center gap-5 p-4 rounded-2xl border transition-all duration-200 ${
                isUnlocked ? 'bg-surface border-border hover:border-accent/40 hover:bg-accent/5' : 'bg-surface/40 border-border/30 opacity-50 cursor-not-allowed'
            }`}>
            {/* icône statut */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                isInProgress ? 'bg-accent/10 border-accent/20 text-accent' :
                isUnlocked ? 'bg-surface-hover border-border text-text-muted group-hover:border-accent/30 group-hover:text-accent' :
                'bg-surface border-border/40 text-text-muted/30'
            }`}>
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : isInProgress ? <Flame className="w-5 h-5" /> : isUnlocked ? <BookOpen className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                    <h3 className={`font-black text-sm transition-colors truncate ${isUnlocked ? 'group-hover:text-accent' : 'text-text-muted/60'}`}>{mod.title}</h3>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border shrink-0 ${conf.bg} ${conf.color} ${conf.border}`}>{conf.label}</span>
                </div>
                {isUnlocked && lessonCount > 0 && (
                    <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[200px] h-1.5 bg-border/30 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-text-muted/60">{completedCount}/{lessonCount}</span>
                    </div>
                )}
            </div>

            <div className="shrink-0 flex items-center gap-3">
                {mod.category && <span className="text-[10px] font-bold text-text-muted/50 hidden md:block">{mod.category}</span>}
                {isUnlocked && <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />}
            </div>
        </Link>
    );
}
