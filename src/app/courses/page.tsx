import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Lock, Loader2, Search, ChevronRight, Flame, Trophy, Zap } from 'lucide-react';

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

const DIFFICULTY_CONFIG = {
    Découverte:   { color: 'text-sky-400',     bg: 'bg-sky-400/10',     border: 'border-sky-400/20',     dot: 'bg-sky-400',     label: 'Débutant' },
    Fondamentaux: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', dot: 'bg-emerald-400', label: 'Intermédiaire' },
    Avancé:       { color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20',   dot: 'bg-amber-400',   label: 'Avancé' },
    Expert:       { color: 'text-rose-400',    bg: 'bg-rose-400/10',    border: 'border-rose-400/20',    dot: 'bg-rose-400',    label: 'Expert' },
};

export default function CoursesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [modules, setModules] = useState<Module[]>([]);
    const [userModules, setUserModules] = useState<Record<string, UserModule>>({});
    const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
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
                const [{ data: modData }, { data: userModData }, { data: lessonData }] = await Promise.all([
                    supabase.from('modules').select('*').order('order_index', { ascending: true }),
                    supabase.from('user_modules').select('*').eq('user_id', user.id),
                    supabase.from('lessons').select('module_id'),
                ]);

                setModules(modData || []);

                const userModMap: Record<string, UserModule> = {};
                userModData?.forEach(um => { userModMap[um.module_id] = um; });
                setUserModules(userModMap);

                const counts: Record<string, number> = {};
                lessonData?.forEach(l => { counts[l.module_id] = (counts[l.module_id] || 0) + 1; });
                setLessonCounts(counts);
            } catch (err) {
                console.error('Courses fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        }
        if (!authLoading && user) fetchData();
    }, [user?.id, authLoading]);

    const categories = Array.from(new Set(modules.map(m => m.category).filter(Boolean))).sort();
    const difficulties = ['Découverte', 'Fondamentaux', 'Avancé', 'Expert'];

    const filtered = modules.filter(m => {
        const matchCat  = filterCategory === 'all' || m.category === filterCategory;
        const matchDiff = filterDifficulty === 'all' || m.difficulty === filterDifficulty;
        const matchQ    = !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchDiff && matchQ;
    });

    const completedCount = modules.filter(m => userModules[m.id]?.completed).length;
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
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-3">
                                Tous les cours
                            </h1>
                            <p className="text-text-muted text-lg max-w-xl">
                                Maîtrisez les technologies cloud, DevOps et infrastructure avec des parcours structurés.
                            </p>
                        </div>

                        {/* stats personnelles */}
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

            <div className="max-w-7xl mx-auto px-6 py-10">

                {/* ── Filtres ── */}
                <div className="flex flex-col gap-4 mb-10">
                    {/* recherche */}
                    <div className="relative group max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher un cours..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-surface border border-border/80 rounded-2xl outline-none focus:border-accent/40 transition-all text-text placeholder:text-text-muted/50 font-medium"
                        />
                    </div>

                    {/* catégories */}
                    <div className="flex flex-wrap gap-2">
                        {['all', ...categories].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                                    filterCategory === cat
                                        ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
                                        : 'bg-surface border-border text-text-muted hover:text-text hover:border-accent/30'
                                }`}
                            >
                                {cat === 'all' ? 'Tous' : cat}
                            </button>
                        ))}
                        <div className="w-px h-8 bg-border/40 mx-1 self-center" />
                        {difficulties.map(d => {
                            const conf = DIFFICULTY_CONFIG[d as keyof typeof DIFFICULTY_CONFIG];
                            return (
                                <button
                                    key={d}
                                    onClick={() => setFilterDifficulty(filterDifficulty === d ? 'all' : d)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                                        filterDifficulty === d
                                            ? `${conf.bg} ${conf.color} ${conf.border}`
                                            : 'bg-surface border-border text-text-muted hover:text-text hover:border-border/60'
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                                    {conf.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Grille ── */}
                {isLoading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-10 h-10 text-accent animate-spin opacity-40" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24 bg-surface/20 rounded-3xl border border-dashed border-border">
                        <Trophy className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
                        <p className="text-text-muted font-medium">Aucun cours ne correspond à ta recherche.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(mod => {
                            const userMod = userModules[mod.id];
                            const isCompleted = !!userMod?.completed;
                            const isUnlocked = !!userMod?.unlocked || !mod.prerequisite_id;
                            const isInProgress = isUnlocked && !isCompleted && !!userMod;
                            const lessonCount = lessonCounts[mod.id] || 0;
                            const conf = DIFFICULTY_CONFIG[mod.difficulty] || DIFFICULTY_CONFIG['Découverte'];

                            return (
                                <Link
                                    key={mod.id}
                                    to={isUnlocked ? `/modules/${mod.id}` : '#'}
                                    className={`group flex flex-col rounded-3xl border overflow-hidden transition-all duration-300 ${
                                        isUnlocked
                                            ? 'bg-surface border-border hover:border-accent/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/5'
                                            : 'bg-surface/40 border-border/40 opacity-60 cursor-not-allowed'
                                    }`}
                                >
                                    {/* bande de couleur en haut selon difficulté */}
                                    <div className={`h-1.5 w-full ${conf.dot} ${!isUnlocked ? 'opacity-30' : ''}`} />

                                    <div className="flex flex-col flex-1 p-6 gap-4">
                                        {/* header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className={`p-3 rounded-2xl border ${conf.bg} ${conf.border}`}>
                                                <BookOpen className={`w-5 h-5 ${conf.color}`} />
                                            </div>
                                            <div className="flex items-center gap-2">
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
                                                {!isUnlocked && <Lock className="w-4 h-4 text-text-muted/60" />}
                                            </div>
                                        </div>

                                        {/* titre + description */}
                                        <div className="flex-1">
                                            <h3 className={`font-black text-lg leading-tight mb-2 transition-colors ${isUnlocked ? 'group-hover:text-accent' : ''}`}>
                                                {mod.title}
                                            </h3>
                                            <p className="text-text-muted text-sm leading-relaxed line-clamp-2">
                                                {mod.description}
                                            </p>
                                        </div>

                                        {/* métadonnées */}
                                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-text-muted/60">
                                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${conf.bg} ${conf.color} ${conf.border}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                                                {conf.label}
                                            </span>
                                            {lessonCount > 0 && (
                                                <span>{lessonCount} leçon{lessonCount > 1 ? 's' : ''}</span>
                                            )}
                                            {mod.category && (
                                                <span className="truncate">{mod.category}</span>
                                            )}
                                        </div>

                                        {/* footer */}
                                        <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                                            {isCompleted ? (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                                    Module maîtrisé ✓
                                                </span>
                                            ) : isInProgress ? (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                                                    Continuer →
                                                </span>
                                            ) : isUnlocked ? (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                                    Commencer
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/40">
                                                    Verrouillé
                                                </span>
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
        </div>
    );
}
