import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

export default function CreateModulePage() {
    const { isAdmin, isLoading } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('programming');
    const [orderIndex, setOrderIndex] = useState(1);
    const [prerequisiteId, setPrerequisiteId] = useState<string>('');
    const [existingModules, setExistingModules] = useState<any[]>([]);
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
                if (data) setExistingModules(data);
            };
            fetchModules();
        }
    }, [isAdmin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const payload = {
            title,
            description,
            category,
            order_index: orderIndex,
            ...(prerequisiteId ? { prerequisite_id: prerequisiteId } : {})
        };

        const { error: insertError } = await supabase
            .from('modules')
            .insert([payload]);

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

                <form onSubmit={handleSubmit} className="space-y-6 bg-surface border border-white/5 p-8 rounded-3xl">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-text-muted">Titre du Module</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-bold"
                            placeholder="Ex: Introduction à React"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-text-muted">Description court</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all min-h-[100px]"
                            placeholder="Ce que les étudiants vont apprendre..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-muted">Catégorie</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none"
                            >
                                <option value="programming">Programmation</option>
                                <option value="design">Design UI/UX</option>
                                <option value="systems">Systèmes & Réseaux</option>
                                <option value="security">Cybersécurité</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-muted">Ordre d'affichage (Index)</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={orderIndex}
                                onChange={(e) => setOrderIndex(parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-muted">Prérequis (Optionnel)</label>
                            <select
                                value={prerequisiteId}
                                onChange={(e) => setPrerequisiteId(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none"
                            >
                                <option value="">Aucun (Accessible immédiatement)</option>
                                {existingModules.map(mod => (
                                    <option key={mod.id} value={mod.id}>{mod.title}</option>
                                ))}
                            </select>
                            <p className="text-xs text-text-muted mt-2">L'étudiant devra terminer ce module avant d'accéder au nouveau.</p>
                        </div>

                    </div>

                    <div className="pt-6 border-t border-white/5 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Enregistrer le module</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
