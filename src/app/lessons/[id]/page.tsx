import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, AlertCircle, Info, Lightbulb, AlertTriangle } from 'lucide-react';
import { addXp, XP_REWARDS } from '@/lib/gamification';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { parseShortcodes } from '@/lib/shortcodes';

type Lesson = {
    id: string;
    module_id: string;
    title: string;
    content: string;
    order_index: number;
    module?: {
        difficulty: string;
    };
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
                    .select('*, module:modules(difficulty)')
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

            const difficulty = lesson.module?.difficulty || 'Découverte';
            const xpToAdd = XP_REWARDS[difficulty] || 25;

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

    // Pre-processing to ensure GitHub-style alerts are recognized as blockquotes
    const processContent = (content: string) => {
        if (!content) return '';
        // Normalize: ensure '> [!' format and merge potential split blocks starting with an alert
        let processed = content
            .replace(/^> ?\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\]\r?\n>\r?\n/gim, '> [!$1]\n> ')
            .replace(/^> ?\[!/gim, '> [!');
        
        return parseShortcodes(processed);
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
                    <header className="border-b border-border bg-surface/30 px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to={`/modules/${lesson.module_id}`} className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-muted hover:text-text">
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
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 md:mb-10 tracking-tight text-text leading-tight">{lesson.title}</h2>
                            <div className="text-text-muted text-lg leading-relaxed">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                        blockquote: ({ children }) => {
                                            const alertTypes = {
                                                IMPORTANT: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: <AlertCircle className="w-5 h-5" /> },
                                                NOTE: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: <Info className="w-5 h-5" /> },
                                                TIP: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <Lightbulb className="w-5 h-5" /> },
                                                WARNING: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <AlertTriangle className="w-5 h-5" /> },
                                                CAUTION: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: <AlertCircle className="w-5 h-5" /> },
                                            };

                                            const getText = (nodes: any): string => {
                                                if (!nodes) return '';
                                                if (typeof nodes === 'string') return nodes;
                                                if (Array.isArray(nodes)) return nodes.map(getText).join(' '); // Space join for safety
                                                if (nodes.props?.children) return getText(nodes.props.children);
                                                return '';
                                            };

                                            const fullText = getText(children).trim();
                                            // More aggressive regex: check if the marker exists near the start
                                            const match = fullText.match(/\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\]/i);
                                            
                                            // Only process as alert if the marker is at the very beginning (ignoring minor whitespace)
                                            if (match && fullText.indexOf(match[0]) < 5) {
                                                const type = match[1].toUpperCase() as keyof typeof alertTypes;
                                                const config = alertTypes[type];
                                                
                                                const cleanMarker = (nodes: any): any => {
                                                    if (!nodes) return nodes;
                                                    if (typeof nodes === 'string') {
                                                        // Replace the marker (including potential leading whitespace and trailing newlines)
                                                        return nodes.replace(/^(\s*)\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\](\s*)/i, '$1');
                                                    }
                                                    if (Array.isArray(nodes)) {
                                                        return nodes.map(node => cleanMarker(node));
                                                    }
                                                    if (nodes?.props?.children) {
                                                        return {
                                                            ...nodes,
                                                            props: {
                                                                ...nodes.props,
                                                                children: cleanMarker(nodes.props.children)
                                                            }
                                                        };
                                                    }
                                                    return nodes;
                                                };

                                                return (
                                                    <div className={`my-8 p-6 rounded-2xl border ${config.border} ${config.bg} backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700`}>
                                                        <div className={`flex items-center gap-2 mb-3 font-black text-xs uppercase tracking-[0.25em] ${config.color}`}>
                                                            {config.icon}
                                                            {type}
                                                        </div>
                                                        <div className="text-text/90 italic text-lg leading-relaxed unprose">
                                                            {cleanMarker(children)}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return <blockquote className="border-l-4 border-accent/30 pl-6 my-10 italic text-text-muted text-xl">{children}</blockquote>;
                                        }
                                    }}
                                >
                                    {processContent(lesson.content)}
                                </ReactMarkdown>
                            </div>
                        </article>
                    </main>

                    <footer className="border-t border-border bg-surface/50 backdrop-blur-md p-6 sticky bottom-0">
                        <div className="max-w-4xl mx-auto flex justify-between items-center">
                            <button
                                disabled
                                className="p-3 rounded-xl bg-surface-hover/50 text-text-muted opacity-50 cursor-not-allowed border border-border"
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
