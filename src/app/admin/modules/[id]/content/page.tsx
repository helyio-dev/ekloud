import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Loader2,
    ArrowLeft,
    Plus,
    Book,
    HelpCircle,
    Edit2,
    Trash2,
    ChevronRight,
    GripVertical,
    CheckCircle2,
    Sparkles,
    Settings,
    Activity,
    BookOpen,
    Zap
} from 'lucide-react';

/**
 * structure de données pour les leçons indexées.
 */
interface Lesson {
    id: string;
    title: string;
    order_index: number;
}

/**
 * structure de données pour les questions de quiz et leurs itérations de réponses.
 */
interface Question {
    id: string;
    question_text: string;
    answers: { id: string; answer_text: string; is_correct: boolean }[];
}

/**
 * page de gestion granulaire du contenu d'un module.
 * permet l'organisation de la séquence pédagogique (leçons) et des points de contrôle (quiz).
 */
export default function ModuleContentPage() {
    const { isAdmin, isContributor, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id: moduleId } = useParams<{ id: string }>();

    const [moduleTitle, setModuleTitle] = useState('');
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    /**
     * guard de sécurité pour l'intégrité de la session admin.
     */
    useEffect(() => {
        if (!authLoading && !isAdmin && !isContributor) navigate('/dashboard');
    }, [isAdmin, isContributor, authLoading, navigate]);

    /**
     * agrégation multi-canaux des leçons et questions associées au module.
     */
    const fetchData = useCallback(async () => {
        if (!moduleId) return;
        setIsLoading(true);
        try {
            const [
                { data: modData },
                { data: lessonData },
                { data: questionData }
            ] = await Promise.all([
                supabase.from('modules').select('title').eq('id', moduleId).single(),
                supabase.from('lessons').select('id, title, order_index').eq('module_id', moduleId).order('order_index'),
                supabase.from('questions').select('id, question_text, quiz_options (id, option_text, is_correct)').eq('module_id', moduleId)
            ]);

            if (modData) setModuleTitle(modData.title);
            setLessons(lessonData || []);
            
            const formattedQuestions = (questionData || []).map((q: any) => ({
                id: q.id,
                question_text: q.question_text,
                answers: (q.quiz_options || []).map((o: any) => ({
                    id: o.id,
                    answer_text: o.option_text,
                    is_correct: o.is_correct
                }))
            }));
            setQuestions(formattedQuestions);
        } catch (err) {
            console.error('ModuleContentPage: échec synchronisation contenu:', err);
        } finally {
            setIsLoading(false);
        }
    }, [moduleId]);

    useEffect(() => {
        if (isAdmin || isContributor) fetchData();
    }, [fetchData, isAdmin, isContributor]);

    /**
     * procédure de suppression de leçon avec confirmation utilisateur.
     */
    const handleDeleteLesson = async (id: string, title: string) => {
        if (!window.confirm(`confirmer la suppression de la leçon "${title}" ?`)) return;
        setIsDeleting(id);
        try {
            const { error } = await supabase.from('lessons').delete().eq('id', id);
            if (error) throw error;
            setLessons(prev => prev.filter(l => l.id !== id));
        } catch (err) {
            console.error('échec de suppression leçon:', err);
        } finally {
            setIsDeleting(null);
        }
    };

    /**
     * procédure de suppression de question quiz.
     */
    const handleDeleteQuestion = async (id: string) => {
        if (!window.confirm(`confirmer la suppression de cette question ?`)) return;
        setIsDeleting(id);
        try {
            const { error } = await supabase.from('questions').delete().eq('id', id);
            if (error) throw error;
            setQuestions(prev => prev.filter(q => q.id !== id));
        } catch (err) {
            console.error('échec de suppression question:', err);
        } finally {
            setIsDeleting(null);
        }
    };

    if (authLoading || (isLoading && !moduleTitle)) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 animate-spin text-accent opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted/40 italic">reconstruction du curriculum...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text font-sans selection:bg-accent/30 p-8 md:p-14 overflow-x-hidden relative">
            {/* décorum nebula */}
            <div className="absolute top-0 right-0 p-32 opacity-[0.01] pointer-events-none">
                <Settings size={800} />
            </div>

            <div className="max-w-7xl mx-auto space-y-12 relative z-10 animate-in fade-in slide-in-from-top-6 duration-1000">
                {/* en-tête immersif */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-border/20 pb-12">
                    <div className="space-y-4">
                        <Link to="/admin" className="inline-flex items-center gap-4 text-[10px] font-black text-text-muted hover:text-accent uppercase tracking-[0.3em] transition-all group">
                            <div className="p-2.5 bg-surface border border-border/40 rounded-xl group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            </div>
                            retour console admin
                        </Link>
                        
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-4 h-4 text-accent" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60">architecture pédagogique</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-equinox leading-tight">{moduleTitle}</h1>
                            <p className="text-[11px] font-bold text-text-muted/60 uppercase tracking-[0.2em] italic">configuration des ressources séquentielles et interactives.</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to={`/admin/lessons/new?moduleId=${moduleId}`}
                            className="group flex items-center gap-3 px-8 py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-accent/20 active:scale-95"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> leçon
                        </Link>
                        <Link
                            to={`/admin/quizzes/new?moduleId=${moduleId}`}
                            className="flex items-center gap-3 px-8 py-4 bg-surface hover:bg-surface-hover border border-border/60 text-text rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> question
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* section leçons */}
                    <section className="space-y-8 animate-in slide-in-from-left-8 duration-700">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                                    <BookOpen className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-text uppercase tracking-widest italic">leçons lues</h2>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/40 italic">{lessons.length} indexées</p>
                                </div>
                            </div>
                            <Zap className="text-text-muted/10" size={32} />
                        </div>

                        <div className="space-y-4">
                            {lessons.map((lesson, idx) => (
                                <div 
                                    key={lesson.id} 
                                    className="group bg-surface/30 backdrop-blur-3xl border border-border/40 p-6 rounded-[2.5rem] hover:border-blue-400/30 transition-all flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="text-[10px] font-black text-blue-400/40 bg-blue-400/5 w-12 h-12 rounded-2xl border border-blue-400/10 flex items-center justify-center italic">
                                            {String(lesson.order_index).padStart(2, '0')}
                                        </div>
                                        <h3 className="font-black text-lg uppercase tracking-tight text-text/80 group-hover:text-blue-400 transition-colors">{lesson.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                        <Link
                                            to={`/admin/lessons/${lesson.id}/edit`}
                                            className="p-3 bg-background/40 hover:bg-surface-hover border border-border/40 rounded-xl text-text-muted hover:text-text transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                                            disabled={isDeleting === lesson.id}
                                            className="p-3 bg-rose-500/5 hover:bg-rose-500 border border-rose-500/10 hover:border-rose-500 rounded-xl text-rose-500 hover:text-white transition-all"
                                        >
                                            {isDeleting === lesson.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {lessons.length === 0 && (
                                <div className="text-center py-24 bg-surface/10 border border-dashed border-border/40 rounded-[3rem] space-y-4">
                                    <Book className="w-10 h-10 text-text-muted/10 mx-auto" />
                                    <p className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.4em] italic">aucun module pédagogique détecté.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* section quiz */}
                    <section className="space-y-8 animate-in slide-in-from-right-8 duration-700">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                                    <HelpCircle className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-text uppercase tracking-widest italic">points de contrôle</h2>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/40 italic">{questions.length} questions actives</p>
                                </div>
                            </div>
                            <Activity className="text-text-muted/10" size={32} />
                        </div>

                        <div className="space-y-6">
                            {questions.map((q, idx) => (
                                <div 
                                    key={q.id} 
                                    className="group bg-surface/30 backdrop-blur-3xl border border-border/40 p-8 rounded-[3rem] hover:border-purple-400/30 transition-all animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                                    style={{ animationDelay: `${idx * 150}ms` }}
                                >
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <GripVertical size={12} className="text-text-muted/20" />
                                                <span className="text-[9px] font-black text-purple-400/60 uppercase tracking-widest italic">id: {q.id.substring(0, 8)}</span>
                                            </div>
                                            <h3 className="font-black text-xl uppercase tracking-tight text-text leading-tight group-hover:text-purple-400 transition-colors">{q.question_text}</h3>
                                        </div>
                                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                            <Link
                                                to={`/admin/quizzes/${q.id}/edit`}
                                                className="p-3 bg-background/40 hover:bg-surface-hover border border-border/40 rounded-xl text-text-muted hover:text-text transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteQuestion(q.id)}
                                                disabled={isDeleting === q.id}
                                                className="p-3 bg-rose-500/5 hover:bg-rose-500 border border-rose-500/10 hover:border-rose-500 rounded-xl text-rose-500 hover:text-white transition-all"
                                            >
                                                {isDeleting === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {q.answers.map((a) => (
                                            <div key={a.id} className={`flex items-center gap-4 px-5 py-4 rounded-[1.5rem] border transition-all ${a.is_correct ? 'bg-accent/10 border-accent/40 text-accent shadow-lg shadow-accent/5' : 'bg-background/20 border-border/40 text-text-muted/40'}`}>
                                                <div className={`w-3 h-3 rounded-full shrink-0 ${a.is_correct ? 'bg-accent animate-pulse' : 'bg-border/40'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest truncate italic">{a.answer_text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {questions.length === 0 && (
                                <div className="text-center py-24 bg-surface/10 border border-dashed border-border/40 rounded-[3rem] space-y-4">
                                    <HelpCircle className="w-10 h-10 text-text-muted/10 mx-auto" />
                                    <p className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.4em] italic">aucun exercice interactif configuré.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
