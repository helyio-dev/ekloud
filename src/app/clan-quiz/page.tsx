import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { ChevronRight, Loader2, Crown, Users, Zap, Terminal, Ghost, Cpu, ShieldCheck, Swords } from 'lucide-react';



type SquadId = 'ROOT' | 'VOID' | 'CORE' | 'CYPHER';

// définition statique des squads et de leurs propriétés
const SQUADS: Record<SquadId, {
    tagline: string;
    description: string;
    color: string;
    glow: string;
    bg: string;
    border: string;
    hex: string;
    icon: React.ElementType;
}> = {
    ROOT: {
        tagline: 'Les architectes des fondations',
        description: "Les membres de ROOT ne se contentent pas d'utiliser la technologie, ils la possèdent. Spécialistes du bas-niveau, de l'administration système et de l'infrastructure lourde.",
        color: 'text-orange-400', glow: 'shadow-[0_0_40px_rgba(251,146,60,0.25)]',
        bg: 'from-orange-500/15 to-transparent', border: 'border-orange-500/30',
        hex: '#fb923c', icon: Terminal,
    },
    VOID: {
        tagline: "Les maîtres de l'ombre",
        description: "VOID représente l'absence de trace, l'automatisation pure et la furtivité. Ses membres préfèrent laisser un script de 10 lignes travailler à leur place.",
        color: 'text-violet-400', glow: 'shadow-[0_0_40px_rgba(167,139,250,0.25)]',
        bg: 'from-violet-500/15 to-transparent', border: 'border-violet-500/30',
        hex: '#a78bfa', icon: Ghost,
    },
    CORE: {
        tagline: 'Les bâtisseurs de logique',
        description: "La TechSquad CORE transforme des idées abstraites en algorithmes puissants. Ce sont les architectes du code, le moteur qui propulse l'innovation.",
        color: 'text-blue-400', glow: 'shadow-[0_0_40px_rgba(96,165,250,0.25)]',
        bg: 'from-blue-500/15 to-transparent', border: 'border-blue-500/30',
        hex: '#60a5fa', icon: Cpu,
    },
    CYPHER: {
        tagline: 'Les sentinelles du réseau',
        description: "Pour CYPHER, l'information est la ressource la plus vulnérable. Experts en chiffrement et analyse de menaces — ils comprennent les failles pour mieux les colmater.",
        color: 'text-green-400', glow: 'shadow-[0_0_40px_rgba(74,222,128,0.25)]',
        bg: 'from-green-500/15 to-transparent', border: 'border-green-500/30',
        hex: '#4ade80', icon: ShieldCheck,
    },
};



type Answer = { text: string; scores: Partial<Record<SquadId, number>> };
type Question = { question: string; answers: Answer[] };

