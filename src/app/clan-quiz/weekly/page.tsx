import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
    Loader2, ChevronRight, CheckCircle, XCircle,
    Trophy, Zap, Users, Calendar, Swords, ArrowLeft,
    Terminal, Ghost, Cpu, ShieldCheck,
} from 'lucide-react';

/* ── Types ── */
type Option = { text: string; correct: boolean };

type Question = {
    id: string;
    question_text: string;
    options: Option[];
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
};

type Competition = {
    id: string;
    period_start: string;
    period_end: string;
    status: string;
    question_ids: string[];
};

type ClanScore = {
    clan: string;
    participants: number;
    avg_score_10: number;
    total_correct: number;
};

type Phase = 'loading' | 'already_done' | 'intro' | 'quiz' | 'result';

/* ── Constants ── */
const SQUAD_COLORS: Record<string, { color: string; hex: string; icon: React.ElementType }> = {
    ROOT:   { color: 'text-orange-400', hex: '#fb923c', icon: Terminal },
    VOID:   { color: 'text-violet-400', hex: '#a78bfa', icon: Ghost },
    CORE:   { color: 'text-blue-400',   hex: '#60a5fa', icon: Cpu },
    CYPHER: { color: 'text-green-400',  hex: '#4ade80', icon: ShieldCheck },
};

