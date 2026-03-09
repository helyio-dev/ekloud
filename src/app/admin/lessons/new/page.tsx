import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

export default function CreateLessonPage() {
    const { isAdmin, isLoading } = useAuth();
    const navigate = useNavigate();

    const [modules, setModules] = useState<any[]>([]);
    const [selectedModule, setSelectedModule] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [orderIndex, setOrderIndex] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            navigate('/dashboard');
        }
    }, [isAdmin, isLoading, navigate]);

    useEffect(() => {
        if (isAdmin) {
            const fetchModules = async () => {
                const { data } = await supabase.from('modules').select('id, title').order('order_index');
                if (data) {
                    setModules(data);
                    if (data.length > 0) setSelectedModule(data[0].id);
                }
            };
            fetchModules();
        }
    }, [isAdmin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedModule) {
            setError("Veuillez sélectionner un module.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const { error: insertError } = await supabase
            .from('lessons')
            .insert([
                { module_id: selectedModule, title, content, order_index: orderIndex }
            ]);

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

                <form onSubmit={handleSubmit} className="space-y-6 bg-surface border border-white/5 p-8 rounded-3xl">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-muted">Module Parent</label>
                            <select
                                required
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none"
                            >
                                <option value="" disabled>Sélectionnez un module</option>
                                {modules.map(mod => (
                                    <option key={mod.id} value={mod.id}>{mod.title}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-muted">Ordre d'affichage (Index dans le module)</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={orderIndex}
                                onChange={(e) => setOrderIndex(parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-text-muted">Titre de la leçon</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-bold"
                            placeholder="Ex: Les fondamentaux des variables"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-text-muted">Contenu de la leçon (Markdown/Texte)</label>
                        <textarea
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all min-h-[400px] font-mono text-sm leading-relaxed"
                            placeholder="Rédigez le contenu de votre cours ici..."
                        />
                    </div>

                    <div className="pt-6 border-t border-white/5 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Enregistrer la leçon</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
