import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft } from 'lucide-react';
import LessonForm from '../../../components/LessonForm';

export default function EditLessonPage() {
    const { isAdmin, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id: lessonId } = useParams<{ id: string }>();

    const [lessonData, setLessonData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAdmin) navigate('/dashboard');
    }, [isAdmin, authLoading, navigate]);

    useEffect(() => {
        const fetchLesson = async () => {
            if (!lessonId) return;
            setIsLoading(true);
            const { data, error } = await supabase
                .from('lessons')
                .select('*')
                .eq('id', lessonId)
                .single();

            if (error) {
                console.error('Error fetching lesson:', error);
                setError('Impossible de charger la leçon.');
            } else {
                setLessonData(data);
            }
            setIsLoading(false);
        };

        if (isAdmin) fetchLesson();
    }, [lessonId, isAdmin]);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError(null);

        const { error: updateError } = await supabase
            .from('lessons')
            .update(data)
            .eq('id', lessonId);

        if (updateError) {
            setError(updateError.message);
            setIsSubmitting(false);
        } else {
            navigate(`/admin/modules/${lessonData.module_id}/content`);
        }
    };

    if (authLoading || (isLoading && !error) || !isAdmin) {
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
                    to={lessonData ? `/admin/modules/${lessonData.module_id}/content` : "/admin"}
                    className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Retour à la gestion du module
                </Link>

                <h1 className="text-3xl font-black mb-8">Modifier la Leçon</h1>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-8">
                        {error}
                    </div>
                )}

                {!isLoading && lessonData && (
                    <LessonForm
                        initialData={lessonData}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        buttonText="Mettre à jour la leçon"
                    />
                )}
            </div>
        </div>
    );
}