// questions du quiz de répartition
const QUESTIONS: Question[] = [
    {
        question: "Tu découvres un bug critique en production à 3h du matin. Tu…",
        answers: [
            { text: "Tu SSH dans le serveur et tu fixes manuellement les processus.", scores: { ROOT: 3, VOID: 1 } },
            { text: "Tu lances ton script de rollback automatique que tu avais préparé.", scores: { VOID: 3, ROOT: 1 } },
            { text: "Tu traces la cause racine dans le code et proposes un correctif durable.", scores: { CORE: 3 } },
            { text: "Tu vérifies les logs d'accès pour voir si c'est une intrusion.", scores: { CYPHER: 3, VOID: 1 } },
        ],
    },
    {
        question: "Quel est ton outil de prédilection ?",
        answers: [
            { text: "Un terminal avec accès root et vim configuré sur mesure.", scores: { ROOT: 3 } },
            { text: "Un script Python / bash que j'ai écrit moi-même.", scores: { VOID: 3, CORE: 1 } },
            { text: "Mon IDE favori avec mes extensions et patterns bien rodés.", scores: { CORE: 3 } },
            { text: "Wireshark, Burp Suite ou un outil d'analyse réseau.", scores: { CYPHER: 3 } },
        ],
    },
    {
        question: "Comment tu décris ton approche face à un nouveau problème ?",
        answers: [
            { text: "Je comprends d'abord le système en profondeur avant de toucher quoi que ce soit.", scores: { ROOT: 2, CORE: 1 } },
            { text: "J'automatise tout ce qui est répétitif et j'agis dans l'ombre.", scores: { VOID: 3 } },
            { text: "Je décompose le problème en algorithmes et je construis une solution élégante.", scores: { CORE: 3 } },
            { text: "Je cherche les failles et je modélise les risques avant d'agir.", scores: { CYPHER: 3 } },
        ],
    },
    {
        question: "Tu rejoins un nouveau projet. Ta première action ?",
        answers: [
            { text: "Lire la config serveur, les logs système et l'architecture réseau.", scores: { ROOT: 3 } },
            { text: "Automatiser le setup du dev environment avec un script.", scores: { VOID: 3 } },
            { text: "Étudier la codebase et l'architecture logicielle existante.", scores: { CORE: 3 } },
            { text: "Scanner les dépendances pour les CVE connues et évaluer la surface d'attaque.", scores: { CYPHER: 3, ROOT: 1 } },
        ],
    },
    {
        question: "Quelle citation te parle le plus ?",
        answers: [
            { text: "\"If it ain't broke, don't fix it — mais connaître comment ça marche en bas.\"", scores: { ROOT: 3 } },
            { text: "\"Le meilleur code est celui que tu n'as pas à exécuter manuellement.\"", scores: { VOID: 3 } },
            { text: "\"La beauté d'un algorithme, c'est sa clarté et son efficacité.\"", scores: { CORE: 3 } },
            { text: "\"La sécurité n'est pas un produit, c'est un processus.\"", scores: { CYPHER: 3 } },
        ],
    },
    {
        question: "Tu as une soirée libre. Tu passes ton temps à…",
        answers: [
            { text: "Configurer un homelab ou explorer un nouveau distro Linux.", scores: { ROOT: 3 } },
            { text: "Écrire un script qui automatise quelque chose qui t'ennuyait.", scores: { VOID: 3 } },
            { text: "Coder un side-project ou résoudre des challenges Leetcode.", scores: { CORE: 3 } },
            { text: "Faire un CTF (Capture The Flag) ou lire des writeups de vulnérabilités.", scores: { CYPHER: 3 } },
        ],
    },
    {
        question: "Dans une équipe, tu es naturellement…",
        answers: [
            { text: "Celui qui gère l'infra et s'assure que tout fonctionne en dessous.", scores: { ROOT: 3, VOID: 1 } },
            { text: "Celui qui travaille en solo et livre un outil fini qui règle le problème.", scores: { VOID: 3 } },
            { text: "L'architecte technique qui définit la structure et les patterns.", scores: { CORE: 3 } },
            { text: "Celui qui audit le code et soulève les risques de sécurité.", scores: { CYPHER: 3 } },
        ],
    },
    {
        question: "Une API que tu utilises tombe sans explication. Tu…",
        answers: [
            { text: "Tu regardes les métriques système et les logs serveur côté hôte.", scores: { ROOT: 3 } },
            { text: "Ton monitoring automatique te le notifie déjà avec le rapport complet.", scores: { VOID: 3 } },
            { text: "Tu vérifies les changelogs et tu proposes un fallback dans le code.", scores: { CORE: 3 } },
            { text: "Tu analyses le trafic réseau pour comprendre ce qui se passe.", scores: { CYPHER: 3, ROOT: 1 } },
        ],
    },
    {
        question: "Quelle compétence t'impressionne le plus ?",
        answers: [
            { text: "Maîtriser le kernel Linux ou écrire un driver depuis zéro.", scores: { ROOT: 3 } },
            { text: "Écrire un pipeline d'automatisation qui tourne 24h/24 sans intervention.", scores: { VOID: 3 } },
            { text: "Concevoir une architecture logicielle qui tient à l'échelle.", scores: { CORE: 3 } },
            { text: "Reverse-engineer un binaire ou déchiffrer un protocole inconnu.", scores: { CYPHER: 3 } },
        ],
    },
    {
        question: "Comment tu protèges tes propres projets ?",
        answers: [
            { text: "Accès root limité, firewall bien configuré, pas de service inutile exposé.", scores: { ROOT: 3, CYPHER: 1 } },
            { text: "Des scripts qui vérifient automatiquement l'intégrité et alertent.", scores: { VOID: 3 } },
            { text: "Des tests unitaires, du code review, et de la documentation à jour.", scores: { CORE: 3 } },
            { text: "Chiffrement de bout en bout, audit régulier et rotation des clés.", scores: { CYPHER: 3 } },
        ],
    },
];