const DIFFICULTY_LABEL: Record<string, string> = {
    easy:   'Facile',
    medium: 'Moyen',
    hard:   'Difficile',
};
const DIFFICULTY_COLOR: Record<string, string> = {
    easy:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    hard:   'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

/* ── Helpers ── */
function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

/* ── Component ── */
export default function WeeklyClanQuizPage() {
    const { user, isLoading: authLoading, clan } = useAuth();
    const navigate = useNavigate();

    const [phase, setPhase]               = useState<Phase>('loading');
    const [competition, setCompetition]   = useState<Competition | null>(null);
    const [questions, setQuestions]       = useState<Question[]>([]);
    const [shuffledOptions, setShuffledOptions] = useState<Option[][]>([]);
    const [currentQ, setCurrentQ]         = useState(0);
    const [selected, setSelected]         = useState<number | null>(null);
    const [revealed, setRevealed]         = useState(false);
    const [score, setScore]               = useState(0);
    const [answers, setAnswers]           = useState<boolean[]>([]);
    const [clanScores, setClanScores]     = useState<ClanScore[]>([]);
    const [prevAttempt, setPrevAttempt]   = useState<{ score: number; total: number } | null>(null);
    const [isSaving, setIsSaving]         = useState(false);
    const [errorMsg, setErrorMsg]         = useState<string | null>(null);

    /* ── Auth guard ── */
    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    /* ── Init ── */
    const init = useCallback(async () => {
        if (!user) return;
        setPhase('loading');
        setErrorMsg(null);

        try {
            // 1. Récupérer la compétition hebdomadaire active
            const { data: comp, error: compErr } = await supabase
                .from('clan_competitions')
                .select('*')
                .eq('type', 'week')
                .eq('status', 'active')
                .order('period_start', { ascending: false })
                .limit(1)
                .single();

            if (compErr || !comp) {
                setErrorMsg("Aucun quiz hebdomadaire actif pour le moment. Revenez lundi !");
                setPhase('intro');
                return;
            }

            setCompetition(comp);

            // 2. Vérifier si l'utilisateur a déjà participé
            const { data: existing } = await supabase
                .from('clan_attempts')
                .select('score, total_questions')
                .eq('user_id', user.id)
                .eq('competition_id', comp.id)
                .maybeSingle();

            if (existing) {
                setPrevAttempt({ score: existing.score, total: existing.total_questions });
                await loadClanScores(comp.id);
                setPhase('already_done');
                return;
            }

            // 3. Sélectionner 10 questions au hasard dans la banque
            let questionIds: string[] = comp.question_ids ?? [];

            if (questionIds.length < 10) {
                // Si pas assez de questions configurées → pioche dans le pool actif
                const { data: pool } = await supabase
                    .from('clan_questions')
                    .select('id')
                    .eq('active', true);

                const poolIds = (pool || []).map((q: { id: string }) => q.id);
                questionIds = shuffleArray(poolIds).slice(0, 10);
            } else {
                questionIds = shuffleArray(questionIds).slice(0, 10);
            }

            if (questionIds.length === 0) {
                setErrorMsg("La banque de questions est vide. Revenez plus tard !");
                setPhase('intro');
                return;
            }

            // 4. Charger les questions
            const { data: qs, error: qErr } = await supabase
                .from('clan_questions')
                .select('id, question_text, options, category, difficulty')
                .in('id', questionIds);

            if (qErr || !qs || qs.length === 0) {
                setErrorMsg("Impossible de charger les questions. Réessayez.");
                setPhase('intro');
                return;
            }

            const parsed: Question[] = qs.map((q: any) => ({
                ...q,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
            }));

            setQuestions(parsed);
            setShuffledOptions(parsed.map(q => shuffleArray(q.options)));
            setPhase('intro');
        } catch (err) {
            console.error('WeeklyQuiz init error:', err);
            setErrorMsg("Une erreur est survenue. Réessayez.");
            setPhase('intro');
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading && user) init();
    }, [authLoading, user, init]);

    const loadClanScores = async (competitionId: string) => {
        const { data } = await supabase
            .from('clan_competition_scores')
            .select('clan, participants, avg_score_10, total_correct')
            .eq('competition_id', competitionId);
        setClanScores((data || []) as ClanScore[]);
    };

    /* ── Quiz logic ── */
    const handleAnswer = (optionIndex: number) => {
        if (revealed || selected !== null) return;
        setSelected(optionIndex);
        setRevealed(true);

        const isCorrect = shuffledOptions[currentQ][optionIndex].correct;
        if (isCorrect) setScore(s => s + 1);
        setAnswers(a => [...a, isCorrect]);
    };

    const handleNext = () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ(q => q + 1);
            setSelected(null);
            setRevealed(false);
        } else {
            // Quiz terminé → sauvegarder
            saveAttempt();
        }
    };

    const saveAttempt = async () => {
        if (!user || !competition || isSaving) return;
        setIsSaving(true);
        const finalScore = answers.filter(Boolean).length + (revealed && shuffledOptions[currentQ]?.[selected!]?.correct ? 1 : 0);

        try {
            await supabase.from('clan_attempts').insert({
                user_id: user.id,
                competition_id: competition.id,
                score: finalScore,
                total_questions: questions.length,
            });
            await loadClanScores(competition.id);
        } catch (err) {
            console.error('WeeklyQuiz saveAttempt error:', err);
        } finally {
            setIsSaving(false);
            setPhase('result');
        }
    };

    /* ── Renders ── */
    if (authLoading || phase === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 text-accent animate-spin opacity-40" />
            </div>
        );
    }

    const squadConfig = clan ? SQUAD_COLORS[clan] : null;

    /* Already done */
    if (phase === 'already_done' && prevAttempt) {
        const pct = Math.round((prevAttempt.score / prevAttempt.total) * 100);
        return (
            <PageWrapper>
                <BackLink />
                <div className="max-w-2xl mx-auto">
                    {/* Result card */}
                    <div className="bg-surface/50 border border-border/60 rounded-3xl p-8 mb-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h1 className="text-3xl font-black mb-2">Quiz complété ✓</h1>
                        {competition && (
                            <p className="text-text-muted text-sm mb-6">
                                Semaine du {formatDate(competition.period_start)} au {formatDate(competition.period_end)}
                            </p>
                        )}
                        <div className="inline-flex items-center gap-3 px-6 py-4 bg-background rounded-2xl border border-border/60">
                            <span className="text-5xl font-black text-accent">{prevAttempt.score}</span>
                            <span className="text-text-muted font-black text-2xl">/ {prevAttempt.total}</span>
                        </div>
                        <p className="text-text-muted text-sm mt-3">{pct}% de réussite</p>
                    </div>

                    <ClanLeaderboard scores={clanScores} userClan={clan} competitionType="week" />

                    <div className="mt-6 text-center">
                        <Link
                            to="/clan-quiz/monthly"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-accent/10 border border-accent/20 rounded-2xl text-accent text-sm font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all"
                        >
                            <Calendar className="w-4 h-4" /> Voir le quiz mensuel
                        </Link>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    /* Intro / error */
    if (phase === 'intro') {
        return (
            <PageWrapper>
                <BackLink />
                <div className="max-w-2xl mx-auto text-center">
                    <div className="mb-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-4">Quiz hebdomadaire</p>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
                            Quiz de clan<br />
                            <span className="text-accent">de la semaine</span>
                        </h1>
                        {competition && (
                            <p className="text-text-muted mb-2">
                                Semaine du <strong>{formatDate(competition.period_start)}</strong> au <strong>{formatDate(competition.period_end)}</strong>
                            </p>
                        )}
                        <p className="text-text-muted text-sm mb-8">
                            10 questions techniques. Une seule tentative. Ton score contribue au classement mensuel de ta TechSquad.
                        </p>
                    </div>

                    {errorMsg ? (
                        <div className="p-6 bg-surface/30 border border-border/60 rounded-3xl text-text-muted mb-8">
                            <p>{errorMsg}</p>
                        </div>
                    ) : (
                        <>
                            {/* Info cards */}
                            <div className="grid grid-cols-3 gap-3 mb-8">
                                {[
                                    { icon: Swords, label: '10 questions', sub: 'Tech & DevOps' },
                                    { icon: Zap, label: '1 tentative', sub: 'par semaine' },
                                    { icon: Trophy, label: 'Classement', sub: 'mensuel des squads' },
                                ].map(({ icon: Icon, label, sub }) => (
                                    <div key={label} className="bg-surface/40 border border-border/60 rounded-2xl p-4">
                                        <Icon className="w-5 h-5 text-accent mx-auto mb-2" />
                                        <p className="text-sm font-black">{label}</p>
                                        <p className="text-[10px] text-text-muted uppercase tracking-widest">{sub}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Clan badge */}
                            {clan && squadConfig && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface/40 border border-border/60 rounded-2xl mb-8">
                                    <squadConfig.icon className={`w-4 h-4 ${squadConfig.color}`} />
                                    <span className={`text-sm font-black ${squadConfig.color}`}>Tu joues pour {clan}</span>
                                </div>
                            )}
                            {!clan && (
                                <div className="p-4 bg-yellow-400/5 border border-yellow-400/20 rounded-2xl mb-8">
                                    <p className="text-yellow-400 text-sm">Tu dois rejoindre une TechSquad pour participer au classement.</p>
                                    <Link to="/clan-quiz" className="text-yellow-400 underline text-sm font-bold">Rejoindre une squad →</Link>
                                </div>
                            )}

                            <button
                                onClick={() => setPhase('quiz')}
                                className="group flex items-center justify-center gap-3 mx-auto px-10 py-5 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-accent/30 hover:-translate-y-1"
                            >
                                Démarrer le quiz
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </>
                    )}
                </div>
            </PageWrapper>
        );
    }

    /* Quiz */
    if (phase === 'quiz' && questions.length > 0) {
        const q = questions[currentQ];
        const opts = shuffledOptions[currentQ] || [];
        const progress = ((currentQ) / questions.length) * 100;

        return (
            <PageWrapper>
                <div className="max-w-2xl mx-auto">
                    {/* Progress */}
                    <div className="mb-8">
                        <div className="flex justify-between text-xs text-text-muted mb-2 font-black uppercase tracking-widest">
                            <span>Question {currentQ + 1} / {questions.length}</span>
                            <span className="text-accent">{score} correcte{score > 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Question card */}
                    <div key={currentQ} className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Category + difficulty */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted px-2.5 py-1 bg-surface border border-border/60 rounded-full">
                                {q.category}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${DIFFICULTY_COLOR[q.difficulty]}`}>
                                {DIFFICULTY_LABEL[q.difficulty]}
                            </span>
                        </div>

                        <h2 className="text-xl md:text-2xl font-black mb-6 leading-snug">{q.question_text}</h2>

                        {/* Options */}
                        <div className="grid gap-3 mb-6">
                            {opts.map((opt, i) => {
                                const isSelected = selected === i;
                                const isCorrect = opt.correct;
                                let className = 'text-left px-5 py-4 rounded-2xl border font-medium text-sm transition-all duration-200 ';

                                if (!revealed) {
                                    className += 'bg-surface/50 border-border hover:border-accent/40 hover:bg-accent/5 hover:text-accent cursor-pointer';
                                } else if (isCorrect) {
                                    className += 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
                                } else if (isSelected && !isCorrect) {
                                    className += 'bg-rose-500/10 border-rose-500/30 text-rose-400';
                                } else {
                                    className += 'bg-surface/20 border-border text-text-muted opacity-40';
                                }

                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(i)}
                                        disabled={revealed}
                                        className={className}
                                    >
                                        <span className="opacity-50 mr-3 text-xs font-black">{String.fromCharCode(65 + i)}</span>
                                        {opt.text}
                                        {revealed && isCorrect && <CheckCircle className="inline w-4 h-4 ml-2 text-emerald-400" />}
                                        {revealed && isSelected && !isCorrect && <XCircle className="inline w-4 h-4 ml-2 text-rose-400" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Next button (shown after answer) */}
                        {revealed && (
                            <button
                                onClick={handleNext}
                                disabled={isSaving}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                            >
                                {isSaving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...</>
                                ) : currentQ < questions.length - 1 ? (
                                    <>Question suivante <ChevronRight className="w-4 h-4" /></>
                                ) : (
                                    <>Voir mes résultats <Trophy className="w-4 h-4" /></>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </PageWrapper>
        );
    }

    /* Result */
    if (phase === 'result') {
        const total = questions.length;
        const finalScore = answers.filter(Boolean).length;
        const pct = Math.round((finalScore / total) * 100);

        return (
            <PageWrapper>
                <BackLink />
                <div className="max-w-2xl mx-auto">
                    {/* Score */}
                    <div className="bg-surface/50 border border-border/60 rounded-3xl p-8 mb-8 text-center">
                        <div className="mb-4">
                            {pct >= 70 ? (
                                <div className="w-16 h-16 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto">
                                    <Trophy className="w-8 h-8 text-emerald-400" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
                                    <Zap className="w-8 h-8 text-accent" />
                                </div>
                            )}
                        </div>
                        <h1 className="text-3xl font-black mb-1">
                            {pct >= 70 ? 'Bien joué !' : 'Bonne participation !'}
                        </h1>
                        <p className="text-text-muted text-sm mb-6">
                            {clan ? `Ton score a été ajouté au classement de ${clan}` : 'Rejoins une squad pour contribuer au classement.'}
                        </p>
                        <div className="inline-flex items-center gap-3 px-6 py-4 bg-background rounded-2xl border border-border/60">
                            <span className="text-5xl font-black text-accent">{finalScore}</span>
                            <span className="text-text-muted font-black text-2xl">/ {total}</span>
                        </div>
                        <p className="text-text-muted text-sm mt-3">{pct}% de réussite</p>
                    </div>

                    {/* Answer recap */}
                    <div className="bg-surface/30 border border-border/60 rounded-3xl p-5 mb-8">
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/60 mb-4">Récapitulatif</p>
                        <div className="grid grid-cols-5 gap-2">
                            {answers.map((correct, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center justify-center h-10 rounded-xl border text-xs font-black ${correct
                                        ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                                        : 'bg-rose-400/10 border-rose-400/20 text-rose-400'
                                    }`}
                                >
                                    {correct ? '✓' : '✗'}
                                </div>
                            ))}
                        </div>
                    </div>

                    <ClanLeaderboard scores={clanScores} userClan={clan} competitionType="week" />

                    <div className="mt-6 text-center">
                        <Link
                            to="/clan-quiz/monthly"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-accent/10 border border-accent/20 rounded-2xl text-accent text-sm font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all"
                        >
                            <Calendar className="w-4 h-4" /> Voir le classement mensuel
                        </Link>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    return null;
}

