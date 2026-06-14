import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Lock, Search, ChevronRight, Flame, Trophy, Zap, LayoutGrid, List } from 'lucide-react';

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

type SortOrder =
    | 'default'
    | 'difficulty-asc'
    | 'difficulty-desc'
    | 'alpha-asc'
    | 'alpha-desc'
    | 'xp-asc'
    | 'xp-desc';

type ViewMode = 'grid' | 'list';

const DIFFICULTY_CONFIG = {
    Découverte:   { color: 'text-sky-400',     bg: 'bg-sky-400/10',     border: 'border-sky-400/20',     dot: 'bg-sky-400',     label: 'Débutant' },
    Fondamentaux: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', dot: 'bg-emerald-400', label: 'Intermédiaire' },
    Avancé:       { color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20',   dot: 'bg-amber-400',   label: 'Avancé' },
    Expert:       { color: 'text-rose-400',    bg: 'bg-rose-400/10',    border: 'border-rose-400/20',    dot: 'bg-rose-400',    label: 'Expert' },
};

const XP_MULTIPLIERS: Record<Module['difficulty'], number> = {
    Découverte:   10,
    Fondamentaux: 25,
    Avancé:       50,
    Expert:       100,
};

const DIFFICULTY_ORDER: Record<Module['difficulty'], number> = {
    Découverte:   0,
    Fondamentaux: 1,
    Avancé:       2,
    Expert:       3,
};

export function calculateModuleXP(lessonCount: number, difficulty: Module['difficulty']): number {
    return lessonCount * XP_MULTIPLIERS[difficulty];
}

export function calculateRemainingXP(lessonCount: number, completedCount: number, difficulty: Module['difficulty']): number {
    return (lessonCount - completedCount) * XP_MULTIPLIERS[difficulty];
}

export function sortModules(list: Module[], order: SortOrder, xpMap: Record<string, number>): Module[] {
    const sorted = [...list];
    switch (order) {
        case 'default':       return sorted.sort((a, b) => a.order_index - b.order_index);
        case 'difficulty-asc':return sorted.sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);
        case 'difficulty-desc':return sorted.sort((a, b) => DIFFICULTY_ORDER[b.difficulty] - DIFFICULTY_ORDER[a.difficulty]);
        case 'alpha-asc':     return sorted.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
        case 'alpha-desc':    return sorted.sort((a, b) => b.title.toLowerCase().localeCompare(a.title.toLowerCase()));
        case 'xp-asc':        return sorted.sort((a, b) => (xpMap[a.id] || 0) - (xpMap[b.id] || 0));
        case 'xp-desc':       return sorted.sort((a, b) => (xpMap[b.id] || 0) - (xpMap[a.id] || 0));
    }
}

/* ── Sub-components ── */

function SkeletonCard() {
    return (
        <div className="flex flex-col rounded-3xl border border-border/40 overflow-hidden animate-pulse bg-surface/40">
            <div className="h-1.5 w-full bg-border/60" />
            <div className="flex flex-col flex-1 p-6 gap-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-border/40" />
                    <div className="w-16 h-6 rounded-full bg-border/40" />
                </div>
                <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 rounded bg-border/40" />
                    <div className="h-3.5 w-full rounded bg-border/30" />
                    <div className="h-3.5 w-5/6 rounded bg-border/30" />
                </div>
                <div className="flex gap-2">
                    <div className="h-6 w-20 rounded-full bg-border/40" />
                    <div className="h-6 w-12 rounded-full bg-border/30" />
                </div>
                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                    <div className="h-3 w-20 rounded bg-border/40" />
                    <div className="w-9 h-9 rounded-xl bg-border/40" />
                </div>
            </div>
        </div>
    );
}

interface ProgressBarProps {
    completed: number;
    total: number;
    difficulty: Module['difficulty'];
    moduleCompleted: boolean;
}

function ProgressBar({ completed, total, difficulty, moduleCompleted }: ProgressBarProps) {
    const pct = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
    const barColor = DIFFICULTY_CONFIG[difficulty]?.dot ?? 'bg-accent';
    let label: string;
    if (total === 0)                        label = '0 / 0 leçons';
    else if (pct === 100 && !moduleCompleted) label = 'Quiz disponible';
    else                                    label = `${completed} / ${total} leçon${total > 1 ? 's' : ''}`;

    return (
        <div className="flex flex-col gap-1">
            <div className="w-full bg-border/30 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/60">{label}</span>
        </div>
    );
}

