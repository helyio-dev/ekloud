import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import * as LucideIcons from 'lucide-react';
import { Plus, Trash2, Edit2, Link, Book, Save, X, Loader2, Move, LayoutList, Eye } from 'lucide-react';

const SkillIcon = ({ name, size = 20, className, isFinal }: { name: string, size?: number, className?: string, isFinal: boolean }) => {
    // Robust lookup: handle kebab-case to PascalCase
    const iconName = name
        ? name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('')
        : '';
    const Icon = (LucideIcons as any)[iconName] || (isFinal ? LucideIcons.Trophy : LucideIcons.Crosshair);
    return (
        <g transform={`translate(${-size / 2}, ${-size / 2})`}>
            <Icon size={size} className={className} />
        </g>
    );
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
};

type Module = {
    id: string;
    title: string;
};

type SkillPrereq = {
    skill_id: string;
    prerequisite_skill_id: string;
};

const GRID_SIZES = [80, 160] as const;

const snapToGrid = (value: number, gridSize: number) =>
    Math.round(value / gridSize) * gridSize;

export default function SkillManagementTab() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [prereqs, setPrereqs] = useState<SkillPrereq[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'visual'>('list');
    const [gridSize, setGridSize] = useState<80 | 160>(80);

    // Drag and Drop state for Visual Editor
    const [isDragging, setIsDragging] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

    // Panning state
    const [isPanning, setIsPanning] = useState(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    const svgRef = useRef<SVGSVGElement>(null);

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
                { data: prereqData }
            ] = await Promise.all([
                supabase.from('skills').select('*').order('created_at'),
                supabase.from('modules').select('id, title').order('order_index'),
                supabase.from('skill_prerequisites').select('*')
            ]);

            setSkills(skillData || []);
            setModules(moduleData || []);
            setPrereqs(prereqData || []);
        } catch (err) {
            console.error('Error fetching skill data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (skill: Skill) => {
        setEditingSkill(skill);
        setIsFormOpen(true);

        const [
            { data: skillMods },
            { data: skillPrereqs }
        ] = await Promise.all([
            supabase.from('skill_modules').select('module_id').eq('skill_id', skill.id),
            supabase.from('skill_prerequisites').select('prerequisite_skill_id').eq('skill_id', skill.id)
        ]);

        setSelectedModules(skillMods?.map(sm => sm.module_id) || []);
        setSelectedPrereqs(skillPrereqs?.map(sp => sp.prerequisite_skill_id) || []);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSkill) return;

        setIsSaving(true);
        try {
            const skillData = {
                name: editingSkill.name,
                description: editingSkill.description,
                icon: editingSkill.icon,
                x_pos: editingSkill.x_pos,
                y_pos: editingSkill.y_pos,
                is_final: editingSkill.is_final,
                is_locked: editingSkill.is_locked
            };

            let skillId = editingSkill.id;

            if (skillId.length < 30) {
                const { data, error } = await supabase.from('skills').insert([{
                    ...skillData,
                    requires_exam: editingSkill.requires_exam,
                    exam_module_id: editingSkill.requires_exam ? (editingSkill.exam_module_id || null) : null
                }]).select().single();
                if (error) throw error;
                skillId = data.id;
            } else {
                const { error } = await supabase.from('skills').update({
                    ...skillData,
                    requires_exam: editingSkill.requires_exam,
                    exam_module_id: editingSkill.requires_exam ? (editingSkill.exam_module_id || null) : null
                }).eq('id', skillId);
                if (error) throw error;
            }

            await Promise.all([
                supabase.from('skill_modules').delete().eq('skill_id', skillId),
                supabase.from('skill_prerequisites').delete().eq('skill_id', skillId)
            ]);

            const modInserts = selectedModules.map(mid => ({ skill_id: skillId, module_id: mid }));
            const prereqInserts = selectedPrereqs.map(pid => ({ skill_id: skillId, prerequisite_skill_id: pid }));

            if (modInserts.length > 0) await supabase.from('skill_modules').insert(modInserts);
            if (prereqInserts.length > 0) await supabase.from('skill_prerequisites').insert(prereqInserts);

            setIsFormOpen(false);
            setEditingSkill(null);
            fetchData();
        } catch (err) {
            console.error('Error saving skill:', err);
            alert('Erreur lors de la sauvegarde.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Supprimer cette compétence ?')) return;
        try {
            await supabase.from('skills').delete().eq('id', id);
            fetchData();
        } catch (err) {
            console.error('Error deleting skill:', err);
        }
    };

    // --- Interaction Logic (Drag & Panning) ---
    const handleMouseDown = (e: React.MouseEvent, skill?: Skill) => {
        if (skill) {
            e.stopPropagation();
            setIsDragging(skill.id);
            setLastMousePos({ x: e.clientX, y: e.clientY }); // Track mouse start for delta
        } else {
            // Background Panning
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            const svg = svgRef.current;
            if (!svg) return;

            const rect = svg.getBoundingClientRect();
            const viewBoxW = 1200;
            const viewBoxH = 600;

            const scaleX = viewBoxW / rect.width;
            const scaleY = viewBoxH / rect.height;

            // Use simple delta scaled by the viewBox ratio so 1 screen px = correct SVG px
            const dx = (e.clientX - lastMousePos.x) * scaleX;
            const dy = (e.clientY - lastMousePos.y) * scaleY;

            // Find current skill
            const currentSkill = skills.find(s => s.id === isDragging);
            if (!currentSkill) return;

            const newX = currentSkill.x_pos + dx;
            const newY = currentSkill.y_pos + dy;

            // Snap for visual feedback only if we want, or save directly (here we snap to grid visually)
            const snappedX = snapToGrid(newX, gridSize);
            const snappedY = snapToGrid(newY, gridSize);

            setDragPos({ x: snappedX, y: snappedY });

            const newSkills = skills.map(s => {
                if (s.id === isDragging) {
                    return { ...s, x_pos: newX, y_pos: newY }; // Save raw floating coords while dragging to avoid jitter
                }
                return s;
            });
            setSkills(newSkills);
            setLastMousePos({ x: e.clientX, y: e.clientY }); // update last mouse pos
        } else if (isPanning) {
            const svg = svgRef.current;
            if (!svg) return;
            const rect = svg.getBoundingClientRect();
            const viewBoxW = 1200;
            const viewBoxH = 600;

            const scaleX = viewBoxW / rect.width;
            const scaleY = viewBoxH / rect.height;

            const dx = (e.clientX - lastMousePos.x) * scaleX * 0.4;
            const dy = (e.clientY - lastMousePos.y) * scaleY * 0.4;

            setPan(prev => ({ x: prev.x - dx, y: prev.y - dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = async () => {
        if (isDragging) {
            const skill = skills.find(s => s.id === isDragging);
            if (skill) {
                // Snap to final positions when letting go
                const snappedX = snapToGrid(skill.x_pos, gridSize);
                const snappedY = snapToGrid(skill.y_pos, gridSize);

                // Update UI state with final snapped pos
                const finalSkills = skills.map(s => s.id === isDragging ? { ...s, x_pos: snappedX, y_pos: snappedY } : s);
                setSkills(finalSkills);

                try {
                    await supabase.from('skills')
                        .update({ x_pos: snappedX, y_pos: snappedY })
                        .eq('id', skill.id);
                } catch (err) {
                    console.error('Error saving skill position:', err);
                }
            }
            setIsDragging(null);
            setDragPos(null);
        }
        setIsPanning(false);
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-accent animate-spin" /></div>;

    // Viewport calculation base
    const padding = 200;
    const baseMinX = Math.min(...skills.map(s => s.x_pos), -200) - padding;
    const baseMinY = Math.min(...skills.map(s => s.y_pos), -200) - padding;
    const maxX = Math.max(...skills.map(s => s.x_pos), 800) + padding;
    const maxY = Math.max(...skills.map(s => s.y_pos), 1000) + padding;

    // Viewport with Panning offset
    const currentMinX = baseMinX + pan.x;
    const currentMinY = baseMinY + pan.y;

    return (
        <div className="space-y-6 select-none">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white">Arbre de Compétences</h2>
                    <p className="text-sm text-text-muted font-medium">Configurez le chemin d'apprentissage visuel.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-background/50 border border-white/5 p-1 rounded-xl flex items-center">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
                        >
                            <LayoutList className="w-3.5 h-3.5" /> Liste
                        </button>
                        <button
                            onClick={() => setViewMode('visual')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'visual' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
                        >
                            <Move className="w-3.5 h-3.5" /> Éditeur Visuel
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            setEditingSkill({ id: Date.now().toString(), name: '', description: '', icon: 'Book', x_pos: 0, y_pos: 0, is_final: false, requires_exam: false, exam_module_id: undefined, is_locked: false });
                            setSelectedModules([]);
                            setSelectedPrereqs([]);
                            setIsFormOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold transition-all text-sm shadow-lg shadow-accent/20"
                    >
                        <Plus className="w-4 h-4" /> Nouvelle
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skills.map(skill => (
                        <div key={skill.id} className="bg-background/40 backdrop-blur-md border border-white/5 p-6 rounded-[24px] hover:border-accent/30 hover:bg-background/60 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-accent/10 border border-accent/20 text-accent ${skill.is_final ? 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : ''}`}>
                                        <SkillIcon name={skill.icon} isFinal={skill.is_final} size={24} className={skill.is_final ? 'text-yellow-500' : 'text-accent'} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{skill.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-accent font-black uppercase tracking-tighter bg-accent/5 px-2 py-0.5 rounded-md border border-accent/10">X: {skill.x_pos}</span>
                                            <span className="text-[10px] text-accent font-black uppercase tracking-tighter bg-accent/5 px-2 py-0.5 rounded-md border border-accent/10">Y: {skill.y_pos}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(skill)} className="p-2 hover:bg-white/5 rounded-xl text-text-muted hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(skill.id)} className="p-2 hover:bg-red-400/10 rounded-xl text-text-muted hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <p className="text-sm text-text-muted line-clamp-2 mb-4 leading-relaxed font-medium">{skill.description || 'Appuyez pour ajouter une description.'}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex -space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-bold" title="Préreclis">
                                        P
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => handleEdit(skill)} className="text-[10px] font-black uppercase text-accent hover:underline flex items-center gap-1">
                                        Modifier les liens <Eye className="w-3 h-3" />
                                    </button>
                                    {skill.requires_exam && (
                                        <div className="text-[10px] font-black uppercase text-yellow-500 flex items-center gap-1">
                                            Examen Requis <LucideIcons.Trophy className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div
                    className={`relative bg-[#09090b] border border-white/5 rounded-[32px] overflow-hidden min-h-[600px] ${isPanning ? 'cursor-grabbing' : isDragging ? 'cursor-move' : 'cursor-grab'}`}
                    onMouseDown={(e) => handleMouseDown(e)}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Toolbar */}
                    <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
                        <div className="bg-purple-500/10 border border-purple-500/20 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-3">
                            <Move className="w-4 h-4 text-purple-400" />
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.1em]">Éditeur Visuel · Snap-to-grid</span>
                        </div>
                        {/* Grid size toggle */}
                        <div className="bg-background/80 border border-white/10 backdrop-blur-xl px-1 py-1 rounded-2xl flex items-center gap-1">
                            {GRID_SIZES.map(g => (
                                <button
                                    key={g}
                                    onClick={(e) => { e.stopPropagation(); setGridSize(g as 80 | 160); }}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${gridSize === g ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-white'
                                        }`}
                                >
                                    {g}px
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Live coord display while dragging */}
                    {isDragging && dragPos && (
                        <div className="absolute top-6 right-6 z-20 bg-accent/10 border border-accent/30 backdrop-blur-xl px-4 py-2 rounded-2xl">
                            <span className="text-xs font-black text-accent font-mono">X: {dragPos.x} · Y: {dragPos.y}</span>
                        </div>
                    )}

                    <svg
                        ref={svgRef}
                        width="100%"
                        height="600"
                        viewBox={`${currentMinX} ${currentMinY} 1200 600`}
                        className="relative z-10 w-full h-[600px] overflow-visible"
                    >
                        {/* SVG GRID DOTS — snap points */}
                        <g className="pointer-events-none">
                            {(() => {
                                const dots = [];
                                const startX = Math.floor(currentMinX / gridSize) * gridSize;
                                const startY = Math.floor(currentMinY / gridSize) * gridSize;
                                const countX = Math.ceil(1200 / gridSize) + 2;
                                const countY = Math.ceil(600 / gridSize) + 2;
                                for (let ix = 0; ix < countX; ix++) {
                                    for (let iy = 0; iy < countY; iy++) {
                                        const gx = startX + ix * gridSize;
                                        const gy = startY + iy * gridSize;
                                        const isOrigin = gx === 0 && gy === 0;
                                        dots.push(
                                            <circle
                                                key={`${ix}-${iy}`}
                                                cx={gx} cy={gy}
                                                r={isOrigin ? 5 : 2}
                                                fill={isOrigin ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.12)'}
                                            />
                                        );
                                    }
                                }
                                return dots;
                            })()}
                        </g>

                        {/* ORIGIN LABEL */}
                        <g className="opacity-40 pointer-events-none">
                            <text x="8" y="-8" fill="rgba(99,102,241,0.9)" fontSize="10" fontWeight="900" fontFamily="monospace">0,0</text>
                        </g>

                        {/* connections (Orthogonal & Thicker) */}
                        {prereqs.map((p, i) => {
                            const start = skills.find(s => s.id === p.prerequisite_skill_id);
                            const end = skills.find(s => s.id === p.skill_id);
                            if (!start || !end) return null;

                            const pathD = `M ${start.x_pos} ${start.y_pos} L ${start.x_pos} ${end.y_pos} L ${end.x_pos} ${end.y_pos}`;

                            return (
                                <path
                                    key={i}
                                    d={pathD}
                                    fill="none"
                                    stroke="rgba(99, 102, 241, 0.3)"
                                    strokeWidth="4"
                                    strokeDasharray="6,6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            );
                        })}

                        {/* Nodes */}
                        {skills.map(skill => (
                            <g
                                key={skill.id}
                                transform={`translate(${skill.x_pos}, ${skill.y_pos})`}
                                onMouseDown={(e) => handleMouseDown(e, skill)}
                                className="cursor-move group"
                            >
                                <rect
                                    x="-25" y="-25" width="50" height="50"
                                    rx="10"
                                    className={`transition-all duration-300 ${isDragging === skill.id ? 'fill-accent stroke-white stroke-2 scale-110 shadow-2xl' : 'fill-background border border-white/10 stroke-white/10 stroke-1 group-hover:stroke-accent/50'}`}
                                />
                                <SkillIcon
                                    name={skill.icon}
                                    isFinal={skill.is_final}
                                    size={20}
                                    className={isDragging === skill.id ? 'text-white' : (skill.is_final ? 'text-yellow-500/50' : 'text-accent/50')}
                                />
                                <text
                                    y="40"
                                    textAnchor="middle"
                                    className="fill-white/40 text-[10px] font-bold pointer-events-none group-hover:fill-white transition-colors"
                                >
                                    {skill.name}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>
            )}

            {isFormOpen && editingSkill && (
                <div className="fixed inset-0 bg-[#09090b]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
                    <div className="bg-surface border border-white/10 p-6 md:p-10 rounded-3xl md:rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 md:space-y-8 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-white">{editingSkill.id.length < 30 ? 'Nouvelle Compétence' : 'Paramètres'}</h2>
                                <p className="text-sm text-text-muted font-medium">Définissez les détails et prérequis.</p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="p-3 hover:bg-white/5 rounded-full transition-all hover:rotate-90"><X className="w-8 h-8 text-white" /></button>
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
                                        className="w-full px-5 py-4 bg-background border border-white/5 rounded-2xl outline-none focus:border-accent transition-all text-white font-bold"
                                        placeholder="ex: Linux Avancé"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Icône Lucide</label>
                                    <input
                                        type="text"
                                        value={editingSkill.icon}
                                        onChange={e => setEditingSkill({ ...editingSkill, icon: e.target.value })}
                                        className="w-full px-5 py-4 bg-background border border-white/5 rounded-2xl outline-none focus:border-accent transition-all text-white font-medium"
                                        placeholder="Book, Code, Server..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Description pédagogique</label>
                                <textarea
                                    value={editingSkill.description}
                                    onChange={e => setEditingSkill({ ...editingSkill, description: e.target.value })}
                                    className="w-full px-5 py-4 bg-background border border-white/5 rounded-2xl outline-none focus:border-accent transition-all text-white h-32 resize-none font-medium leading-relaxed"
                                    placeholder="Expliquez ce que l'élève va apprendre..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">X Position</label>
                                    <input
                                        type="number"
                                        value={editingSkill.x_pos}
                                        onChange={e => setEditingSkill({ ...editingSkill, x_pos: parseInt(e.target.value) })}
                                        className="w-full px-5 py-4 bg-background border border-white/5 rounded-2xl outline-none focus:border-accent transition-all text-white font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Y Position</label>
                                    <input
                                        type="number"
                                        value={editingSkill.y_pos}
                                        onChange={e => setEditingSkill({ ...editingSkill, y_pos: parseInt(e.target.value) })}
                                        className="w-full px-5 py-4 bg-background border border-white/5 rounded-2xl outline-none focus:border-accent transition-all text-white font-bold"
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <div className="flex flex-col gap-4">
                                        <label className="flex items-center gap-4 cursor-pointer p-4 bg-background/50 border border-white/5 rounded-2xl hover:border-accent/30 transition-all select-none group">
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editingSkill.is_final ? 'bg-yellow-500 border-yellow-500' : 'border-white/10 group-hover:border-accent/40'}`}>
                                                {editingSkill.is_final && <LucideIcons.Trophy size={14} className="text-black" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={editingSkill.is_final}
                                                onChange={e => setEditingSkill({ ...editingSkill, is_final: e.target.checked })}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-white">Nœud Final</span>
                                                <span className="text-[10px] text-text-muted font-bold uppercase">Trophée de fin</span>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-4 cursor-pointer p-4 bg-background/50 border border-white/5 rounded-2xl hover:border-red-500/30 transition-all select-none group">
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editingSkill.is_locked ? 'bg-red-500 border-red-500' : 'border-white/10 group-hover:border-red-500/40'}`}>
                                                {editingSkill.is_locked && <LucideIcons.Lock size={14} className="text-black" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={editingSkill.is_locked}
                                                onChange={e => setEditingSkill({ ...editingSkill, is_locked: e.target.checked })}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-white">Bloquer / En construction</span>
                                                <span className="text-[10px] text-text-muted font-bold uppercase text-red-500/80">Indisponible aux élèves</span>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-4 cursor-pointer p-4 bg-background/50 border border-white/5 rounded-2xl hover:border-yellow-500/30 transition-all select-none group">
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editingSkill.requires_exam ? 'bg-yellow-500 border-yellow-500' : 'border-white/10 group-hover:border-yellow-500/40'}`}>
                                                {editingSkill.requires_exam && <LucideIcons.HelpCircle size={14} className="text-black" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={editingSkill.requires_exam}
                                                onChange={e => setEditingSkill({ ...editingSkill, requires_exam: e.target.checked })}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-white">Examen Requis</span>
                                                <span className="text-[10px] text-text-muted font-bold uppercase text-yellow-500/80">Quiz de Validation</span>
                                            </div>
                                        </label>

                                        {editingSkill.requires_exam && (
                                            <div className="space-y-2 animate-in fade-in zoom-in duration-300 slide-in-from-top-4">
                                                <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1 flex items-center gap-2">
                                                    <Book className="w-3 h-3 text-yellow-500" /> Quel Examen ?
                                                </label>
                                                <select
                                                    value={editingSkill.exam_module_id || ''}
                                                    onChange={e => setEditingSkill({ ...editingSkill, exam_module_id: e.target.value })}
                                                    className="w-full px-5 py-4 bg-background border border-yellow-500/30 rounded-2xl outline-none focus:border-yellow-500 transition-all text-white font-bold"
                                                >
                                                    <option value="" disabled>Sélectionner un module</option>
                                                    {modules.map(mod => (
                                                        <option key={mod.id} value={mod.id}>{mod.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                                        <Book className="w-4 h-4 text-accent" /> Modules liés ({selectedModules.length})
                                    </label>
                                    <div className="bg-background border border-white/5 rounded-3xl p-5 h-64 overflow-y-auto space-y-2 custom-scrollbar">
                                        {modules.map(mod => (
                                            <label key={mod.id} className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-3 rounded-xl transition-colors group">
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
                                                    <span className="text-sm font-bold text-white/70 group-hover:text-white">{mod.title}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-white/5 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                                        <Link className="w-4 h-4 text-purple-400" /> Prérequis ({selectedPrereqs.length})
                                    </label>
                                    <div className="bg-background border border-white/5 rounded-3xl p-5 h-64 overflow-y-auto space-y-2 custom-scrollbar">
                                        {skills.filter(s => s.id !== editingSkill.id).map(skill => (
                                            <label key={skill.id} className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-3 rounded-xl transition-colors group">
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
                                                    <span className="text-sm font-bold text-white/70 group-hover:text-white">{skill.name}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-white/5 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
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
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}

function ChevronRight({ className, size = 16 }: { className?: string, size?: number }) {
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            className={className}
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}
