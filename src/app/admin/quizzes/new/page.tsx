import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft } from 'lucide-react';
import QuestionForm from '../../components/QuestionForm';

export default function CreateQuizPage() {
    const { isAdmin, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const initialModuleId = queryParams.get('moduleId') || '';
    const initialSkillId = queryParams.get('skillId') || '';

    const isSkillContext = !!initialSkillId;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !isAdmin) navigate('/dashboard');
    }, [isAdmin, isLoading, navigate]);

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
                    difficulty: data.difficulty,
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

    if (isLoading || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <Link
                    to={isSkillContext ? `/admin/skills/${initialSkillId}/exam` : initialModuleId ? `/admin/modules/${initialModuleId}/content` : '/admin'}
                    className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Retour
                </Link>

                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-4xl font-black text-white tracking-tight">Nouvelle Question</h1>
                    <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase border ${isSkillContext ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-accent/10 border-accent/20 text-accent'}`}>
                        {isSkillContext ? 'Question d\'Examen' : 'Création Quiz'}
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-8 font-bold">
                        {error}
                    </div>
                )}

                <QuestionForm
                    initialData={{
                        module_id: initialModuleId || null,
                        skill_id: initialSkillId || null,
                        question_text: '',
                        difficulty: 'easy',
                        type: 'multiple_choice',
                        answers: [
                            { text: '', isCorrect: true },
                            { text: '', isCorrect: false }
                        ]
                    }}
                    context={isSkillContext ? 'skill' : 'module'}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    buttonText="Créer la question"
                />
            </div>
        </div>
    );
}
