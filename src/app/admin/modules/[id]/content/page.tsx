import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
    CheckCircle2
} from 'lucide-react';

interface Lesson {
    id: string;
    title: string;
    order_index: number;
}

interface Question {
    id: string;
    question_text: string;
    difficulty: string;
    answers: { id: string; answer_text: string; is_correct: boolean }[];
}

export default function ModuleContentPage() {
    const { isAdmin, isContributor, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id: moduleId } = useParams<{ id: string }>();

    const [moduleTitle, setModuleTitle] = useState('');
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAdmin && !isContributor) navigate('/dashboard');
    }, [isAdmin, isContributor, authLoading, navigate]);

    const fetchData = async () => {
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
                supabase.from('questions').select('id, question_text, difficulty, quiz_options (id, option_text, is_correct)').eq('module_id', moduleId)
            ]);

            if (modData) setModuleTitle(modData.title);
            setLessons(lessonData || []);
            
            const formattedQuestions = (questionData || []).map((q: any) => ({
                id: q.id,
                question_text: q.question_text,
                difficulty: q.difficulty,
                answers: (q.quiz_options || []).map((o: any) => ({
                    id: o.id,
                    answer_text: o.option_text,
                    is_correct: o.is_correct
                }))
            }));
            setQuestions(formattedQuestions);
        } catch (err) {
            console.error('Error fetching module content:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin || isContributor) fetchData();
    }, [moduleId, isAdmin, isContributor]);

    const handleDeleteLesson = async (id: string, title: string) => {
        if (!window.confirm(`Supprimer la leçon "${title}" ?`)) return;
        setIsDeleting(id);
        const { error } = await supabase.from('lessons').delete().eq('id', id);
        if (!error) setLessons(lessons.filter(l => l.id !== id));
        setIsDeleting(null);
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!window.confirm(`Supprimer cette question ?`)) return;
        setIsDeleting(id);
        const { error } = await supabase.from('questions').delete().eq('id', id);
        if (!error) setQuestions(questions.filter(q => q.id !== id));
        setIsDeleting(null);
    };

    if (authLoading || (isLoading && !moduleTitle)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <Link to="/admin" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-all text-xs font-bold uppercase tracking-widest mb-2 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Retour au Panel Admin
                        </Link>
                        <h1 className="text-4xl font-black tracking-tight text-white">{moduleTitle}</h1>
                        <p className="text-text-muted font-medium">Gestion des leçons et des exercices du module.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to={`/admin/lessons/new?moduleId=${moduleId}`}
                            className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-accent/20"
                        >
                            <Plus className="w-4 h-4" /> Ajouter une Leçon
                        </Link>
                        <Link
                            to={`/admin/quizzes/new?moduleId=${moduleId}`}
                            className="flex items-center gap-2 px-5 py-2.5 bg-surface hover:bg-white/5 border border-white/10 text-white rounded-2xl font-black text-sm transition-all"
                        >
                            <Plus className="w-4 h-4" /> Ajouter une Question
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Lessons Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Book className="w-5 h-5 text-blue-400" />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Leçons ({lessons.length})</h2>
                        </div>

                        <div className="space-y-3">
                            {lessons.map((lesson) => (
                                <div key={lesson.id} className="group bg-surface/50 border border-white/5 p-4 rounded-2xl hover:border-blue-400/30 transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-xs font-black text-blue-400/40 w-6">
                                            {String(lesson.order_index).padStart(2, '0')}
                                        </div>
                                        <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{lesson.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <Link
                                            to={`/admin/lessons/${lesson.id}/edit`}
                                            className="p-2 hover:bg-white/5 rounded-lg text-text-muted hover:text-white transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                                            disabled={isDeleting === lesson.id}
                                            className="p-2 hover:bg-red-400/10 rounded-lg text-text-muted hover:text-red-400 transition-all"
                                        >
                                            {isDeleting === lesson.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {lessons.length === 0 && (
                                <div className="text-center py-12 bg-surface/30 border border-dashed border-white/5 rounded-3xl text-text-muted">
                                    Aucune leçon pour le moment.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Quiz Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <HelpCircle className="w-5 h-5 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Quiz / Questions ({questions.length})</h2>
                        </div>

                        <div className="space-y-4">
                            {questions.map((q) => (
                                <div key={q.id} className="group bg-surface/50 border border-white/5 p-5 rounded-3xl hover:border-purple-400/30 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${q.difficulty === 'hard' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                                                        q.difficulty === 'medium' ? 'bg-orange-400/10 text-orange-400 border-orange-400/20' :
                                                            'bg-green-400/10 text-green-400 border-green-400/20'
                                                    }`}>
                                                    {q.difficulty}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-white leading-snug">{q.question_text}</h3>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                            <Link
                                                to={`/admin/quizzes/${q.id}/edit`}
                                                className="p-2 hover:bg-white/5 rounded-lg text-text-muted hover:text-white transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteQuestion(q.id)}
                                                disabled={isDeleting === q.id}
                                                className="p-2 hover:bg-red-400/10 rounded-lg text-text-muted hover:text-red-400 transition-all"
                                            >
                                                {isDeleting === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {q.answers.map((a) => (
                                            <div key={a.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${a.is_correct ? 'bg-green-400/10 border-green-400/20 text-green-400' : 'bg-background/40 border-white/5 text-text-muted'}`}>
                                                {a.is_correct && <CheckCircle2 className="w-3 h-3" />}
                                                <span className="truncate">{a.answer_text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {questions.length === 0 && (
                                <div className="text-center py-12 bg-surface/30 border border-dashed border-white/5 rounded-3xl text-text-muted">
                                    Aucune question de quiz.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
