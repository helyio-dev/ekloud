import React, { useMemo, useState, useEffect, useRef } from 'react';
import dagre from 'dagre';
import * as LucideIcons from 'lucide-react';
import { Lock, Trophy, Crosshair, CheckCircle, Sparkles, BookOpen, Zap, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const SkillIcon = ({ name, status, isFinal, size = 20, className }: { name: string, status: string, isFinal: boolean, size?: number, className?: string }) => {
    const { mode } = useTheme();
    if (status === 'locked') return <Lock size={size} className={className} />;
    
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

export type Skill = {
    id: string;
    name: string;
    description: string;
    icon: string;
    is_final: boolean;
    requires_exam: boolean;
    exam_module_id?: string;
    is_locked?: boolean;
    level?: 'Découverte' | 'Fondamentaux' | 'Avancé' | 'Expert';
};

export type SkillPrereq = {
    skill_id: string;
    prerequisite_skill_id: string;
};

export type SkillModule = {
    skill_id: string;
    module_id: string;
};

type SkillTreeProps = {
    skills: Skill[];
    prereqs: SkillPrereq[];
    skillModules: SkillModule[];
    modules: { id: string, title: string, category?: string, order_index?: number }[];
    userModules: Record<string, boolean>;
    completedSkills: Set<string>;
    passedExams: Set<string>;
    onSkillClick?: (skill: Skill) => void;
};

const ConstellationBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { mode } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.offsetWidth;
        let height = canvas.offsetHeight;
        canvas.width = width;
        canvas.height = height;

        const particles: { x: number, y: number, angle: number, speed: number }[] = [];
        
        let particleCount = Math.floor((width * height) / 8000); 

        const initParticles = () => {
            particles.length = 0;
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    angle: Math.random() * Math.PI * 2,
                    speed: Math.random() * 0.4 + 0.1
                });
            }
        };

        initParticles();

        let mouseX = -1000;
        let mouseY = -1000;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        };
        const handleMouseLeave = () => {
            mouseX = -1000;
            mouseY = -1000;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseLeave);

        let animationFrameId: number;
        const render = () => {
            ctx.clearRect(0, 0, width, height);
            
            ctx.fillStyle = mode === 'dark' ? 'rgba(200, 230, 255, 0.8)' : 'rgba(100, 102, 241, 0.8)';
            ctx.lineWidth = 1.0;

            for (let i = 0; i < particleCount; i++) {
                const p = particles[i];
                
                p.angle += (Math.random() - 0.5) * 0.06;
                let vx = Math.cos(p.angle) * p.speed;
                let vy = Math.sin(p.angle) * p.speed;

                const dxMouse = mouseX - p.x;
                const dyMouse = mouseY - p.y;
                const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
                
                if (distMouse < 200) {
                    const force = (200 - distMouse) / 200;
                    vx -= (dxMouse / distMouse) * force * 2;
                    vy -= (dyMouse / distMouse) * force * 2;
                }

                p.x += vx;
                p.y += vy;

                if (p.x < -100) p.x = width + 100;
                else if (p.x > width + 100) p.x = -100;
                if (p.y < -100) p.y = height + 100;
                else if (p.y > height + 100) p.y = -100;

                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
                ctx.fill();

                for (let j = i + 1; j < particleCount; j++) {
                    const p2 = particles[j];
                    const distX = p.x - p2.x;
                    const distY = p.y - p2.y;
                    const dist = Math.sqrt(distX * distX + distY * distY);
                    
                    if (dist < 200) {
                        ctx.beginPath();
                        ctx.strokeStyle = mode === 'dark' 
                            ? `rgba(100, 200, 255, ${0.4 - (dist / 200) * 0.4})`
                            : `rgba(99, 102, 241, ${0.4 - (dist / 200) * 0.4})`;
                        ctx.moveTo(p.x, p.y);
                        
                        const midX = p.x + distX / 2 + (Math.sin(p.angle) * dist * 0.1);
                        const midY = p.y + distY / 2 + (Math.cos(p.angle) * dist * 0.1);
                        ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        const handleResize = () => {
            if (!canvas.parentElement) return;
            width = canvas.parentElement.offsetWidth;
            height = canvas.parentElement.offsetHeight;
            canvas.width = width;
            canvas.height = height;
            particleCount = Math.floor((width * height) / 8000);
            initParticles();
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-80" />;
};


// Updated Soft Dark Slate colors "Un peu plus clair"
const getThemeColor = (status: string) => {
    if (status === 'locked') return { 
        bg: 'var(--surface)', 
        border: 'var(--border)', 
        text: 'var(--text-muted)', 
        shadow: 'none', 
        glow: 'transparent',
        accent: 'var(--surface-hover)'
    };
    if (status === 'completed') return { 
        bg: 'var(--surface)', 
        border: 'var(--accent)', 
        text: 'var(--accent)', 
        shadow: '0 0 20px var(--accent-glow)', 
        glow: 'var(--accent)',
        accent: 'var(--accent)'
    };
    // Available / Unlocked (Cyan)
    return { 
        bg: 'var(--surface)', 
        border: 'var(--neon-cyan)', 
        text: 'var(--neon-cyan)', 
        shadow: '0 0 20px var(--accent-glow)', 
        glow: 'var(--neon-cyan)',
        accent: 'var(--neon-cyan)'
    };
};const SkillNode = ({ skill, status, active, onClick }: { skill: Skill, status: string, active: boolean, onClick: () => void }) => {
    const isCompleted = status === 'completed';
    const isLocked = status === 'locked';
    const theme = getThemeColor(status);

    return (
        <div 
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`group absolute inset-0 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all duration-500
                ${isLocked ? 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100' : 'z-20'}`}
        >
            <div className="relative">
                {/* Orbital Rings - Animating for completed/active skills */}
                {!isLocked && (
                    <>
                        <div className={`absolute inset-[-8px] rounded-full border border-dashed animate-[spin_20s_linear_infinite] opacity-20`}
                             style={{ borderColor: theme.border }} />
                        <div className={`absolute inset-[-14px] rounded-full border border-dotted animate-[spin_30s_linear_infinite_reverse] opacity-10`}
                             style={{ borderColor: theme.border }} />
                    </>
                )}

                {/* Main Node - Circle */}
                <div 
                    className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500 border-2 shadow-2xl overflow-hidden
                        ${active ? 'scale-110' : 'group-hover:scale-105'}`}
                    style={{
                        backgroundColor: theme.bg,
                        borderColor: active ? theme.border : `${theme.border}44`, // semi-transparent border unless active
                        color: theme.text,
                        boxShadow: active ? theme.shadow : 'none'
                    }}
                >
                    {/* Inner Glow */}
                    {!isLocked && (
                        <div className="absolute inset-0 bg-gradient-to-t from-current to-transparent opacity-5" />
                    )}

                    <div className={`relative z-10 transition-transform duration-500 flex items-center justify-center ${active ? 'scale-110' : ''}`}>
                        <SkillIcon name={skill.icon} status={status} isFinal={skill.is_final} size={24} className="md:w-7 md:h-7" />
                    </div>
                    
                    {/* Progress Fill Effect removed as per user request (no blinking/clignote) */}
                </div>

                {/* Pulsating dot removed as per user request */}
            </div>
        </div>
    );
};

export default function SkillTree({
    skills,
    prereqs,
    skillModules,
    modules,
    userModules,
    completedSkills,
    passedExams,
    onSkillClick
}: SkillTreeProps) {
    const [activeModuleId, setActiveModuleId] = useState<string>('intro');
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

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

    const groupedSkills = useMemo(() => {
        const groups: Record<string, Skill[]> = {};
        
        // Get unique categories from modules
        const categories = Array.from(new Set(modules.map(m => m.category || 'Autres')));
        
        categories.forEach(cat => {
            // Find all modules in this category
            const categoryModuleIds = modules.filter(m => m.category === cat).map(m => m.id);
            
            // Find all skills linked to any of these modules
            const categorySkills = skills.filter(s => 
                skillModules.some(sm => sm.skill_id === s.id && categoryModuleIds.includes(sm.module_id))
            );
            
            if (categorySkills.length > 0) groups[cat] = categorySkills;
        });

        const assignedSkillIds = new Set(skillModules.map(sm => sm.skill_id));
        const orphanSkills = skills.filter(s => !assignedSkillIds.has(s.id));
        if (orphanSkills.length > 0) groups['intro'] = orphanSkills;
        
        return groups;
    }, [skills, skillModules, modules]);

    const categories = Object.keys(groupedSkills).filter(cat => cat !== 'intro').sort();
    const activeSkills = groupedSkills[activeModuleId] || [];

    // Initialize activeModuleId if it's the first time
    useEffect(() => {
        if (activeModuleId === 'intro' && categories.length > 0 && !groupedSkills['intro']) {
            setActiveModuleId(categories[0]);
        }
    }, [categories]);
    const selectedSkill = activeSkills.find(s => s.id === selectedSkillId) || null;

    useEffect(() => {
        setSelectedSkillId(null);
    }, [activeModuleId]);

    const graphData = useMemo(() => {
        const NODE_WIDTH = 100;
        const NODE_HEIGHT = 100;
        const GAP_X = 60; 
        const GAP_Y = 60;

        const g = new dagre.graphlib.Graph();
        g.setGraph({
            rankdir: 'TB', 
            nodesep: GAP_X,
            ranksep: GAP_Y,
            edgesep: GAP_X,
            marginx: 0,
            marginy: 0,
            align: 'UL'
        });
        g.setDefaultEdgeLabel(() => ({}));

        const skillMap = new Map<string, Skill>();
        activeSkills.forEach(s => {
            skillMap.set(s.id, s);
            g.setNode(s.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
        });

        const parents = new Map<string, string[]>();
        activeSkills.forEach(s => parents.set(s.id, []));

        prereqs.forEach(p => {
            if (skillMap.has(p.skill_id) && skillMap.has(p.prerequisite_skill_id)) {
                parents.get(p.skill_id)!.push(p.prerequisite_skill_id);
                g.setEdge(p.prerequisite_skill_id, p.skill_id);
            }
        });

        dagre.layout(g);

        const layout = new Map<string, { x: number, y: number }>();
        let maxX = 0;
        let maxY = 0;
        let minX = Infinity;
        let minY = Infinity;

        g.nodes().forEach(v => {
            const node = g.node(v);
            if (node) {
                const x = node.x - node.width / 2;
                const y = node.y - node.height / 2;
                layout.set(v, { x, y });
                
                if (node.x + node.width / 2 > maxX) maxX = node.x + node.width / 2;
                if (node.y + node.height / 2 > maxY) maxY = node.y + node.height / 2;
                if (node.x - node.width / 2 < minX) minX = node.x - node.width / 2;
                if (node.y - node.height / 2 < minY) minY = node.y - node.height / 2;
            }
        });

        const offsetX = minX === Infinity ? 0 : minX;
        const offsetY = minY === Infinity ? 0 : minY;

        layout.forEach((pos) => {
            pos.x -= offsetX;
            pos.y -= offsetY;
        });

        const width = maxX - offsetX;
        const height = maxY - offsetY;

        const edges: { sourceId: string, targetId: string, path: string }[] = [];
        g.edges().forEach(e => {
            const sourceNode = layout.get(e.v);
            const targetNode = layout.get(e.w);
            
            if(sourceNode && targetNode) {
                const startX = sourceNode.x + NODE_WIDTH / 2 + 100;
                const startY = sourceNode.y + NODE_HEIGHT / 2 + 100 + 10; 
                const endX = targetNode.x + NODE_WIDTH / 2 + 100;
                const endY = targetNode.y + NODE_HEIGHT / 2 + 100 - 30;
                
                const midY = startY + (endY - startY) / 2;

                let pathD = `M ${startX} ${startY} V ${midY}`;
                
                if (Math.abs(startX - endX) > 5) {
                    const radius = 10;
                    const hDir = endX > startX ? 1 : -1;
                    const startRadiusX = startX + (radius * hDir);
                    const endRadiusX = endX - (radius * hDir);
                    
                    pathD += ` M ${startX} ${startY} V ${midY - radius} Q ${startX} ${midY} ${startRadiusX} ${midY} H ${endRadiusX} Q ${endX} ${midY} ${endX} ${midY + radius} V ${endY}`;
                } else {
                    pathD = `M ${startX} ${startY} V ${endY}`;
                }

                edges.push({
                    sourceId: e.v,
                    targetId: e.w,
                    path: pathD
                });
            }
        });

        return { 
            parents, layout, edges,
            totalWidth: width, totalHeight: height, 
            NODE_WIDTH, NODE_HEIGHT 
        };
    }, [activeSkills, prereqs]);

    const validModules = modules.filter(m => groupedSkills[m.id]);

    return (
        <div 
            className="relative w-full h-[calc(100dvh-70px)] md:h-[calc(100vh-80px)] min-h-[600px] z-0 overflow-hidden bg-background text-[#f1f5f9] flex flex-col font-mono select-none mesh-gradient"
            onClick={() => setSelectedSkillId(null)}
        >
            {/* Base grid - Unified with theme */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

            {/* Glowing Nebulas */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#60a5fa]/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-[#818cf8]/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

            {/* Live JS Animated Constellations */}
            <ConstellationBackground />

            {categories.length > 0 && (
                <nav className="absolute top-4 left-4 right-4 md:right-auto md:w-auto z-40 flex items-center p-2 bg-surface/70 border border-border backdrop-blur-2xl shadow-xl rounded-2xl md:rounded-[12px] overflow-x-auto no-scrollbar pointer-events-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex gap-2 w-max">
                        {categories.map(category => (
                            <button 
                                key={category}
                                onClick={() => setActiveModuleId(category)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all max-w-[160px] truncate
                                    ${activeModuleId === category ? 'bg-[#38bdf8] text-[#0f172a] shadow-[0_0_15px_rgba(56,189,248,0.3)] md:scale-105' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </nav>
            )}

            <main className="relative z-10 flex-1 flex overflow-hidden">
                <div className="w-full h-full overflow-auto p-4 md:p-12 pb-[400px] md:pb-12 custom-scrollbar relative flex items-center justify-center pointer-events-auto"
                     onClick={(e) => {
                         if(e.target === e.currentTarget) setSelectedSkillId(null);
                     }}
                >
                    <div 
                        className="relative"
                        style={{
                            width: `${Math.max(window.innerWidth < 768 ? 100 : 200, graphData.totalWidth) + 200}px`,
                            height: `${Math.max(window.innerWidth < 768 ? 100 : 200, graphData.totalHeight) + 200}px`,
                            minWidth: `${Math.max(window.innerWidth < 768 ? 100 : 200, graphData.totalWidth) + 200}px`,
                            minHeight: `${Math.max(window.innerWidth < 768 ? 100 : 200, graphData.totalHeight) + 200}px`
                        }}
                    >
                        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                            {graphData.edges.map(edge => {
                                const pId = edge.sourceId;
                                const skillId = edge.targetId;
                                
                                const isParentCompleted = getSkillStatus(pId) === 'completed';
                                const isTargetLocked = getSkillStatus(skillId) === 'locked';
                                const srcTheme = getThemeColor(getSkillStatus(pId));

                                return (
                                    <g key={`${pId}-${skillId}`}>
                                        <path 
                                            d={edge.path}
                                            fill="none"
                                            strokeLinejoin="round"
                                            strokeLinecap="round"
                                            stroke={isParentCompleted ? srcTheme.border : 'var(--border)'}
                                            strokeWidth={isParentCompleted && !isTargetLocked ? "1.5" : "1"}
                                            className={`transition-all duration-1000 ${isTargetLocked ? 'stroke-dasharray-[2_4]' : ''}`}
                                            style={{
                                                filter: isParentCompleted && !isTargetLocked ? `drop-shadow(0 0 3px ${srcTheme.border})` : 'none',
                                                opacity: isParentCompleted ? 0.8 : 0.3
                                            }}
                                        />
                                    </g>
                                );
                            })}
                        </svg>

                        {activeSkills.map(skill => {
                            const pos = graphData.layout.get(skill.id);
                            if (!pos) return null;

                            return (
                                <div 
                                    key={skill.id}
                                    className="absolute transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                                    style={{
                                        left: pos.x + 100,
                                        top: pos.y + 100,
                                        width: graphData.NODE_WIDTH,
                                        height: graphData.NODE_HEIGHT
                                    }}
                                >
                                    <SkillNode 
                                        skill={skill}
                                        status={getSkillStatus(skill.id)}
                                        active={selectedSkillId === skill.id}
                                        onClick={() => setSelectedSkillId(skill.id)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div 
                    onClick={e => e.stopPropagation()}
                    className={`fixed md:absolute inset-x-0 bottom-0 top-auto h-[70vh] md:h-full md:inset-auto md:right-0 md:w-[400px] md:max-w-[400px] w-full bg-surface/95 border-t md:border-t-0 md:border-l border-border p-6 md:p-10 flex flex-col justify-start z-50 transition-[transform,opacity] duration-300 md:duration-500 shadow-[0_-30px_50px_rgba(0,0,0,0.1)] md:shadow-[-30px_0_50px_rgba(0,0,0,0.1)] rounded-t-[24px] md:rounded-none backdrop-blur-2xl
                    ${selectedSkill ? 'translate-y-0 md:translate-x-0 opacity-100' : 'translate-y-full md:translate-x-full md:translate-y-0 opacity-0 md:opacity-100 pointer-events-none'}`}
                >
                    <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6 md:hidden flex-shrink-0" />

                    {selectedSkill && (
                        <>
                            <button 
                                onClick={() => setSelectedSkillId(null)}
                                className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 rounded-full bg-surface-hover hover:bg-border/20 flex items-center justify-center text-text-muted transition-colors"
                            >
                                <X size={16} />
                            </button>

                            <div className="flex flex-col flex-1 min-h-0 space-y-6 md:space-y-8 mt-2 md:mt-0 font-sans">
                                <div className="space-y-4 md:space-y-6 flex-shrink-0 border-b border-border pb-4 md:pb-6">
                                    <div className="flex gap-4 md:gap-5 items-start pr-8 md:pr-0">
                                        <div 
                                            className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0 rounded-full flex items-center justify-center border-2"
                                            style={{
                                                borderColor: getThemeColor(getSkillStatus(selectedSkill.id)).border,
                                                backgroundColor: 'var(--surface)',
                                                color: getThemeColor(getSkillStatus(selectedSkill.id)).text
                                            }}    
                                        >
                                            <SkillIcon name={selectedSkill.icon} status={getSkillStatus(selectedSkill.id)} isFinal={selectedSkill.is_final} size={24} />
                                        </div>
                                        <div className="pt-2">
                                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-text leading-tight break-words">
                                                {selectedSkill.name}
                                            </h2>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 md:pr-4 space-y-6 md:space-y-8 pb-10">
                                    <div className="space-y-3">
                                        <p className="text-[14px] md:text-[15px] text-text-muted leading-relaxed font-medium">
                                            {selectedSkill.description}
                                        </p>
                                    </div>

                                    {prereqs.filter(p => p.skill_id === selectedSkill.id).length > 0 && (
                                        <div className="space-y-3 md:space-y-4 pt-4">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted border-b border-border pb-2">
                                                [REQ_DEPENDENCIES]
                                            </h4>
                                            <div className="flex flex-col gap-2 pt-1">
                                                {prereqs.filter(p => p.skill_id === selectedSkill.id).map(p => {
                                                    const preSkill = skills.find(s => s.id === p.prerequisite_skill_id);
                                                    const isPreMet = getSkillStatus(p.prerequisite_skill_id) === 'completed';
                                                    
                                                    return (
                                                        <div 
                                                            key={p.prerequisite_skill_id} 
                                                            className={`flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded-[10px] border text-[11px] md:text-[12px] font-bold tracking-wide transition-all
                                                                ${isPreMet ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#f8fafc]' : 'bg-[#0f172a]/50 border-[#334155] text-[#94a3b8]'}`}
                                                        >
                                                            <div className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center ${isPreMet ? 'bg-[#10b981] text-[#0f172a]' : 'bg-[#334155] text-[#94a3b8]'}`}>
                                                                {isPreMet ? <CheckCircle className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                                            </div>
                                                            <span>{preSkill?.name || 'Inconnu'}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
