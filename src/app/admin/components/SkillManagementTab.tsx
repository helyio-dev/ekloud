import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import * as LucideIcons from 'lucide-react';
import { Plus, Trash2, Edit2, Link, Book, Save, X, Loader2, LayoutList, Eye, ArrowUp, ArrowDown, Sparkles, ChevronRight, Trophy, Lock, HelpCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';


const SkillIcon = ({ name, size = 20, className, isFinal }: { name: string, size?: number, className?: string, isFinal: boolean }) => {
    const { mode } = useTheme();
    // Support for external CDN icons (URL)
    if (name && (name.startsWith('http') || name.startsWith('https'))) {
        return <img src={name} alt="" style={{ width: size, height: size }} className={className} />;
    }

    const iconName = name
        ? name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('')
        : '';
    const Icon = (LucideIcons as any)[iconName];
    
    if (Icon) return <Icon size={size} className={className} />;

    // Fallback to Simple Icons CDN (for brand icons like react, python, etc.)
    const iconColor = mode === 'light' ? '0f172a' : 'ffffff';
    return <img src={`https://cdn.simpleicons.org/${name}/${iconColor}`} alt="" style={{ width: size, height: size }} className={className} />;
};

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

export default function SkillManagementTab() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [prereqs, setPrereqs] = useState<SkillPrereq[]>([]);
    const [skillModules, setSkillModules] = useState<{ skill_id: string, module_id: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'visual'>('list');

    // Form state
    const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [selectedPrereqs, setSelectedPrereqs] = useState<string[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
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
            console.error('Error fetching skill data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (skill: Skill) => {
        setEditingSkill(skill);
        setIsFormOpen(true);

        const { data: skillMods } = await supabase.from('skill_modules').select('module_id').eq('skill_id', skill.id);
        const { data: skillPrereqs } = await supabase.from('skill_prerequisites').select('prerequisite_skill_id').eq('skill_id', skill.id);

        setSelectedModules(skillMods?.map(m => m.module_id) || []);
        setSelectedPrereqs(skillPrereqs?.map(p => p.prerequisite_skill_id) || []);
    };

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

            for (const update of updates) {
                await supabase.from('skills').update({ y_pos: update.y_pos }).eq('id', update.id);
            }
        } catch (err) {
            console.error('Error reordering skills:', err);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSkill) return;
        setIsSaving(true);

        try {
            const isNew = !editingSkill.id;
            
            if (isNew) {
                const { id, ...saveData } = editingSkill;
                const { data, error } = await supabase.from('skills').insert([{
                    ...saveData,
                    y_pos: skills.length
                }]).select();
                if (error) throw error;
                editingSkill.id = data[0].id;
            } else {
                await supabase.from('skills').update(editingSkill).eq('id', editingSkill.id);
            }

            // Update Modules
            await supabase.from('skill_modules').delete().eq('skill_id', editingSkill.id);
            if (selectedModules.length > 0) {
                await supabase.from('skill_modules').insert(selectedModules.map(mid => ({
                    skill_id: editingSkill.id,
                    module_id: mid
                })));
            }

            // Update Prerequisites
            await supabase.from('skill_prerequisites').delete().eq('skill_id', editingSkill.id);
            if (selectedPrereqs.length > 0) {
                await supabase.from('skill_prerequisites').insert(selectedPrereqs.map(pid => ({
                    skill_id: editingSkill.id,
                    prerequisite_skill_id: pid
                })));
            }

            setIsFormOpen(false);
            fetchData();
        } catch (err) {
            console.error('Error saving skill:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Voulez-vous vraiment supprimer cette compétence ?')) return;
        try {
            await supabase.from('skills').delete().eq('id', id);
            setSkills(skills.filter(s => s.id !== id));
        } catch (err) {
            console.error('Error deleting skill:', err);
        }
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-accent animate-spin" /></div>;


    return (
        <div className="space-y-6 select-none">
            <div className="flex justify-between items-center bg-surface border border-border p-4 rounded-3xl shadow-xl">
                <div className="flex items-center gap-6">
                    <div className="flex gap-1 p-1 bg-background/50 rounded-2xl border border-border">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
                        >
                            <LayoutList className="w-3.5 h-3.5" /> Liste
                        </button>
                        <button
                            onClick={() => setViewMode('visual')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'visual' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
                        >
                            <Eye className="w-3.5 h-3.5" /> Aperçu Helix
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingSkill({ name: '', description: '', icon: 'Book', x_pos: 0, y_pos: 0, is_final: false, requires_exam: false, is_locked: false, level: 'Découverte' } as any);
                        setSelectedModules([]);
                        setSelectedPrereqs([]);
                        setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-light text-white rounded-2xl text-sm font-black transition-all shadow-lg active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Nouvelle Compétence
                </button>
            </div>

            {viewMode === 'list' ? (
                <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                    {skills.map((skill, index) => (
                        <div key={skill.id} className="group bg-surface border border-border p-6 rounded-[32px] hover:border-accent/30 transition-all shadow-xl hover:shadow-accent/5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center transition-all ${skill.is_final ? 'shadow-[0_0_15px_rgba(234,179,8,0.2)] border-yellow-500/30' : 'group-hover:border-accent/30'}`}>
                                        <SkillIcon name={skill.icon} isFinal={skill.is_final} size={28} className={skill.is_final ? 'text-yellow-500' : 'text-accent'} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-text group-hover:text-accent transition-colors">{skill.name || 'Sans Nom'}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-text-muted font-black uppercase tracking-wider">Position {index + 1}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleMove(skill.id, 'up')} className="p-2 hover:bg-surface-hover rounded-xl text-text-muted hover:text-text transition-all"><ArrowUp className="w-4 h-4" /></button>
                                    <button onClick={() => handleMove(skill.id, 'down')} className="p-2 hover:bg-surface-hover rounded-xl text-text-muted hover:text-text transition-all"><ArrowDown className="w-4 h-4" /></button>
                                    <button onClick={() => handleEdit(skill)} className="p-2 hover:bg-surface-hover rounded-xl text-text-muted hover:text-text transition-all"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(skill.id)} className="p-2 hover:bg-red-400/10 rounded-xl text-text-muted hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <p className="text-sm text-text-muted mb-4 font-medium">{skill.description || 'Appuyez pour ajouter une description.'}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <span className="text-[10px] font-black uppercase text-text-muted">
                                    {skill.is_final ? '🏆 Nœud Final' : skill.is_locked ? '🔒 En Construction' : '📚 Compétence Standard'}
                                </span>
                                <button onClick={() => handleEdit(skill)} className="text-[10px] font-black uppercase text-accent hover:underline flex items-center gap-1">
                                    Gérer les liens <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // CHAPTER-BASED PREVIEW
                <ChapterPreview
                    skills={skills}
                    prereqs={prereqs}
                    skillModules={skillModules}
                    modules={modules}
                    onEdit={handleEdit}
                />
            )}

            {isFormOpen && editingSkill && (
                <div className="fixed inset-0 bg-[#09090b]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
                    <div className="bg-surface border border-border p-6 md:p-10 rounded-3xl md:rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 md:space-y-8 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-text">{editingSkill.id ? 'Paramètres' : 'Nouvelle Compétence'}</h2>
                                <p className="text-sm text-text-muted font-medium">Définissez les détails et prérequis.</p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="p-3 hover:bg-surface-hover rounded-full transition-all hover:rotate-90"><X className="w-8 h-8 text-text" /></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Nom de la compétence</label>
                                    <input
                                        required
                                        type="text"
                                        value={editingSkill.name}
                                        onChange={e => setEditingSkill({ ...editingSkill, name: e.target.value })}
                                        className="w-full px-5 py-4 bg-background border border-border rounded-2xl outline-none focus:border-accent transition-all text-text font-bold"
                                        placeholder="ex: Linux Avancé"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Icône Lucide</label>
                                    <input
                                        type="text"
                                        value={editingSkill.icon}
                                        onChange={e => setEditingSkill({ ...editingSkill, icon: e.target.value })}
                                        className="w-full px-5 py-4 bg-background border border-border rounded-2xl outline-none focus:border-accent transition-all text-text font-medium"
                                        placeholder="Book, Code, Server..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Niveau de difficulté</label>
                                    <select
                                        value={editingSkill.level || 'Découverte'}
                                        onChange={e => setEditingSkill({ ...editingSkill, level: e.target.value as any })}
                                        className="w-full px-5 py-4 bg-background border border-border rounded-2xl outline-none focus:border-accent transition-all text-text font-bold"
                                    >
                                        <option value="Découverte">Découverte</option>
                                        <option value="Fondamentaux">Fondamentaux</option>
                                        <option value="Avancé">Avancé</option>
                                        <option value="Expert">Expert</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Description pédagogique</label>
                                <textarea
                                    value={editingSkill.description}
                                    onChange={e => setEditingSkill({ ...editingSkill, description: e.target.value })}
                                    className="w-full px-5 py-4 bg-background border border-border rounded-2xl outline-none focus:border-accent transition-all text-text h-32 resize-none font-medium leading-relaxed"
                                    placeholder="Expliquez ce que l'élève va apprendre..."
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Filtres et État</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <label className="flex items-center gap-4 cursor-pointer p-4 bg-background/50 border border-border rounded-2xl hover:border-accent/30 transition-all select-none group">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editingSkill.is_final ? 'bg-yellow-500 border-yellow-500' : 'border-border group-hover:border-accent/40'}`}>
                                            {editingSkill.is_final && <Trophy size={14} className="text-black" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={editingSkill.is_final}
                                            onChange={e => setEditingSkill({ ...editingSkill, is_final: e.target.checked })}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-text">Nœud Final</span>
                                            <span className="text-[10px] text-text-muted font-bold uppercase">Trophée de fin</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-4 cursor-pointer p-4 bg-background/50 border border-border rounded-2xl hover:border-red-500/30 transition-all select-none group">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editingSkill.is_locked ? 'bg-red-500 border-red-500' : 'border-border group-hover:border-red-500/40'}`}>
                                            {editingSkill.is_locked && <Lock size={14} className="text-black" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={editingSkill.is_locked}
                                            onChange={e => setEditingSkill({ ...editingSkill, is_locked: e.target.checked })}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-text">Bloqué / Travaux</span>
                                            <span className="text-[10px] text-text-muted font-bold uppercase text-red-500/80">Indisponible</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-4 cursor-pointer p-4 bg-background/50 border border-border rounded-2xl hover:border-yellow-500/30 transition-all select-none group">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editingSkill.requires_exam ? 'bg-yellow-500 border-yellow-500' : 'border-border group-hover:border-yellow-500/40'}`}>
                                            {editingSkill.requires_exam && <HelpCircle size={14} className="text-black" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={editingSkill.requires_exam}
                                            onChange={e => setEditingSkill({ ...editingSkill, requires_exam: e.target.checked })}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-text">Examen Requis</span>
                                            <span className="text-[10px] text-text-muted font-bold uppercase text-yellow-500/80">Validation</span>
                                        </div>
                                    </label>
                                </div>

                                {editingSkill.requires_exam && (
                                    <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                                        <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1 flex items-center gap-2">
                                            <Book className="w-3 h-3 text-yellow-500" /> Quel Examen ?
                                        </label>
                                        <select
                                            value={editingSkill.exam_module_id || ''}
                                            onChange={e => setEditingSkill({ ...editingSkill, exam_module_id: e.target.value })}
                                            className="w-full px-5 py-4 bg-background border border-yellow-500/30 rounded-2xl outline-none focus:border-yellow-500 transition-all text-text font-bold"
                                        >
                                            <option value="" disabled>Sélectionner un module</option>
                                            {modules.map(mod => (
                                                <option key={mod.id} value={mod.id}>{mod.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                                        <Book className="w-4 h-4 text-accent" /> Modules liés ({selectedModules.length})
                                    </label>
                                    <div className="bg-background border border-border rounded-3xl p-5 h-64 overflow-y-auto space-y-2 custom-scrollbar">
                                        {modules.map(mod => (
                                            <label key={mod.id} className="flex items-center justify-between cursor-pointer hover:bg-surface-hover p-3 rounded-xl transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedModules.includes(mod.id)}
                                                        onChange={e => {
                                                            if (e.target.checked) setSelectedModules([...selectedModules, mod.id]);
                                                            else setSelectedModules(selectedModules.filter(id => id !== mod.id));
                                                        }}
                                                        className="w-5 h-5 accent-accent"
                                                    />
                                                    <span className="text-sm font-bold text-text-muted group-hover:text-text">{mod.title}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-text-muted/10 group-hover:text-accent group-hover:translate-x-1 transition-all transition-colors" />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                                        <Link className="w-4 h-4 text-purple-400" /> Prérequis ({selectedPrereqs.length})
                                    </label>
                                    <div className="bg-background border border-border rounded-3xl p-5 h-64 overflow-y-auto space-y-2 custom-scrollbar">
                                        {skills.filter(s => s.id !== editingSkill.id).map(skill => (
                                            <label key={skill.id} className="flex items-center justify-between cursor-pointer hover:bg-surface-hover p-3 rounded-xl transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPrereqs.includes(skill.id)}
                                                        onChange={e => {
                                                            if (e.target.checked) setSelectedPrereqs([...selectedPrereqs, skill.id]);
                                                            else setSelectedPrereqs(selectedPrereqs.filter(id => id !== skill.id));
                                                        }}
                                                        className="w-5 h-5 accent-purple-400"
                                                    />
                                                    <span className="text-sm font-bold text-text-muted group-hover:text-text">{skill.name}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-text-muted/10 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="group w-full relative overflow-hidden rounded-[24px] bg-accent p-[1px] shadow-2xl shadow-accent/20 active:scale-95 transition-all"
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] group-hover:animate-[shimmer_2s_infinite]"></div>
                                <div className="bg-accent py-5 rounded-[23px] flex items-center justify-center gap-3">
                                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                    <span className="text-xl font-black text-white uppercase tracking-widest">Enregistrer Compétence</span>
                                </div>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--accent); }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}

type ChapterPreviewProps = {
    skills: any[];
    prereqs: any[];
    skillModules: any[];
    modules: any[];
    onEdit: (skill: any) => void;
};

// ChapterPreview component
function ChapterPreview({ skills, prereqs, skillModules, modules, onEdit }: ChapterPreviewProps) {
    const [activeModuleId, setActiveModuleId] = useState<string>('intro');
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

    const grouped = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        
        // Get unique categories
        const categories = Array.from(new Set(modules.map(m => m.category || 'Autres')));
        
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
        <div className="bg-background border border-border rounded-[48px] overflow-hidden flex flex-col h-[750px] relative font-sans">
            {/* Top Slim Nav */}
            <nav className="relative z-20 flex items-center gap-6 px-8 py-4 bg-surface/30 border-b border-border backdrop-blur-md overflow-x-auto no-scrollbar">
                {grouped['intro'] && (
                    <button 
                        onClick={() => setActiveModuleId('intro')}
                        className={`text-[9px] font-black uppercase tracking-widest transition-colors whitespace-nowrap
                            ${activeModuleId === 'intro' ? 'text-accent' : 'text-text-muted hover:text-text'}`}
                    >
                        Progression
                    </button>
                )}
                {categories.map(category => (
                    <button 
                        key={category}
                        onClick={() => setActiveModuleId(category)}
                        className={`text-[9px] font-black uppercase tracking-widest transition-colors whitespace-nowrap
                            ${activeModuleId === category ? 'text-accent' : 'text-text-muted hover:text-text'}`}
                    >
                        {category}
                    </button>
                ))}
            </nav>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Grid */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-10 custom-scrollbar bg-surface/10">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {activeSkills.map(skill => (
                            <div 
                                key={skill.id}
                                onClick={() => setSelectedSkillId(skill.id)}
                                className={`group relative aspect-square rounded-full flex flex-col items-center justify-center transition-all cursor-pointer border-2
                                    ${selectedSkillId === skill.id ? 'bg-accent/10 border-accent shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-accent/20' : 'bg-surface border-border opacity-60 hover:opacity-100 hover:border-accent/30'}`}
                            >
                                <div className={`transition-all duration-300 ${selectedSkillId === skill.id ? 'scale-110 text-accent' : 'text-text-muted'}`}>
                                    <SkillIcon name={skill.icon} isFinal={skill.is_final} size={24} />
                                </div>
                                <div className="absolute inset-0 rounded-full border border-dashed border-border animate-[spin_40s_linear_infinite] pointer-events-none" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Detailed Panel */}
                <div className="w-[320px] bg-surface/30 border-l border-border p-10 flex flex-col justify-between">
                    {selectedSkill ? (
                        <>
                            <div className="space-y-10">
                                <div className="space-y-3">
                                    <div className="w-14 h-14 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent">
                                        <SkillIcon name={selectedSkill.icon} isFinal={selectedSkill.is_final} size={24} />
                                    </div>
                                    <h4 className="text-xl font-black text-text uppercase tracking-tighter leading-tight mt-4">{selectedSkill.name}</h4>
                                    <p className="text-[9px] text-text-muted font-medium italic leading-relaxed line-clamp-4">{selectedSkill.description}</p>
                                </div>
                                
                                <div className="space-y-4">
                                </div>
                            </div>

                            <button 
                                onClick={() => onEdit(selectedSkill)}
                                className="w-full h-12 bg-accent rounded-xl text-white font-black uppercase text-[10px] flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95"
                            >
                                <Edit2 className="w-3 h-3" /> Éditer Succès
                            </button>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-text-muted opacity-10 text-[10px] font-black uppercase tracking-widest text-center">
                            Selectionnez un succès...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
