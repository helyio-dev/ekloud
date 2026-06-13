import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, HelpCircle, Loader2, Lock, ChevronLeft, ChevronRight, BookOpen, Trophy, Zap } from 'lucide-react';

type Module = {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    category: string;
};

type LessonPreview = {
    id: string;
    title: string;
    order_index: number;
};

const DIFFICULTY_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; label: string }> = {
    Découverte:   { color: 'text-sky-400',     bg: 'bg-sky-400/10',     border: 'border-sky-400/20',     dot: 'bg-sky-400',     label: 'Débutant' },
    Fondamentaux: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', dot: 'bg-emerald-400', label: 'Intermédiaire' },
    Avancé:       { color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20',   dot: 'bg-amber-400',   label: 'Avancé' },
    Expert:       { color: 'text-rose-400',    bg: 'bg-rose-400/10',    border: 'border-rose-400/20',    dot: 'bg-rose-400',    label: 'Expert' },
};

export default function ModulePage() {
    const { id } = useParams();
    const { user, isLoading: authLoading } = useAuth();
    const [module, setModule] = useState<Module | null>(null);
    const [lessons, setLessons] = useState<LessonPreview[]>([]);
    const [progress, setProgress] = useState<Record<string, boolean>>({});
    const [quizPassed, setQuizPassed] = useState(false);
    const [examPassed, setExamPassed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        async function fetchModuleData() {
            if (!user || !id) return;
            try {
                const [{ data: mod }, { data: lessonList }, { data: progressList }, { data: attempts }] = await Promise.all([
                    supabase.from('modules').select('*').eq('id', id).single(),
                    supabase.from('lessons').select('id, title, order_index').eq('module_id', id).order('order_index', { ascending: true }),
                    supabase.from('user_lessons').select('lesson_id, completed').eq('user_id', user.id),
                    supabase.from('quiz_attempts').select('passed, is_exam').eq('user_id', user.id).eq('module_id', id),
                ]);
                if (mod) setModule(mod);
                setLessons(lessonList || []);
                const progMap: Record<string, boolean> = {};
                progressList?.forEach(p => { progMap[p.lesson_id] = p.completed; });
                setProgress(progMap);
                if (attempts) {
                    setQuizPassed(attempts.some(a => a.passed && !a.is_exam));
                    setExamPassed(attempts.some(a => a.passed && a.is_exam));
                }
            } catch (err) {
                console.error('erreur module:', err);
            } finally {
                setIsLoading(false);
            }
        }
        if (user && id) fetchModuleData();
    }, [user?.id, id]);

    const completedLessons = lessons.filter(l => progress[l.id]).length;
    const allLessonsCompleted = lessons.length > 0 && completedLessons === lessons.length;
    const progressPct = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;
    const conf = module ? (DIFFICULTY_CONFIG[module.difficulty] || DIFFICULTY_CONFIG['Découverte']) : null;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-accent animate-spin opacity-30" />
            </div>
        );
    }

    if (!module) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <Shield className="w-12 h-12 text-text-muted/20 mb-4" />
                <p className="text-xl font-black uppercase tracking-widest text-text-muted/40">module introuvable</p>
                <Link to="/courses" className="mt-6 text-accent text-xs font-black uppercase tracking-widest hover:underline">← retour aux cours</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text font-sans">

            {/* ── Header ── */}
            <div className="border-b border-border/40 bg-surface/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />
                <div className="max-w-4xl mx-auto px-6 py-10 relative">
                    <Link to="/courses" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors mb-6">
                        <ChevronLeft className="w-4 h-4" /> Tous les cours
                    </Link>

                    <div className="flex items-start gap-4 mb-6">
                        {conf && (
                            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${conf.bg} ${conf.color} ${conf.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                                {conf.label}
                            </span>
                        )}
                        {module.category && (
                            <span className="px-3 py-1.5 rounded-full border border-border/60 text-[10px] font-black uppercase tracking-widest text-text-muted bg-surface">
                                {module.category}
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4 leading-tight">
                        {module.title}
                    </h1>
                    <p className="text-text-muted text-lg max-w-2xl leading-relaxed">
                        {module.description}
                    </p>

                    {/* barre de progression globale */}
                    {lessons.length > 0 && (
                        <div className="mt-8 flex items-center gap-4">
                            <div className="flex-1 h-2.5 bg-border/30 rounded-full overflow-hidden max-w-sm">
                                <div
                                    className="h-full bg-accent rounded-full transition-all duration-700 shadow-[0_0_8px_var(--accent-glow)]"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                            <span className="text-sm font-black text-text-muted shrink-0">
                                {completedLessons} / {lessons.length} leçons
                            </span>
                            {allLessonsCompleted && (
                                <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                    <CheckCircle className="w-4 h-4" /> Terminé
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

                {/* ── Leçons ── */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <BookOpen className="w-5 h-5 text-accent" />
                        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-text-muted">
                            Leçons — {completedLessons}/{lessons.length}
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {lessons.map((lesson, idx) => {
                            const done = !!progress[lesson.id];
                            // une leçon est accessible si c'est la première ou si la précédente est faite
                            const accessible = idx === 0 || !!progress[lessons[idx - 1]?.id];

                            return (
                                <div key={lesson.id}>
                                    {accessible ? (
                                        <Link
                                            to={`/lessons/${lesson.id}`}
                                            className={`flex items-center gap-4 p-5 rounded-2xl border transition-all group ${
                                                done
                                                    ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                                                    : 'bg-surface border-border hover:border-accent/40 hover:bg-accent/5'
                                            }`}
                                        >
                                            {/* numéro / check */}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm transition-all ${
                                                done
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-background border border-border group-hover:border-accent/40 group-hover:bg-accent/10 group-hover:text-accent text-text-muted'
                                            }`}>
                                                {done ? <CheckCircle className="w-5 h-5" /> : <span>{idx + 1}</span>}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <span className={`font-black text-base leading-snug block transition-colors ${
                                                    done ? 'text-emerald-400' : 'group-hover:text-accent'
                                                }`}>
                                                    {lesson.title}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60 mt-0.5 block">
                                                    {done ? 'Terminée' : idx === completedLessons ? 'À faire maintenant' : 'Leçon'}
                                                </span>
                                            </div>

                                            <div className={`shrink-0 transition-all ${done ? 'text-emerald-400/60' : 'text-text-muted group-hover:text-accent group-hover:translate-x-1'}`}>
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="flex items-center gap-4 p-5 rounded-2xl border border-border/30 bg-surface/30 opacity-40 cursor-not-allowed">
                                            <div className="w-10 h-10 rounded-xl bg-background border border-border/40 flex items-center justify-center shrink-0">
                                                <Lock className="w-4 h-4 text-text-muted/40" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-black text-base text-text-muted/60">{lesson.title}</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/40 mt-0.5 block">Terminez la leçon précédente</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── Évaluations ── */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Trophy className="w-5 h-5 text-accent" />
                        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-text-muted">Évaluations</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Quiz */}
                        {allLessonsCompleted ? (
                            <Link
                                to={`/quiz/${module.id}`}
                                className="flex items-center gap-5 p-6 rounded-2xl border transition-all group bg-accent/5 border-accent/20 hover:border-accent/50 hover:bg-accent/10"
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                                    quizPassed
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'bg-accent/10 border-accent/20 text-accent group-hover:bg-accent group-hover:text-white'
                                }`}>
                                    {quizPassed ? <CheckCircle className="w-7 h-7" /> : <HelpCircle className="w-7 h-7" />}
                                </div>
                                <div className="flex-1">
                                    <span className={`font-black text-lg block transition-colors ${quizPassed ? 'text-emerald-400' : 'group-hover:text-accent'}`}>
                                        Quiz de révision
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
                                        {quizPassed ? '✓ Validé — seuil 70%' : '10 questions — seuil 70%'}
                                    </span>
                                </div>
                                {quizPassed
                                    ? <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">Certifié</span>
                                    : <ChevronRight className="w-6 h-6 text-accent group-hover:translate-x-1 transition-transform shrink-0" />
                                }
                            </Link>
                        ) : (
                            <div className="flex items-center gap-5 p-6 rounded-2xl border border-border/30 bg-surface/20 opacity-50 cursor-not-allowed">
                                <div className="w-14 h-14 rounded-2xl bg-surface-hover border border-border/40 flex items-center justify-center shrink-0 text-text-muted">
                                    <HelpCircle className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <span className="font-black text-lg block text-text-muted/60">Quiz de révision</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/40">Terminez toutes les leçons d'abord</span>
                                </div>
                                <Lock className="w-5 h-5 text-text-muted/40 shrink-0" />
                            </div>
                        )}

                        {/* Examen */}
                        {quizPassed ? (
                            <Link
                                to={`/exam/${module.id}`}
                                className="flex items-center gap-5 p-6 rounded-2xl border transition-all group bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10"
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                                    examPassed
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-500 group-hover:bg-amber-500 group-hover:text-white'
                                }`}>
                                    {examPassed ? <CheckCircle className="w-7 h-7" /> : <Zap className="w-7 h-7" />}
                                </div>
                                <div className="flex-1">
                                    <span className={`font-black text-lg block transition-colors ${examPassed ? 'text-emerald-400' : 'group-hover:text-amber-400'}`}>
                                        Examen final
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
                                        {examPassed ? '✓ Module maîtrisé' : '20 questions — seuil 80%'}
                                    </span>
                                </div>
                                {examPassed
                                    ? <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">Maîtrisé</span>
                                    : <ChevronRight className="w-6 h-6 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
                                }
                            </Link>
                        ) : (
                            <div className="flex items-center gap-5 p-6 rounded-2xl border border-border/30 bg-surface/20 opacity-50 cursor-not-allowed">
                                <div className="w-14 h-14 rounded-2xl bg-surface-hover border border-border/40 flex items-center justify-center shrink-0 text-text-muted">
                                    <Zap className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <span className="font-black text-lg block text-text-muted/60">Examen final</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/40">Validez le quiz pour déverrouiller</span>
                                </div>
                                <Lock className="w-5 h-5 text-text-muted/40 shrink-0" />
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
