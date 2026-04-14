import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import * as LucideIcons from 'lucide-react';
import { 
    Plus, Trash2, Edit2, Link, Book, Save, X, Loader2, LayoutList, Eye, 
    ArrowUp, ArrowDown, Sparkles, ChevronRight, Trophy, Lock, HelpCircle,
    Zap, Rocket, Target, Settings2, Database
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * composant utilitaire de rendu d'icônes.
 * supporte lucide-react (mapping dynamique), simple-icons (marques technologiques) et images raw.
 */
const SkillIcon = ({ name, size = 20, className, isFinal }: { name: string, size?: number, className?: string, isFinal: boolean }) => {
    const { mode } = useTheme();
    
    // redirection vers ressource externe si url détectée
    if (name && (name.startsWith('http') || name.startsWith('https'))) {
        return <img src={name} alt="" style={{ width: size, height: size }} className={className} />;
    }

    // normalisation du nom pour lucide (kebab-case vers PascalCase)
    const iconName = name
        ? name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('')
        : '';
        
    const Icon = (LucideIcons as any)[iconName];
    if (Icon) return <Icon size={size} className={className} />;

    // fallback : bibliothèque simple-icons pour les logos dev
    const iconColor = mode === 'light' ? '0f172a' : 'ffffff';
    return (
        <img 
            src={`https://cdn.simpleicons.org/${name}/${iconColor}`} 
            alt="tech-icon" 
            style={{ width: size, height: size }} 
            className={`${className} opacity-80 group-hover:opacity-100 transition-opacity`} 
        />
    );
};

/**
 * définition structurelle d'une compétence helix.
 */
type Skill = {
    id: string;
    name: string;
    description: string;
    icon: string;
    x_pos: number;
    y_pos: number;
    is_final: boolean;
    requires_exam: boolean;
    exam_module_id?: string;
    is_locked: boolean;
    level: 'Découverte' | 'Fondamentaux' | 'Avancé' | 'Expert';
};

type Module = {
    id: string;
    title: string;
};

type SkillPrereq = {
    skill_id: string;
    prerequisite_skill_id: string;
};

/**
 * interface de pilotage de l'arbre de compétences.
 * permet l'orchestration des nœuds, la définition des prérequis et le mapping pédagogique.
 */
export default function SkillManagementTab() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [prereqs, setPrereqs] = useState<SkillPrereq[]>([]);
    const [skillModules, setSkillModules] = useState<{ skill_id: string, module_id: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'visual'>('list');

    // contrôle du formulaire de modification/création
    const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [selectedPrereqs, setSelectedPrereqs] = useState<string[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);

    /**
     * synchronisation complète des données de l'arbre.
     */
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [
                { data: skillData },
                { data: moduleData },
                { data: prereqData },
                { data: smData }
            ] = await Promise.all([
                supabase.from('skills').select('*').order('y_pos', { ascending: true }),
                supabase.from('modules').select('id, title').order('order_index', { ascending: true }),
                supabase.from('skill_prerequisites').select('*'),
                supabase.from('skill_modules').select('*')
            ]);

            setSkills(skillData || []);
            setModules(moduleData || []);
            setPrereqs(prereqData || []);
            setSkillModules(smData || []);
        } catch (err) {
            console.error('erreur lors de la récupération des données helix:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /**
     * prépare l'édition d'une compétence existante et charge ses relations.
     */
    const handleEdit = async (skill: Skill) => {
        setEditingSkill(skill);
        setIsFormOpen(true);

        try {
            const [
                { data: skillMods },
                { data: skillPrereqs }
            ] = await Promise.all([
                supabase.from('skill_modules').select('module_id').eq('skill_id', skill.id),
                supabase.from('skill_prerequisites').select('prerequisite_skill_id').eq('skill_id', skill.id)
            ]);

            setSelectedModules(skillMods?.map(m => m.module_id) || []);
            setSelectedPrereqs(skillPrereqs?.map(p => p.prerequisite_skill_id) || []);
        } catch (err) {
            console.error('erreur chargement relations compétence:', err);
        }
    };

    /**
     * réordonne les nœuds dans la hiérarchie visuelle.
     */
    const handleMove = async (skillId: string, direction: 'up' | 'down') => {
        const index = skills.findIndex(s => s.id === skillId);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === skills.length - 1) return;

        const newSkills = [...skills];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newSkills[index], newSkills[targetIndex]] = [newSkills[targetIndex], newSkills[index]];

        setSkills(newSkills);

        try {
            const updates = newSkills.map((s, i) => ({
                id: s.id,
                y_pos: i
            }));

            // exécution séquentielle pour garantir l'intégrité de l'indexation
            for (const update of updates) {
                await supabase.from('skills').update({ y_pos: update.y_pos }).eq('id', update.id);
            }
        } catch (err) {
            console.error('erreur lors du réordonnancement des skills:', err);
        }
    };

    /**
     * valide et synchronise les modifications d'une compétence (atomic update).
     */
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSkill) return;
        setIsSaving(true);

        try {
            const isNew = !editingSkill.id;
            let currentId = editingSkill.id;
            
            if (isNew) {
                const { id, ...saveData } = editingSkill;
                const { data, error } = await supabase.from('skills').insert([{
                    ...saveData,
                    y_pos: skills.length
                }]).select();
                if (error) throw error;
                currentId = data[0].id;
            } else {
                await supabase.from('skills').update(editingSkill).eq('id', editingSkill.id);
            }

            // synchronisation destructive des relations (pattern sync-clean)
            await Promise.all([
                supabase.from('skill_modules').delete().eq('skill_id', currentId),
                supabase.from('skill_prerequisites').delete().eq('skill_id', currentId)
            ]);

            const insertions = [];
            if (selectedModules.length > 0) {
                insertions.push(supabase.from('skill_modules').insert(selectedModules.map(mid => ({
                    skill_id: currentId,
                    module_id: mid
                }))));
            }
            if (selectedPrereqs.length > 0) {
                insertions.push(supabase.from('skill_prerequisites').insert(selectedPrereqs.map(pid => ({
                    skill_id: currentId,
                    prerequisite_skill_id: pid
                }))));
            }

            await Promise.all(insertions);

            setIsFormOpen(false);
            fetchData();
        } catch (err) {
            console.error('erreur lors de la sauvegarde:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm('suppression définitive : voulez-vous vraiment effacer cette compétence de l\'arbre matrix ?');
        if (!confirmed) return;
        
        try {
            await supabase.from('skills').delete().eq('id', id);
            setSkills(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error('erreur lors de la suppression du skill:', err);
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-12 h-12 text-accent animate-spin opacity-20" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted/40 italic">chargement de l'arbre helix...</span>
        </div>
    );

    return (
        <div className="space-y-10">
            {/* barre de contrôle supérieure */}
            <div className="flex items-center justify-between border-b border-border/40 pb-6">
                <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-border/60">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-accent text-white' : 'text-text-muted hover:text-text'}`}
                    >
                        Liste
                    </button>
                    <button
                        onClick={() => setViewMode('visual')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'visual' ? 'bg-accent text-white' : 'text-text-muted hover:text-text'}`}
                    >
                        Grille
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-accent">
                        <Database size={14} />
                        <h1 className="text-sm font-black uppercase tracking-widest text-text">Compétences</h1>
                    </div>
                    <div className="h-4 w-px bg-border/40" />
                    <button
                        onClick={() => {
                            setEditingSkill({ name: '', description: '', icon: 'Book', x_pos: 0, y_pos: 0, is_final: false, requires_exam: false, is_locked: false, level: 'Découverte' } as any);
                            setSelectedModules([]);
                            setSelectedPrereqs([]);
                            setIsFormOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-accent/20"
                    >
                        <Plus className="w-4 h-4" /> Nouveau Sujet
                    </button>
                </div>
            </div>

            {/* affichage conditionnel : liste vs helix grid */}
            {viewMode === 'list' ? (
                <div className="grid grid-cols-1 gap-6 overflow-y-auto max-h-[70vh] pr-4 custom-scrollbar scroll-smooth">
                    {skills.map((skill, index) => (
                        <div 
                            key={skill.id} 
                            className="group bg-surface hover:bg-surface-hover/50 border border-border/60 hover:border-accent/60 p-8 rounded-[2.5rem] transition-all shadow-xl hover:shadow-2xl hover:shadow-accent/5 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="flex items-center gap-8">
                                    <div className={`w-20 h-20 rounded-[1.5rem] bg-background border border-border/80 flex items-center justify-center transition-all duration-500 shadow-inner group-hover:scale-105 group-hover:rotate-3 ${skill.is_final ? 'shadow-[0_0_30px_rgba(234,179,8,0.2)] border-yellow-500/60 ring-1 ring-yellow-500/20' : 'group-hover:border-accent/60'}`}>
                                        <SkillIcon name={skill.icon} isFinal={skill.is_final} size={32} className={skill.is_final ? 'text-yellow-500 animate-pulse' : 'text-accent'} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-black text-text uppercase tracking-tight group-hover:text-accent transition-colors">{skill.name || 'sujet non identifié'}</h3>
                                            <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[9px] font-black text-accent uppercase tracking-widest">{skill.level}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] text-text-muted/60 font-black uppercase tracking-[0.2em] italic">index hiérarchique: {index + 1}</span>
                                            {skill.requires_exam && <span className="flex items-center gap-1 text-[9px] text-yellow-500 font-black uppercase tracking-widest"><Target size={10} /> examen requis</span>}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 bg-background p-2 rounded-2xl border border-border/60 shadow-md">
                                    <button onClick={() => handleMove(skill.id, 'up')} className="p-3 hover:bg-surface-hover rounded-xl text-text-muted/40 hover:text-text transition-all active:scale-95" title="monter"><ArrowUp className="w-4 h-4" /></button>
                                    <button onClick={() => handleMove(skill.id, 'down')} className="p-3 hover:bg-surface-hover rounded-xl text-text-muted/40 hover:text-text transition-all active:scale-95" title="descendre"><ArrowDown className="w-4 h-4" /></button>
                                    <div className="w-px h-8 bg-border/60 mx-1 self-center" />
                                    <button onClick={() => handleEdit(skill)} className="p-3 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all active:scale-95" title="éditer"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(skill.id)} className="p-3 hover:bg-rose-500/10 rounded-xl text-text-muted hover:text-rose-500 transition-all active:scale-95" title="supprimer"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-8 border-t border-border/60 space-y-6">
                                <p className="text-sm text-text-muted max-w-3xl font-medium leading-relaxed italic">{skill.description || 'aucune donnée pédagogique enregistrée pour ce module.'}</p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm ${skill.is_final ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-surface-hover border-border/80 text-text-muted'}`}>
                                            {skill.is_final ? <Trophy size={10} /> : skill.is_locked ? <Lock size={10} /> : <Book size={10} />}
                                            {skill.is_final ? 'nœud de maîtrise' : skill.is_locked ? 'verrouillé' : 'module standard'}
                                        </div>
                                    </div>
                                    <button onClick={() => handleEdit(skill)} className="text-[10px] font-black uppercase text-accent hover:text-accent-light flex items-center gap-2 group/btn tracking-widest transition-colors">
                                        configurer les dépendances <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* vue helix grid : aperçu directionnel par chapitre */
                <ChapterPreview
                    skills={skills}
                    prereqs={prereqs}
                    skillModules={skillModules}
                    modules={modules}
                    onEdit={handleEdit}
                />
            )}

            {/* modal de configuration du nœud */}
            {isFormOpen && editingSkill && (
                <div className="fixed inset-0 bg-background/95 z-[100] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-500">
                    <div className="bg-surface border border-border/80 p-8 md:p-16 rounded-[4rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-12 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative custom-scrollbar">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                            <Settings2 size={300} />
                        </div>

                        <div className="flex justify-between items-start relative z-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-accent/20 border border-accent/20 rounded-full w-fit">
                                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                                    <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">{editingSkill.id ? 'édition nucléaire' : 'injection de donnée'}</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-text uppercase tracking-tighter font-equinox">{editingSkill.id ? 'config helix' : 'nouveau nœud'}</h2>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="p-4 bg-background border border-border/60 hover:bg-surface-hover rounded-full transition-all hover:rotate-90 group shadow-md">
                                <X className="w-10 h-10 text-text group-hover:text-accent transition-colors" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-16 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/60 ml-1">désignation technique</label>
                                    <input
                                        required
                                        type="text"
                                        value={editingSkill.name}
                                        onChange={e => setEditingSkill({ ...editingSkill, name: e.target.value })}
                                        className="w-full px-8 py-6 bg-background border border-border/60 rounded-[2rem] outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all text-text font-black uppercase tracking-tight text-xl shadow-sm"
                                        placeholder="EX: CLOUD ARCHITECTURE"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/60 ml-1">vecteur lucide / tech-icon</label>
                                    <input
                                        type="text"
                                        value={editingSkill.icon}
                                        onChange={e => setEditingSkill({ ...editingSkill, icon: e.target.value })}
                                        className="w-full px-8 py-6 bg-background border border-border/60 rounded-[2rem] outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all text-text font-bold italic shadow-sm"
                                        placeholder="Book, Database, React..."
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/60 ml-1">niveau d'accréditation</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(['Découverte', 'Fondamentaux', 'Avancé', 'Expert'] as const).map(lvl => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => setEditingSkill({ ...editingSkill, level: lvl })}
                                                className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${editingSkill.level === lvl ? 'bg-accent border-accent text-white shadow-xl shadow-accent/40' : 'bg-background border-border/60 text-text-muted hover:border-accent/40 hover:text-text shadow-sm'}`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/60 ml-1">manifest pédagogique</label>
                                <textarea
                                    value={editingSkill.description}
                                    onChange={e => setEditingSkill({ ...editingSkill, description: e.target.value })}
                                    className="w-full px-8 py-6 bg-background border border-border/60 rounded-[2rem] outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all text-text h-40 resize-none font-medium leading-relaxed italic shadow-sm"
                                    placeholder="décrivez l'objectif terminal de ce nœud de compétence..."
                                />
                            </div>

                            <div className="space-y-8">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/60 ml-1">attributs de progression</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <label className="flex items-center gap-6 cursor-pointer p-6 bg-background border border-border/60 rounded-[2rem] hover:border-accent/60 transition-all select-none group shadow-md">
                                        <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${editingSkill.is_final ? 'bg-yellow-500 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'border-border/60 group-hover:border-accent/40'}`}>
                                            {editingSkill.is_final && <Trophy size={16} className="text-black" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={editingSkill.is_final}
                                            onChange={e => setEditingSkill({ ...editingSkill, is_final: e.target.checked })}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-text uppercase tracking-widest">nœud final</span>
                                            <span className="text-[9px] text-text-muted font-bold uppercase">objectif terminal</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-6 cursor-pointer p-6 bg-background border border-border/60 rounded-[2rem] hover:border-rose-500/60 transition-all select-none group shadow-md">
                                        <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${editingSkill.is_locked ? 'bg-rose-500 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'border-border/60 group-hover:border-rose-500/40'}`}>
                                            {editingSkill.is_locked && <Lock size={16} className="text-black" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={editingSkill.is_locked}
                                            onChange={e => setEditingSkill({ ...editingSkill, is_locked: e.target.checked })}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-text uppercase tracking-widest">en développement</span>
                                            <span className="text-[9px] text-rose-500 font-bold uppercase tracking-tighter">accès restreint</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-6 cursor-pointer p-6 bg-background border border-border/60 rounded-[2rem] hover:border-accent/60 transition-all select-none group shadow-md">
                                        <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${editingSkill.requires_exam ? 'bg-accent border-accent shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'border-border/60 group-hover:border-accent/40'}`}>
                                            {editingSkill.requires_exam && <Rocket size={16} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={editingSkill.requires_exam}
                                            onChange={e => setEditingSkill({ ...editingSkill, requires_exam: e.target.checked })}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-text uppercase tracking-widest">examen d'accès</span>
                                            <span className="text-[9px] text-accent font-bold uppercase tracking-tighter">pass obligatoire</span>
                                        </div>
                                    </label>
                                </div>

                                {editingSkill.requires_exam && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/60 ml-1 flex items-center gap-2">
                                            <Target className="w-3 h-3 text-accent" /> module de validation assigné
                                        </label>
                                        <select
                                            value={editingSkill.exam_module_id || ''}
                                            onChange={e => setEditingSkill({ ...editingSkill, exam_module_id: e.target.value })}
                                            className="w-full px-8 py-6 bg-background border border-accent/30 rounded-[2rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-text font-black uppercase tracking-widest text-xs appearance-none shadow-sm"
                                        >
                                            <option value="" disabled>sélectionner un module d'examen</option>
                                            {modules.map(mod => (
                                                <option key={mod.id} value={mod.id}>{mod.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/60 ml-1 flex items-center gap-2">
                                        <Book className="w-4 h-4 text-accent" /> modules ekloud liés ({selectedModules.length})
                                    </label>
                                    <div className="bg-background border border-border/60 rounded-[2.5rem] p-6 h-80 overflow-y-auto space-y-2 custom-scrollbar shadow-inner">
                                        {modules.map(mod => (
                                            <label key={mod.id} className="flex items-center justify-between cursor-pointer hover:bg-surface p-4 rounded-2xl transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedModules.includes(mod.id) ? 'bg-accent border-accent text-white' : 'border-border/60 group-hover:border-accent/40'}`}>
                                                        {selectedModules.includes(mod.id) && <Plus size={14} className="rotate-45" />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={selectedModules.includes(mod.id)}
                                                        onChange={e => {
                                                            if (e.target.checked) setSelectedModules([...selectedModules, mod.id]);
                                                            else setSelectedModules(selectedModules.filter(id => id !== mod.id));
                                                        }}
                                                    />
                                                    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${selectedModules.includes(mod.id) ? 'text-text' : 'text-text-muted group-hover:text-text-muted'}`}>{mod.title}</span>
                                                </div>
                                                <ChevronRight className={`w-4 h-4 transition-all opacity-0 group-hover:opacity-100 ${selectedModules.includes(mod.id) ? 'text-accent' : 'text-text-muted/40'}`} />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/60 ml-1 flex items-center gap-2">
                                        <Database className="w-4 h-4 text-purple-500" /> dépendances amont ({selectedPrereqs.length})
                                    </label>
                                    <div className="bg-background border border-border/60 rounded-[2.5rem] p-6 h-80 overflow-y-auto space-y-2 custom-scrollbar shadow-inner">
                                        {skills.filter(s => s.id !== editingSkill.id).map(skill => (
                                            <label key={skill.id} className="flex items-center justify-between cursor-pointer hover:bg-surface p-4 rounded-2xl transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedPrereqs.includes(skill.id) ? 'bg-purple-600 border-purple-600 text-white' : 'border-border/60 group-hover:border-purple-500/40'}`}>
                                                        {selectedPrereqs.includes(skill.id) && <Zap size={10} />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={selectedPrereqs.includes(skill.id)}
                                                        onChange={e => {
                                                            if (e.target.checked) setSelectedPrereqs([...selectedPrereqs, skill.id]);
                                                            else setSelectedPrereqs(selectedPrereqs.filter(id => id !== skill.id));
                                                        }}
                                                    />
                                                    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${selectedPrereqs.includes(skill.id) ? 'text-text' : 'text-text-muted group-hover:text-text-muted'}`}>{skill.name}</span>
                                                </div>
                                                <ChevronRight className={`w-4 h-4 transition-all opacity-0 group-hover:opacity-100 ${selectedPrereqs.includes(skill.id) ? 'text-purple-500' : 'text-text-muted/40'}`} />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="group w-full relative overflow-hidden rounded-[2.5rem] bg-accent p-[1px] shadow-2xl shadow-accent/40 active:scale-[0.98] transition-all"
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%] group-hover:animate-[shimmer_2s_infinite]"></div>
                                <div className="bg-accent py-8 rounded-[2.4rem] flex items-center justify-center gap-4 relative">
                                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                    <span className="text-xl font-black text-white uppercase tracking-[0.4em] font-equinox">synchroniser l'helix</span>
                                </div>
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

/**
 * propriété de l'interface d'aperçu par chapitre.
 */
type ChapterPreviewProps = {
    skills: any[];
    prereqs: any[];
    skillModules: any[];
    modules: any[];
    onEdit: (skill: any) => void;
};

/**
 * vue contextuelle helix par chapitre pédagogique.
 * structure les nœuds dans un environnement visuel immersif.
 */
function ChapterPreview({ skills, prereqs, skillModules, modules, onEdit }: ChapterPreviewProps) {
    const [activeModuleId, setActiveModuleId] = useState<string>('intro');
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

    // agrégation des nœuds par thématique/catégorie modules
    const grouped = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        const categories = Array.from(new Set(modules.map(m => m.category || 'système')));
        
        categories.forEach(cat => {
            const categoryModuleIds = modules.filter(m => m.category === cat).map(m => m.id);
            const catSkills = skills.filter(s => skillModules.some(sm => sm.skill_id === s.id && categoryModuleIds.includes(sm.module_id)));
            if (catSkills.length > 0) groups[cat] = catSkills;
        });

        const assignedSkillIds = new Set(skillModules.map(sm => sm.skill_id));
        const orphanSkills = skills.filter(s => !assignedSkillIds.has(s.id));
        if (orphanSkills.length > 0) groups['intro'] = orphanSkills;
        
        return groups;
    }, [skills, skillModules, modules]);

    const categories = Object.keys(grouped).filter(c => c !== 'intro').sort();
    const activeSkills = grouped[activeModuleId] || [];

    useEffect(() => {
        if (activeModuleId === 'intro' && categories.length > 0 && !grouped['intro']) {
            setActiveModuleId(categories[0]);
        }
    }, [categories]);

    const selectedSkill = skills.find(s => s.id === (selectedSkillId || activeSkills[0]?.id)) || activeSkills[0];

    useEffect(() => {
        if (activeSkills.length > 0) setSelectedSkillId(activeSkills[0].id);
    }, [activeModuleId]);

    return (
        <div className="bg-surface border border-border/80 rounded-[4rem] overflow-hidden flex flex-col h-[800px] relative font-sans shadow-2xl animate-in fade-in zoom-in-95 duration-1000">
            {/* navigation contextuelle supérieure */}
            <nav className="relative z-20 flex items-center gap-8 px-12 py-6 bg-surface border-b border-border/80 overflow-x-auto no-scrollbar scroll-smooth shadow-sm">
                {grouped['intro'] && (
                    <button 
                        onClick={() => setActiveModuleId('intro')}
                        className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap py-2.5 px-6 rounded-xl
                            ${activeModuleId === 'intro' ? 'text-accent bg-accent/10 shadow-sm' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
                    >
                        architecture
                    </button>
                )}
                {categories.map(category => (
                    <button 
                        key={category}
                        onClick={() => setActiveModuleId(category)}
                        className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap py-2.5 px-6 rounded-xl
                            ${activeModuleId === category ? 'text-accent bg-accent/10 shadow-sm' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
                    >
                        {category}
                    </button>
                ))}
            </nav>

            <div className="flex-1 flex overflow-hidden">
                {/* section gauche : grille helix nodes */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-16 custom-scrollbar bg-background/5 relative shadow-inner">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_70%)]" />
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 relative z-10">
                        {activeSkills.map((skill, idx) => (
                            <div 
                                key={skill.id}
                                onClick={() => setSelectedSkillId(skill.id)}
                                className={`group relative aspect-square rounded-[2rem] flex flex-col items-center justify-center transition-all duration-500 cursor-pointer border-2 animate-in fade-in slide-in-from-bottom-4 fill-mode-both shadow-md
                                    ${selectedSkillId === skill.id 
                                        ? 'bg-accent/10 border-accent shadow-[0_0_40px_rgba(99,102,241,0.25)] scale-105' 
                                        : 'bg-surface border-border/80 opacity-70 hover:opacity-100 hover:border-accent/60 hover:scale-[1.02]'}`}
                                style={{ animationDelay: `${idx * 40}ms` }}
                            >
                                <div className={`transition-all duration-700 ${selectedSkillId === skill.id ? 'scale-125 text-accent rotate-12' : 'text-text-muted group-hover:rotate-6'}`}>
                                    <SkillIcon name={skill.icon} isFinal={skill.is_final} size={32} />
                                </div>
                                
                                {selectedSkillId === skill.id && (
                                    <div className="absolute inset-0 rounded-[2rem] border-2 border-dashed border-accent/40 animate-[spin_60s_linear_infinite] pointer-events-none" />
                                )}
                            </div>
                        ))}
                    </div>

                    {activeSkills.length === 0 && (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-[10px] font-black text-text-muted/30 uppercase tracking-[0.5em] italic">configuration helix vide</p>
                        </div>
                    )}
                </div>

                {/* section droite : terminal d'inspection détaillée */}
                <div className="w-[400px] bg-surface border-l border-border/80 p-12 flex flex-col justify-between relative overflow-hidden shadow-2xl">
                    <div className="absolute -bottom-20 -right-20 opacity-[0.03] pointer-events-none">
                        <Zap size={300} />
                    </div>

                    {selectedSkill && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-both flex flex-col h-full gap-10">
                            <div className="space-y-12">
                                <div className="space-y-6">
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-background border-2 border-accent/40 flex items-center justify-center text-accent shadow-xl shadow-accent/10">
                                        <SkillIcon name={selectedSkill.icon} isFinal={selectedSkill.is_final} size={36} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-black text-accent uppercase tracking-[0.4em]">nœud actif</span>
                                            <div className="h-px flex-1 bg-accent/20" />
                                        </div>
                                        <h4 className="text-3xl font-black text-text uppercase tracking-tighter leading-[0.9] font-equinox">{selectedSkill.name}</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <span className="px-4 py-1.5 bg-surface-hover border border-border/80 rounded-full text-[9px] font-black uppercase text-text-muted">{selectedSkill.level}</span>
                                        {selectedSkill.is_final && <span className="px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-[9px] font-black uppercase text-yellow-500">nœud maître</span>}
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest border-b border-border/60 pb-2 flex items-center gap-2">
                                        <Settings2 size={12} /> détails de l'implémentation
                                    </span>
                                    <p className="text-sm text-text-muted font-medium italic leading-relaxed opacity-90">{selectedSkill.description || 'aucune instruction pédagogique fournie.'}</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => onEdit(selectedSkill)}
                                className="group w-full h-16 bg-accent rounded-2xl text-white font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-4 transition-all hover:scale-[1.05] active:scale-95 shadow-2xl shadow-accent/40 mt-auto"
                            >
                                <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> éditer succès
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