interface XpBadgeProps { value: number; dimmed?: boolean; }
function XpBadge({ value, dimmed }: XpBadgeProps) {
    return (
        <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${dimmed ? 'text-text-muted/60' : 'text-accent'}`}>
            <Zap className="w-3 h-3" />{value} XP
        </span>
    );
}

function AvailableBadge() {
    return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[9px] font-black uppercase tracking-wider">
            Disponible
        </div>
    );
}

interface ContinueSectionProps {
    modules: Module[];
    userModules: Record<string, UserModule>;
    lessonCounts: Record<string, number>;
    completedLessons: Record<string, number>;
}

function ContinueSection({ modules, userModules, lessonCounts, completedLessons }: ContinueSectionProps) {
    const inProgress = modules
        .filter(m => { const um = userModules[m.id]; return um?.unlocked && !um?.completed; })
        .sort((a, b) => a.order_index - b.order_index)
        .slice(0, 4);

    if (inProgress.length === 0) return null;

    return (
        <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
                <Flame className="w-4 h-4 text-accent" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">Continuer</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {inProgress.map(mod => {
                    const conf = DIFFICULTY_CONFIG[mod.difficulty] || DIFFICULTY_CONFIG['Découverte'];
                    return (
                        <Link
                            key={mod.id}
                            to={`/modules/${mod.id}`}
                            className="group flex flex-col rounded-2xl border border-border bg-surface overflow-hidden hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
                        >
                            <div className={`h-1 w-full ${conf.dot}`} />
                            <div className="p-4 flex flex-col gap-3">
                                <h3 className="font-black text-sm leading-tight line-clamp-2 group-hover:text-accent transition-colors">{mod.title}</h3>
                                <ProgressBar completed={completedLessons[mod.id] || 0} total={lessonCounts[mod.id] || 0} difficulty={mod.difficulty} moduleCompleted={false} />
                                <span className={`text-[9px] font-black uppercase tracking-widest ${conf.color}`}>{conf.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

/* ── Page ── */

export default function CoursesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [modules, setModules]               = useState<Module[]>([]);
    const [userModules, setUserModules]       = useState<Record<string, UserModule>>({});
    const [lessonCounts, setLessonCounts]     = useState<Record<string, number>>({});
    const [completedLessons, setCompletedLessons] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading]           = useState(true);
    const [error, setError]                   = useState<string | null>(null);
    const [retryCount, setRetryCount]         = useState(0);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [searchQuery, setSearchQuery]       = useState('');
    const [sortOrder, setSortOrder]           = useState<SortOrder>('default');
    const [viewMode, setViewMode]             = useState<ViewMode>('grid');
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            setIsLoading(true);
            setError(null);
            try {
                const [
                    { data: modData,        error: modErr        },
                    { data: userModData,    error: userModErr    },
                    { data: lessonData,     error: lessonErr     },
                    { data: userLessonData, error: userLessonErr },
                ] = await Promise.all([
                    supabase.from('modules').select('*').order('order_index', { ascending: true }),
                    supabase.from('user_modules').select('*').eq('user_id', user.id),
                    supabase.from('lessons').select('module_id'),
                    supabase.from('user_lessons').select('lesson_id, lessons(module_id)').eq('user_id', user.id).eq('completed', true),
                ]);

                if (modErr || userModErr || lessonErr || userLessonErr) throw new Error('Erreur lors du chargement');

                setModules(modData || []);

                const userModMap: Record<string, UserModule> = {};
                userModData?.forEach(um => { userModMap[um.module_id] = um; });
                setUserModules(userModMap);

                const counts: Record<string, number> = {};
                lessonData?.forEach(l => { counts[l.module_id] = (counts[l.module_id] || 0) + 1; });
                setLessonCounts(counts);

                const completedMap: Record<string, number> = {};
                userLessonData?.forEach(ul => {
                    const rel = ul.lessons as unknown as { module_id: string } | { module_id: string }[] | null;
                    const mid = Array.isArray(rel) ? rel[0]?.module_id : rel?.module_id;
                    if (mid) completedMap[mid] = (completedMap[mid] || 0) + 1;
                });
                setCompletedLessons(completedMap);
            } catch (err) {
                console.error('Courses fetch error:', err);
                setError('Impossible de charger les cours. Veuillez réessayer.');
            } finally {
                setIsLoading(false);
            }
        }
        if (!authLoading && user) fetchData();
    }, [user?.id, authLoading, retryCount]);

    function resetFilters() {
        setFilterCategory('all');
        setFilterDifficulty('all');
        setSearchQuery('');
        setSortOrder('default');
    }

    const categories  = useMemo(() => Array.from(new Set(modules.map(m => m.category).filter(Boolean))).sort(), [modules]);
    const difficulties = ['Découverte', 'Fondamentaux', 'Avancé', 'Expert'] as const;

    const xpMap = useMemo(() => {
        const map: Record<string, number> = {};
        modules.forEach(m => { map[m.id] = calculateModuleXP(lessonCounts[m.id] || 0, m.difficulty); });
        return map;
    }, [modules, lessonCounts]);

    const filtered = useMemo(() => {
        const base = modules.filter(m => {
            const matchCat  = filterCategory === 'all' || m.category === filterCategory;
            const matchDiff = filterDifficulty === 'all' || m.difficulty === filterDifficulty;
            const matchQ    = !searchQuery
                || m.title.toLowerCase().includes(searchQuery.toLowerCase())
                || m.description?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCat && matchDiff && matchQ;
        });
        return sortModules(base, sortOrder, xpMap);
    }, [modules, filterCategory, filterDifficulty, searchQuery, sortOrder, xpMap]);

    const completedCount  = modules.filter(m => userModules[m.id]?.completed).length;
    const inProgressCount = modules.filter(m => userModules[m.id]?.unlocked && !userModules[m.id]?.completed).length;

    return (
        <div className="min-h-screen bg-background text-text font-sans">

            {/* ── Hero ── */}
            <div className="relative border-b border-border/40 bg-surface/30">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 relative">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-3">catalogue</p>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-3">Tous les cours</h1>
                            <p className="text-text-muted text-lg max-w-xl">
                                Maîtrisez les technologies cloud, DevOps et infrastructure avec des parcours structurés.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="flex flex-col items-center px-6 py-4 bg-background border border-border/60 rounded-2xl">
                                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-2xl font-black">{completedCount}</span>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">terminés</span>
                            </div>
                            <div className="flex flex-col items-center px-6 py-4 bg-background border border-border/60 rounded-2xl">
                                <div className="flex items-center gap-2 text-accent mb-1">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-2xl font-black">{inProgressCount}</span>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">en cours</span>
                            </div>
                            <div className="flex flex-col items-center px-6 py-4 bg-background border border-border/60 rounded-2xl">
                                <div className="flex items-center gap-2 text-text-muted mb-1">
                                    <BookOpen className="w-4 h-4" />
                                    <span className="text-2xl font-black">{modules.length}</span>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">total</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main ── */}
            <div className="max-w-7xl mx-auto px-6 py-10">

                {/* Continue section — full width */}
                <ContinueSection
                    modules={modules}
                    userModules={userModules}
                    lessonCounts={lessonCounts}
                    completedLessons={completedLessons}
                />

                {/* Two-column: sidebar + content */}
                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* ── Sidebar ── */}
                    <aside className="w-full md:w-64 shrink-0 md:sticky md:top-6 md:self-start">
                        <div className="bg-surface/50 border border-border/60 rounded-3xl p-5 flex flex-col gap-5">

                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-text-muted/60">Filtres</p>

                            {/* Search */}
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 bg-surface border border-border/80 rounded-2xl outline-none focus:border-accent/40 transition-all text-text placeholder:text-text-muted/50 font-medium text-sm"
                                />
                            </div>

                            {/* Catégorie */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/60 mb-2">Catégorie</p>
                                <div className="flex flex-col gap-1">
                                    {['all', ...categories].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setFilterCategory(cat)}
                                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left ${
                                                filterCategory === cat
                                                    ? 'bg-accent text-white'
                                                    : 'text-text-muted hover:text-text hover:bg-surface'
                                            }`}
                                        >
                                            {cat === 'all' ? 'Tous' : cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulté */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/60 mb-2">Difficulté</p>
                                <div className="flex flex-col gap-1">
                                    {difficulties.map(d => {
                                        const conf = DIFFICULTY_CONFIG[d];
                                        return (
                                            <button
                                                key={d}
                                                onClick={() => setFilterDifficulty(filterDifficulty === d ? 'all' : d)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    filterDifficulty === d
                                                        ? `${conf.bg} ${conf.color} border ${conf.border}`
                                                        : 'text-text-muted hover:text-text hover:bg-surface'
                                                }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conf.dot}`} />
                                                {conf.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Trier par */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/60 mb-2">Trier par</p>
                                <select
                                    value={sortOrder}
                                    onChange={e => setSortOrder(e.target.value as SortOrder)}
                                    className="w-full px-3 py-2.5 bg-surface border border-border/80 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text outline-none focus:border-accent/40 transition-all cursor-pointer"
                                >
                                    <option value="default">Ordre par défaut</option>
                                    <option value="difficulty-asc">Difficulté croissante</option>
                                    <option value="difficulty-desc">Difficulté décroissante</option>
                                    <option value="alpha-asc">Alphabétique A→Z</option>
                                    <option value="alpha-desc">Alphabétique Z→A</option>
                                    <option value="xp-asc">XP potentiel croissant</option>
                                    <option value="xp-desc">XP potentiel décroissant</option>
                                </select>
                            </div>

                            {/* Reset */}
                            <button
                                onClick={resetFilters}
                                className="w-full px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-border/60 text-text-muted hover:text-text hover:border-accent/30 transition-all"
                            >
                                Réinitialiser
                            </button>
                        </div>
                    </aside>

                    {/* ── Content ── */}
                    <div className="flex-1 min-w-0">

                        {/* Top bar */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">
                                {filtered.length} cours trouvé{filtered.length !== 1 ? 's' : ''}
                            </p>
                            <div className="flex items-center gap-1 p-1 bg-surface border border-border/80 rounded-2xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    aria-label="Vue grille"
                                    className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    aria-label="Vue liste"
                                    className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* States */}
                        {error ? (
                            <div className="flex flex-col items-center gap-4 py-24 bg-surface/20 rounded-3xl border border-dashed border-rose-400/30">
                                <p className="text-text-muted font-medium">{error}</p>
                                <button
                                    onClick={() => setRetryCount(c => c + 1)}
                                    className="px-6 py-2.5 rounded-full bg-accent text-white text-[10px] font-black uppercase tracking-widest hover:bg-accent/90 transition-all"
                                >
                                    Réessayer
                                </button>
                            </div>
                        ) : isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-24 bg-surface/20 rounded-3xl border border-dashed border-border">
                                <Trophy className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
                                <p className="text-text-muted font-medium mb-4">Aucun cours ne correspond à ta recherche.</p>
                                <button
                                    onClick={resetFilters}
                                    className="px-6 py-2.5 rounded-full bg-surface border border-border text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text hover:border-accent/30 transition-all"
                                >
                                    Réinitialiser les filtres
                                </button>
                            </div>
                        ) : (
                            <div className="transition-opacity duration-150">
                                {viewMode === 'list' ? (
                                    /* ── List view ── */
                                    <div className="flex flex-col gap-3">
                                        {filtered.map(mod => {
                                            const userMod = userModules[mod.id];
                                            const isCompleted  = !!userMod?.completed;
                                            const isUnlocked   = !!userMod?.unlocked || !mod.prerequisite_id;
                                            const isInProgress = isUnlocked && !isCompleted && !!userMod;
                                            const conf = DIFFICULTY_CONFIG[mod.difficulty] || DIFFICULTY_CONFIG['Découverte'];
                                            return (
                                                <Link
                                                    key={mod.id}
                                                    to={isUnlocked ? `/modules/${mod.id}` : '#'}
                                                    aria-label={`${mod.title} — ${isCompleted ? 'Terminé' : isInProgress ? 'En cours' : isUnlocked ? 'Disponible' : 'Verrouillé'}`}
                                                    aria-disabled={!isUnlocked ? 'true' : undefined}
                                                    tabIndex={isUnlocked ? 0 : -1}
                                                    className={`group flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-200 ${
                                                        isUnlocked
                                                            ? 'bg-surface border-border hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5'
                                                            : 'bg-surface/40 border-border/40 opacity-60 cursor-not-allowed'
                                                    }`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${conf.dot}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-black text-sm leading-tight truncate ${isUnlocked ? 'group-hover:text-accent transition-colors' : ''}`}>{mod.title}</p>
                                                        <p className="text-text-muted text-xs truncate mt-0.5">{mod.description}</p>
                                                    </div>
                                                    {isUnlocked && (
                                                        <div className="w-28 shrink-0">
                                                            <ProgressBar
                                                                completed={completedLessons[mod.id] || 0}
                                                                total={lessonCounts[mod.id] || 0}
                                                                difficulty={mod.difficulty}
                                                                moduleCompleted={isCompleted}
                                                            />
                                                        </div>
                                                    )}
                                                    {isUnlocked && (
                                                        <XpBadge
                                                            value={isCompleted
                                                                ? calculateModuleXP(lessonCounts[mod.id] || 0, mod.difficulty)
                                                                : calculateRemainingXP(lessonCounts[mod.id] || 0, completedLessons[mod.id] || 0, mod.difficulty)}
                                                            dimmed={isCompleted}
                                                        />
                                                    )}
                                                    {isUnlocked && <ChevronRight className="w-4 h-4 text-text-muted/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    /* ── Grid view ── */
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filtered.map(mod => {
                                            const userMod = userModules[mod.id];
                                            const isCompleted  = !!userMod?.completed;
                                            const isUnlocked   = !!userMod?.unlocked || !mod.prerequisite_id;
                                            const isInProgress = isUnlocked && !isCompleted && !!userMod;
                                            const lessonCount  = lessonCounts[mod.id] || 0;
                                            const conf = DIFFICULTY_CONFIG[mod.difficulty] || DIFFICULTY_CONFIG['Découverte'];
                                            return (
                                                <Link
                                                    key={mod.id}
                                                    to={isUnlocked ? `/modules/${mod.id}` : '#'}
                                                    aria-label={`${mod.title} — ${isCompleted ? 'Terminé' : isInProgress ? 'En cours' : isUnlocked ? 'Disponible' : 'Verrouillé'} — ${isUnlocked ? `${Math.round(((completedLessons[mod.id] || 0) / (lessonCount || 1)) * 100)}%` : 'verrouillé'}`}
                                                    aria-disabled={!isUnlocked ? 'true' : undefined}
                                                    tabIndex={isUnlocked ? 0 : -1}
                                                    className={`group flex flex-col rounded-3xl border overflow-hidden transition-all duration-300 ${
                                                        isUnlocked
                                                            ? 'bg-surface border-border hover:border-accent/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/5'
                                                            : 'bg-surface/40 border-border/40 opacity-60 cursor-not-allowed'
                                                    }`}
                                                >
                                                    <div className={`h-1.5 w-full ${conf.dot} ${!isUnlocked ? 'opacity-30' : ''}`} />
                                                    <div className="flex flex-col flex-1 p-6 gap-4">
                                                        {/* header */}
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className={`p-3 rounded-2xl border ${conf.bg} ${conf.border}`}>
                                                                <BookOpen className={`w-5 h-5 ${conf.color}`} />
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                                                {isCompleted && (
                                                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                                                                        <CheckCircle className="w-3 h-3" /> Terminé
                                                                    </div>
                                                                )}
                                                                {isInProgress && (
                                                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[9px] font-black uppercase tracking-wider">
                                                                        <Flame className="w-3 h-3" /> En cours
                                                                    </div>
                                                                )}
                                                                {isUnlocked && !isCompleted && !isInProgress && <AvailableBadge />}
                                                                {!isUnlocked && <Lock className="w-4 h-4 text-text-muted/60" />}
                                                            </div>
                                                        </div>
                                                        {/* title + description */}
                                                        <div className="flex-1">
                                                            <h3 className={`font-black text-lg leading-tight mb-2 transition-colors ${isUnlocked ? 'group-hover:text-accent' : ''}`}>{mod.title}</h3>
                                                            <p className="text-text-muted text-sm leading-relaxed line-clamp-2">{mod.description}</p>
                                                        </div>
                                                        {/* progress bar */}
                                                        {isUnlocked && (
                                                            <ProgressBar
                                                                completed={completedLessons[mod.id] || 0}
                                                                total={lessonCount}
                                                                difficulty={mod.difficulty}
                                                                moduleCompleted={isCompleted}
                                                            />
                                                        )}
                                                        {/* metadata */}
                                                        <div className="flex items-center gap-3 flex-wrap text-[10px] font-black uppercase tracking-widest text-text-muted/60">
                                                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${conf.bg} ${conf.color} ${conf.border}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                                                                {conf.label}
                                                            </span>
                                                            {lessonCount > 0 && <span>{lessonCount} leçon{lessonCount > 1 ? 's' : ''}</span>}
                                                            {mod.category && <span className="truncate">{mod.category}</span>}
                                                            {isUnlocked && (
                                                                <XpBadge
                                                                    value={isCompleted
                                                                        ? calculateModuleXP(lessonCount, mod.difficulty)
                                                                        : calculateRemainingXP(lessonCount, completedLessons[mod.id] || 0, mod.difficulty)}
                                                                    dimmed={isCompleted}
                                                                />
                                                            )}
                                                        </div>
                                                        {/* footer */}
                                                        <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                                                            {isCompleted ? (
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Module maîtrisé ✓</span>
                                                            ) : isInProgress ? (
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Continuer →</span>
                                                            ) : isUnlocked ? (
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Commencer</span>
                                                            ) : (
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/40">Verrouillé</span>
                                                            )}
                                                            {isUnlocked && (
                                                                <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                                                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
