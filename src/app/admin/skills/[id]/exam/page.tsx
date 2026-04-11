import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Loader2,
    ArrowLeft,
    Plus,
    Trophy,
    Edit2,
    Trash2,
    CheckCircle2,
    Sparkles,
    Settings,
    Zap,
    Target
} from 'lucide-react';

/**
 * structure de données pour les questions d'accréditation.
 */
interface Question {
    id: string;
    question_text: string;
    answers: { id: string; answer_text: string; is_correct: boolean }[];
}

/**
 * page de configuration de l'examen final d'une compétence helix.
 * permet l'organisation des points de contrôle d'accréditation majeure.
 */
export default function SkillExamQuestionsPage() {
    const { isAdmin, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id: skillId } = useParams<{ id: string }>();

    const [skillName, setSkillName] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    /**
     * guard d'intégrité pour l'accès aux privilèges d'accréditation.
     */
    useEffect(() => {
        if (!authLoading && !isAdmin) navigate('/dashboard');
    }, [isAdmin, authLoading, navigate]);

    /**
     * agrégation des données d'examen associées au nœud de compétence.
     */
    const fetchData = useCallback(async () => {
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
            console.error('SkillExamQuestionsPage: échec synchronisation examen:', err);
        } finally {
            setIsLoading(false);
        }
    }, [skillId]);

    useEffect(() => {
        if (isAdmin) fetchData();
    }, [fetchData, isAdmin]);

    /**
     * procédure de suppression de question d'examen avec confirmation.
     */
    const handleDeleteQuestion = async (id: string) => {
        if (!window.confirm(`confirmer la suppression de cette question d'examen ?`)) return;
        setIsDeleting(id);
        try {
            const { error } = await supabase.from('questions').delete().eq('id', id);
            if (error) throw error;
            setQuestions(prev => prev.filter(q => q.id !== id));
        } catch (err) {
            console.error('échec suppression question examen:', err);
        } finally {
            setIsDeleting(null);
        }
    };

    if (authLoading || (isLoading && !skillName)) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 animate-spin text-accent opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted/40 italic">reconfiguration du banc d'essai...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text font-sans selection:bg-accent/30 p-8 md:p-14 overflow-x-hidden relative">
            {/* décorum nebula */}
            <div className="absolute top-0 right-0 p-32 opacity-[0.01] pointer-events-none rotate-12">
                <Settings size={600} />
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
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-500/60">accréditation majeure</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-equinox leading-tight italic">examen : {skillName}</h1>
                            <p className="text-[11px] font-bold text-text-muted/60 uppercase tracking-[0.2em] italic">configuration des points de contrôle finaux pour l'évaluation de compétence.</p>
                        </div>
                    </div>
                    
                    <Link
                        to={`/admin/quizzes/new?skillId=${skillId}`}
                        className="group flex items-center gap-4 px-10 py-5 bg-accent hover:bg-accent/90 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl shadow-accent/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> injecter question
                    </Link>
                </header>

                <section className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl shadow-xl shadow-yellow-500/5">
                                <Target className="w-5 h-5 text-yellow-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-text uppercase tracking-widest italic">banque de tests</h2>
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/40 italic">{questions.length} questions indexées pour l'accréditation</p>
                            </div>
                        </div>
                        <Zap className="text-text-muted/5" size={48} />
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {questions.map((q, idx) => (
                            <div 
                                key={q.id} 
                                className="group bg-surface/30 backdrop-blur-3xl border border-border/40 p-10 rounded-[3.5rem] hover:border-accent/40 transition-all animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="flex items-start justify-between mb-10">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                            <span className="text-[9px] font-black uppercase text-yellow-500/60 tracking-[0.3em]">point de contrôle final</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-text/80 leading-tight uppercase tracking-tight group-hover:text-accent transition-colors">{q.question_text}</h3>
                                    </div>
                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                        <Link
                                            to={`/admin/quizzes/${q.id}/edit`}
                                            className="p-4 bg-background/40 hover:bg-surface-hover border border-border/40 rounded-2xl text-text-muted hover:text-text transition-all"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteQuestion(q.id)}
                                            disabled={isDeleting === q.id}
                                            className="p-4 bg-rose-500/5 hover:bg-rose-500 border border-rose-500/10 hover:border-rose-500 rounded-2xl text-rose-500 hover:text-white transition-all shadow-lg"
                                        >
                                            {isDeleting === q.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {q.answers.map((a) => (
                                        <div key={a.id} className={`flex items-center gap-5 px-8 py-6 rounded-[2rem] border transition-all ${a.is_correct ? 'bg-accent/10 border-accent/40 text-accent shadow-lg shadow-accent/5' : 'bg-background/20 border-border/40 text-text-muted/40'}`}>
                                            <div className={`w-3.5 h-3.5 rounded-full shrink-0 border-2 ${a.is_correct ? 'bg-accent border-accent animate-pulse' : 'bg-transparent border-text-muted/10'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest truncate italic">{a.answer_text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {questions.length === 0 && (
                            <div className="text-center py-32 bg-surface/10 border border-dashed border-border/40 rounded-[4rem] space-y-6">
                                <Trophy className="w-16 h-16 text-text-muted/5 mx-auto animate-pulse" />
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black text-text-muted/40 uppercase tracking-[0.5em] italic">aucun vecteur d'accréditation configuré.</p>
                                    <p className="text-[9px] text-text-muted/20 uppercase tracking-widest italic leading-relaxed">injectez des questions pour initialiser le cycle d'examen.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
                
                <footer className="flex justify-center pt-8 border-t border-border/20">
                    <Sparkles className="w-4 h-4 text-text-muted/10" />
                </footer>
            </div>
        </div>
    );
}