/* ── Shared sub-components ── */

function PageWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-text font-sans">
            <div className="max-w-3xl mx-auto px-6 py-12">
                {children}
            </div>
        </div>
    );
}

function BackLink() {
    return (
        <Link
            to="/clan-quiz"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text text-sm font-black uppercase tracking-widest transition-colors mb-8"
        >
            <ArrowLeft className="w-4 h-4" /> TechSquad
        </Link>
    );
}

function ClanLeaderboard({ scores, userClan, competitionType }: {
    scores: ClanScore[];
    userClan: string | null;
    competitionType: 'week' | 'month';
}) {
    const sorted = [...scores].sort((a, b) => b.avg_score_10 - a.avg_score_10);
    const maxScore = Math.max(...sorted.map(s => s.avg_score_10), 0.01);

    return (
        <div className="bg-surface/50 border border-border/60 rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-black">
                        Classement {competitionType === 'week' ? 'de la semaine' : 'du mois'}
                    </h2>
                    <p className="text-xs text-text-muted mt-0.5">Score moyen /10 par squad</p>
                </div>
                <Users className="w-4 h-4 text-text-muted" />
            </div>

            {sorted.length === 0 ? (
                <p className="text-text-muted text-sm p-6 text-center">Aucun résultat pour le moment.</p>
            ) : (
                <div className="p-4 space-y-3">
                    {sorted.map((s, i) => {
                        const cfg = SQUAD_COLORS[s.clan];
                        if (!cfg) return null;
                        const Icon = cfg.icon;
                        const pct = (s.avg_score_10 / maxScore) * 100;
                        const isMySquad = s.clan === userClan;

                        return (
                            <div
                                key={s.clan}
                                className={`p-4 rounded-2xl border transition-all ${isMySquad
                                    ? 'bg-accent/5 border-accent/20'
                                    : 'bg-background/40 border-border/40'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-black text-text-muted w-5">{i + 1}</span>
                                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                                        <span className={`font-black text-sm ${cfg.color}`}>{s.clan}</span>
                                        {isMySquad && (
                                            <span className="text-[9px] font-black px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded-full">
                                                ta squad
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="font-black text-sm">{s.avg_score_10.toFixed(1)}/10</span>
                                        <p className="text-[10px] text-text-muted">{s.participants} participant{s.participants > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <div className="h-1.5 w-full bg-background/60 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${pct}%`, backgroundColor: cfg.hex }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
