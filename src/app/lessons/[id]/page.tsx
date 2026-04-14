import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Info, Lightbulb, AlertTriangle, Sparkles } from 'lucide-react';
import { addXp, XP_REWARDS } from '@/lib/gamification';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { parseShortcodes } from '@/lib/shortcodes';

/**
 * structure d'une leçon ekloud.
 */
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

/**
 * page de visualisation d'une leçon individuelle.
 * moteur de rendu markdown enrichi avec support de shortcodes et alertes callout.
 * gère l'attribution dynamique d'xp basées sur la difficulté du module parent.
 */
export default function LessonPage() {
    const { id } = useParams();
    const { user, isLoading: authLoading, xp, streak } = useAuth();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [nextLessonId, setNextLessonId] = useState<string | null>(null);
    const [prevLessonId, setPrevLessonId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompleting, setIsCompleting] = useState(false);
    const navigate = useNavigate();

    // redirection si session inexistante
    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    /**
     * récupère les données de la leçon actuelle et identifie la suivante dans l'ordre logique.
     */
    useEffect(() => {
        async function fetchLessonData() {
            if (!user || !id) return;
            setIsLoading(true);

            try {
                const { data: currentLesson } = await supabase
                    .from('lessons')
                    .select('*, module:modules(difficulty)')
                    .eq('id', id)
                    .single();

                if (currentLesson) {
                    setLesson(currentLesson);
                    
                    // recherche de la leçon suivante dans le même module
                    const { data: nextLesson } = await supabase
                        .from('lessons')
                        .select('id')
                        .eq('module_id', currentLesson.module_id)
                        .gt('order_index', currentLesson.order_index)
                        .order('order_index', { ascending: true })
                        .limit(1);

                    setNextLessonId(nextLesson && nextLesson.length > 0 ? nextLesson[0].id : null);

                    // recherche de la leçon précédente dans le même module
                    const { data: prevLesson } = await supabase
                        .from('lessons')
                        .select('id')
                        .eq('module_id', currentLesson.module_id)
                        .lt('order_index', currentLesson.order_index)
                        .order('order_index', { ascending: false })
                        .limit(1);

                    setPrevLessonId(prevLesson && prevLesson.length > 0 ? prevLesson[0].id : null);
                }
            } catch (err) {
                console.error("erreur de récupération de la leçon:", err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchLessonData();
    }, [user?.id, id]);

    /**
     * valide la complétion de la leçon et attribue les récompenses xp.
     */
    const handleComplete = async () => {
        if (!user || !lesson) return;
        setIsCompleting(true);

        try {
            // enregistrement de la progression persistante
            await supabase.from('user_lessons').upsert({
                user_id: user.id,
                lesson_id: lesson.id,
                completed: true
            }, { onConflict: 'user_id,lesson_id' });

            // calcul des paliers de récompense
            const difficulty = lesson.module?.difficulty || 'Découverte';
            const xpToAdd = XP_REWARDS[difficulty] || 25;

            await addXp(supabase, user.id, xp || 0, xpToAdd, streak || 0);

            // navigation intelligente vers la suite du parcours
            if (nextLessonId) {
                navigate(`/lessons/${nextLessonId}`);
            } else {
                navigate(`/modules/${lesson.module_id}`);
            }
        } catch (err) {
            console.error('erreur lors de la validation de la leçon:', err);
        } finally {
            setIsCompleting(false);
        }
    };

    /**
     * utilitaire de traitement du flux markdown pour normaliser les extensions de syntaxe (alertes).
     */
    const processContent = useCallback((content: string) => {
        if (!content) return '';
        const normalized = content
            .replace(/^> ?\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\]\r?\n>\r?\n/gim, '> [!$1]\n> ')
            .replace(/^> ?\[!/gim, '> [!');
        return parseShortcodes(normalized);
    }, []);

    if (authLoading || (isLoading && !lesson)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-12 h-12 text-accent animate-spin opacity-20" />
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-muted p-6">
                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-xl font-black uppercase tracking-widest opacity-40">leçon hors ligne</p>
                <Link to="/dashboard" className="mt-8 text-accent text-xs font-black uppercase tracking-[0.2em] hover:underline">retour console</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text flex flex-col font-sans">
            <main className="flex-grow max-w-5xl mx-auto w-full px-8 py-16 md:py-32">
                <article className="prose prose-invert prose-indigo max-w-none animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-both">
                    <header className="mb-24 flex flex-col items-center text-center">
                        <div className="w-16 h-1 bg-accent/20 rounded-full mb-12" />
                        <h2 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter text-text leading-[1.05] uppercase drop-shadow-2xl">
                            {lesson.title}
                        </h2>
                    </header>
                    
                    <div className="text-text/80 text-xl leading-relaxed font-medium md:text-2xl md:leading-[1.6]">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                blockquote: ({ children }) => {
                                    const alertTypes = {
                                        IMPORTANT: { color: 'text-rose-400', bg: 'bg-rose-500/5', border: 'border-rose-500/20', icon: <AlertCircle className="w-6 h-6" /> },
                                        NOTE: { color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20', icon: <Info className="w-6 h-6" /> },
                                        TIP: { color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', icon: <Lightbulb className="w-6 h-6" /> },
                                        WARNING: { color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/20', icon: <AlertTriangle className="w-6 h-6" /> },
                                        CAUTION: { color: 'text-rose-400', bg: 'bg-rose-500/5', border: 'border-rose-500/20', icon: <AlertCircle className="w-6 h-6" /> },
                                    };

                                    const getText = (nodes: any): string => {
                                        if (!nodes) return '';
                                        if (typeof nodes === 'string') return nodes;
                                        if (Array.isArray(nodes)) return nodes.map(getText).join(' ');
                                        if (nodes.props?.children) return getText(nodes.props.children);
                                        return '';
                                    };

                                    const fullText = getText(children).trim();
                                    const match = fullText.match(/\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\]/i);
                                    
                                    if (match && fullText.indexOf(match[0]) < 5) {
                                        const type = match[1].toUpperCase() as keyof typeof alertTypes;
                                        const config = alertTypes[type];
                                        const cleanMarker = (nodes: any): any => {
                                            if (!nodes) return nodes;
                                            if (typeof nodes === 'string') return nodes.replace(/^(\s*)\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\](\s*)/i, '$1');
                                            if (Array.isArray(nodes)) return nodes.map(node => cleanMarker(node));
                                            if (nodes?.props?.children) return { ...nodes, props: { ...nodes.props, children: cleanMarker(nodes.props.children) } };
                                            return nodes;
                                        };

                                        return (
                                            <div className={`my-16 p-10 rounded-[3rem] border ${config.border} ${config.bg} backdrop-blur-3xl shadow-2xl relative overflow-hidden group`}>
                                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    {config.icon}
                                                </div>
                                                <div className={`flex items-center gap-4 mb-6 font-black text-xs uppercase tracking-[0.4em] ${config.color}`}>
                                                    <span className="w-6 h-[2px] bg-current opacity-30" />
                                                    {type}
                                                </div>
                                                <div className="text-text italic text-xl md:text-2xl leading-relaxed relative z-10">
                                                    {cleanMarker(children)}
                                                </div>
                                            </div>
                                        );
                                    }

                                    return <blockquote className="border-l-4 border-accent/30 pl-10 my-16 italic text-text-muted text-2xl md:text-3xl leading-relaxed lowercase">{children}</blockquote>;
                                },
                                code: ({ className, children, ...props }: any) => <code className={`${className} bg-surface-hover/50 px-2 py-1 rounded-lg text-accent`} {...props}>{children}</code>
                            }}
                        >
                            {processContent(lesson.content)}
                        </ReactMarkdown>
                    </div>

                    {/* Actions de fin de leçon intégrées au flux */}
                    <footer className="mt-32 pt-16 border-t border-border/40 flex flex-col items-center gap-10">
                        <button
                            onClick={handleComplete}
                            disabled={isCompleting}
                            className="w-full md:w-auto min-w-[320px] flex items-center justify-center gap-5 px-16 py-8 bg-accent hover:bg-accent/90 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xl transition-all transform hover:scale-[1.05] active:scale-95 shadow-[0_30px_70px_-15px_rgba(99,102,241,0.5)] disabled:opacity-50"
                        >
                            {isCompleting ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                                <>
                                    <Sparkles className="w-6 h-6" />
                                    <span>{nextLessonId ? "Continuer" : "Terminer le module"}</span>
                                    <ChevronRight className="w-8 h-8 ml-2" />
                                </>
                            )}
                        </button>

                        <div className="flex items-center gap-12">
                            <button 
                                onClick={() => prevLessonId && navigate(`/lessons/${prevLessonId}`)}
                                disabled={!prevLessonId} 
                                className={`text-[10px] font-black uppercase tracking-[0.4em] text-text-muted hover:text-text transition-all ${!prevLessonId ? 'opacity-0 pointer-events-none' : 'hover:translate-x-[-8px]'}`}
                            >
                                ← Leçon Précédente
                            </button>
                            <Link 
                                to={`/modules/${lesson.module_id}`}
                                className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted hover:text-accent transition-all"
                            >
                                Revenir au module
                            </Link>
                        </div>
                    </footer>
                </article>
            </main>
        </div>
    );
}
