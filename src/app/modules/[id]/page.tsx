import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, HelpCircle, Loader2, Lock, ChevronLeft, ChevronRight, BookOpen, Trophy, Zap, Play, Clock } from 'lucide-react';

type Module = { id: string; title: string; description: string; difficulty: string; category: string };
type LessonPreview = { id: string; title: string; order_index: number; word_count?: number };

const DIFF: Record<string, { color: string; bg: string; border: string; dot: string; bar: string; label: string }> = {
    Découverte:   { color: 'text-sky-400',     bg: 'bg-sky-400/10',     border: 'border-sky-400/20',     dot: 'bg-sky-400',     bar: 'bg-sky-400',     label: 'Débutant' },
    Fondamentaux: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', dot: 'bg-emerald-400', bar: 'bg-emerald-400', label: 'Intermédiaire' },
    Avancé:       { color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20',   dot: 'bg-amber-400',   bar: 'bg-amber-400',   label: 'Avancé' },
    Expert:       { color: 'text-rose-400',    bg: 'bg-rose-400/10',    border: 'border-rose-400/20',    dot: 'bg-rose-400',    bar: 'bg-rose-400',    label: 'Expert' },
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
        async function fetchData() {
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
                const pm: Record<string, boolean> = {};
                progressList?.forEach(p => { pm[p.lesson_id] = p.completed; });
                setProgress(pm);
                if (attempts) {
                    setQuizPassed(attempts.some(a => a.passed && !a.is_exam));
                    setExamPassed(attempts.some(a => a.passed && a.is_exam));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        if (user && id) fetchData();
    }, [user?.id, id]);

    const completedCount = lessons.filter(l => progress[l.id]).length;
    const allDone = lessons.length > 0 && completedCount === lessons.length;
    const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
    const conf = module ? (DIFF[module.difficulty] || DIFF['Découverte']) : null;
    // première leçon non complétée = leçon à faire maintenant
    const currentLessonIdx = lessons.findIndex(l => !progress[l.id]);

    if (isLoading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent animate-spin opacity-30" />
        </div>
    );

    if (!module) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-4">
            <Shield className="w-10 h-10 text-text-muted/20" />
            <p className="font-black uppercase tracking-widest text-text-muted/40">Module introuvable</p>
            <Link to="/courses" className="text-accent text-xs font-black uppercase tracking-widest hover:underline">← Retour aux cours</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-text font-sans flex flex-col">

            {/* ── Topbar ── */}
            <div className="border-b border-border/40 bg-surface/30 shrink-0">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <Link to="/courses" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors shrink-0">
                        <ChevronLeft className="w-4 h-4" /> Cours
                    </Link>

                    <div className="flex-1 max-w-sm">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-text-muted/60 mb-1">
                            <span>{completedCount}/{lessons.length} leçons</span>
                            <span>{pct}%</span>
                        </div>
                        <div className="h-2 bg-border/30 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${allDone ? 'bg-emerald-500' : conf?.bar || 'bg-accent'}`}
                                style={{ width: `${pct}%` }} />
                        </div>
                    </div>

                    {currentLessonIdx !== -1 ? (
                        <Link to={`/lessons/${lessons[currentLessonIdx]?.id}`}
                            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shrink-0">
                            <Play className="w-3.5 h-3.5 fill-current" /> Continuer
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0">
                            <CheckCircle className="w-3.5 h-3.5" /> Terminé
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 py-8 gap-8">

                {/* ── Sidebar navigation leçons ── */}
                <aside className="w-72 shrink-0 hidden md:flex flex-col gap-2 sticky top-24 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
                    {/* infos module */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            {conf && (
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${conf.bg} ${conf.color} ${conf.border}`}>
                                    {conf.label}
                                </span>
                            )}
                            {module.category && (
                                <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted/60">{module.category}</span>
                            )}
                        </div>
                        <h1 className="text-lg font-black uppercase tracking-tight leading-tight">{module.title}</h1>
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 mb-1">Leçons</p>

                    {lessons.map((lesson, idx) => {
                        const done = !!progress[lesson.id];
                        const isCurrent = idx === currentLessonIdx;
                        const accessible = idx === 0 || !!progress[lessons[idx - 1]?.id];

                        return accessible ? (
                            <Link key={lesson.id} to={`/lessons/${lesson.id}`}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                                    done ? 'text-emerald-400/80 hover:bg-emerald-500/5'
                                    : isCurrent ? 'bg-accent/10 text-accent font-black border border-accent/20'
                                    : 'text-text-muted hover:bg-surface-hover hover:text-text'
                                }`}>
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                                    done ? 'bg-emerald-500/20 text-emerald-400'
                                    : isCurrent ? 'bg-accent text-white'
                                    : 'bg-surface border border-border/60 text-text-muted/60'
                                }`}>
                                    {done ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                                </div>
                                <span className="truncate font-medium text-xs leading-snug">{lesson.title}</span>
                            </Link>
                        ) : (
                            <div key={lesson.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-30 cursor-not-allowed">
                                <div className="w-6 h-6 rounded-lg bg-surface border border-border/40 flex items-center justify-center shrink-0">
                                    <Lock className="w-3 h-3 text-text-muted/40" />
                                </div>
                                <span className="truncate text-xs text-text-muted/40">{lesson.title}</span>
                            </div>
                        );
                    })}

                    {/* séparateur évaluations */}
                    <div className="mt-3 pt-3 border-t border-border/40">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 mb-2">Évaluations</p>

                        {allDone ? (
                            <Link to={`/quiz/${module.id}`}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                                    quizPassed ? 'text-emerald-400/80 hover:bg-emerald-500/5' : 'text-text-muted hover:bg-surface-hover hover:text-accent'
                                }`}>
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${quizPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface border border-border/60 text-text-muted/60'}`}>
                                    {quizPassed ? <CheckCircle className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
                                </div>
                                <span className="text-xs font-medium">Quiz de révision</span>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-30 cursor-not-allowed">
                                <div className="w-6 h-6 rounded-lg bg-surface border border-border/40 flex items-center justify-center shrink-0">
                                    <Lock className="w-3 h-3 text-text-muted/40" />
                                </div>
                                <span className="text-xs text-text-muted/40">Quiz de révision</span>
                            </div>
                        )}

                        {quizPassed ? (
                            <Link to={`/exam/${module.id}`}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                                    examPassed ? 'text-emerald-400/80 hover:bg-emerald-500/5' : 'text-text-muted hover:bg-surface-hover hover:text-amber-400'
                                }`}>
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${examPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface border border-border/60 text-text-muted/60'}`}>
                                    {examPassed ? <CheckCircle className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                                </div>
                                <span className="text-xs font-medium">Examen final</span>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-30 cursor-not-allowed">
                                <div className="w-6 h-6 rounded-lg bg-surface border border-border/40 flex items-center justify-center shrink-0">
                                    <Lock className="w-3 h-3 text-text-muted/40" />
                                </div>
                                <span className="text-xs text-text-muted/40">Examen final</span>
                            </div>
                        )}
                    </div>
                </aside>

                {/* ── Contenu principal ── */}
                <main className="flex-1 min-w-0">
                    {/* description module */}
                    <div className="mb-8 pb-8 border-b border-border/40">
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-3">{module.title}</h2>
                        <p className="text-text-muted leading-relaxed max-w-2xl">{module.description}</p>

                        {/* CTA si leçon en cours */}
                        {currentLessonIdx !== -1 && (
                            <Link to={`/lessons/${lessons[currentLessonIdx]?.id}`}
                                className="inline-flex items-center gap-3 mt-6 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-accent/20">
                                <Play className="w-4 h-4 fill-current" />
                                {completedCount === 0 ? 'Commencer le module' : `Reprendre — Leçon ${currentLessonIdx + 1}`}
                            </Link>
                        )}
                    </div>

                    {/* liste leçons (mobile + desktop) */}
                    <section className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <BookOpen className="w-4 h-4 text-accent" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-muted">
                                {completedCount}/{lessons.length} leçons complétées
                            </h3>
                        </div>

                        <div className="space-y-2">
                            {lessons.map((lesson, idx) => {
                                const done = !!progress[lesson.id];
                                const isCurrent = idx === currentLessonIdx;
                                const accessible = idx === 0 || !!progress[lessons[idx - 1]?.id];

                                return accessible ? (
                                    <Link key={lesson.id} to={`/lessons/${lesson.id}`}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group ${
                                            done ? 'bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/30'
                                            : isCurrent ? 'bg-accent/5 border-accent/20 hover:border-accent/40 hover:bg-accent/10'
                                            : 'bg-surface border-border hover:border-accent/30 hover:bg-surface-hover'
                                        }`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm transition-all ${
                                            done ? 'bg-emerald-500 text-white'
                                            : isCurrent ? 'bg-accent text-white shadow-lg shadow-accent/30'
                                            : 'bg-background border border-border text-text-muted group-hover:border-accent/30 group-hover:text-accent'
                                        }`}>
                                            {done ? <CheckCircle className="w-5 h-5" /> : isCurrent ? <Play className="w-4 h-4 fill-current" /> : idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={`font-black text-sm block transition-colors ${
                                                done ? 'text-emerald-400' : isCurrent ? 'text-accent' : 'group-hover:text-accent'
                                            }`}>{lesson.title}</span>
                                            <span className="text-[10px] font-medium uppercase tracking-widest text-text-muted/50 mt-0.5 block">
                                                {done ? '✓ Terminée' : isCurrent ? '→ À faire maintenant' : `Leçon ${idx + 1}`}
                                            </span>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 shrink-0 transition-all ${done ? 'text-emerald-400/40' : 'text-text-muted group-hover:text-accent group-hover:translate-x-0.5'}`} />
                                    </Link>
                                ) : (
                                    <div key={lesson.id} className="flex items-center gap-4 p-4 rounded-2xl border border-border/20 bg-surface/20 opacity-40 cursor-not-allowed">
                                        <div className="w-10 h-10 rounded-xl bg-background border border-border/30 flex items-center justify-center shrink-0">
                                            <Lock className="w-4 h-4 text-text-muted/30" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-black text-sm text-text-muted/50 block">{lesson.title}</span>
                                            <span className="text-[10px] font-medium uppercase tracking-widest text-text-muted/30 mt-0.5 block">Terminez la leçon précédente</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── Évaluations ── */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Trophy className="w-4 h-4 text-accent" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-muted">Évaluations</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Quiz */}
                            {allDone ? (
                                <Link to={`/quiz/${module.id}`}
                                    className={`flex items-center gap-4 p-5 rounded-2xl border transition-all group ${quizPassed ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' : 'bg-surface border-border hover:border-accent/40 hover:bg-accent/5'}`}>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all ${quizPassed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-accent/10 border-accent/20 text-accent group-hover:bg-accent group-hover:text-white'}`}>
                                        {quizPassed ? <CheckCircle className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1">
                                        <span className={`font-black text-sm block ${quizPassed ? 'text-emerald-400' : 'group-hover:text-accent transition-colors'}`}>Quiz de révision</span>
                                        <span className="text-[10px] font-medium text-text-muted/60 uppercase tracking-widest">{quizPassed ? '✓ Validé' : '10 questions · seuil 70%'}</span>
                                    </div>
                                    {!quizPassed && <ChevronRight className="w-4 h-4 text-accent group-hover:translate-x-0.5 transition-transform shrink-0" />}
                                </Link>
                            ) : (
                                <div className="flex items-center gap-4 p-5 rounded-2xl border border-border/20 bg-surface/20 opacity-40 cursor-not-allowed">
                                    <div className="w-12 h-12 rounded-xl bg-surface-hover border border-border/40 flex items-center justify-center shrink-0 text-text-muted"><HelpCircle className="w-6 h-6" /></div>
                                    <div><span className="font-black text-sm block text-text-muted/60">Quiz de révision</span><span className="text-[10px] font-medium text-text-muted/40 uppercase tracking-widest">Terminez les leçons d'abord</span></div>
                                </div>
                            )}

                            {/* Examen */}
                            {quizPassed ? (
                                <Link to={`/exam/${module.id}`}
                                    className={`flex items-center gap-4 p-5 rounded-2xl border transition-all group ${examPassed ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/10'}`}>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all ${examPassed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-amber-500/10 border-amber-500/20 text-amber-500 group-hover:bg-amber-500 group-hover:text-white'}`}>
                                        {examPassed ? <CheckCircle className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1">
                                        <span className={`font-black text-sm block ${examPassed ? 'text-emerald-400' : 'group-hover:text-amber-400 transition-colors'}`}>Examen final</span>
                                        <span className="text-[10px] font-medium text-text-muted/60 uppercase tracking-widest">{examPassed ? '✓ Maîtrisé' : '20 questions · seuil 80%'}</span>
                                    </div>
                                    {!examPassed && <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />}
                                </Link>
                            ) : (
                                <div className="flex items-center gap-4 p-5 rounded-2xl border border-border/20 bg-surface/20 opacity-40 cursor-not-allowed">
                                    <div className="w-12 h-12 rounded-xl bg-surface-hover border border-border/40 flex items-center justify-center shrink-0 text-text-muted"><Zap className="w-6 h-6" /></div>
                                    <div><span className="font-black text-sm block text-text-muted/60">Examen final</span><span className="text-[10px] font-medium text-text-muted/40 uppercase tracking-widest">Validez le quiz d'abord</span></div>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
