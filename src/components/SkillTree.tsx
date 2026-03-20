import React, { useRef, useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Lock, Trophy, Crosshair, Sparkles, BookOpen, CheckCircle, X, ChevronRight } from 'lucide-react';

const SkillIcon = ({ name, className, status, isFinal, size = 30 }: { name: string, className?: string, status: string, isFinal: boolean, size?: number }) => {
    const iconName = name
        ? name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('')
        : '';
    const Icon = status === 'locked' ? Lock : ((LucideIcons as any)[iconName] || (isFinal ? Trophy : Crosshair));
    return (
        <g transform={`translate(${-size / 2}, ${-size / 2})`}>
            <Icon size={size} className={className} />
        </g>
    );
};

export type Skill = {
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

export type SkillPrereq = {
    skill_id: string;
    prerequisite_skill_id: string;
};

export type SkillModule = {
    skill_id: string;
    module_id: string;
};

interface SkillTreeProps {
    skills: Skill[];
    prereqs: SkillPrereq[];
    skillModules: SkillModule[];
    userModules: Record<string, boolean>;
    completedSkills: Set<string>;
    passedExams: Set<string>;
    onSkillClick?: (skill: Skill) => void;
    readOnly?: boolean;
}

export default function SkillTree({
    skills,
    prereqs,
    skillModules,
    userModules,
    completedSkills,
    passedExams,
    onSkillClick,
    readOnly = false
}: SkillTreeProps) {
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1.5);
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const getSkillStatus = (skillId: string, visited = new Set<string>()): 'completed' | 'available' | 'unlocked' | 'unlocked_needs_exam' | 'locked' => {
        if (completedSkills.has(skillId)) return 'completed';
        if (visited.has(skillId)) return 'locked';
        visited.add(skillId);

        const skillPrereqs = prereqs.filter(p => p.skill_id === skillId);
        const prereqsMet = skillPrereqs.every(p => getSkillStatus(p.prerequisite_skill_id, visited) === 'completed');

        if (!prereqsMet && skillPrereqs.length > 0) return 'locked';

        const requiredModules = skillModules.filter(sm => sm.skill_id === skillId);
        const modulesCompleted = requiredModules.length > 0 && requiredModules.every(rm => userModules[rm.module_id]);

        const skill = skills.find(s => s.id === skillId);
        if (skill?.is_locked) return 'locked';

        if (skill?.requires_exam && skill.exam_module_id) {
            if (!passedExams.has(skill.exam_module_id)) return 'unlocked_needs_exam';
        }

        if (requiredModules.length > 0 && !modulesCompleted) return 'unlocked';

        return 'available';
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as Element).closest('g.skill-node')) return;
        setIsPanning(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const scaleX = (1600 / zoom) / rect.width;
        const scaleY = (900 / zoom) / rect.height;
        const dx = (e.clientX - lastMousePos.x) * scaleX * 0.4;
        const dy = (e.clientY - lastMousePos.y) * scaleY * 0.4;
        setPan(prev => ({ x: prev.x - dx, y: prev.y - dy }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsPanning(false);

    // Viewport calculation
    const padding = 200;
    const baseMinX = Math.min(...skills.map(s => s.x_pos), -200) - padding;
    const baseMinY = Math.min(...skills.map(s => s.y_pos), -200) - padding;
    const currentWidth = 1600 / zoom;
    const currentHeight = 900 / zoom;
    const currentMinX = baseMinX + pan.x;
    const currentMinY = baseMinY + pan.y;

    return (
        <div className="w-full h-full relative overflow-hidden select-none">
            <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#80808010_1px,transparent_1px)] bg-[size:60px_60px] opacity-50"
                style={{ backgroundPosition: `${-pan.x}px ${-pan.y}px` }}
            ></div>

            <main
                className={`w-full h-full relative overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    viewBox={`${currentMinX} ${currentMinY} ${currentWidth} ${currentHeight}`}
                    className="relative z-10 w-full h-full overflow-visible"
                >
                    {prereqs.map((p, i) => {
                        const start = skills.find(s => s.id === p.prerequisite_skill_id);
                        const end = skills.find(s => s.id === p.skill_id);
                        if (!start || !end) return null;
                        const isStartCompleted = completedSkills.has(start.id);
                        const pathD = `M ${start.x_pos} ${start.y_pos} L ${start.x_pos} ${end.y_pos} L ${end.x_pos} ${end.y_pos}`;
                        return (
                            <path
                                key={i}
                                d={pathD}
                                fill="none"
                                stroke={isStartCompleted ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.08)'}
                                strokeWidth="6"
                                strokeDasharray={isStartCompleted ? "0" : "12,12"}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-all duration-700"
                            />
                        );
                    })}

                    {skills.map(skill => {
                        const status = getSkillStatus(skill.id);
                        const isActive = hoveredSkill?.id === skill.id;

                        return (
                            <g
                                key={skill.id}
                                transform={`translate(${skill.x_pos}, ${skill.y_pos})`}
                                onMouseEnter={() => setHoveredSkill(skill)}
                                onMouseLeave={() => setHoveredSkill(null)}
                                onClick={() => onSkillClick?.(skill)}
                                className="skill-node cursor-pointer group"
                            >
                                {status === 'available' && (
                                    <rect x="-40" y="-40" width="80" height="80" rx="16" className="fill-accent/10 animate-pulse blur-xl" />
                                )}
                                <rect
                                    x="-35" y="-35" width="70" height="70" rx="14"
                                    className={`transition-all duration-500 transform ${isActive ? 'scale-110 shadow-[0_0_30px_rgba(99,102,241,0.4)]' : 'scale-100'} 
                                        ${status === 'completed' ? 'fill-green-500/10 stroke-green-500/50 stroke-2' :
                                        status === 'available' ? 'fill-accent/10 stroke-accent stroke-2' :
                                        (status === 'unlocked' || status === 'unlocked_needs_exam') ? 'fill-white/10 stroke-white/40 stroke-2' :
                                        'fill-surface/40 stroke-white/5 stroke-2'}`}
                                />
                                <rect x="-30" y="-30" width="60" height="60" rx="10"
                                    className={`transition-all duration-500 ${status === 'completed' ? 'fill-green-500/20' :
                                        status === 'available' ? 'fill-accent/20' :
                                        (status === 'unlocked' || status === 'unlocked_needs_exam') ? 'fill-white/10' : 'fill-white/5'}`}
                                />
                                <SkillIcon name={skill.icon} isFinal={skill.is_final} status={status} className={`transition-all duration-500 ${status === 'completed' ? (skill.is_final ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'text-green-400') : status === 'available' ? (skill.is_final ? 'text-white/80' : 'text-accent') : (status === 'unlocked' || status === 'unlocked_needs_exam') ? 'text-white/60' : 'text-white/20'}`} />
                                <foreignObject x="45" y="-35" width="220" height="100" className={`transition-all duration-500 pointer-events-none ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                                    <div className="flex flex-col gap-1 p-3 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                                        <span className="text-sm font-black text-white truncate">{skill.name}</span>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${status === 'completed' ? 'bg-green-400' : status === 'available' ? 'bg-accent animate-pulse' : (status === 'unlocked' || status === 'unlocked_needs_exam') ? 'bg-white/40' : 'bg-white/20'}`}></div>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">
                                                {status === 'completed' ? 'Maîtrisé' : status === 'available' ? 'Disponible' : skill.is_locked ? 'En Construction' : status === 'unlocked_needs_exam' ? 'Examen Requis' : status === 'unlocked' ? 'En cours' : 'Verrouillé'}
                                            </span>
                                        </div>
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    })}
                </svg>
            </main>

            {/* Status Legend Bar (Optimized) */}
            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-40 hidden md:block pointer-events-none">
                <div className="flex items-center gap-4 p-4 bg-[#09090b]/80 backdrop-blur-3xl border border-white/5 rounded-[24px] shadow-2xl">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Maîtrisé</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-accent">Disponible</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Verrouillé</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 p-1.5 bg-[#09090b]/80 backdrop-blur-3xl border border-white/10 rounded-full shadow-2xl">
                    <button onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))} className="p-2.5 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"><LucideIcons.ZoomOut size={16} /></button>
                    <button onClick={() => setZoom(1.5)} className="px-2 py-1 text-[9px] font-black text-white/40 hover:text-white uppercase tracking-tighter">RESET</button>
                    <button onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))} className="p-2.5 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"><LucideIcons.ZoomIn size={16} /></button>
                </div>
            </div>
        </div>
    );
}
