import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useRef, useMemo, memo, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, AlertCircle, Info, Lightbulb, AlertTriangle, Sparkles, Clock } from 'lucide-react';
import { addXp, XP_REWARDS } from '@/lib/gamification';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { splitContentSegments } from '@/lib/shortcodes';
import InlineQuiz from '@/components/InlineQuiz';

type Lesson = {
    id: string;
    module_id: string;
    title: string;
    content: string;
    order_index: number;
    module?: { difficulty: string };
};

// Composants ReactMarkdown stables (définis en dehors pour éviter le remontage)
const MD_COMPONENTS = {
    blockquote: ({ children }: any) => {
        const alertTypes: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
            IMPORTANT: { color: 'text-rose-400',   bg: 'bg-rose-500/5',    border: 'border-rose-500/20',    icon: <AlertCircle className="w-6 h-6" /> },
            NOTE:      { color: 'text-blue-400',    bg: 'bg-blue-500/5',    border: 'border-blue-500/20',    icon: <Info className="w-6 h-6" /> },
            TIP:       { color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', icon: <Lightbulb className="w-6 h-6" /> },
            WARNING:   { color: 'text-amber-400',   bg: 'bg-amber-500/5',   border: 'border-amber-500/20',   icon: <AlertTriangle className="w-6 h-6" /> },
            CAUTION:   { color: 'text-rose-400',    bg: 'bg-rose-500/5',    border: 'border-rose-500/20',    icon: <AlertCircle className="w-6 h-6" /> },
        };
        const getText = (n: any): string => {
            if (!n) return '';
            if (typeof n === 'string') return n;
            if (Array.isArray(n)) return n.map(getText).join(' ');
            if (n.props?.children) return getText(n.props.children);
            return '';
        };
        const fullText = getText(children).trim();
        const match = fullText.match(/\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\]/i);
        if (match && fullText.indexOf(match[0]) < 5) {
            const type = match[1].toUpperCase() as keyof typeof alertTypes;
            const config = alertTypes[type];
            const clean = (n: any): any => {
                if (!n) return n;
                if (typeof n === 'string') return n.replace(/^(\s*)\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\](\s*)/i, '$1');
                if (Array.isArray(n)) return n.map(clean);
                if (n?.props?.children) return { ...n, props: { ...n.props, children: clean(n.props.children) } };
                return n;
            };
            return (
                <div className={`my-8 p-6 md:p-8 rounded-2xl border ${config.border} ${config.bg} relative overflow-hidden`}>
                    <div className={`flex items-center gap-3 mb-3 font-black text-xs uppercase tracking-[0.3em] ${config.color}`}>
                        {config.icon}
                        {type}
                    </div>
                    <div className="text-text/90 text-base md:text-lg leading-relaxed relative z-10">{clean(children)}</div>
                </div>
            );
        }
        return <blockquote className="border-l-4 border-accent/30 pl-6 my-6 italic text-text-muted text-lg leading-relaxed">{children}</blockquote>;
    },
    code: ({ className, children, ...props }: any) => (
        <code className={`${className ?? ''} bg-surface-hover/50 px-2 py-1 rounded-lg text-accent`} {...props}>{children}</code>
    ),
};

// =============================================================================
// LessonContent — rendu stable du contenu + quizzes
// =============================================================================
interface LessonContentProps {
    content: string;
    contentRef: React.RefObject<HTMLDivElement>;
    onQuizCountChange: (total: number) => void;
    onAllAnswered: (done: boolean) => void;
}

