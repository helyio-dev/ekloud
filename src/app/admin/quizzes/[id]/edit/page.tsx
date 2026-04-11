import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Edit3, Sparkles, Settings, Zap } from 'lucide-react';
import QuestionForm from '../../../components/QuestionForm';

/**
 * page de reconfiguration des vecteurs d'évaluation.
 * permet l'ajustement structurel des questions et la synchronisation des options de réponse.
 */
export default function EditQuestionPage() {
    const { isAdmin, isContributor, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id: questionId } = useParams<{ id: string }>();

    const [questionData, setQuestionData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * guard de sécurité pour l'intégrité de la session admin.
     */
    useEffect(() => {
        if (!authLoading && !isAdmin && !isContributor) navigate('/dashboard');
    }, [isAdmin, isContributor, authLoading, navigate]);

    /**
     * extraction et normalisation des métadonnées de la question.
     */
    const fetchQuestion = useCallback(async () => {
        if (!questionId) return;
        setIsLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('questions')
                .select('*, quiz_options (*)')
                .eq('id', questionId)
                .single();

            if (fetchError) throw fetchError;

            if (data) {
                setQuestionData({
                    module_id: data.module_id,
                    skill_id: data.skill_id,
                    question_text: data.question_text,
                    type: data.type,
                    answers: (data.quiz_options || []).map((o: any) => ({
                        id: o.id,
                        text: o.option_text,
                        isCorrect: o.is_correct
                    }))
                });
            }
        } catch (err: any) {
            console.error('EditQuestionPage: échec synchronisation question:', err);
            setError('impossible de synchroniser les données de la question.');
        } finally {
            setIsLoading(false);
        }
    }, [questionId]);

    useEffect(() => {
        if (isAdmin || isContributor) fetchQuestion();
    }, [isAdmin, isContributor, fetchQuestion]);

    /**
     * orchestration de la transaction de mise à jour (atomic shift).
     */
    const handleSubmit = async (data: any) => {
        if (!data.answers || data.answers.length < 2) {
            setError('validation échouée : minimum 2 options requises.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. synchronisation des descripteurs de question
            const { error: questionError } = await supabase
                .from('questions')
                .update({
                    module_id: data.module_id,
                    skill_id: data.skill_id,
                    question_text: data.question_text,
                    type: data.type
                })
                .eq('id', questionId);

            if (questionError) throw questionError;

            // 2. nettoyage et reconstruction des options de réponse
            const { error: deleteError } = await supabase
                .from('quiz_options')
                .delete()
                .eq('question_id', questionId);

            if (deleteError) throw deleteError;

            const optionsToInsert = data.answers.map((a: any) => ({
                question_id: questionId,
                option_text: a.text,
                is_correct: a.isCorrect
            }));

            const { error: answersError } = await supabase
                .from('quiz_options')
                .insert(optionsToInsert);

            if (answersError) throw answersError;

            // 3. routage post-transaction
            if (data.skill_id) {
                navigate(`/admin/skills/${data.skill_id}/exam`);
            } else if (data.module_id) {
                navigate(`/admin/modules/${data.module_id}/content`);
            } else {
                navigate('/admin');
            }
        } catch (err: any) {
            setError(err.message || 'échec de la transaction système.');
            setIsSubmitting(false);
        }
    };

    if (authLoading || (isLoading && !error) || (!isAdmin && !isContributor)) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 animate-spin text-accent opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted/40 italic">reconfiguration des données...</span>
            </div>
        );
    }

    const backUrl = questionData?.skill_id 
        ? `/admin/skills/${questionData.skill_id}/exam`
        : questionData?.module_id 
            ? `/admin/modules/${questionData.module_id}/content`
            : "/admin";

    return (
        <div className="min-h-screen bg-background text-text font-sans selection:bg-accent/30 p-8 md:p-14 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 opacity-[0.02] pointer-events-none rotate-12">
                <Settings size={600} />
            </div>

            <div className="max-w-5xl mx-auto space-y-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <Link
                    to={backUrl}
                    className="inline-flex items-center gap-4 text-[10px] font-black text-text-muted hover:text-accent uppercase tracking-[0.3em] transition-all group"
                >
                    <div className="p-2.5 bg-surface border border-border/40 rounded-xl group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                    retour au contexte parent
                </Link>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Edit3 className="w-4 h-4 text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60">système de modification évaluative</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-equinox leading-tight">réviser question</h1>
                        <div className="flex items-center gap-3 opacity-20">
                            <Zap size={14} />
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">live update protocol</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] text-rose-500 text-xs font-bold uppercase tracking-widest italic animate-in shake-in">
                        {error}
                    </div>
                )}

                {!isLoading && questionData && (
                    <div className="bg-surface/20 backdrop-blur-3xl border border-border/40 p-1 rounded-[3.5rem] shadow-2xl">
                        <div className="p-8 md:p-14">
                            <QuestionForm
                                initialData={questionData}
                                onSubmit={handleSubmit}
                                isSubmitting={isSubmitting}
                                buttonText="mettre à jour la question"
                                context={questionData.skill_id ? 'skill' : 'module'}
                            />
                        </div>
                    </div>
                )}

                <footer className="flex justify-center pt-8 border-t border-border/20">
                    <div className="flex items-center gap-2 opacity-10">
                        <Sparkles size={12} />
                        <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">eval micro-service v2.0</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
