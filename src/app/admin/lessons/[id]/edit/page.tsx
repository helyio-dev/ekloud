import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Edit3, Sparkles, Settings } from 'lucide-react';
import LessonForm from '../../../components/LessonForm';

/**
 * page de révision du contenu pédagogique unitaire.
 * permet la mutation des ressources textuelles et des métadonnées séquence.
 */
export default function EditLessonPage() {
    const { isAdmin, isContributor, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id: lessonId } = useParams<{ id: string }>();

    const [lessonData, setLessonData] = useState<any>(null);
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
     * synchronisation des données de la leçon via le canal supabase.
     */
    const fetchLesson = useCallback(async () => {
        if (!lessonId) return;
        setIsLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('lessons')
                .select('*')
                .eq('id', lessonId)
                .single();

            if (fetchError) throw fetchError;
            setLessonData(data);
        } catch (err: any) {
            console.error('EditLessonPage: échec synchronisation leçon:', err);
            setError('impossible de synchroniser les données de la leçon.');
        } finally {
            setIsLoading(false);
        }
    }, [lessonId]);

    useEffect(() => {
        if (isAdmin || isContributor) fetchLesson();
    }, [isAdmin, isContributor, fetchLesson]);

    /**
     * commit des modifications dans le stockage persistant.
     */
    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('lessons')
                .update(data)
                .eq('id', lessonId);

            if (updateError) throw updateError;
            
            // redirection contextuelle vers le module parent
            navigate(`/admin/modules/${lessonData.module_id}/content`);
        } catch (err: any) {
            setError(err.message || 'échec de la mise à jour système.');
            setIsSubmitting(false);
        }
    };

    if (authLoading || (isLoading && !error) || (!isAdmin && !isContributor)) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 animate-spin text-accent opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted/40 italic">chargement données leçon...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text font-sans selection:bg-accent/30 p-8 md:p-14 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 opacity-[0.02] pointer-events-none rotate-12">
                <Settings size={600} />
            </div>

            <div className="max-w-5xl mx-auto space-y-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <Link
                    to={lessonData ? `/admin/modules/${lessonData.module_id}/content` : "/admin"}
                    className="inline-flex items-center gap-4 text-[10px] font-black text-text-muted hover:text-accent uppercase tracking-[0.3em] transition-all group"
                >
                    <div className="p-2.5 bg-surface border border-border/40 rounded-xl group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                    retour au curriculum
                </Link>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Edit3 className="w-4 h-4 text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60">système de modification</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-equinox leading-tight">réviser leçon</h1>
                </div>

                {error && (
                    <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] text-rose-500 text-xs font-bold uppercase tracking-widest italic animate-in shake-in">
                        {error}
                    </div>
                )}

                {!isLoading && lessonData && (
                    <div className="bg-surface/20 backdrop-blur-3xl border border-border/40 p-1 rounded-[3rem] shadow-2xl">
                        <div className="p-8 md:p-12">
                            <LessonForm
                                initialData={lessonData}
                                onSubmit={handleSubmit}
                                isSubmitting={isSubmitting}
                                buttonText="mettre à jour la leçon"
                            />
                        </div>
                    </div>
                )}

                <footer className="flex justify-center pt-8 border-t border-border/20">
                    <div className="flex items-center gap-2 opacity-20">
                        <Sparkles size={12} />
                        <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">lesson update system v2.0</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
