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

            {/* panneau latéral d'exploration des détails de compétence */}
            {selectedSkill && (() => {
                const status = skillsStatus[selectedSkill.id];
                const skillModulesData = skillModules.filter(sm => sm.skill_id === selectedSkill.id);

                return (
                    <article className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:-translate-y-1/2 md:right-8 w-full md:w-[600px] max-h-[85vh] md:max-h-[90vh] bg-surface/50 backdrop-blur-[64px] border border-border z-[999] rounded-t-[4rem] md:rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-32 md:slide-in-from-right-32 duration-700 overflow-hidden flex flex-col">
                        <div className="relative z-10 p-10 md:p-14 space-y-10 flex flex-col h-full overflow-y-auto no-scrollbar">
                            <header className="flex justify-between items-start gap-6">
                                <div className="space-y-6">
                                    <div className="flex flex-wrap items-center gap-4">
                                        {status === 'completed' ? (
                                            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 shadow-sm">
                                                <CheckCircle size={14} /> maîtrisé
                                            </div>
                                        ) : status === 'available' ? (
                                            <div className="flex items-center gap-2 px-4 py-1.5 bg-accent/20 border border-accent/40 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-accent animate-pulse shadow-sm">
                                                <Sparkles size={14} /> disponible
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-hover/50 border border-border rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                                                <Lock size={14} /> {status === 'locked' ? 'verrouillé' : 'évolution en cours'}
                                            </div>
                                        )}
                                        {selectedSkill.is_final && <div className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/40 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 shadow-sm flex items-center gap-2"><Trophy size={14} /> palier majeur</div>}
                                    </div>
                                    <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-none text-text uppercase font-equinox drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                                        {selectedSkill.name}
                                    </h2>
                                </div>
                                <button onClick={() => setSelectedSkill(null)} className="p-4 bg-surface-hover/40 hover:bg-surface-hover rounded-full transition-all group active:scale-90" aria-label="fermer les détails">
                                    <X className="w-8 h-8 text-text-muted group-hover:text-text group-hover:rotate-90 transition-all duration-500" />
                                </button>
                            </header>

                            <p className="text-xl md:text-2xl text-text-muted/80 leading-relaxed font-medium max-w-lg">
                                {selectedSkill.description || "maîtrisez cette compétence pour débloquer de nouveaux horizons technologiques."}
                            </p>

                            <aside className="flex items-center gap-8 p-8 bg-surface-hover/30 border border-border/60 rounded-[3rem] shadow-inner">
                                <div className="w-16 h-16 shrink-0 bg-accent/15 rounded-[1.5rem] flex items-center justify-center shadow-lg border border-accent/20">
                                    <Sparkles className="w-8 h-8 text-accent" />
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted opacity-60">récompense de succès</p>
                                    <p className="text-3xl font-black text-text tracking-tight">+{selectedSkill.is_final ? '100' : '25'} XP <span className="text-accent underline decoration-accent/20">collectables</span></p>
                                </div>
                            </aside>

                            {skillModulesData.length > 0 && (
                                <section className="space-y-8">
                                    <header className="flex justify-between items-end px-4">
                                        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.5em] flex items-center gap-3">
                                            <Target size={12} className="text-accent" /> objectifs à atteindre
                                        </h3>
                                        <span className="text-[10px] font-black text-text-muted opacity-40 bg-surface-hover/50 px-2 py-1 rounded">
                                            {skillModulesData.filter(sm => userModules[sm.module_id]).length} / {skillModulesData.length} complétés
                                        </span>
                                    </header>

                                    <div className="flex gap-6 overflow-x-auto pb-8 px-4 snap-x no-scrollbar">
                                        {skillModulesData.map((sm) => {
                                            const mod = modules.find(m => m.id === sm.module_id);
                                            const completed = userModules[sm.module_id];
                                            return (
                                                <article
                                                    key={sm.module_id}
                                                    onClick={() => navigate(`/modules/${sm.module_id}`)}
                                                    className="group shrink-0 w-48 snap-start cursor-pointer group"
                                                >
                                                    <div className={`aspect-[4/5] rounded-[3rem] border transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-2 flex flex-col p-8 justify-between shadow-2xl relative overflow-hidden ${completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/60 bg-surface-hover/30 group-hover:border-accent/40'}`}>
                                                        <div className={`absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000`} />
                                                        <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all duration-700 relative z-10 ${completed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-surface-hover text-text-muted group-hover:bg-accent/20 group-hover:text-accent'}`}>
                                                            {completed ? <CheckCircle size={24} /> : <BookOpen size={24} />}
                                                        </div>
                                                        <div className="space-y-2 relative z-10">
                                                            <h4 className="text-base font-black leading-tight block uppercase tracking-tight group-hover:text-text transition-colors">{mod?.title || 'objectif orbital'}</h4>
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-50 group-hover:opacity-100 transition-opacity">{completed ? 'terminé' : 'en cours'}</span>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            <footer className="mt-auto pt-8">
                                {status === 'available' ? (
                                    <button
                                        onClick={() => handleSkillAction(selectedSkill)}
                                        className="group w-full rounded-[3rem] bg-accent py-10 flex items-center justify-center gap-5 shadow-[0_20px_50px_rgba(99,102,241,0.3)] active:scale-95 transition-all hover:shadow-[0_25px_60px_rgba(99,102,241,0.4)]"
                                    >
                                        <Sparkles className="w-8 h-8 text-white animate-pulse" />
                                        <span className="text-2xl font-black text-white uppercase tracking-[0.4em]">collecter succès</span>
                                    </button>
                                ) : (selectedSkill.is_locked) ? (
                                    <div className="w-full py-10 bg-red-500/5 border border-red-500/20 rounded-[3rem] flex items-center justify-center gap-5 text-red-500/60 transition-opacity">
                                        <Lock size={28} /> <span className="text-2xl font-black uppercase tracking-[0.3em]">indisponible</span>
                                    </div>
                                ) : (skillModulesData.length > 0) ? (
                                    <button
                                        onClick={() => {
                                            const targetId = (status === 'unlocked_needs_exam' && selectedSkill.exam_module_id) ? selectedSkill.exam_module_id : (skillModulesData.find(sm => !userModules[sm.module_id])?.module_id || skillModulesData[0].module_id);
                                            navigate(`/modules/${targetId}`);
                                        }}
                                        disabled={status === 'locked'}
                                        className={`group w-full rounded-[3rem] py-10 flex items-center justify-center gap-5 border border-border/80 bg-surface-hover/50 backdrop-blur-xl transition-all shadow-xl font-sans ${status === 'locked' ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95 hover:border-accent/40 hover:bg-accent/5'}`}
                                    >
                                        <span className="text-2xl font-black uppercase tracking-[0.3em] group-hover:text-accent transition-colors">
                                            {status === 'completed' ? 'revoir objectifs' : status === 'unlocked_needs_exam' ? 'passer l\'examen' : 'lancer l\'objectif'}
                                        </span>
                                        <ChevronRight className="w-8 h-8 group-hover:translate-x-3 transition-transform duration-500 text-accent" />
                                    </button>
                                ) : null}
                            </footer>
                        </div>
                    </article>
                );
            })()}
        </div>
    );
}
