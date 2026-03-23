import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Book, PlayCircle, Star, Shield, HelpCircle, Loader2, Lock as LockIcon } from 'lucide-react';

type Module = {
    id: string;
    title: string;
    description: string;
};

type Lesson = {
    id: string;
    title: string;
    order_index: number;
};

type UserLessonProgress = {
    lesson_id: string;
    completed: boolean;
};

export default function ModulePage() {
    const { id } = useParams();
    const { user, isLoading: authLoading } = useAuth();
    const [module, setModule] = useState<Module | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
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
                const [{ data: mod }, { data: lessonList }, { data: progressList }] = await Promise.all([
                    supabase.from('modules').select('*').eq('id', id).single(),
                    supabase.from('lessons').select('id, title, order_index').eq('module_id', id).order('order_index', { ascending: true }),
                    supabase.from('user_lessons').select('lesson_id, completed').eq('user_id', user.id)
                ]);

                if (mod) setModule(mod);
                setLessons(lessonList || []);

                const progMap: Record<string, boolean> = {};
                progressList?.forEach(p => { progMap[p.lesson_id] = p.completed; });
                setProgress(progMap);

                // Fetch quiz attempts for this module
                const { data: attempts } = await supabase
                    .from('quiz_attempts')
                    .select('passed, is_exam')
                    .eq('user_id', user.id)
                    .eq('module_id', id);

                if (attempts) {
                    setQuizPassed(attempts.some(a => a.passed && !a.is_exam));
                    setExamPassed(attempts.some(a => a.passed && a.is_exam));
                }
            } catch (err) {
                console.error("Module fetchData error:", err);
            } finally {
                setIsLoading(false);
            }
        }

        if (user && id) fetchData();
    }, [user?.id, id]);

    const allLessonsCompleted = lessons.length > 0 && lessons.every(l => progress[l.id]);

    return (
        <div className="min-h-screen bg-background text-text">
            <main className="max-w-4xl mx-auto px-6 py-12">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-accent animate-spin" />
                    </div>
                ) : !module ? (
                    <div className="text-center py-20">
                        <p className="text-text-muted">Module introuvable.</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        <div className="mb-12">
                            <h2 className="text-3xl font-bold mb-4">{module.title}</h2>
                            <p className="text-text-muted leading-relaxed">{module.description}</p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Leçons</h3>
                            {lessons.map((lesson) => (
                                <Link
                                    key={lesson.id}
                                    to={`/lessons/${lesson.id}`}
                                    className="flex items-center justify-between p-5 bg-surface rounded-xl border border-border hover:border-accent/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${progress[lesson.id] ? 'bg-green-500/10 text-green-400' : 'bg-background text-accent'}`}>
                                            {progress[lesson.id] ? <Star className="w-5 h-5 fill-current" /> : <PlayCircle className="w-5 h-5" />}
                                        </div>
                                        <span className="font-semibold group-hover:text-accent transition-colors">{lesson.title}</span>
                                    </div>
                                    <ChevronLeft className="w-5 h-5 rotate-180 text-text-muted" />
                                </Link>
                            ))}

                            { }
                            <div className="pt-8 border-t border-border mt-8 space-y-4">
                                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Évaluations</h3>

                                {allLessonsCompleted ? (
                                    <Link
                                        to={`/quiz/${module.id}`}
                                        className="flex items-center justify-between p-5 bg-accent/5 rounded-xl border border-accent/10 hover:bg-accent/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-accent/20 text-accent">
                                                <HelpCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="font-semibold block">Quiz de validation</span>
                                                <span className="text-xs text-text-muted">10 questions • {quizPassed ? 'Réussi' : 'Requis pour l\'examen'}</span>
                                            </div>
                                        </div>
                                        {quizPassed ? (
                                            <div className="px-3 py-1 bg-green-500/20 rounded text-[10px] font-bold text-green-400 uppercase">Validé</div>
                                        ) : (
                                            <div className="px-3 py-1 bg-accent/20 rounded text-[10px] font-bold text-accent uppercase">Prêt</div>
                                        )}
                                    </Link>
                                ) : (
                                    <div className="flex items-center justify-between p-5 bg-surface rounded-xl border border-border transition-all group opacity-60 grayscale cursor-not-allowed">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-background text-text-muted">
                                                <HelpCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="font-semibold block">Quiz de validation</span>
                                                <span className="text-xs text-text-muted">Lisez toutes les leçons pour débloquer</span>
                                            </div>
                                        </div>
                                        <LockIcon className="w-4 h-4 text-text-muted" />
                                    </div>
                                )}

                                {quizPassed ? (
                                    <Link
                                        to={`/exam/${module.id}`}
                                        className="flex items-center justify-between p-5 bg-accent/5 rounded-xl border border-accent/10 hover:bg-accent/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="font-semibold block text-yellow-500">Examen Final</span>
                                                <span className="text-xs text-text-muted">20 questions • {examPassed ? 'Réussi' : 'Débloque le module suivant'}</span>
                                            </div>
                                        </div>
                                        {examPassed ? (
                                            <div className="px-3 py-1 bg-green-500/20 rounded text-[10px] font-bold text-green-400 uppercase">Validé</div>
                                        ) : (
                                            <div className="px-3 py-1 bg-yellow-500/20 rounded text-[10px] font-bold text-yellow-500 uppercase">Prêt</div>
                                        )}
                                    </Link>
                                ) : (
                                    <div className="flex items-center justify-between p-5 bg-surface rounded-xl border border-border transition-all group opacity-60 grayscale cursor-not-allowed">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-background text-text-muted">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="font-semibold block">Examen Final</span>
                                                <span className="text-xs text-text-muted">Réussissez le quiz pour débloquer</span>
                                            </div>
                                        </div>
                                        <LockIcon className="w-4 h-4 text-text-muted" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
