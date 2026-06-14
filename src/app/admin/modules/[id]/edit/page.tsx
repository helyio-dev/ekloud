import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Edit3, Sparkles, Settings } from 'lucide-react';
import ModuleForm from '../../../components/ModuleForm';

/**
 * page de reconfiguration des modules pédagogiques existants.
 * permet l'ajustement des métadonnées et de la hiérarchie des prérequis.
 */
export default function EditModulePage() {
    const { isAdmin, isContributor, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [moduleData, setModuleData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * guard de sécurité pour l'intégrité des accès administratifs.
     */
    useEffect(() => {
        if (!authLoading && !isAdmin && !isContributor) {
            navigate('/dashboard');
        }
    }, [isAdmin, isContributor, authLoading, navigate]);

    /**
     * synchronisation des données du module depuis le stockage cloud.
     */
    const fetchModule = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('modules')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            setModuleData(data);
        } catch (err: any) {
            console.error('EditModulePage: échec synchronisation module:', err);
            setError('impossible de synchroniser les données du module.');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (isAdmin || isContributor) {
            fetchModule();
        }
    }, [isAdmin, isContributor, fetchModule]);

    /**
     * commit des modifications dans la base de données après validation.
     */
    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('modules')
                .update(data)
                .eq('id', id);

            if (updateError) throw updateError;
            navigate('/admin');
        } catch (err: any) {
            setError(err.message || 'échec de la mise à jour système.');
            setIsSubmitting(false);
        }
    };

    if (authLoading || (isLoading && !error) || (!isAdmin && !isContributor)) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 animate-spin text-accent opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted/40 italic">chargement profil module...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text font-sans selection:bg-accent/30 p-8 md:p-14 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 opacity-[0.02] pointer-events-none rotate-12">
                <Settings size={600} />
            </div>

            <div className="max-w-4xl mx-auto space-y-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <Link to="/admin" className="inline-flex items-center gap-4 text-[10px] font-black text-text-muted hover:text-accent uppercase tracking-[0.3em] transition-all group">
                    <div className="p-2.5 bg-surface border border-border/40 rounded-xl group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                    retour console centrale
                </Link>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Edit3 className="w-4 h-4 text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60">mode édition actif</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-equinox leading-tight">reconfigurer module</h1>
                </div>

                {error && (
                    <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] text-rose-500 text-xs font-bold uppercase tracking-widest italic animate-in shake-in">
                        {error}
                    </div>
                )}

                {!isLoading && moduleData && (
                    <div className="bg-surface/20 backdrop-blur-3xl border border-border/40 p-1 rounded-[3rem] shadow-2xl">
                        <ModuleForm
                            initialData={moduleData}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            buttonText="mettre à jour les paramètres"
                            currentModuleId={id}
                        />
                    </div>
                )}

                <footer className="flex justify-center pt-8 border-t border-border/20">
                    <div className="flex items-center gap-2 opacity-20">
                        <Sparkles size={12} />
                        <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">curriculum update unit</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
