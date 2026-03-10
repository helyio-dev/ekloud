import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save } from 'lucide-react';

interface LessonFormData {
    module_id: string;
    title: string;
    content: string;
    order_index: number;
    difficulty: string;
}

interface LessonFormProps {
    initialData?: LessonFormData;
    onSubmit: (data: LessonFormData) => Promise<void>;
    isSubmitting: boolean;
    buttonText: string;
}

export default function LessonForm({ initialData, onSubmit, isSubmitting, buttonText }: LessonFormProps) {
    const [modules, setModules] = useState<any[]>([]);
    const [moduleId, setModuleId] = useState(initialData?.module_id || '');
    const [title, setTitle] = useState(initialData?.title || '');
    const [content, setContent] = useState(initialData?.content || '');
    const [orderIndex, setOrderIndex] = useState(initialData?.order_index || 1);
    const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'easy');

    useEffect(() => {
        const fetchModules = async () => {
            const { data } = await supabase.from('modules').select('id, title').order('order_index');
            if (data) {
                setModules(data);
                if (!moduleId && data.length > 0) setModuleId(data[0].id);
            }
        };
        fetchModules();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            module_id: moduleId,
            title,
            content,
            order_index: orderIndex,
            difficulty
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-surface border border-white/5 p-8 rounded-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-2 text-text-muted">Module Parent</label>
                    <select
                        required
                        value={moduleId}
                        onChange={(e) => setModuleId(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none text-white"
                    >
                        <option value="" disabled>Sélectionnez un module</option>
                        {modules.map(mod => (
                            <option key={mod.id} value={mod.id}>{mod.title}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-text-muted">Difficulté</label>
                    <select
                        required
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none text-white"
                    >
                        <option value="easy">Facile (10 XP)</option>
                        <option value="medium">Moyen (25 XP)</option>
                        <option value="hard">Difficile (50 XP)</option>
                        <option value="very_hard">Très Difficile (100 XP)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-text-muted">Titre de la leçon</label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-bold text-white"
                        placeholder="Ex: Les fondamentaux des variables"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-text-muted">Ordre d'affichage (Index)</label>
                    <input
                        type="number"
                        min="1"
                        required
                        value={orderIndex}
                        onChange={(e) => setOrderIndex(parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-white"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2 text-text-muted">Contenu de la leçon (Markdown/Texte)</label>
                <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all min-h-[400px] font-mono text-sm leading-relaxed text-white"
                    placeholder="Rédigez le contenu de votre cours ici..."
                />
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> {buttonText}</>}
                </button>
            </div>
        </form>
    );
}
