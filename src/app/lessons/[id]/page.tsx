import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { addXp, XP_REWARDS } from '@/lib/gamification';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

type Lesson = {
    id: string;
    module_id: string;
    title: string;
    content: string;
    order_index: number;
    difficulty: string;
};

export default function LessonPage() {
    const { id } = useParams();
    const { user, isLoading: authLoading, xp, level, streak } = useAuth();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [nextLessonId, setNextLessonId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompleting, setIsCompleting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        async function fetchLesson() {
            if (!user || !id) return;

            try {
                const { data: currentLesson } = await supabase
                    .from('lessons')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (currentLesson) {
                    setLesson(currentLesson);


                    const { data: nextLesson } = await supabase
                        .from('lessons')
                        .select('id')
                        .eq('module_id', currentLesson.module_id)
                        .gt('order_index', currentLesson.order_index)
                        .order('order_index', { ascending: true })
                        .limit(1);

                    setNextLessonId(nextLesson && nextLesson.length > 0 ? nextLesson[0].id : null);
                }
            } catch (err) {
                console.error("Lesson fetchLesson error:", err);
            } finally {
                setIsLoading(false);
            }
        }

        if (user && id) fetchLesson();
    }, [user?.id, id]);

    const markAsComplete = async () => {
        if (!user || !lesson) return;
        setIsCompleting(true);

        try {
            await supabase.from('user_lessons').upsert({
                user_id: user.id,
                lesson_id: lesson.id,
                completed: true
            }, { onConflict: 'user_id,lesson_id' });

            const difficulty = (lesson as any).difficulty || 'easy';
            const xpToAdd = (XP_REWARDS as any)[difficulty] || 20;

            await addXp(supabase, user.id, xp || 0, xpToAdd, streak || 0);

            if (nextLessonId) {
                navigate(`/lessons/${nextLessonId}`);
            } else {
                navigate(`/modules/${lesson.module_id}`);
            }
        } catch (err) {
            console.error('Error completing lesson:', err);
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-text flex flex-col">
            {isLoading ? (
                <div className="flex-grow flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-accent animate-spin" />
                </div>
            ) : !lesson ? (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-text-muted">Leçon introuvable.</p>
                </div>
            ) : (
                <>
                    <header className="border-b border-white/5 bg-surface/30 px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to={`/modules/${lesson.module_id}`} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-muted hover:text-white">
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                            <h1 className="text-sm md:text-base font-bold truncate max-w-[200px] md:max-w-md text-text-muted">{lesson.title}</h1>
                        </div>
                        <div className="bg-accent/10 px-3 py-1 rounded-full border border-accent/20 text-[10px] font-bold text-accent uppercase">
                            En cours
                        </div>
                    </header>

                    <main className="flex-grow max-w-4xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
                        <article className="prose prose-invert prose-indigo max-w-none">
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 md:mb-10 tracking-tight text-white leading-tight">{lesson.title}</h2>
                            <div className="text-text-muted text-lg leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                    {lesson.content}
                                </ReactMarkdown>
                            </div>
                        </article>
                    </main>

                    <footer className="border-t border-white/5 bg-surface/50 backdrop-blur-md p-6 sticky bottom-0">
                        <div className="max-w-4xl mx-auto flex justify-between items-center">
                            <button
                                disabled
                                className="p-3 rounded-xl bg-white/5 text-text-muted opacity-50 cursor-not-allowed"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>

                            <button
                                onClick={markAsComplete}
                                disabled={isCompleting}
                                className="flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold transition-all transform hover:scale-105"
                            >
                                {isCompleting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        {nextLessonId ? "Leçon Suivante" : "Terminer le module"}
                                        <ChevronRight className="w-6 h-6" />
                                    </>
                                )}
                            </button>
                        </div>
                    </footer>
                </>
            )}
        </div>
    );
}
