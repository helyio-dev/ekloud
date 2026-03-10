import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft } from 'lucide-react';
import QuestionForm from '../../../components/QuestionForm';

export default function EditQuestionPage() {
    const { isAdmin, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id: questionId } = useParams<{ id: string }>();

    const [questionData, setQuestionData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAdmin) navigate('/dashboard');
    }, [isAdmin, authLoading, navigate]);

    useEffect(() => {
        const fetchQuestion = async () => {
            if (!questionId) return;
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('questions')
                    .select('*, quiz_options (*)')
                    .eq('id', questionId)
                    .single();

                if (error) throw error;

                // Format for QuestionForm
                if (data) {
                    setQuestionData({
                        module_id: data.module_id,
                        skill_id: data.skill_id,
                        question_text: data.question_text,
                        difficulty: data.difficulty,
                        type: data.type,
                        answers: (data.quiz_options || []).map((o: any) => ({
                            id: o.id,
                            text: o.option_text,
                            isCorrect: o.is_correct
                        }))
                    });
                }
        } catch (err: any) {
            console.error('Error fetching question:', err);
            setError('Impossible de charger la question.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isAdmin) fetchQuestion();
}, [questionId, isAdmin]);

const handleSubmit = async (data: any) => {
    if (!data.answers || data.answers.length < 2) {
        setError('Une question doit avoir au moins 2 réponses.');
        return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
        // 1. Update Question
        const { error: questionError } = await supabase
            .from('questions')
            .update({
                module_id: data.module_id,
                skill_id: data.skill_id,
                question_text: data.question_text,
                difficulty: data.difficulty,
                type: data.type
            })
            .eq('id', questionId);

        if (questionError) throw questionError;

        // 2. Manage Options (Delete and Re-insert)
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

        // 3. Navigation
        if (data.skill_id) {
            navigate(`/admin/skills/${data.skill_id}/exam`);
        } else if (data.module_id) {
            navigate(`/admin/modules/${data.module_id}/content`);
        } else {
            navigate('/admin');
        }
    } catch (err: any) {
        setError(err.message);
        setIsSubmitting(false);
    }
};

if (authLoading || (isLoading && !error) || !isAdmin) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
    );
}

const backUrl = questionData?.skill_id 
    ? `/admin/skills/${questionData.skill_id}/exam`
    : questionData?.module_id 
        ? `/admin/modules/${questionData.module_id}/content`
        : "/admin";

return (
    <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
            <Link
                to={backUrl}
                className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Retour
            </Link>

            <h1 className="text-3xl font-black mb-8">Modifier la Question</h1>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-8 font-bold">
                    {error}
                </div>
            )}

            {!isLoading && questionData && (
                <QuestionForm
                    initialData={questionData}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    buttonText="Mettre à jour la question"
                    context={questionData.skill_id ? 'skill' : 'module'}
                />
            )}
        </div>
    </div>
);
}
