import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, HelpCircle, Sparkles, Layout, Zap } from 'lucide-react';
import QuestionForm from '../../components/QuestionForm';

/**
 * orchestrateur de création d'évaluations interactives (quiz/examens).
 * gère l'injection atomique des questions et de leurs vecteurs de réponse.
 */
export default function CreateQuizPage() {
    const { isAdmin, isContributor, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const initialModuleId = queryParams.get('moduleId') || '';
    const initialSkillId = queryParams.get('skillId') || '';

    const isSkillContext = !!initialSkillId;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * guard d'intégrité de session admin.
     */
    useEffect(() => {
        if (!isLoading && !isAdmin && !isContributor) navigate('/dashboard');
    }, [isAdmin, isContributor, isLoading, navigate]);

    /**
     * transaction composite : insertion question + mapping des options de réponse.
     */
    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const { data: questionData, error: questionError } = await supabase
                .from('questions')
                .insert([{
                    module_id: data.module_id || null,
                    skill_id: data.skill_id || null,
                    question_text: data.question_text,
                    type: data.type
                }])
                .select()
                .single();

            if (questionError) throw questionError;

            const optionsToInsert = data.answers.map((a: any) => ({
                question_id: questionData.id,
                option_text: a.text,
                is_correct: a.isCorrect
            }));

            const { error: answersError } = await supabase
                .from('quiz_options')
                .insert(optionsToInsert);

            if (answersError) throw answersError;

            // routage contextuel post-injection
            if (data.skill_id) {
                navigate(`/admin/skills/${data.skill_id}/exam`);
            } else if (data.module_id) {
                navigate(`/admin/modules/${data.module_id}/content`);
            } else {
                navigate('/admin');
            }
        } catch (err: any) {
            setError(err.message || 'échec lors de la sérialisation de l\'évaluation.');
            setIsSubmitting(false);
        }
    };

    if (isLoading || (!isAdmin && !isContributor)) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 animate-spin text-accent opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted/40 italic">génération studio évaluation...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text font-sans selection:bg-accent/30 p-8 md:p-14 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 opacity-[0.02] pointer-events-none rotate-12">
                <Layout size={600} />
            </div>

            <div className="max-w-5xl mx-auto space-y-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <Link
                    to={isSkillContext ? `/admin/skills/${initialSkillId}/exam` : initialModuleId ? `/admin/modules/${initialModuleId}/content` : '/admin'}
                    className="inline-flex items-center gap-4 text-[10px] font-black text-text-muted hover:text-accent uppercase tracking-[0.3em] transition-all group"
                >
                    <div className="p-2.5 bg-surface border border-border/40 rounded-xl group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                    retour au contexte parent
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <HelpCircle className="w-4 h-4 text-accent" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60">module d'interrogation</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-equinox leading-tight">nouvelle question</h1>
                    </div>
                    
                    <div className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border transition-all shadow-lg ${isSkillContext ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-accent/10 border-accent/20 text-accent shadow-accent/5'}`}>
                        {isSkillContext ? 'accréditation helix' : 'quiz standard'}
                    </div>
                </div>

                {error && (
                    <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] text-rose-500 text-xs font-bold uppercase tracking-widest italic animate-in shake-in">
                        {error}
                    </div>
                )}

                <div className="bg-surface/20 backdrop-blur-3xl border border-border/40 p-1 rounded-[3.5rem] shadow-2xl">
                    <div className="p-8 md:p-14">
                        <QuestionForm
                            initialData={{
                                module_id: initialModuleId || null,
                                skill_id: initialSkillId || null,
                                question_text: '',
                                type: 'multiple_choice',
                                answers: [
                                    { text: '', isCorrect: true },
                                    { text: '', isCorrect: false }
                                ]
                            }}
                            context={isSkillContext ? 'skill' : 'module'}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            buttonText="déployer la question"
                        />
                    </div>
                </div>
                
                <footer className="flex justify-center pt-8 border-t border-border/20">
                    <div className="flex items-center gap-2 opacity-20">
                        <Sparkles size={12} />
                        <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">evaluation core v2.0</p>
                        <Zap size={12} />
                    </div>
                </footer>
            </div>
        </div>
    );
}
