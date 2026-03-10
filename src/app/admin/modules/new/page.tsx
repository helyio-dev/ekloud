import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft } from 'lucide-react';
import ModuleForm from '@/app/admin/components/ModuleForm';

export default function CreateModulePage() {
    const { isAdmin, isLoading } = useAuth();
    const navigate = useNavigate();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            navigate('/dashboard');
        }
    }, [isAdmin, isLoading, navigate]);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError(null);

        const { error: insertError } = await supabase
            .from('modules')
            .insert([data]);

        if (insertError) {
            setError(insertError.message);
            setIsSubmitting(false);
        } else {
            navigate('/admin');
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
            <div className="max-w-3xl mx-auto">
                <Link to="/admin" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Retour au Dashboard
                </Link>

                <h1 className="text-3xl font-black mb-8">Créer un Nouveau Module</h1>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-8">
                        {error}
                    </div>
                )}

                <ModuleForm
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    buttonText="Enregistrer le module"
                />
            </div>
        </div>
    );
}
