import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
    Loader2, Crown, Trophy, Zap, Users,
    Calendar, ArrowLeft, Terminal, Ghost, Cpu, ShieldCheck,
    ChevronRight,
} from 'lucide-react';

/* ── Types ── */
type ClanScore = {
    clan: string;
    participants: number;
    avg_score_10: number;
    total_correct: number;
};

type WeekSummary = {
    competition_id: string;
    period_start: string;
    period_end: string;
    scores: ClanScore[];
};

type MonthCompetition = {
    id: string;
    period_start: string;
    period_end: string;
    status: string;
    winner_clan: string | null;
};

/* ── Constants ── */
const SQUAD_COLORS: Record<string, { color: string; hex: string; bg: string; border: string; icon: React.ElementType }> = {
    ROOT:   { color: 'text-orange-400', hex: '#fb923c', bg: 'from-orange-500/15 to-transparent', border: 'border-orange-500/30', icon: Terminal },
    VOID:   { color: 'text-violet-400', hex: '#a78bfa', bg: 'from-violet-500/15 to-transparent', border: 'border-violet-500/30', icon: Ghost },
    CORE:   { color: 'text-blue-400',   hex: '#60a5fa', bg: 'from-blue-500/15 to-transparent',   border: 'border-blue-500/30',   icon: Cpu },
    CYPHER: { color: 'text-green-400',  hex: '#4ade80', bg: 'from-green-500/15 to-transparent',  border: 'border-green-500/30',  icon: ShieldCheck },
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

/* ── Component ── */
export default function MonthlyClanQuizPage() {
    const { user, isLoading: authLoading, clan } = useAuth();
    const navigate = useNavigate();

    const [isLoading, setIsLoading]           = useState(true);
    const [monthComp, setMonthComp]           = useState<MonthCompetition | null>(null);
    const [monthScores, setMonthScores]       = useState<ClanScore[]>([]);
    const [weekSummaries, setWeekSummaries]   = useState<WeekSummary[]>([]);
    const [userMonthScore, setUserMonthScore] = useState<{ score: number; total: number } | null>(null);
    const [errorMsg, setErrorMsg]             = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    const init = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setErrorMsg(null);

        try {
            // 1. Récupérer la compétition mensuelle active
            const { data: comp, error: compErr } = await supabase
                .from('clan_competitions')
                .select('*')
                .eq('type', 'month')
                .eq('status', 'active')
                .order('period_start', { ascending: false })
                .limit(1)
                .single();

            if (compErr || !comp) {
                setErrorMsg("Aucune compétition mensuelle active pour le moment.");
                setIsLoading(false);
                return;
            }

            setMonthComp(comp);

            // 2. Score du mois courant par clan (via la vue)
            const { data: monthScoreData } = await supabase
                .from('clan_competition_scores')
                .select('clan, participants, avg_score_10, total_correct')
                .eq('competition_id', comp.id);

            setMonthScores((monthScoreData || []) as ClanScore[]);

            // 3. Score de l'utilisateur sur les semaines du mois
            // Récupérer toutes les semaines dans la période du mois
            const { data: weekComps } = await supabase
                .from('clan_competitions')
                .select('id, period_start, period_end')
                .eq('type', 'week')
                .gte('period_start', comp.period_start)
                .lte('period_end', comp.period_end)
                .order('period_start', { ascending: true });

            const weeks = weekComps || [];

            // 4. Récupérer les participations de l'utilisateur pour ces semaines
            let userTotalScore = 0;
            let userTotalQuestions = 0;

            const weekSummaryData: WeekSummary[] = [];

            for (const week of weeks) {
                // Scores du clan pour cette semaine
                const { data: weekScoreData } = await supabase
                    .from('clan_competition_scores')
                    .select('clan, participants, avg_score_10, total_correct')
                    .eq('competition_id', week.id);

                weekSummaryData.push({
                    competition_id: week.id,
                    period_start: week.period_start,
                    period_end: week.period_end,
                    scores: (weekScoreData || []) as ClanScore[],
                });

                // Participation personnelle
                const { data: userAttempt } = await supabase
                    .from('clan_attempts')
                    .select('score, total_questions')
                    .eq('user_id', user.id)
                    .eq('competition_id', week.id)
                    .maybeSingle();

                if (userAttempt) {
                    userTotalScore     += userAttempt.score;
                    userTotalQuestions += userAttempt.total_questions;
                }
            }

            setWeekSummaries(weekSummaryData);
            if (userTotalQuestions > 0) {
                setUserMonthScore({ score: userTotalScore, total: userTotalQuestions });
            }
        } catch (err) {
            console.error('MonthlyClanQuiz init error:', err);
            setErrorMsg("Une erreur est survenue. Réessayez.");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading && user) init();
    }, [authLoading, user, init]);

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 text-accent animate-spin opacity-40" />
            </div>
        );
    }

    const sortedMonth = [...monthScores].sort((a, b) => b.avg_score_10 - a.avg_score_10);
    const maxMonthScore = Math.max(...sortedMonth.map(s => s.avg_score_10), 0.01);
    const leader = sortedMonth[0] ?? null;

    return (
        <div className="min-h-screen bg-background text-text font-sans">
            <div className="max-w-3xl mx-auto px-6 py-12">

                {/* Back */}
                <Link
                    to="/clan-quiz"
                    className="inline-flex items-center gap-2 text-text-muted hover:text-text text-sm font-black uppercase tracking-widest transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" /> TechSquad
                </Link>

                {/* Header */}
                <div className="mb-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-3">Classement mensuel</p>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3">
                        Compétition<br /><span className="text-accent">du mois</span>
                    </h1>
                    {monthComp && (
                        <p className="text-text-muted">
                            Du <strong>{formatDate(monthComp.period_start)}</strong> au <strong>{formatDate(monthComp.period_end)}</strong>
                        </p>
                    )}
                </div>

                {errorMsg && (
                    <div className="p-6 bg-surface/30 border border-border/60 rounded-3xl text-text-muted mb-8">
                        <p>{errorMsg}</p>
                    </div>
                )}

                {/* Leader highlight */}
                {leader && (() => {
                    const cfg = SQUAD_COLORS[leader.clan];
                    if (!cfg) return null;
                    const Icon = cfg.icon;
                    return (
                        <div className={`relative bg-gradient-to-br ${cfg.bg} border ${cfg.border} rounded-3xl p-6 mb-8 overflow-hidden`}>
                            <div className="absolute top-4 right-4 opacity-10">
                                <Crown className="w-24 h-24" />
                            </div>
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-3">
                                    <Crown className="w-4 h-4 text-yellow-400" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/60">En tête ce mois-ci</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Icon className={`w-10 h-10 ${cfg.color}`} />
                                    <div>
                                        <h2 className={`text-3xl font-black ${cfg.color}`}>{leader.clan}</h2>
                                        <p className="text-text-muted text-sm">{leader.avg_score_10.toFixed(1)}/10 de moyenne · {leader.participants} participant{leader.participants > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Monthly ranking */}
                {sortedMonth.length > 0 && (
                    <div className="bg-surface/50 border border-border/60 rounded-3xl overflow-hidden mb-8">
                        <div className="p-5 border-b border-border/40">
                            <h2 className="text-base font-black">Classement mensuel</h2>
                            <p className="text-xs text-text-muted mt-0.5">Basé sur les scores des quiz hebdomadaires</p>
                        </div>
                        <div className="p-4 space-y-3">
                            {sortedMonth.map((s, i) => {
                                const cfg = SQUAD_COLORS[s.clan];
                                if (!cfg) return null;
                                const Icon = cfg.icon;
                                const pct = (s.avg_score_10 / maxMonthScore) * 100;
                                const isMySquad = s.clan === clan;

                                return (
                                    <div
                                        key={s.clan}
                                        className={`p-4 rounded-2xl border transition-all ${isMySquad
                                            ? `bg-gradient-to-br ${cfg.bg} ${cfg.border}`
                                            : 'bg-background/40 border-border/40'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                                                    i === 0 ? 'bg-yellow-400/10 text-yellow-400' : 'bg-surface text-text-muted'
                                                }`}>
                                                    {i === 0 ? <Crown className="w-3.5 h-3.5" /> : i + 1}
                                                </div>
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
                                                <p className="text-[10px] text-text-muted flex items-center gap-1 justify-end">
                                                    <Users className="w-3 h-3" />
                                                    {s.participants} mb.
                                                </p>
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
                    </div>
                )}

                {/* User personal stats */}
                {userMonthScore && (
                    <div className="bg-surface/40 border border-border/60 rounded-3xl p-5 mb-8">
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/60 mb-4">Ta progression ce mois-ci</p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-accent">
                                <Zap className="w-5 h-5" />
                                <span className="text-3xl font-black">{userMonthScore.score}</span>
                                <span className="text-text-muted text-xl">/ {userMonthScore.total}</span>
                            </div>
                            <div>
                                <p className="text-sm font-black">{Math.round((userMonthScore.score / userMonthScore.total) * 100)}% de réussite</p>
                                <p className="text-xs text-text-muted">sur {weekSummaries.filter(w => w.scores.length > 0).length} semaine{weekSummaries.length > 1 ? 's' : ''} participée{weekSummaries.length > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Weekly summaries */}
                {weekSummaries.length > 0 && (
                    <div className="bg-surface/30 border border-border/60 rounded-3xl overflow-hidden mb-8">
                        <div className="p-5 border-b border-border/40">
                            <h2 className="text-base font-black">Semaines du mois</h2>
                            <p className="text-xs text-text-muted mt-0.5">Résultats par semaine</p>
                        </div>
                        <div className="divide-y divide-border/40">
                            {weekSummaries.map(week => {
                                const weekLeader = [...week.scores].sort((a, b) => b.avg_score_10 - a.avg_score_10)[0];
                                const leaderCfg = weekLeader ? SQUAD_COLORS[weekLeader.clan] : null;

                                return (
                                    <div key={week.competition_id} className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-black">Semaine du {formatDate(week.period_start)}</p>
                                            <p className="text-xs text-text-muted">au {formatDate(week.period_end)}</p>
                                        </div>
                                        {weekLeader && leaderCfg ? (
                                            <div className="flex items-center gap-2">
                                                <leaderCfg.icon className={`w-4 h-4 ${leaderCfg.color}`} />
                                                <span className={`text-sm font-black ${leaderCfg.color}`}>
                                                    {weekLeader.clan}
                                                </span>
                                                <span className="text-xs text-text-muted">{weekLeader.avg_score_10.toFixed(1)}/10</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-text-muted">Aucun résultat</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* CTA */}
                <div className="text-center">
                    <Link
                        to="/clan-quiz/weekly"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-accent/20 hover:-translate-y-0.5"
                    >
                        <Trophy className="w-4 h-4" /> Participer au quiz de cette semaine
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
