import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, PlayCircle, Star, Shield, HelpCircle, Loader2, Lock } from 'lucide-react';

/**
 * structure d'un module de formation ekloud.
 */
type Module = {
    id: string;
    title: string;
    description: string;
};

/**
 * aperçu d'une leçon individuelle.
 */
type LessonPreview = {
    id: string;
    title: string;
    order_index: number;
};

/**
 * page de visualisation d'un module.
 * liste les leçons disponibles et gère le déblocage progressif des évaluations (quiz/examen).
 * interface immersive avec retour visuel sur la progression de l'utilisateur.
 */
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

    // redirection si session non authentifiée
    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    /**
     * agrège les données du module, de ses leçons et de la progression utilisateur.
     */
    useEffect(() => {
        async function fetchModuleData() {
            if (!user || !id) return;

            try {
                // parallélisation des requêtes pour une réactivité maximale
                const [
                    { data: mod }, 
                    { data: lessonList }, 
                    { data: progressList },
                    { data: attempts }
                ] = await Promise.all([
                    supabase.from('modules').select('*').eq('id', id).single(),
                    supabase.from('lessons').select('id, title, order_index').eq('module_id', id).order('order_index', { ascending: true }),
                    supabase.from('user_lessons').select('lesson_id, completed').eq('user_id', user.id),
                    supabase.from('quiz_attempts').select('passed, is_exam').eq('user_id', user.id).eq('module_id', id)
                ]);

                if (mod) setModule(mod);
                setLessons(lessonList || []);

                // création d'un dictionnaire de progression pour un accès o(1)
                const progMap: Record<string, boolean> = {};
                progressList?.forEach(p => { progMap[p.lesson_id] = p.completed; });
                setProgress(progMap);

                // évaluation de l'état des validations (quiz/examen)
                if (attempts) {
                    setQuizPassed(attempts.some(a => a.passed && !a.is_exam));
                    setExamPassed(attempts.some(a => a.passed && a.is_exam));
                }
            } catch (err) {
                console.error("erreur lors de la récupération du module:", err);
            } finally {
                setIsLoading(false);
            }
        }

        if (user && id) fetchModuleData();
    }, [user?.id, id]);

    // contrôle logique pour le déblocage des évaluations
    const allLessonsCompleted = lessons.length > 0 && lessons.every(l => progress[l.id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-accent animate-spin opacity-20" />
            </div>
        );
    }

    if (!module) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <Shield className="w-16 h-16 text-text-muted/20 mb-6" />
                <h2 className="text-2xl font-black uppercase tracking-widest text-text-muted">secteur manquant</h2>
                <p className="text-text-muted/60 mt-2 max-w-xs">ce module semble avoir disparu de notre base de données.</p>
                <Link to="/dashboard" className="mt-8 text-accent font-black uppercase text-xs tracking-widest hover:underline decoration-accent/30 underline-offset-8 transition-all">retour au centre de commande</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text font-sans relative overflow-x-hidden">
            {/* signatures visuelles atmosphériques */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
            
            <main className="max-w-4xl mx-auto px-6 py-20 relative z-10">
                <header className="mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                    <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter uppercase font-equinox leading-tight">{module.title}</h2>
                    <p className="text-xl md:text-2xl text-text-muted/70 leading-relaxed font-medium max-w-3xl">{module.description}</p>
                </header>

                <section className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.5em] flex items-center gap-4">
                            <span className="w-8 h-px bg-border/40" /> corpus de leçons
                        </h3>
                        
                        <div className="grid gap-4">
                            {lessons.map((lesson) => (
                                <Link
                                    key={lesson.id}
                                    to={`/lessons/${lesson.id}`}
                                    className="flex items-center justify-between p-6 bg-surface/40 backdrop-blur-3xl rounded-[2rem] border border-border/80 hover:border-accent/40 hover:bg-accent/5 transition-all group shadow-sm"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all duration-500 ${progress[lesson.id] ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-hover text-accent group-hover:bg-accent/20 group-hover:text-accent'}`}>
                                            {progress[lesson.id] ? <Star className="w-5 h-5 fill-current" /> : <PlayCircle className="w-6 h-6" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-lg group-hover:text-accent transition-all uppercase tracking-tight">{lesson.title}</span>
                                            <span className="text-[9px] font-bold text-text-muted/60 uppercase tracking-widest">{progress[lesson.id] ? 'module terminé' : 'prêt pour lancement'}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-text-muted group-hover:text-accent group-hover:translate-x-2 transition-all duration-300" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <aside className="pt-12 border-t border-border/40 mt-16 space-y-8">
                        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.5em] flex items-center gap-4">
                            <span className="w-8 h-px bg-border/40" /> protocoles de validation
                        </h3>

                        <div className="grid gap-6">
                            {/* quiz de validation */}
                            {allLessonsCompleted ? (
                                <Link
                                    to={`/quiz/${module.id}`}
                                    className="flex items-center justify-between p-8 bg-accent/5 rounded-[2.5rem] border border-accent/20 hover:bg-accent/10 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-inner">
                                            <HelpCircle className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="font-black text-2xl block uppercase tracking-tighter group-hover:text-accent transition-colors">quiz tactique</span>
                                            <span className="text-xs font-bold text-text-muted/70 uppercase tracking-widest">10 questions • {quizPassed ? 'validé avec succès' : 'disponible pour évaluation'}</span>
                                        </div>
                                    </div>
                                    {quizPassed ? (
                                        <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-widest shadow-sm">certifié</div>
                                    ) : (
                                        <ChevronRight className="w-8 h-8 text-accent group-hover:translate-x-3 transition-transform duration-500" />
                                    )}
                                </Link>
                            ) : (
                                <div className="flex items-center justify-between p-8 bg-surface/30 rounded-[2.5rem] border border-border/60 transition-all opacity-40 grayscale cursor-not-allowed">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-surface-hover flex items-center justify-center text-text-muted">
                                            <HelpCircle className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="font-black text-2xl block uppercase tracking-tighter">quiz tactique</span>
                                            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">complétez toutes les leçons pour déverrouiller</span>
                                        </div>
                                    </div>
                                    <Lock className="w-6 h-6 text-text-muted opacity-40" />
                                </div>
                            )}

                            {/* examen final */}
                            {quizPassed ? (
                                <Link
                                    to={`/exam/${module.id}`}
                                    className="flex items-center justify-between p-8 bg-amber-500/5 rounded-[2.5rem] border border-amber-500/20 hover:bg-amber-500/10 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                                            <Shield className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="font-black text-2xl block uppercase tracking-tighter group-hover:text-amber-500 transition-colors">examen de palier</span>
                                            <span className="text-xs font-bold text-text-muted/70 uppercase tracking-widest">20 questions • {examPassed ? 'accès sécurisé' : 'prêt pour le titre'}</span>
                                        </div>
                                    </div>
                                    {examPassed ? (
                                        <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-widest shadow-sm">maîtrisé</div>
                                    ) : (
                                        <ChevronRight className="w-8 h-8 text-amber-500 group-hover:translate-x-3 transition-transform duration-500" />
                                    )}
                                </Link>
                            ) : (
                                <div className="flex items-center justify-between p-8 bg-surface/30 rounded-[2.5rem] border border-border/60 transition-all opacity-40 grayscale cursor-not-allowed">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-surface-hover flex items-center justify-center text-text-muted">
                                            <Shield className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="font-black text-2xl block uppercase tracking-tighter">examen de palier</span>
                                            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">validez le quiz pour déverrouiller</span>
                                        </div>
                                    </div>
                                    <Lock className="w-6 h-6 text-text-muted opacity-40" />
                                </div>
                            )}
                        </div>
                    </aside>
                </section>
            </main>
        </div>
    );
}
