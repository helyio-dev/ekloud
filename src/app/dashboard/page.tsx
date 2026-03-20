import SkillTree, { Skill, SkillPrereq, SkillModule } from '@/components/SkillTree';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Info, BookOpen, CheckCircle, X, Sparkles, Lock, ZoomIn, ZoomOut } from 'lucide-react';
import { addXp } from '@/lib/gamification';

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

type UserModule = {
    module_id: string;
    completed: boolean;
};

export default function Dashboard() {
    const { user, isAdmin, xp, streak, refreshProfile, isLoading: authLoading } = useAuth();
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
    const welcomeCheckRef = useRef(false);

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            setIsLoading(true);
            try {
                const { data: skillsData } = await supabase.from('skills').select('*');
                const { data: prereqsData } = await supabase.from('skill_prerequisites').select('*');
                const { data: smData } = await supabase.from('skill_modules').select('*');
                const { data: moduleData } = await supabase.from('modules').select('id, title');
                const { data: umData } = await supabase.from('user_modules').select('module_id, completed').eq('user_id', user.id);
                const { data: usData } = await supabase.from('user_skills').select('skill_id').eq('user_id', user.id);
                const { data: examsData } = await supabase.from('quiz_attempts').select('module_id, is_exam, created_at').eq('user_id', user.id).eq('passed', true);

                setSkills(skillsData || []);
                setPrereqs(prereqsData || []);
                setSkillModules(smData || []);
                setModules(moduleData || []);
                setCompletedSkills(new Set(usData?.map(us => us.skill_id) || []));

                // Grandfathering: Include passed attempts that are explicitly exams OR old quizzes before the new system (approx March 9, 2026)
                const cutoffDate = new Date('2026-03-09T23:00:00Z');
                setPassedExams(new Set(examsData?.filter(e => e.is_exam || new Date(e.created_at) < cutoffDate).map(e => e.module_id) || []));

                // 3. Ensure "Bienvenue sur Ekloud !" root skill exists
                if (skillsData && !welcomeCheckRef.current) {
                    const welcomeSkill = skillsData.find(s => s.x_pos === 0 && s.y_pos === 0);
                    if (!welcomeSkill && isAdmin) {
                        welcomeCheckRef.current = true;
                        const { data: newSkill } = await supabase
                            .from('skills')
                            .insert([{
                                name: "Bienvenue sur Ekloud !",
                                description: "S'enregistrer sur le site.",
                                icon: "Tent",
                                x_pos: 0,
                                y_pos: 0,
                                is_final: false
                            }])
                            .select()
                            .single();

                        if (newSkill) {
                            setSkills(prev => [...prev, newSkill]);

                            // Auto-link existing roots to this new center
                            const existingPrereqIds = new Set(prereqsData?.map(p => p.skill_id) || []);
                            const roots = skillsData.filter(s => s.id !== newSkill.id && !existingPrereqIds.has(s.id));
                            if (roots.length > 0) {
                                const links = roots.map(r => ({
                                    skill_id: r.id,
                                    prerequisite_skill_id: newSkill.id
                                }));
                                await supabase.from('skill_prerequisites').insert(links);
                                setPrereqs(prev => [...prev, ...links as any]);
                            }
                        }
                    }
                }

                const umMap: Record<string, boolean> = {};
                umData?.forEach(um => { umMap[um.module_id] = um.completed; });

                // Also count any passed quiz as completed in the UI counter
                examsData?.forEach(e => {
                    if (!e.is_exam) {
                        umMap[e.module_id] = true;
                    }
                });

                setUserModules(umMap);
            } catch (err) {
                console.error("Dashboard fetchData error:", err);
            } finally {
                setIsLoading(false);
            }
        }

        if (!authLoading && user) fetchData();

        // Realtime subscription for instant updates
        const channel = supabase
            .channel('dashboard-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_modules',
                filter: `user_id=eq.${user?.id}`
            }, () => fetchData())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_skills',
                filter: `user_id=eq.${user?.id}`
            }, () => fetchData())
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'quiz_attempts',
                filter: `user_id=eq.${user?.id}`
            }, () => fetchData())
            .subscribe();

        // 4. Hide scrollbars on dashboard specifically
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
            supabase.removeChannel(channel);
        };
    }, [user?.id, authLoading]);

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

    const [claimedSkills, setClaimedSkills] = useState<Set<string>>(new Set());
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' } | null>(null);

    const handleSkillClick = async (skill: Skill) => {
        const status = getSkillStatus(skill.id);

        if (status === 'available' && !completedSkills.has(skill.id)) {
            // Success! Claim XP & Persist Mastery
            if (user) {
                const amount = skill.is_final ? 100 : 25;
                const { error: xpError } = await addXp(supabase, user.id, xp || 0, amount, streak || 0);

                if (!xpError) {
                    // Persist to user_skills
                    const { error: usError } = await supabase
                        .from('user_skills')
                        .insert([{ user_id: user.id, skill_id: skill.id }]);

                    if (usError) {
                        console.error("Error persisting skill mastery:", usError.code, usError.message, usError.details);
                        setNotification({ message: "Erreur lors de la sauvegarde du succès.", type: 'info' });
                        setTimeout(() => setNotification(null), 3000);
                    } else {
                        await refreshProfile();
                        setCompletedSkills(prev => new Set(prev).add(skill.id));
                        setNotification({
                            message: `Succès déverrouillé ! +${amount} XP`,
                            type: 'success'
                        });
                        setTimeout(() => setNotification(null), 3000);
                    }
                }
            }
        } else if (status === 'unlocked' || status === 'unlocked_needs_exam') {
            setSelectedSkill(skill);
        } else if (status === 'completed') {
            setNotification({ message: "Compétence déjà maîtrisée !", type: 'info' });
            setTimeout(() => setNotification(null), 2000);
            setSelectedSkill(skill);
        } else {
            setNotification({ message: "Cette compétence est encore verrouillée.", type: 'info' });
            setTimeout(() => setNotification(null), 2000);
        }
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-accent animate-spin" /></div>;


    return (
        <div className="h-[calc(100vh-73px)] bg-background relative overflow-hidden flex flex-col select-none">
            <SkillTree
                skills={skills}
                prereqs={prereqs}
                skillModules={skillModules}
                userModules={userModules}
                completedSkills={completedSkills}
                passedExams={passedExams}
                onSkillClick={handleSkillClick}
            />

            {/* Selected Skill Detail (PS5 Style Floating Activity Card) */}
            {selectedSkill && (() => {
                const status = getSkillStatus(selectedSkill.id);
                const skillModulesData = skillModules.filter(sm => sm.skill_id === selectedSkill.id);

                return (
                    <div className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:-translate-y-1/2 md:right-8 w-full md:w-[540px] max-h-[85vh] md:max-h-[90vh] bg-[#09090b]/40 md:bg-black/20 backdrop-blur-[60px] border border-white/10 md:border-white/10 z-50 rounded-t-[48px] md:rounded-[48px] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] md:shadow-[0_40px_120px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-20 md:slide-in-from-right-20 duration-500 overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none scale-150 transform translate-x-12 -translate-y-12">
                            {/* Inlined SkillIcon logic for simplicity in detail panel */}
                            <svg width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            </svg>
                        </div>

                        <div className="relative z-10 p-6 md:p-10 space-y-6 md:space-y-10 flex flex-col h-full overflow-y-auto no-scrollbar">
                            <div className="flex justify-between items-start">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        {status === 'completed' ? (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-green-500">
                                                <CheckCircle className="w-3 h-3" /> Maîtrisé
                                            </div>
                                        ) : status === 'available' ? (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-accent/20 border border-accent/40 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-accent animate-pulse">
                                                <Sparkles className="w-3 h-3" /> Disponible
                                            </div>
                                        ) : selectedSkill.is_locked ? (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-red-500">
                                                <Lock className="w-3 h-3" /> Construction
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                                                <Lock className="w-3 h-3" /> {status === 'unlocked' ? 'En Cours' : 'Verrouillé'}
                                            </div>
                                        )}
                                        {selectedSkill.is_final && (
                                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                                                🏆 Légendaire
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.8] text-white pr-12">
                                        {selectedSkill.name}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setSelectedSkill(null)}
                                    className="p-3 hover:bg-white/10 rounded-full transition-all group shrink-0"
                                >
                                    <X className="w-6 h-6 text-white/30 group-hover:text-white group-hover:rotate-90 transition-all" />
                                </button>
                            </div>

                            <p className="text-lg text-text-muted/70 leading-relaxed font-medium max-w-md">
                                {selectedSkill.description || "Maîtrisez cette compétence pour progresser dans votre arbre de connaissances technologiques."}
                            </p>

                            <div className="flex items-center gap-4 md:gap-6 p-4 md:p-6 bg-white/[0.03] border border-white/[0.05] rounded-[24px] md:rounded-[32px]">
                                <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-accent/20 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Récompense</p>
                                    <p className="text-xl font-black text-white">+{selectedSkill.is_final ? '100' : '25'} XP Collectables</p>
                                </div>
                            </div>

                            {selectedSkill.name !== 'Bienvenue sur Ekloud !' && skillModulesData.length > 0 && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end px-2">
                                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Activités du succès</h3>
                                        <span className="text-[10px] font-black text-white/40">
                                            {skillModulesData.filter(sm => userModules[sm.module_id]).length} / {skillModulesData.length} terminée(s)
                                        </span>
                                    </div>

                                    <div className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x no-scrollbar">
                                        {skillModulesData.map((sm, idx) => {
                                            const mod = modules.find(m => m.id === sm.module_id);
                                            const completed = userModules[sm.module_id];
                                            return (
                                                <div
                                                    key={sm.module_id}
                                                    onClick={() => navigate(`/modules/${sm.module_id}`)}
                                                    className="group relative flex-shrink-0 w-44 snap-start cursor-pointer"
                                                    style={{ animationDelay: `${idx * 100}ms` }}
                                                >
                                                    <div className={`relative aspect-[4/5] rounded-[32px] border ${completed ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/[0.03]'} overflow-hidden transition-all duration-500 group-hover:scale-[1.05] group-hover:border-white/20 group-hover:bg-white/[0.06] group-hover:shadow-2xl`}>
                                                        <div className="absolute inset-0 flex flex-col p-5 justify-between">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${completed ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/20'}`}>
                                                                {completed ? <CheckCircle className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <span className={`text-sm font-black leading-tight block ${completed ? 'text-green-500/80' : 'text-white/80'}`}>
                                                                    {mod?.title || 'Activité'}
                                                                </span>
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-white/30">
                                                                    {completed ? 'Terminé' : 'En cours'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto pt-6">
                                {status === 'available' ? (
                                    <button
                                        onClick={() => handleSkillClick(selectedSkill)}
                                        className="group w-full relative overflow-hidden rounded-[40px] bg-accent p-[1px] shadow-[0_20px_50px_rgba(99,102,241,0.4)] active:scale-[0.97] transition-all"
                                    >
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%] group-hover:animate-[shimmer_2s_infinite]"></div>
                                        <div className="bg-accent py-5 md:py-8 rounded-[39px] flex items-center justify-center gap-3 md:gap-4">
                                            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:rotate-12 transition-transform" />
                                            <span className="text-lg md:text-xl font-black text-white uppercase tracking-[0.2em] md:tracking-[0.3em]">Collecter Succès</span>
                                        </div>
                                    </button>
                                ) : (selectedSkill.name === 'Bienvenue sur Ekloud !' && status === 'completed') ? null : selectedSkill.is_locked ? (
                                    <div className="w-full text-center py-8 bg-red-500/10 border border-red-500/20 rounded-[40px]">
                                        <span className="text-xl font-black text-red-500 uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                                            <Lock className="w-6 h-6" /> Indisponible
                                        </span>
                                    </div>
                                ) : (skillModulesData.length > 0 || (selectedSkill.requires_exam && selectedSkill.exam_module_id)) ? (
                                    <button
                                        onClick={() => {
                                            if (status === 'unlocked_needs_exam' && selectedSkill.exam_module_id) {
                                                navigate(`/modules/${selectedSkill.exam_module_id}`);
                                            } else {
                                                const nextMod = skillModulesData.find(sm => !userModules[sm.module_id]) || skillModulesData[0];
                                                if (nextMod) navigate(`/modules/${nextMod.module_id}`);
                                            }
                                        }}
                                        disabled={status === 'locked'}
                                        className={`group w-full relative rounded-[40px] p-[1px] overflow-hidden transition-all ${status === 'locked' ? 'opacity-30 grayscale cursor-not-allowed' : 'bg-white/10 hover:bg-white/20'}`}
                                    >
                                        <div className="bg-[#101014]/80 py-5 md:py-8 rounded-[39px] flex items-center justify-center gap-3 md:gap-4 border border-white/5 backdrop-blur-xl">
                                            <span className="text-sm md:text-xl font-black text-white uppercase tracking-[0.1em] md:tracking-[0.2em] text-center px-4">
                                                {status === 'completed' ? 'Revoir Activités' : status === 'unlocked_needs_exam' ? 'Passer l\'Examen' : 'Lancer l\'Objectif'}
                                            </span>
                                            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:translate-x-2 transition-transform shrink-0" />
                                        </div>
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                );
            })()}

            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
