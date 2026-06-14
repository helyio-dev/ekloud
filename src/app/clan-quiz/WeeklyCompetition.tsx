import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Crown, Users, CheckCircle, XCircle, Loader2, ChevronRight, Calendar, Flame, CalendarDays } from 'lucide-react';

type SquadId = 'ROOT' | 'VOID' | 'CORE' | 'CYPHER';

const SQUAD: Record<SquadId, { color: string; bg: string; border: string; hex: string }> = {
    ROOT:   { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', hex: '#fb923c' },
    VOID:   { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', hex: '#a78bfa' },
    CORE:   { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   hex: '#60a5fa' },
    CYPHER: { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  hex: '#4ade80' },
};

interface Question { id: string; question_text: string; options: { text: string; correct: boolean }[]; }
interface Competition { id: string; type: 'week' | 'month'; period_start: string; period_end: string; status: string; question_ids: string[]; }
interface ClanScore { clan: SquadId; participants: number; avg_score_10: number; total_correct: number; }
type Phase = 'lobby' | 'quiz' | 'done';

export default function WeeklyCompetition({ userClan, defaultTab }: { userClan: SquadId; defaultTab?: 'week' | 'month' }) {
    const { user } = useAuth();
    const conf = SQUAD[userClan] || SQUAD.ROOT;
    const forced = !!defaultTab;

    const [activeTab, setActiveTab] = useState<'week' | 'month'>(defaultTab || 'week');
    const [competitions, setCompetitions] = useState<Record<'week' | 'month', Competition | null>>({ week: null, month: null });
    const [questions, setQuestions] = useState<Question[]>([]);
    const [scores, setScores] = useState<Record<'week' | 'month', ClanScore[]>>({ week: [], month: [] });
    const [played, setPlayed] = useState<Record<'week' | 'month', number | null>>({ week: null, month: null });
    const [isLoading, setIsLoading] = useState(true);
    const [phase, setPhase] = useState<Phase>('lobby');
    const [currentQ, setCurrentQ] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [answers, setAnswers] = useState<boolean[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const comp = competitions[activeTab];
    const myScore = played[activeTab];
    const clanScores = scores[activeTab];

    useEffect(() => { loadData(); }, [user?.id]);

    const loadData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data: comps } = await supabase.from('clan_competitions').select('*').eq('status', 'active').in('type', ['week', 'month']);
            const compMap: Record<string, Competition> = {};
            (comps || []).forEach((c: Competition) => { compMap[c.type] = c; });
            setCompetitions({ week: compMap['week'] || null, month: compMap['month'] || null });
            const compIds = Object.values(compMap).map(c => c.id);
            if (compIds.length > 0) {
                const { data: sc } = await supabase.from('clan_competition_scores').select('*').in('competition_id', compIds);
                const scByComp: Record<string, ClanScore[]> = {};
                (sc || []).forEach((s: any) => { if (!scByComp[s.competition_id]) scByComp[s.competition_id] = []; scByComp[s.competition_id].push(s); });
                setScores({ week: compMap['week'] ? (scByComp[compMap['week'].id] || []).sort((a, b) => b.avg_score_10 - a.avg_score_10) : [], month: compMap['month'] ? (scByComp[compMap['month'].id] || []).sort((a, b) => b.avg_score_10 - a.avg_score_10) : [] });
                const { data: attempts } = await supabase.from('clan_attempts').select('competition_id, score').eq('user_id', user.id).in('competition_id', compIds);
                const playedMap: Record<'week' | 'month', number | null> = { week: null, month: null };
                (attempts || []).forEach((a: any) => { const type = Object.keys(compMap).find(t => compMap[t as 'week' | 'month']?.id === a.competition_id) as 'week' | 'month' | undefined; if (type) playedMap[type] = a.score; });
                setPlayed(playedMap);
            }
        } catch (err) { console.error('[COMPETITION] loadData:', err); }
        finally { setIsLoading(false); }
    };

    const loadQuestions = async () => {
        if (!comp) return;
        const { data, error } = await supabase.from('clan_questions').select('id, question_text, options').eq('active', true);
        if (error || !data || data.length === 0) { console.error('[COMPETITION] loadQuestions error:', error?.message); return; }
        const shuffled = [...data];
        for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
        setQuestions(shuffled.slice(0, 10));
        setPhase('quiz'); setCurrentQ(0); setSelected(null); setAnswers([]);
    };

    const handleAnswer = (idx: number) => {
        if (selected !== null) return;
        setSelected(idx);
        const correct = questions[currentQ].options[idx]?.correct === true;
        setTimeout(() => {
            const next = [...answers, correct];
            if (currentQ + 1 < questions.length) { setAnswers(next); setCurrentQ(q => q + 1); setSelected(null); }
            else { submitResults(next); }
        }, 800);
    };

    const submitResults = async (final: boolean[]) => {
        if (!user || !comp) return;
        setIsSaving(true);
        const score = final.filter(Boolean).length;
        try {
            await supabase.from('clan_attempts').insert({ user_id: user.id, competition_id: comp.id, score, total_questions: questions.length });
            setPlayed(prev => ({ ...prev, [activeTab]: score }));
            setPhase('done');
            await loadData();
        } catch (err) { console.error('[COMPETITION] submit:', err); }
        finally { setIsSaving(false); }
    };

    const formatPeriod = (c: Competition) => {
        const start = new Date(c.period_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        const end = new Date(c.period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        return `${start} – ${end}`;
    };

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 text-accent animate-spin opacity-40" /></div>;

    return (
        <div className="space-y-6">
            {!forced && (
                <div className="flex gap-1 p-1 bg-surface border border-border rounded-2xl w-fit">
                    {(['week', 'month'] as const).map(t => (
                        <button key={t} onClick={() => { setActiveTab(t); setPhase('lobby'); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-muted hover:text-text'}`}>
                            {t === 'week' ? <><Calendar className="w-3.5 h-3.5" />Semaine</> : <><CalendarDays className="w-3.5 h-3.5" />Mois</>}
                        </button>
                    ))}
                </div>
            )}

            {!comp ? (
                <div className="text-center py-12 bg-surface/20 rounded-2xl border border-dashed border-border">
                    <Calendar className="w-10 h-10 text-text-muted/20 mx-auto mb-3" />
                    <p className="text-text-muted text-sm font-medium">Pas de compétition {activeTab === 'week' ? 'cette semaine' : 'ce mois'}.</p>
                </div>
            ) : phase === 'quiz' ? (
                isSaving ? (
                    <div className="flex flex-col items-center py-12 gap-4"><Loader2 className="w-7 h-7 text-accent animate-spin" /><p className="text-sm text-text-muted font-medium">Envoi des résultats...</p></div>
                ) : (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-border/30 rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(currentQ / questions.length) * 100}%` }} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 shrink-0">{currentQ + 1}/{questions.length}</span>
                        </div>
                        <div className="p-5 bg-surface border border-border rounded-2xl">
                            <p className="font-black text-base leading-snug">{questions[currentQ].question_text}</p>
                        </div>
                        <div className="space-y-2">
                            {questions[currentQ].options.map((opt, idx) => {
                                const isSel = selected === idx;
                                const ok = opt.correct;
                                let s = 'bg-surface border-border hover:border-accent/40 hover:bg-accent/5 cursor-pointer';
                                if (selected !== null) {
                                    if (isSel && ok) s = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 cursor-default';
                                    else if (isSel) s = 'bg-rose-500/10 border-rose-500/40 text-rose-400 cursor-default';
                                    else if (ok) s = 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500/60 cursor-default';
                                    else s = 'opacity-40 cursor-default border-border';
                                }
                                return (
                                    <button key={idx} disabled={selected !== null} onClick={() => handleAnswer(idx)}
                                        className={`w-full flex items-center justify-between gap-3 p-4 rounded-xl border text-left text-sm font-bold transition-all ${s}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border shrink-0 ${isSel ? (ok ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-rose-500 border-rose-500 text-white') : 'border-border/60 text-text-muted/60'}`}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            {opt.text}
                                        </div>
                                        {selected !== null && isSel && (ok ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-500 shrink-0" />)}
                                        {selected !== null && !isSel && ok && <CheckCircle className="w-4 h-4 text-emerald-500/60 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )
            ) : (
                <div className="space-y-5">
                    <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${conf.bg} ${conf.border}`}>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 flex items-center gap-2 mb-1">
                                {activeTab === 'week' ? <Calendar className="w-3 h-3" /> : <CalendarDays className="w-3 h-3" />}
                                {activeTab === 'week' ? 'Semaine' : 'Mois'} · {formatPeriod(comp)}
                            </p>
                            <h3 className={`text-lg font-black ${conf.color}`}>{activeTab === 'week' ? 'Quiz hebdomadaire' : 'Championnat mensuel'}</h3>
                            <p className="text-text-muted/70 text-sm mt-0.5">10 questions aléatoires · Représente {userClan}</p>
                        </div>
                        {myScore !== null ? (
                            <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${conf.bg} ${conf.border}`}>
                                <CheckCircle className={`w-5 h-5 ${conf.color}`} />
                                <div>
                                    <div className={`text-xl font-black ${conf.color}`}>{myScore}/10</div>
                                    <div className="text-[9px] font-bold text-text-muted/60 uppercase tracking-widest">Ton score</div>
                                </div>
                            </div>
                        ) : (
                            <button onClick={loadQuestions} className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shrink-0">
                                {phase === 'done' ? 'Rejouer' : 'Participer'} <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {clanScores.length > 0 && (
                        <>
                            <div className="flex items-center gap-3 pt-2">
                                <div className="flex-1 h-px bg-border/40" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/40">Scores quiz</span>
                                <div className="flex-1 h-px bg-border/40" />
                            </div>
                            <ClanLeaderboard scores={clanScores} userClan={userClan} type={activeTab} />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function ClanLeaderboard({ scores, userClan, type }: { scores: ClanScore[]; userClan: SquadId; type: 'week' | 'month' }) {
    const ALL: SquadId[] = ['ROOT', 'VOID', 'CORE', 'CYPHER'];
    const full = ALL.map(clan => scores.find(s => s.clan === clan) || { clan, participants: 0, avg_score_10: 0, total_correct: 0 }).sort((a, b) => b.avg_score_10 - a.avg_score_10);
    const maxAvg = Math.max(...full.map(s => s.avg_score_10), 1);
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <Trophy className="w-4 h-4 text-accent" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-muted">Scores du quiz {type === 'week' ? 'cette semaine' : 'ce mois'}</h3>
            </div>
            {full.map((s, idx) => {
                const c = SQUAD[s.clan] || SQUAD.ROOT;
                const pct = maxAvg > 0 ? (s.avg_score_10 / maxAvg) * 100 : 0;
                const isMe = s.clan === userClan;
                return (
                    <div key={s.clan} className={`p-4 rounded-2xl border transition-all ${isMe ? `${c.bg} ${c.border}` : 'bg-surface border-border'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${idx === 0 ? 'bg-amber-400/20 text-amber-400' : 'bg-surface-hover text-text-muted'}`}>
                                {idx === 0 ? <Crown className="w-4 h-4" /> : idx + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`font-black text-sm ${c.color}`}>{s.clan}</span>
                                    {isMe && <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded-full">Ta squad</span>}
                                </div>
                                <div className="text-[9px] text-text-muted/60 font-medium mt-0.5 flex items-center gap-2">
                                    <Users className="w-3 h-3" />{s.participants} joueur{s.participants > 1 ? 's' : ''}
                                    {s.participants > 0 && <><Flame className="w-3 h-3" />moy. {s.avg_score_10.toFixed(1)}/10</>}
                                </div>
                            </div>
                            <span className={`font-black text-base shrink-0 ${c.color}`}>{s.participants > 0 ? s.avg_score_10.toFixed(1) : '–'}</span>
                        </div>
                        <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: c.hex }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
