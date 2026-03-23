import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Loader2,
    ArrowLeft,
    Plus,
    Trophy,
    Edit2,
    Trash2,
    CheckCircle2
} from 'lucide-react';

interface Question {
    id: string;
    question_text: string;
    answers: { id: string; answer_text: string; is_correct: boolean }[];
}

export default function SkillExamQuestionsPage() {
    const { isAdmin, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id: skillId } = useParams<{ id: string }>();

    const [skillName, setSkillName] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAdmin) navigate('/dashboard');
    }, [isAdmin, authLoading, navigate]);

    const fetchData = async () => {
        if (!skillId) return;
        setIsLoading(true);
        try {
            const [
                { data: skillData },
                { data: questionData }
            ] = await Promise.all([
                supabase.from('skills').select('name').eq('id', skillId).single(),
                supabase.from('questions').select('id, question_text, quiz_options (id, option_text, is_correct)').eq('skill_id', skillId)
            ]);

            if (skillData) setSkillName(skillData.name);
            
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
            console.error('Error fetching skill exam content:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) fetchData();
    }, [skillId, isAdmin]);

    const handleDeleteQuestion = async (id: string) => {
        if (!window.confirm(`Supprimer cette question d'examen ?`)) return;
        setIsDeleting(id);
        const { error } = await supabase.from('questions').delete().eq('id', id);
        if (!error) setQuestions(questions.filter(q => q.id !== id));
        setIsDeleting(null);
    };

    if (authLoading || (isLoading && !skillName)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <Link to="/admin" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-all text-xs font-bold uppercase tracking-widest mb-2 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Retour au Panel Admin
                        </Link>
                        <h1 className="text-4xl font-black tracking-tight text-white">Examen : {skillName}</h1>
                        <p className="text-text-muted font-medium">Gestion des questions de l'examen final de la compétence.</p>
                    </div>
                    <Link
                        to={`/admin/quizzes/new?skillId=${skillId}`}
                        className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black transition-all shadow-xl shadow-accent/20"
                    >
                        <Plus className="w-5 h-5" /> Ajouter une Question d'Examen
                    </Link>
                </header>

                <section className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-yellow-500/10 rounded-xl">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                        </div>
                        <h2 className="text-xl font-black text-white uppercase tracking-wider">Questions de l'Examen ({questions.length})</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {questions.map((q) => (
                            <div key={q.id} className="group bg-surface/50 border border-border p-6 rounded-[32px] hover:border-accent/30 transition-all">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-yellow-500/60 tracking-widest">Question d'Examen</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white leading-relaxed">{q.question_text}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                        <Link
                                            to={`/admin/quizzes/${q.id}/edit`}
                                            className="p-2.5 hover:bg-surface-hover rounded-xl text-text-muted hover:text-text transition-all shadow-lg"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteQuestion(q.id)}
                                            disabled={isDeleting === q.id}
                                            className="p-2.5 hover:bg-red-400/10 rounded-xl text-text-muted hover:text-red-400 transition-all shadow-lg"
                                        >
                                            {isDeleting === q.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {q.answers.map((a) => (
                                        <div key={a.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold border transition-all ${a.is_correct ? 'bg-green-400/10 border-green-400/20 text-green-400' : 'bg-background/40 border-border text-text-muted'}`}>
                                            {a.is_correct && <CheckCircle2 className="w-4 h-4" />}
                                            <span className="truncate">{a.answer_text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {questions.length === 0 && (
                            <div className="text-center py-20 bg-surface/30 border border-dashed border-white/10 rounded-[40px] text-text-muted">
                                <Trophy className="w-12 h-12 text-white/5 mx-auto mb-4" />
                                <p className="font-bold">Aucune question pour cet examen.</p>
                                <p className="text-xs mt-1">Ajoutez des questions pour que l'examen soit disponible.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
