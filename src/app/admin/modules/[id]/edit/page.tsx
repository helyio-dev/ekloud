import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft } from 'lucide-react';
import ModuleForm from '../../../components/ModuleForm';

export default function EditModulePage() {
    const { isAdmin, isContributor, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [moduleData, setModuleData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAdmin && !isContributor) {
            navigate('/dashboard');
        }
    }, [isAdmin, isContributor, authLoading, navigate]);

    useEffect(() => {
        const fetchModule = async () => {
            if (!id) return;
            setIsLoading(true);
            const { data, error } = await supabase
                .from('modules')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching module:', error);
                setError('Impossible de charger le module.');
            } else {
                setModuleData(data);
            }
            setIsLoading(false);
        };

        if (isAdmin || isContributor) {
            fetchModule();
        }
    }, [id, isAdmin, isContributor]);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError(null);

        const { error: updateError } = await supabase
            .from('modules')
            .update(data)
            .eq('id', id);

        if (updateError) {
            setError(updateError.message);
            setIsSubmitting(false);
        } else {
            navigate('/admin');
        }
    };

    if (authLoading || (isLoading && !error) || (!isAdmin && !isContributor)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-3xl mx-auto">
                <Link to="/admin" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Retour à l'Administration
                </Link>

                <h1 className="text-3xl font-black mb-8">Modifier le Module</h1>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-8">
                        {error}
                    </div>
                )}

                {!isLoading && moduleData && (
                    <ModuleForm
                        initialData={moduleData}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        buttonText="Mettre à jour le module"
                        currentModuleId={id}
                    />
                )}
            </div>
        </div>
    );
}
