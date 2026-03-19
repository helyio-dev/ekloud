import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft } from 'lucide-react';
import LessonForm from '../../components/LessonForm';

export default function CreateLessonPage() {
    const { isAdmin, isContributor, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const initialModuleId = queryParams.get('moduleId') || '';

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !isAdmin && !isContributor) {
            navigate('/dashboard');
        }
    }, [isAdmin, isContributor, isLoading, navigate]);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError(null);

        const { error: insertError } = await supabase
            .from('lessons')
            .insert([data]);

        if (insertError) {
            setError(insertError.message);
            setIsSubmitting(false);
        } else {
            navigate(data.module_id ? `/admin/modules/${data.module_id}/content` : '/admin');
        }
    };

    if (isLoading || (!isAdmin && !isContributor)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <Link to="/admin" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Retour au Dashboard
                </Link>

                <h1 className="text-3xl font-black mb-8">Créer une Nouvelle Leçon</h1>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-8">
                        {error}
                    </div>
                )}

                <LessonForm
                    initialData={{
                        module_id: initialModuleId,
                        title: '',
                        content: '',
                        order_index: 1,
                        difficulty: 'easy'
                    }}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    buttonText="Enregistrer la leçon"
                />
            </div>
        </div>
    );
}