const LessonContent = memo(({ content, contentRef, onQuizCountChange, onAllAnswered }: LessonContentProps) => {
    const segments = useMemo(() => {
        if (!content) return [];
        const normalized = content
            .replace(/^> ?\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\]\r?\n>\r?\n/gim, '> [!$1]\n> ')
            .replace(/^> ?\[!/gim, '> [!');
        return splitContentSegments(normalized);
    }, [content]);

    const quizSegments = useMemo(() => segments.filter(s => s.type === 'quiz'), [segments]);
    const [answeredSet, setAnsweredSet] = useState<Set<string>>(new Set());

    // notifier le parent du nombre de quizzes
    useEffect(() => {
        onQuizCountChange(quizSegments.length);
        setAnsweredSet(new Set()); // reset quand le contenu change
    }, [quizSegments.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAnswered = useCallback((quizId: string) => {
        setAnsweredSet(prev => {
            const next = new Set(prev).add(quizId);
            onAllAnswered(next.size >= quizSegments.length);
            return next;
        });
    }, [quizSegments.length, onAllAnswered]);

    return (
        <div ref={contentRef} className="text-text/85 text-base md:text-lg leading-relaxed font-normal">
            {segments.map((seg, i) => {
                if (seg.type === 'markdown') {
                    return (
                        <ReactMarkdown
                            key={i}
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            rehypePlugins={[rehypeRaw]}
                            components={MD_COMPONENTS}
                        >
                            {seg.content}
                        </ReactMarkdown>
                    );
                }
                return (
                    <InlineQuiz
                        key={seg.data.id}
                        question={seg.data.question}
                        options={seg.data.options}
                        correctIndex={seg.data.correctIndex}
                        explanation={seg.data.explanation}
                        onAnswered={() => handleAnswered(seg.data.id)}
                    />
                );
            })}
        </div>
    );
});

LessonContent.displayName = 'LessonContent';

// =============================================================================
// LessonPage
// =============================================================================
export default function LessonPage() {
    const { id } = useParams();
    const { user, isLoading: authLoading, xp, streak } = useAuth();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [nextLessonId, setNextLessonId] = useState<string | null>(null);
    const [prevLessonId, setPrevLessonId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompleting, setIsCompleting] = useState(false);
    const [quizTotal, setQuizTotal] = useState(0);
    const [allAnswered, setAllAnswered] = useState(true);

    const [activeSection, setActiveSection] = useState(0);
    const sectionRefs = useRef<HTMLElement[]>([]);
    const contentRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const handleQuizCountChange = useCallback((total: number) => {
        setQuizTotal(total);
        setAllAnswered(total === 0);
    }, []);

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        async function fetchLessonData() {
            if (!user || !id) return;
            setIsLoading(true);
            try {
                const { data: currentLesson } = await supabase
                    .from('lessons').select('*, module:modules(difficulty)').eq('id', id).single();
                if (currentLesson) {
                    setLesson(currentLesson);
                    const { data: next } = await supabase.from('lessons').select('id')
                        .eq('module_id', currentLesson.module_id).gt('order_index', currentLesson.order_index)
                        .order('order_index', { ascending: true }).limit(1);
                    setNextLessonId(next?.[0]?.id ?? null);
                    const { data: prev } = await supabase.from('lessons').select('id')
                        .eq('module_id', currentLesson.module_id).lt('order_index', currentLesson.order_index)
                        .order('order_index', { ascending: false }).limit(1);
                    setPrevLessonId(prev?.[0]?.id ?? null);
                }
            } catch (err) {
                console.error('erreur leçon:', err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchLessonData();
    }, [user?.id, id]);

    useEffect(() => {
        setActiveSection(0);
        sectionRefs.current = [];
    }, [id]);

    useEffect(() => {
        if (!contentRef.current) return;
        const headings = Array.from(contentRef.current.querySelectorAll('h2, h3')) as HTMLElement[];
        sectionRefs.current = headings;
        if (!headings.length) return;
        const observer = new IntersectionObserver(
            entries => {
                const visible = entries.filter(e => e.isIntersecting)
                    .map(e => headings.indexOf(e.target as HTMLElement))
                    .filter(i => i !== -1).sort((a, b) => a - b);
                if (visible.length) setActiveSection(visible[0]);
            },
            { rootMargin: '-10% 0px -60% 0px', threshold: 0 }
        );
        headings.forEach(h => observer.observe(h));
        return () => observer.disconnect();
    }, [lesson, isLoading]);

    const handleComplete = async () => {
        if (!user || !lesson) return;
        setIsCompleting(true);
        try {
            await supabase.from('user_lessons').upsert(
                { user_id: user.id, lesson_id: lesson.id, completed: true },
                { onConflict: 'user_id,lesson_id' }
            );
            const difficulty = lesson.module?.difficulty || 'Découverte';
            await addXp(supabase, user.id, xp || 0, XP_REWARDS[difficulty] || 25, streak || 0);
            if (nextLessonId) navigate(`/lessons/${nextLessonId}`);
            else navigate(`/modules/${lesson.module_id}`);
        } catch (err) {
            console.error('erreur validation leçon:', err);
        } finally {
            setIsCompleting(false);
        }
    };

    const totalSections = sectionRefs.current.length;
    const progressPct = totalSections > 1 ? Math.round((activeSection / (totalSections - 1)) * 100) : 0;
    const canComplete = !isCompleting && allAnswered;

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

            {/* Barre de progression sticky */}
            {totalSections > 1 && (
                <div className="sticky top-[73px] z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 px-6 py-3 flex items-center gap-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-text-muted/60 shrink-0 hidden sm:block">progression</span>
                    <div className="flex-1 h-1.5 bg-border/30 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_var(--accent-glow)]"
                            style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-text-muted/60 shrink-0 tabular-nums">{activeSection + 1} / {totalSections}</span>
                </div>
            )}

            <main className="flex-grow max-w-4xl mx-auto w-full px-6 md:px-8 py-8 md:py-12">
                <article className="prose prose-invert prose-indigo max-w-none">

                    {/* Header compact — titre + navigation visible sans scroller */}
                    <header className="not-prose mb-8 pb-6 border-b border-border/40">
                        <div className="flex items-center gap-3 mb-3">
                            <Link
                                to={`/modules/${lesson.module_id}`}
                                className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors flex items-center gap-1.5"
                            >
                                ← Module
                            </Link>
                            {prevLessonId && (
                                <>
                                    <span className="text-border/60">·</span>
                                    <button
                                        onClick={() => navigate(`/lessons/${prevLessonId}`)}
                                        className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text transition-colors"
                                    >
                                        Précédente
                                    </button>
                                </>
                            )}
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-tight text-text mb-3">
                            {lesson.title}
                        </h1>
                        {/* estimation de lecture */}
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-muted/60">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {(() => {
                                    const words = lesson.content?.replace(/[#*`\[\]()>]/g, '').split(/\s+/).filter(Boolean).length || 0;
                                    const mins = Math.max(1, Math.round(words / 200));
                                    return `${mins} min de lecture`;
                                })()}
                            </span>
                            {lesson.module?.difficulty && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-border/60" />
                                    <span className={
                                        lesson.module.difficulty === 'Découverte' ? 'text-sky-400' :
                                        lesson.module.difficulty === 'Fondamentaux' ? 'text-emerald-400' :
                                        lesson.module.difficulty === 'Avancé' ? 'text-amber-400' : 'text-rose-400'
                                    }>{lesson.module.difficulty}</span>
                                </>
                            )}
                        </div>
                    </header>

                    <LessonContent
                        content={lesson.content}
                        contentRef={contentRef}
                        onQuizCountChange={handleQuizCountChange}
                        onAllAnswered={setAllAnswered}
                    />

                    <footer className="mt-16 pt-8 border-t border-border/40 flex flex-col items-center gap-6">
                        {quizTotal > 0 && !allAnswered && (
                            <p className="text-sm font-black uppercase tracking-widest text-amber-400/80 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                réponds aux exercices avant de continuer
                            </p>
                        )}
                        <button
                            onClick={handleComplete}
                            disabled={!canComplete}
                            className={`w-full md:w-auto min-w-[320px] flex items-center justify-center gap-5 px-16 py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xl transition-all active:scale-95 ${
                                canComplete
                                    ? 'bg-accent hover:bg-accent/90 text-white hover:scale-[1.05] shadow-[0_30px_70px_-15px_rgba(99,102,241,0.5)]'
                                    : 'bg-surface border border-border/60 text-text-muted/40 cursor-not-allowed'
                            }`}
                        >
                            {isCompleting
                                ? <Loader2 className="w-8 h-8 animate-spin" />
                                : <><Sparkles className="w-6 h-6" /><span>{nextLessonId ? 'Continuer' : 'Terminer le module'}</span><ChevronRight className="w-8 h-8 ml-2" /></>
                            }
                        </button>
                        <div className="flex items-center gap-12">
                            <button
                                onClick={() => prevLessonId && navigate(`/lessons/${prevLessonId}`)}
                                disabled={!prevLessonId}
                                className={`text-[10px] font-black uppercase tracking-[0.4em] text-text-muted hover:text-text transition-all ${!prevLessonId ? 'opacity-0 pointer-events-none' : 'hover:translate-x-[-8px]'}`}
                            >
                                ← Leçon Précédente
                            </button>
                            <Link to={`/modules/${lesson.module_id}`} className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted hover:text-accent transition-all">
                                Revenir au module
                            </Link>
                        </div>
                    </footer>
                </article>
            </main>
        </div>
    );
}
