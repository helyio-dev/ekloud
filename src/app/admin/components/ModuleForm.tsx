import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, Layers, Target, Info, Shield, Layout, Globe, Box, Settings2, ChevronRight } from 'lucide-react';

/**
 * structure de transport pour la configuration d'un module ekloud.
 */
interface ModuleFormData {
    title: string;
    description: string;
    category: string;
    order_index: number;
    prerequisite_id?: string | null;
    difficulty: 'Découverte' | 'Fondamentaux' | 'Avancé' | 'Expert';
}

interface ModuleFormProps {
    initialData?: ModuleFormData;
    onSubmit: (data: ModuleFormData) => Promise<void>;
    isSubmitting: boolean;
    buttonText: string;
    currentModuleId?: string;
}

/**
 * formulaire de pilotage des modules du curriculum.
 * implémente une interface immersive alignée sur l'esthétique nebula 2.0.
 */
export default function ModuleForm({ initialData, onSubmit, isSubmitting, buttonText, currentModuleId }: ModuleFormProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [category, setCategory] = useState(initialData?.category || 'Systèmes & réseaux');
    const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'Découverte');
    const [orderIndex, setOrderIndex] = useState(initialData?.order_index || 1);
    const [prerequisiteId, setPrerequisiteId] = useState<string>(initialData?.prerequisite_id || '');
    const [existingModules, setExistingModules] = useState<any[]>([]);

    /**
     * récupération de la hiérarchie existante pour la définition des prérequis.
     */
    const fetchModules = useCallback(async () => {
        const { data } = await supabase.from('modules').select('id, title').order('order_index');
        if (data) setExistingModules(data);
    }, []);

    useEffect(() => {
        fetchModules();
    }, [fetchModules]);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description);
            setCategory(initialData.category);
            setDifficulty(initialData.difficulty || 'Découverte');
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
            prerequisite_id: prerequisiteId || null,
            difficulty
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-10 bg-surface/40 backdrop-blur-3xl border border-border/80 p-10 md:p-14 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <Layout size={400} />
            </div>

            <div className="space-y-8 relative z-10">
                <div className="space-y-4">
                    <label className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] text-text-muted/60 uppercase ml-1">
                        <Layers className="w-3.5 h-3.5 text-accent" /> identification du module
                    </label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-8 py-6 bg-background/40 border border-border/60 rounded-[2rem] outline-none focus:border-accent/40 focus:bg-background transition-all font-black text-text text-xl uppercase tracking-tight placeholder:opacity-20"
                        placeholder="EX: ARCHITECTURE DISTRIBUÉE"
                    />
                </div>

                <div className="space-y-4">
                    <label className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] text-text-muted/60 uppercase ml-1">
                        <Info className="w-3.5 h-3.5 text-accent" /> résumé pédagogique
                    </label>
                    <textarea
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-8 py-6 bg-background/40 border border-border/60 rounded-[2rem] outline-none focus:border-accent/40 focus:bg-background transition-all min-h-[160px] text-text font-medium leading-relaxed italic placeholder:opacity-20"
                        placeholder="décrivez succinctement les compétences visées par ce module..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] text-text-muted/60 uppercase ml-1">
                            <Globe className="w-3.5 h-3.5 text-accent" /> secteur technologique
                        </label>
                        <div className="relative group/select">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-8 py-5 bg-background/40 border border-border/60 rounded-[1.8rem] outline-none focus:border-accent/40 transition-all appearance-none text-text font-black uppercase tracking-widest text-[11px]"
                            >
                                <option value="Systèmes & réseaux">Systèmes & réseaux</option>
                                <option value="Cybersécurité">Cybersécurité</option>
                                <option value="Design">Design</option>
                                <option value="Data">Data</option>
                                <option value="IA">IA</option>
                                <option value="Web3">Web3</option>
                                <option value="Cloud & DevOps">Cloud & DevOps</option>
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/select:translate-x-1 transition-transform">
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] text-text-muted/60 uppercase ml-1">
                            <Target className="w-3.5 h-3.5 text-accent" /> indice d'accréditation
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                                {(['Découverte', 'Fondamentaux', 'Avancé', 'Expert'] as const).map(lvl => (
                                    <button
                                        key={lvl}
                                        type="button"
                                        onClick={() => setDifficulty(lvl)}
                                        className={`px-4 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${difficulty === lvl ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20 scale-[1.02]' : 'bg-background/20 border-border/40 text-text-muted/60 hover:border-border'}`}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-6 bg-background/30 p-8 rounded-[2.5rem] border border-border/40">
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] text-text-muted/60 uppercase ml-1">
                                <Shield className="w-3.5 h-3.5 text-accent" /> chaîne de dépendances (amont)
                            </label>
                            <div className="relative group/select">
                                <select
                                    value={prerequisiteId}
                                    onChange={(e) => setPrerequisiteId(e.target.value)}
                                    className="w-full px-8 py-5 bg-background/60 border border-border/60 rounded-[1.8rem] outline-none focus:border-accent/40 transition-all appearance-none text-text font-black uppercase tracking-widest text-[11px]"
                                >
                                    <option value="">accès immédiat (aucun prérequis)</option>
                                    {existingModules
                                        .filter(mod => mod.id !== currentModuleId)
                                        .map(mod => (
                                            <option key={mod.id} value={mod.id}>{mod.title}</option>
                                        ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                    <Box size={14} />
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-text-muted/40 font-bold uppercase tracking-wider flex items-center gap-2 italic ml-1">
                            <Settings2 size={12} /> le verrouillage logique sera appliqué jusqu'à validation du module parent.
                        </p>
                    </div>
                </div>
            </div>

            <div className="pt-10 border-t border-border/40 flex justify-end relative z-10">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative flex items-center gap-4 px-12 py-5 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all disabled:opacity-50 shadow-2xl shadow-accent/20 active:scale-95"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] group-hover:animate-[shimmer_2s_infinite]"></div>
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    {buttonText.toUpperCase()}
                </button>
            </div>

        </form>
    );
}
