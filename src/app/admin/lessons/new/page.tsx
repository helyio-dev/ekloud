import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, BookOpen, Sparkles, Zap, Layout } from 'lucide-react';
import LessonForm from '../../components/LessonForm';

/**
 * orchestrateur de création de ressources pédagogiques.
 * gère la sérialisation des leçons et l'attribution parentale par module.
 */
export default function CreateLessonPage() {
    const { isAdmin, isContributor, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // extraction de l'affinité du module via le contexte url
    const queryParams = new URLSearchParams(location.search);
    const initialModuleId = queryParams.get('moduleId') || '';

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * guard d'intégrité de session admin.
     */
    useEffect(() => {
        if (!isLoading && !isAdmin && !isContributor) {
            navigate('/dashboard');
        }
    }, [isAdmin, isContributor, isLoading, navigate]);

    /**
     * injection synchronisée des données dans le canal de stockage ekloud.
     */
    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('lessons')
                .insert([data]);

            if (insertError) throw insertError;
            
            // routage intelligent vers le contexte de gestion du module
            navigate(data.module_id ? `/admin/modules/${data.module_id}/content` : '/admin');
        } catch (err: any) {
            setError(err.message || 'échec critique lors de l\'injection de la ressource.');
            setIsSubmitting(false);
        }
    };

    if (isLoading || (!isAdmin && !isContributor)) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 animate-spin text-accent opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted/40 italic">instanciation studio leçon...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text font-sans selection:bg-accent/30 p-8 md:p-14 overflow-hidden relative">
            {/* décorum nebula */}
            <div className="absolute top-0 right-0 p-32 opacity-[0.02] pointer-events-none rotate-12">
                <Layout size={600} />
            </div>

            <div className="max-w-5xl mx-auto space-y-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <Link to="/admin" className="inline-flex items-center gap-4 text-[10px] font-black text-text-muted hover:text-accent uppercase tracking-[0.3em] transition-all group">
                    <div className="p-2.5 bg-surface border border-border/40 rounded-xl group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                    retour console centrale
                </Link>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60">curriculum engineering toolkit</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight">nouvelle leçon</h1>
                        <div className="flex items-center gap-3 opacity-20">
                            <Zap size={14} />
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">draft mode protocol</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] text-rose-500 text-xs font-bold uppercase tracking-widest italic animate-in shake-in duration-500">
                        {error}
                    </div>
                )}

                <div className="bg-surface/20 backdrop-blur-3xl border border-border/40 p-1 rounded-[3rem] shadow-2xl">
                    <div className="p-8 md:p-12">
                        <LessonForm
                            initialData={{
                                module_id: initialModuleId,
                                title: '',
                                content: '',
                                order_index: 1
                            }}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            buttonText="créer la leçon"
                        />
                    </div>
                </div>
                
                <footer className="flex justify-center pt-8 border-t border-border/20">
                    <Sparkles className="w-4 h-4 text-text-muted/10" />
                </footer>
            </div>
        </div>
    );
}
