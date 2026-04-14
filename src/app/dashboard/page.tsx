import SkillTree, { Skill, SkillPrereq, SkillModule } from '@/components/SkillTree';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, BookOpen, CheckCircle, X, Sparkles, Lock, Trophy, Target } from 'lucide-react';
import { addXp } from '@/lib/gamification';

/**
 * icône utilitaire pour la navigation transversale.
 */
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

/**
 * tableau de bord principal (dashboard).
 * interface centrale affichant l'arbre de progression technologique (skill tree).
 * gère la synchronisation des succès, le déblocage des paliers et la visualisation des prérequis.
 */
export default function Dashboard() {
    const { user, xp, streak, refreshProfile, isLoading: authLoading } = useAuth();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [prereqs, setPrereqs] = useState<SkillPrereq[]>([]);
    const [skillModules, setSkillModules] = useState<SkillModule[]>([]);
    const [modules, setModules] = useState<{ id: string, title: string }[]>([]);
    const [userModules, setUserModules] = useState<Record<string, boolean>>({});
    const [completedSkills, setCompletedSkills] = useState<Set<string>>(new Set());
    const [passedExams, setPassedExams] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const navigate = useNavigate();

    // référence temporelle pour éviter les multiples appels réseau (debouncing disk io)
    const lastFetchTimeRef = useRef(0);

    useEffect(() => {
        /**
         * récupère l'ensemble des données nécessaires à la construction de l'arbre.
         * parallélisation des requêtes supabase pour minimiser la latence perçue.
         */
        async function fetchData() {
            if (!user) return;
            const now = Date.now();
            if (now - lastFetchTimeRef.current < 2000) return;

            lastFetchTimeRef.current = now;
            setIsLoading(true);
            try {
                const [
                    { data: skillsData },
                    { data: prereqsData },
                    { data: smData },
                    { data: moduleData },
                    { data: umData },
                    { data: usData },
                    { data: examsData },
                ] = await Promise.all([
                    supabase.from('skills').select('*'),
                    supabase.from('skill_prerequisites').select('*'),
                    supabase.from('skill_modules').select('*'),
                    supabase.from('modules').select('id, title, order_index').order('order_index', { ascending: true }),
                    supabase.from('user_modules').select('module_id, completed').eq('user_id', user.id),
                    supabase.from('user_skills').select('skill_id').eq('user_id', user.id),
                    supabase.from('quiz_attempts').select('module_id, is_exam, passed, created_at').eq('user_id', user.id).eq('passed', true),
                ]);

                setSkills(skillsData || []);
                setPrereqs(prereqsData || []);
                setSkillModules(smData || []);
                setModules(moduleData || []);
                setCompletedSkills(new Set(usData?.map(us => us.skill_id) || []));

                // gestion de la rétrocompatibilité des anciens examens validés
                const legacyCutoff = new Date('2026-03-09T23:00:00Z');
                setPassedExams(new Set(examsData?.filter(e => e.is_exam || new Date(e.created_at) < legacyCutoff).map(e => e.module_id) || []));

                // mapping des modules complétés par l'utilisateur
                const umMap: Record<string, boolean> = {};
                umData?.forEach(um => { umMap[um.module_id] = um.completed; });
                examsData?.forEach(e => { if (!e.is_exam && e.passed) umMap[e.module_id] = true; });
                setUserModules(umMap);
            } catch (err) {
                console.error("erreur de chargement du dashboard:", err);
            } finally {
                setIsLoading(false);
            }
        }

        if (!authLoading && user) fetchData();

        // désactivation du scroll global pour une navigation immersive dans l'arbre
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, [user?.id, authLoading]);

    /**
     * calcule dynamiquement l'état de tous les noeuds selon les règles métier.
     * centralisé dans un useMemo pour éviter les calculs récursifs lourds à chaque render.
     */
    const skillsStatus = useMemo(() => {
        const statusMap: Record<string, 'completed' | 'available' | 'unlocked' | 'unlocked_needs_exam' | 'locked'> = {};

        const computeStatus = (skillId: string, visited = new Set<string>()): any => {
            if (statusMap[skillId]) return statusMap[skillId];
            if (completedSkills.has(skillId)) return 'completed';
            if (visited.has(skillId)) return 'locked';

            const newVisited = new Set(visited);
            newVisited.add(skillId);

            // prérequis directs
            const skillPrereqs = prereqs.filter(p => p.skill_id === skillId);
            const prereqsMet = skillPrereqs.every(p => computeStatus(p.prerequisite_skill_id, newVisited) === 'completed');

            if (!prereqsMet && skillPrereqs.length > 0) return 'locked';

            // modules associés
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

        skills.forEach(s => {
            statusMap[s.id] = computeStatus(s.id);
        });

        return statusMap;
    }, [skills, prereqs, skillModules, userModules, completedSkills, passedExams]);

    /**
     * gère l'interaction utilisateur sur un noeud de l'arbre.
     * déclenche le déblocage de récompenses xp si possible.
     */
    const handleSkillAction = async (skill: Skill) => {
        const status = skillsStatus[skill.id];

        if (status === 'available' && !completedSkills.has(skill.id)) {
            if (user) {
                const amount = skill.is_final ? 100 : 25;
                const { error: xpError } = await addXp(supabase, user.id, xp || 0, amount, streak || 0);

                if (!xpError) {
                    const { error: usError } = await supabase
                        .from('user_skills')
                        .insert([{ user_id: user.id, skill_id: skill.id }]);

                    if (!usError) {
                        await refreshProfile();
                        setCompletedSkills(prev => new Set(prev).add(skill.id));
                    }
                }
            }
        }
        setSelectedSkill(skill);
    };

    if (isLoading) {
        return (
            <div className="flex-grow flex items-center justify-center bg-background">
                <Loader2 className="w-12 h-12 text-accent animate-spin opacity-20" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-73px)] bg-background relative overflow-hidden flex flex-col select-none mesh-gradient font-sans">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none" />

            <SkillTree
                skills={skills}
                prereqs={prereqs}
                skillModules={skillModules}
                modules={modules}
                userModules={userModules}
                completedSkills={completedSkills}
                passedExams={passedExams}
                skillsStatus={skillsStatus}
                onSkillClick={handleSkillAction}
            />

            {/* Panneau de détail industriel */}
            {selectedSkill && (() => {
                const status = skillsStatus[selectedSkill.id];
                const skillModulesData = skillModules.filter(sm => sm.skill_id === selectedSkill.id);

                return (
                    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-surface border-l border-border z-[1000] flex flex-col shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden selection:bg-accent/30">
                        {/* Header Minimal */}
                        <header className="h-20 px-8 border-b border-border/60 flex items-center justify-between shrink-0 bg-background/20">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                                    status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                                    status === 'available' ? 'bg-accent/10 border-accent/30 text-accent animate-pulse' :
                                    'bg-background border-border/80 text-text-muted opacity-40'
                                } shadow-sm`}>
                                    {status === 'completed' ? <CheckCircle size={20} /> : <Sparkles size={20} />}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 leading-none">Status Code</p>
                                    <p className={`text-[11px] font-black uppercase tracking-widest leading-none ${
                                        status === 'completed' ? 'text-emerald-500' : 
                                        status === 'available' ? 'text-accent' : 
                                        'text-text-muted'
                                    }`}>
                                        {status.replace(/_/g, ' ')}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedSkill(null)} className="p-2.5 hover:bg-background border border-border/60 rounded-lg transition-all active:scale-90 text-text-muted hover:text-text">
                                <X size={18} />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                            {/* Identité */}
                            <section className="space-y-3">
                                <h2 className="text-3xl font-black tracking-tight text-text uppercase leading-none">
                                    {selectedSkill.name}
                                </h2>
                                <p className="text-sm text-text-muted leading-relaxed font-medium italic opacity-70">
                                    {selectedSkill.description || "Instruction pédagogique non définie."}
                                </p>
                            </section>

                            {/* Récompense */}
                            <div className="flex items-center justify-between p-5 bg-background border border-border/60 rounded-xl group overflow-hidden">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-accent/5 border border-accent/20 rounded-lg flex items-center justify-center text-accent">
                                        <Trophy size={18} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/60">Achievement Reward</p>
                                        <p className="text-sm font-black uppercase tracking-tight">+{selectedSkill.is_final ? '100' : '25'} XP</p>
                                    </div>
                                </div>
                                {status === 'completed' && <CheckCircle size={16} className="text-emerald-500 opacity-40" />}
                            </div>

                            {/* Objectifs */}
                            {skillModulesData.length > 0 && (
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                                        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                                            <Target size={12} /> Objectifs Requis
                                        </h3>
                                        <span className="text-[9px] font-black text-text-muted/40 uppercase">
                                            {skillModulesData.filter(sm => userModules[sm.module_id]).length} / {skillModulesData.length}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {skillModulesData.map((sm) => {
                                            const mod = modules.find(m => m.id === sm.module_id);
                                            const completed = userModules[sm.module_id];
                                            return (
                                                <button
                                                    key={sm.module_id}
                                                    onClick={() => navigate(`/modules/${sm.module_id}`)}
                                                    className={`w-full flex items-center justify-between p-4 border rounded-xl transition-all text-left group ${
                                                        completed 
                                                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500/80 hover:bg-emerald-500/10' 
                                                        : 'bg-background border-border/60 text-text-muted hover:border-accent/40 hover:bg-surface'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-lg border ${completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-surface border-border/80 group-hover:border-accent/40'} transition-all`}>
                                                            {completed ? <CheckCircle size={14} /> : <BookOpen size={14} />}
                                                        </div>
                                                        <span className="text-[11px] font-black uppercase tracking-tight">{mod?.title || 'Unknown Object'}</span>
                                                    </div>
                                                    <ChevronRight size={12} className="opacity-20 group-hover:opacity-60 transition-all" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Action Bar */}
                        <footer className="p-8 border-t border-border/60 bg-background/20">
                            {status === 'available' ? (
                                <button
                                    onClick={() => handleSkillAction(selectedSkill)}
                                    className="w-full h-16 bg-accent text-white rounded-xl flex items-center justify-center gap-4 shadow-lg shadow-accent/20 hover:brightness-110 active:scale-95 transition-all text-[11px] font-black uppercase tracking-[0.3em]"
                                >
                                    <Sparkles size={16} /> Collecter Succès
                                </button>
                            ) : status === 'locked' || selectedSkill.is_locked ? (
                                <div className="w-full h-16 bg-background border border-border/60 rounded-xl flex items-center justify-center gap-3 text-text-muted/40 text-[11px] font-black uppercase tracking-widest cursor-not-allowed">
                                    <Lock size={16} /> Verrouillé
                                </div>
                            ) : status === 'completed' ? (
                                <div className="w-full h-16 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-3 text-emerald-500/60 text-[11px] font-black uppercase tracking-widest shadow-inner">
                                    <CheckCircle size={16} /> Succès Maîtrisé
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        const targetId = (status === 'unlocked_needs_exam' && selectedSkill.exam_module_id) ? selectedSkill.exam_module_id : (skillModulesData.find(sm => !userModules[sm.module_id])?.module_id || skillModulesData[0].module_id);
                                        navigate(`/modules/${targetId}`);
                                    }}
                                    className="w-full h-16 bg-surface border border-border/60 hover:bg-background hover:border-accent/40 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-accent"
                                >
                                    {status === 'unlocked_needs_exam' ? 'Passer l\'examen' : 'Lancer l\'objectif'}
                                    <ChevronRight size={14} className="opacity-40" />
                                </button>
                            )}
                        </footer>
                    </div>
                );
            })()}
        </div>
    );
}
