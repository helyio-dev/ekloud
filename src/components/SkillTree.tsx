import React, { useMemo, useState, useEffect, useRef } from 'react';
import dagre from 'dagre';
import * as LucideIcons from 'lucide-react';
import { Lock, CheckCircle, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * affiche une icône lucide ou un logo de marque externe via simple icons.
 * gère les états verrouillé/débloqué visuellement.
 */
const SkillIcon = ({ name, status, isFinal, size = 20, className }: { name: string, status: string, isFinal: boolean, size?: number, className?: string }) => {
    const { mode } = useTheme();
    if (status === 'locked') return <Lock size={size} className={className} />;
    
    // support des icônes cdn externes (url)
    if (name && (name.startsWith('http') || name.startsWith('https'))) {
        return <img src={name} alt="" style={{ width: size, height: size }} className={className} />;
    }

    const iconName = name
        ? name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('')
        : '';
    const Icon = (LucideIcons as any)[iconName];
    
    if (Icon) return <Icon size={size} className={className} />;

    // repli sur le cdn simple icons pour les technologies tierces
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
    skillsStatus: Record<string, 'completed' | 'available' | 'unlocked' | 'unlocked_needs_exam' | 'locked'>;
    onSkillClick?: (skill: Skill) => void;
};

/**
 * fond de constellation animé en canvas pour l'immersion nebula.
 * particules interactives réagissant au mouvement de la souris.
 */
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
        let particleCount = Math.floor((width * height) / 10000); 

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
            ctx.fillStyle = mode === 'dark' ? 'rgba(200, 230, 255, 0.4)' : 'rgba(100, 102, 241, 0.4)';
            ctx.lineWidth = 0.8;

            for (let i = 0; i < particleCount; i++) {
                const p = particles[i];
                p.angle += (Math.random() - 0.5) * 0.05;
                let vx = Math.cos(p.angle) * p.speed;
                let vy = Math.sin(p.angle) * p.speed;

                const dxMouse = mouseX - p.x;
                const dyMouse = mouseY - p.y;
                const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
                
                if (distMouse < 150) {
                    const force = (150 - distMouse) / 150;
                    vx -= (dxMouse / distMouse) * force * 1.5;
                    vy -= (dyMouse / distMouse) * force * 1.5;
                }

                p.x += vx;
                p.y += vy;

                if (p.x < -10) p.x = width + 10;
                else if (p.x > width + 10) p.x = -10;
                if (p.y < -10) p.y = height + 10;
                else if (p.y > height + 10) p.y = -10;

                ctx.beginPath();
                ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
                ctx.fill();

                for (let j = i + 1; j < particleCount; j++) {
                    const p2 = particles[j];
                    const distX = p.x - p2.x;
                    if (Math.abs(distX) > 150) continue; // fail-fast horizontal
                    const distY = p.y - p2.y;
                    if (Math.abs(distY) > 150) continue; // fail-fast vertical
                    
                    const dist = Math.sqrt(distX * distX + distY * distY);
                    
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = mode === 'dark' 
                            ? `rgba(100, 200, 255, ${0.15 - (dist / 150) * 0.15})`
                            : `rgba(99, 102, 241, ${0.15 - (dist / 150) * 0.15})`;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
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
            particleCount = Math.floor((width * height) / 10000);
            initParticles();
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, [mode]);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-40" />;
};

/**
 * retourne les variables de style css en fonction de l'état du succès.
 */
const getThemeColor = (status: string) => {
    if (status === 'locked') return { 
        bg: 'var(--surface)', 
        border: 'var(--border)', 
        text: 'var(--text-muted)', 
        shadow: 'none',
    };
    if (status === 'completed') return { 
        bg: 'var(--surface)', 
        border: 'var(--accent)', 
        text: 'var(--accent)', 
        shadow: '0 0 30px var(--accent-glow)',
    };
    return { 
        bg: 'var(--surface)', 
        border: 'var(--neon-cyan)', 
        text: 'var(--neon-cyan)', 
        shadow: '0 0 30px var(--accent-glow)',
    };
};

/**
 * un nœud individuel dans l'arbre des compétences.
 * visuellement riche avec des animations de survol.
 */
const SkillNode = ({ skill, status, active, onClick }: { skill: Skill, status: string, active: boolean, onClick: () => void }) => {
    const isLocked = status === 'locked';
    const theme = getThemeColor(status);

    return (
        <div 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`group absolute inset-0 cursor-pointer flex flex-col items-center justify-center transition-all duration-700 ${isLocked ? 'grayscale opacity-50' : 'z-20'}`}
        >
            <div className="relative">
                {/* anneaux décoratifs orbitaux */}
                {!isLocked && (
                    <>
                        <div className="absolute inset-[-12px] rounded-full border border-dashed animate-[spin_25s_linear_infinite] opacity-10" style={{ borderColor: theme.border }} />
                        <div className="absolute inset-[-20px] rounded-full border border-dotted animate-[spin_40s_linear_infinite_reverse] opacity-5" style={{ borderColor: theme.border }} />
                    </>
                )}

                {/* conteneur principal du nœud */}
                <div 
                    className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-700 border-2 shadow-2xl ${active ? 'scale-110' : 'group-hover:scale-105'}`}
                    style={{
                        backgroundColor: theme.bg,
                        borderColor: active ? theme.border : `${theme.border}33`,
                        color: theme.text,
                        boxShadow: active ? theme.shadow : 'none'
                    }}
                >
                    <div className={`relative z-10 transition-transform duration-700 flex items-center justify-center ${active ? 'scale-110' : ''}`}>
                        <SkillIcon name={skill.icon} status={status} isFinal={skill.is_final} size={28} />
                    </div>
                </div>
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
    skillsStatus,
    onSkillClick
}: SkillTreeProps) {
    const [activeCategoryId, setActiveCategoryId] = useState<string>('intro');
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

    // suppression de getSkillStatus interne (utilisation de skillsStatus passé en prop pour la perf)

    // regroupement des compétences par catégorie de module
    const groupedSkills = useMemo(() => {
        const groups: Record<string, Skill[]> = {};
        const categories = Array.from(new Set(modules.map(m => m.category || 'autres')));
        
        categories.forEach(cat => {
            const categoryModuleIds = modules.filter(m => (m.category || 'autres') === cat).map(m => m.id);
            const categorySkills = skills.filter(s => skillModules.some(sm => sm.skill_id === s.id && categoryModuleIds.includes(sm.module_id)));
            if (categorySkills.length > 0) groups[cat] = categorySkills;
        });

        const assignedSkillIds = new Set(skillModules.map(sm => sm.skill_id));
        const orphanSkills = skills.filter(s => !assignedSkillIds.has(s.id));
        if (orphanSkills.length > 0) groups['intro'] = orphanSkills;
        
        return groups;
    }, [skills, skillModules, modules]);

    const categories = Object.keys(groupedSkills).filter(cat => cat !== 'intro').sort();
    const activeSkills = groupedSkills[activeCategoryId] || [];

    useEffect(() => {
        if (activeCategoryId === 'intro' && categories.length > 0 && !groupedSkills['intro']) {
            setActiveCategoryId(categories[0]);
        }
    }, [categories, activeCategoryId, groupedSkills]);

    useEffect(() => {
        setSelectedSkillId(null);
    }, [activeCategoryId]);

    // calcul automatique du layout avec dagre (moteur de graphe)
    const graphData = useMemo(() => {
        const NODE_SIZE = 120;
        const GAP = 100;

        const g = new dagre.graphlib.Graph();
        g.setGraph({ rankdir: 'TB', nodesep: GAP, ranksep: GAP, marginx: 100, marginy: 100 });
        g.setDefaultEdgeLabel(() => ({}));

        activeSkills.forEach(s => g.setNode(s.id, { width: NODE_SIZE, height: NODE_SIZE }));
        prereqs.forEach(p => {
            if (activeSkills.some(s => s.id === p.skill_id) && activeSkills.some(s => s.id === p.prerequisite_skill_id)) {
                g.setEdge(p.prerequisite_skill_id, p.skill_id);
            }
        });

        dagre.layout(g);

        const layout = new Map<string, { x: number, y: number }>();
        g.nodes().forEach(v => {
            const node = g.node(v);
            layout.set(v, { x: node.x - node.width / 2, y: node.y - node.height / 2 });
        });

        const edges: { sourceId: string, targetId: string, path: string }[] = [];
        g.edges().forEach(e => {
            const source = layout.get(e.v)!;
            const target = layout.get(e.w)!;
            const startX = source.x + NODE_SIZE / 2;
            const startY = source.y + NODE_SIZE;
            const endX = target.x + NODE_SIZE / 2;
            const endY = target.y;
            
            const midY = startY + (endY - startY) / 2;
            const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
            edges.push({ sourceId: e.v, targetId: e.w, path });
        });

        const graphInfo = g.graph();
        return { layout, edges, width: graphInfo.width || 800, height: graphInfo.height || 800, NODE_SIZE };
    }, [activeSkills, prereqs]);

    return (
        <div className="relative w-full h-full overflow-hidden bg-background select-none font-sans" onClick={() => setSelectedSkillId(null)}>
            {/* nébuleuses décoratives */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />

            <ConstellationBackground />

            {/* navigation par catégorie de module */}
            {categories.length > 0 && (
                <nav className="absolute top-6 left-6 right-6 md:right-auto z-[100] flex items-center p-2 bg-surface/60 border border-border backdrop-blur-2xl shadow-2xl rounded-2xl overflow-x-auto no-scrollbar pointer-events-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
                        {categories.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setActiveCategoryId(cat)}
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap
                                    ${activeCategoryId === cat ? 'bg-accent text-white shadow-xl scale-105' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </nav>
            )}

            <main className="w-full h-full overflow-auto custom-scrollbar relative flex items-center justify-center p-20 pointer-events-auto">
                <div className="relative" style={{ width: graphData.width, height: graphData.height }}>
                    {/* rendu des liens de dépendance */}
                    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        {graphData.edges.map(edge => {
                            const status = skillsStatus[edge.sourceId];
                            const isParentCompleted = status === 'completed';
                            const isTargetLocked = skillsStatus[edge.targetId] === 'locked';
                            const theme = getThemeColor(status);

                            return (
                                <g key={`${edge.sourceId}-${edge.targetId}`}>
                                    <path 
                                        d={edge.path}
                                        fill="none"
                                        stroke={isParentCompleted ? theme.border : 'var(--border)'}
                                        strokeWidth={isParentCompleted && !isTargetLocked ? "2" : "1"}
                                        className="transition-all duration-1000"
                                        style={{
                                            filter: isParentCompleted && !isTargetLocked ? `drop-shadow(0 0 5px ${theme.border})` : 'none',
                                            opacity: isParentCompleted ? 1 : 0.2
                                        }}
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {/* rendu des nœuds de succès */}
                    {activeSkills.map(skill => {
                        const pos = graphData.layout.get(skill.id);
                        if (!pos) return null;
                        return (
                            <div 
                                key={skill.id}
                                className="absolute"
                                style={{ left: pos.x, top: pos.y, width: graphData.NODE_SIZE, height: graphData.NODE_SIZE }}
                            >
                                <SkillNode 
                                    skill={skill}
                                    status={skillsStatus[skill.id]}
                                    active={selectedSkillId === skill.id}
                                    onClick={() => {
                                        setSelectedSkillId(skill.id);
                                        onSkillClick?.(skill);
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
