import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Plus, Sparkles, Layout } from 'lucide-react';
import ModuleForm from '@/app/admin/components/ModuleForm';

/**
 * page d'instanciation de nouveaux modules pédagogiques.
 * orchestre la validation métier et le routage post-création.
 */
export default function CreateModulePage() {
    const { isAdmin, isContributor, isLoading } = useAuth();
    const navigate = useNavigate();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * guard de sécurité pour l'accès aux privilèges d'édition.
     */
    useEffect(() => {
        if (!isLoading && !isAdmin && !isContributor) {
            navigate('/dashboard');
        }
    }, [isAdmin, isContributor, isLoading, navigate]);

    /**
     * persist les données du nouveau module dans le schéma relationnel.
     */
    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('modules')
                .insert([data]);

            if (insertError) throw insertError;
            navigate('/admin');
        } catch (err: any) {
            setError(err.message || 'échec critique lors de l\'injection du module.');
            setIsSubmitting(false);
        }
    };

    if (isLoading || (!isAdmin && !isContributor)) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 animate-spin text-accent opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted/40 italic">initialisation session admin...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text font-sans selection:bg-accent/30 p-8 md:p-14 overflow-hidden relative">
            {/* décorum nebula */}
            <div className="absolute top-0 right-0 p-32 opacity-[0.02] pointer-events-none rotate-12">
                <Layout size={600} />
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
                        <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60">système de déploiement</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-equinox leading-tight">nouveau module</h1>
                </div>

                {error && (
                    <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] text-rose-500 text-xs font-bold uppercase tracking-widest italic animate-in shake-in duration-500">
                        <div className="flex items-center gap-4">
                            <Plus className="w-5 h-5 rotate-45" /> {error}
                        </div>
                    </div>
                )}

                <div className="bg-surface/20 backdrop-blur-3xl border border-border/40 p-1 rounded-[3rem] shadow-2xl">
                    <ModuleForm
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        buttonText="déployer le module"
                    />
                </div>
                
                <footer className="flex justify-center pt-8 border-t border-border/20">
                    <p className="text-[9px] font-black text-text-muted/20 uppercase tracking-[0.5em] italic">ekloud curriculum engine v2.0</p>
                </footer>
            </div>
        </div>
    );
}
