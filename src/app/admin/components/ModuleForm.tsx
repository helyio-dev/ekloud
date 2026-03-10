import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save } from 'lucide-react';

interface ModuleFormData {
    title: string;
    description: string;
    category: string;
    order_index: number;
    prerequisite_id?: string | null;
}

interface ModuleFormProps {
    initialData?: ModuleFormData;
    onSubmit: (data: ModuleFormData) => Promise<void>;
    isSubmitting: boolean;
    buttonText: string;
    currentModuleId?: string;
}

export default function ModuleForm({ initialData, onSubmit, isSubmitting, buttonText, currentModuleId }: ModuleFormProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [category, setCategory] = useState(initialData?.category || 'programming');
    const [orderIndex, setOrderIndex] = useState(initialData?.order_index || 1);
    const [prerequisiteId, setPrerequisiteId] = useState<string>(initialData?.prerequisite_id || '');
    const [existingModules, setExistingModules] = useState<any[]>([]);

    useEffect(() => {
        const fetchModules = async () => {
            const { data } = await supabase.from('modules').select('id, title').order('order_index');
            if (data) setExistingModules(data);
        };
        fetchModules();
    }, []);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description);
            setCategory(initialData.category);
            setOrderIndex(initialData.order_index);
            setPrerequisiteId(initialData.prerequisite_id || '');
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            title,
            description,
            category,
            order_index: orderIndex,
            prerequisite_id: prerequisiteId || null
        });
    };

    return (
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
                <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2 text-text-muted">Prérequis (Optionnel)</label>
                    <select
                        value={prerequisiteId}
                        onChange={(e) => setPrerequisiteId(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none"
                    >
                        <option value="">Aucun (Accessible immédiatement)</option>
                        {existingModules
                            .filter(mod => mod.id !== currentModuleId)
                            .map(mod => (
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
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> {buttonText}</>}
                </button>
            </div>
        </form>
    );
}