type SquadStats = { squad: SquadId; totalXp: number; members: number };



type Phase = 'intro' | 'quiz' | 'revealing' | 'result';

export default function TechSquadPage() {
    const { user, isLoading: authLoading, clan } = useAuth();
    const navigate = useNavigate();

    
    const [squadStats, setSquadStats] = useState<SquadStats[]>([]);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    
    // états du parcours de sélection
    const [phase, setPhase] = useState<Phase>('intro');
    const [currentQ, setCurrentQ] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [scores, setScores] = useState<Record<SquadId, number>>({ ROOT: 0, VOID: 0, CORE: 0, CYPHER: 0 });
    const [resultSquad, setResultSquad] = useState<SquadId | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    
    // chargement des statistiques des clans pour l'affichage du leaderboard
    useEffect(() => {
        if (authLoading) return;
        const fetchStats = async () => {
            setIsLoadingStats(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('clan, xp')
                    .not('clan', 'is', null);
                if (error) throw error;

                const acc: Record<string, { totalXp: number; members: number }> = {};
                (data || []).forEach((p: any) => {
                    if (!acc[p.clan]) acc[p.clan] = { totalXp: 0, members: 0 };
                    acc[p.clan].totalXp += (p.xp || 0);
                    acc[p.clan].members += 1;
                });

                const sorted = (Object.entries(acc) as [SquadId, { totalXp: number; members: number }][])
                    .map(([squad, s]) => ({ squad, ...s }))
                    .sort((a, b) => b.totalXp - a.totalXp);

                
                const all: SquadId[] = ['ROOT', 'VOID', 'CORE', 'CYPHER'];
                const final = all.map(id => sorted.find(s => s.squad === id) ?? { squad: id, totalXp: 0, members: 0 });
                final.sort((a, b) => b.totalXp - a.totalXp);
                setSquadStats(final);
            } catch (err) {
                console.error('TechSquadPage: fetchStats error', err);
            } finally {
                setIsLoadingStats(false);
            }
        };
        fetchStats();
    }, [authLoading, clan]);

    // gère la sélection d'une réponse utilisateur au quiz
    const handleAnswer = (answerIndex: number) => {
        if (selected !== null) return;
        setSelected(answerIndex);

        const answer = QUESTIONS[currentQ].answers[answerIndex];
        const newScores = { ...scores };
        Object.entries(answer.scores).forEach(([sq, pts]) => {
            newScores[sq as SquadId] += pts as number;
        });

        setTimeout(() => {
            if (currentQ < QUESTIONS.length - 1) {
                setCurrentQ(q => q + 1);
                setSelected(null);
                setScores(newScores);
            } else {
                const winner = (Object.entries(newScores) as [SquadId, number][])
                    .sort(([, a], [, b]) => b - a)[0][0];
                setResultSquad(winner);
                setScores(newScores);
                setPhase('revealing');
                setTimeout(() => setPhase('result'), 1200);
            }
        }, 700);
    };

    // sauvegarde le résultat du quiz dans le profil (définitif)
    const saveSquad = async (squad: SquadId) => {
        if (!user || clan) return; 
        setIsSaving(true);
        try {
            await supabase.from('profiles').update({ clan: squad }).eq('id', user.id);
            
            window.location.reload();
        } catch (err) {
            console.error('TechSquadPage: saveSquad error', err);
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
            </div>
        );
    }

    
    // si l'utilisateur a déjà un clan, affichage de son dashboard
    if (clan) {
        const userSquad = SQUADS[clan as SquadId];
        return (
            <div className="min-h-screen bg-background text-text flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[50vw] h-[50vw] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-30"
                    style={{ backgroundColor: userSquad?.hex ?? '#6366f1' }} />

                <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-12 relative z-10">
                    {}
                    <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Ta TechSquad</p>
                        <h1 className={`text-6xl font-black mb-2 ${userSquad?.color ?? 'text-accent'}`}
                            style={{ textShadow: `0 0 60px ${userSquad?.hex ?? '#6366f1'}44` }}>
                            {clan}
                        </h1>
                        <p className="text-text-muted">{userSquad?.tagline}</p>
                    </div>

                    {}
                    <div className="bg-surface/50 border border-border rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                        <div className="p-5 border-b border-border flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black">Classement des TechSquads</h2>
                                <p className="text-xs text-text-muted mt-0.5">Classé par XP total accumulé</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-xl">
                                <Zap className="w-3.5 h-3.5 text-accent" />
                                <span className="text-xs font-bold text-accent">XP Total</span>
                            </div>
                        </div>

                        {isLoadingStats ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                            </div>
                        ) : (
                            <div className="p-4 space-y-3">
                                {squadStats.map((s, index) => {
                                    const sq = SQUADS[s.squad];
                                    const isMySquad = s.squad === clan;
                                    const maxXp = Math.max(...squadStats.map(x => x.totalXp), 1);
                                    const pct = (s.totalXp / maxXp) * 100;

                                    return (
                                        <div
                                            key={s.squad}
                                            className={`p-5 rounded-2xl border transition-all ${isMySquad
                                                ? `bg-gradient-to-br ${sq.bg} ${sq.border} ${sq.glow}`
                                                : 'bg-background/40 border-border'
                                                }`}
                                        >
                                            <div className="flex items-start sm:items-center justify-between gap-3 mb-3">
                                                {}
                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-lg rounded-xl flex items-center justify-center font-black shrink-0 ${index === 0 ? 'bg-yellow-400/10 text-yellow-400' : 'bg-surface-hover/50 border border-border text-text-muted'}`}>
                                                        {index === 0 ? <Crown className="w-4 h-4 sm:w-5 sm:h-5" /> : index + 1}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
                                                            <span className={`font-black text-sm sm:text-lg whitespace-nowrap ${sq.color}`}>{s.squad}</span>
                                                            <sq.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted" />
                                                            {isMySquad && (
                                                                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 whitespace-nowrap">
                                                                    Ta squad
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] sm:text-xs text-text-muted hidden sm:block truncate pr-2 w-full">{sq.tagline}</p>
                                                    </div>
                                                </div>

                                                {}
                                                <div className="text-right shrink-0">
                                                    <p className="font-black text-text text-sm sm:text-base whitespace-nowrap">{s.totalXp.toLocaleString()} XP</p>
                                                    <div className="flex items-center justify-end gap-1 text-text-muted text-[10px] sm:text-xs mt-0.5">
                                                        <Users className="w-3 h-3" />
                                                        <span className="whitespace-nowrap">{s.members} mb.</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[10px] sm:hidden text-text-muted mb-3 opacity-80 leading-snug break-words">{sq.tagline}</p>

                                            {}
                                            <div className="h-1.5 w-full bg-background/60 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${pct}%`, backgroundColor: sq.hex }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}

                                {squadStats.every(s => s.members === 0) && (
                                    <p className="text-center text-text-muted py-8">Aucun membre dans les TechSquads pour le moment.</p>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    
    // phase de calcul des résultats
    if (phase === 'revealing') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center animate-in zoom-in duration-500">
                    <div className="w-20 h-20 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                    <p className="text-text-muted text-lg font-medium">Calcul de ta TechSquad...</p>
                </div>
            </div>
        );
    }

    
    // phase d'affichage du résultat avant confirmation finale
    if (phase === 'result' && resultSquad) {
        const sq = SQUADS[resultSquad];
        const totalPts = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
        const sortedScores = (Object.entries(scores) as [SquadId, number][]).sort(([, a], [, b]) => b - a);

        return (
            <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center px-6 py-12">
                <div className="max-w-xl w-full animate-in fade-in zoom-in duration-700">
                    {}
                    <div className={`relative p-8 rounded-3xl bg-gradient-to-br ${sq.bg} border ${sq.border} ${sq.glow} text-center mb-6 overflow-hidden`}>
                        <div className="absolute inset-0 pointer-events-none opacity-20"
                            style={{ background: `radial-gradient(circle at 50% -20%, ${sq.hex} 0%, transparent 70%)` }} />
                        <div className="relative">
                            <p className="text-sm font-bold text-text-muted uppercase tracking-widest mb-3">Ta TechSquad est</p>
                            <div className="flex justify-center mb-6">
                                <sq.icon className="w-16 h-16 drop-shadow-2xl" />
                            </div>
                            <h2 className={`text-4xl md:text-6xl font-black mb-2 ${sq.color}`}
                                style={{ textShadow: `0 0 40px ${sq.hex}66` }}>
                                {resultSquad}
                            </h2>
                            <p className={`font-bold mb-4 ${sq.color} text-lg`}>{sq.tagline}</p>
                            <p className="text-text-muted leading-relaxed text-sm">{sq.description}</p>
                        </div>
                    </div>

                    {}
                    <div className="bg-surface/50 border border-border rounded-2xl p-5 mb-6">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Répartition des affinités</p>
                        <div className="space-y-3">
                            {sortedScores.map(([id, pts]) => {
                                const pct = Math.round((pts / totalPts) * 100);
                                const s = SQUADS[id];
                                return (
                                    <div key={id} className="flex items-center gap-3">
                                        <span className={`text-xs font-black w-14 ${s.color}`}>{id}</span>
                                        <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${pct}%`, backgroundColor: s.hex }} />
                                        </div>
                                        <span className="text-xs text-text-muted w-8 text-right">{pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {}
                    <div className="flex items-start gap-3 p-4 bg-yellow-400/5 border border-yellow-400/20 rounded-xl mb-4 text-sm">
                        <span className="text-yellow-400 text-lg shrink-0">⚠️</span>
                        <p className="text-yellow-400/80">
                            <strong className="text-yellow-400">Attention :</strong> ce choix est <strong>définitif</strong>. Une fois que tu rejoins une TechSquad, tu ne peux plus en changer.
                        </p>
                    </div>

                    {}
                    <button
                        onClick={() => saveSquad(resultSquad)}
                        disabled={isSaving}
                        className={`w-full flex items-center justify-center gap-2 px-5 py-4 text-white rounded-2xl font-black text-lg transition-all shadow-lg ${sq.glow} group hover:scale-[1.02]`}
                        style={{ backgroundColor: sq.hex + 'dd' }}
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <sq.icon className="w-6 h-6 mr-1" />}
                        Rejoindre {resultSquad} définitivement
                    </button>
                </div>
            </div>
        );
    }

    
    // phase d'introduction
    if (phase === 'intro') {
        return (
            <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center px-6 py-12">
                <div className="max-w-5xl w-full text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                            Quelle est ta{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-violet-400 to-green-400">
                                TechSquad
                            </span>{' '}?
                        </h1>
                        <p className="text-text-muted text-lg mb-2">
                            Réponds à {QUESTIONS.length} questions pour découvrir ta place parmi les 4 TechSquads.
                        </p>
                        <p className="text-sm text-yellow-400/80 mb-10 font-medium">
                            ⚠️ Ce choix sera <strong>définitif</strong> — tu ne pourras plus changer de TechSquad.
                        </p>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-6 fill-mode-both mb-16">
                        <button
                            onClick={() => setPhase('quiz')}
                            className="group flex items-center justify-center gap-3 mx-auto px-10 py-5 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-accent/30 hover:-translate-y-1 active:translate-y-0"
                        >
                            Passer le test d'aptitude
                            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="text-xs text-text-muted mt-4 font-medium uppercase tracking-widest text-center">
                            Préparez-vous à répondre à {QUESTIONS.length} questions
                        </p>
                    </div>

                    {}
                    <div className="text-left border-t border-border pt-16 mb-16 animate-in fade-in slide-in-from-bottom-8 fill-mode-both" style={{ animationDelay: '200ms' }}>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black mb-4">Qu'est-ce que le programme TechSquad ?</h2>
                            <p className="text-text-muted max-w-lg mx-auto">
                                Basé sur vos compétences et votre approche de la technologie, on vous assigne
                                une escouade de hackers. C'est définitif et ça change tout.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 w-full">
                            <div className="bg-surface/30 border border-border p-6 rounded-2xl flex flex-col items-center md:items-start text-center md:text-left">
                                <div className="w-12 h-12 bg-accent/20 text-accent rounded-xl flex items-center justify-center mb-4 border border-accent/20">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Rejoins une squad</h3>
                                <p className="text-text-muted text-sm leading-relaxed">
                                    Le programme TechSquad réunit les développeurs en 4 factions majeures.
                                    Trouve celle qui te correspond !
                                </p>
                            </div>

                            <div className="bg-surface/30 border border-border p-6 rounded-2xl flex flex-col items-center md:items-start text-center md:text-left">
                                <div className="w-12 h-12 bg-yellow-400/20 text-yellow-400 rounded-xl flex items-center justify-center mb-4 border border-yellow-400/20">
                                    <Crown className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Honneur au leaderboard</h3>
                                <p className="text-text-muted text-sm leading-relaxed">
                                    Chaque module complété rapporte de l'XP à ta Squad. Aide la à se hisser
                                    au sommet du classement mondial.
                                </p>
                            </div>

                            <div className="bg-surface/30 border border-border p-6 rounded-2xl flex flex-col items-center md:items-start text-center md:text-left">
                                <div className="w-12 h-12 bg-rose-400/20 text-rose-400 rounded-xl flex items-center justify-center mb-4 border border-rose-400/20">
                                    <Swords className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Événements inédits</h3>
                                <p className="text-text-muted text-sm leading-relaxed">
                                    Ta TechSquad te servira de bannière et d'équipe lors d'événements exclusifs
                                    sur la plateforme (hackathons, quiz live...).
                                </p>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="mt-8">
                        <h2 className="text-3xl font-black mb-8 text-center">La philosophie des TechSquad</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
                            {(Object.entries(SQUADS) as [SquadId, typeof SQUADS[SquadId]][]).map(([id, sq], index) => {
                                return (
                                    <div
                                        key={id}
                                        className={`relative group p-6 sm:p-8 rounded-3xl bg-surface/30 border border-border transition-all duration-500 hover:border-accent/40 hover:-translate-y-1 hover:shadow-2xl animate-in fade-in slide-in-from-bottom-8 fill-mode-both overflow-hidden`}
                                        style={{ animationDelay: `${400 + index * 150}ms` }}
                                    >
                                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${sq.bg}`} />

                                        <div className="relative z-10 flex flex-col gap-5 items-start">
                                            <div className="flex items-center gap-4">
                                                <div className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${sq.color} bg-background/80 border border-border shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                                    <sq.icon className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h3 className={`text-2xl font-black ${sq.color}`}>{id}</h3>
                                                    <span className="text-xs font-bold tracking-widest uppercase text-text-muted opacity-80">{sq.tagline}</span>
                                                </div>
                                            </div>

                                            <p className="text-text-muted leading-relaxed text-sm">
                                                {sq.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    
    // déroulement du quiz
    const q = QUESTIONS[currentQ];
    const progress = (currentQ / QUESTIONS.length) * 100;

    return (
        <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center px-6 py-12">
            <div className="max-w-2xl w-full">
                {}
                <div className="mb-8">
                    <div className="flex justify-between text-xs text-text-muted mb-2 font-medium">
                        <span>Question {currentQ + 1} / {QUESTIONS.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-400 via-violet-500 to-green-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {}
                <div key={currentQ} className="animate-in fade-in slide-in-from-right-4 duration-400">
                    <h2 className="text-2xl sm:text-3xl font-black mb-8 leading-snug text-center">{q.question}</h2>
                    <div className="grid gap-3">
                        {q.answers.map((answer, i) => {
                            const isSelected = selected === i;
                            const isOther = selected !== null && !isSelected;
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    disabled={selected !== null}
                                    className={`text-left px-6 py-4 rounded-2xl border font-medium text-sm sm:text-base transition-all duration-300 ${isSelected
                                        ? 'bg-accent/20 border-accent text-accent scale-[1.01] shadow-lg shadow-accent/20'
                                        : isOther
                                            ? 'bg-surface/20 border-border text-text-muted opacity-40'
                                            : 'bg-surface/50 border-border hover:border-accent/40 hover:bg-accent/5 hover:text-accent active:scale-[0.99]'
                                        }`}
                                >
                                    <span className="opacity-50 mr-3 text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                                    {answer.text}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {}
                <div className="flex justify-center gap-4 mt-8 opacity-40">
                    {(Object.entries(scores) as [SquadId, number][]).map(([id, pts]) => (
                        <div key={id} className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SQUADS[id].hex }} />
                            <span className="text-xs font-bold text-text-muted">{id} {pts}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
