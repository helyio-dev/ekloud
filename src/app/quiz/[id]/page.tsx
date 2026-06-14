import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, CheckCircle, XCircle, Loader2, Award, Sparkles, Target, Zap, ChevronRight, RefreshCcw } from 'lucide-react';

/**
 * structure d'une option de réponse.
 * l'indicateur de validité est omis volontairement pour des raisons de sécurité (anti-cheat).
 */
type Option = {
    id: string;
    option_text: string;
};

/**
 * structure d'une question de quiz.
 */
type Question = {
    id: string;
    question_text: string;
    options: Option[];
};

/**
 * bilan de performance renvoyé par la rpc supabase submit_quiz_attempt.
 */
type QuizResult = {
    score: number;
    passed: boolean;
    correct: number;
    total: number;
    xp_earned: number;
};

/**
 * état d'une réponse après validation unitaire par le serveur.
 */
type AnswerState = {
    selected_id: string;
    is_correct: boolean;
    correct_option_id: string;
};

/**
 * page de quiz ekloud.
 * gère le cycle de vie d'une évaluation : chargement sécurisé, validation en temps réel et bilan de progression.
 * implémente des mesures anti-triche via des validations serveur (rpc).
 */
export default function QuizPage() {
    const { id } = useParams();
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answerStates, setAnswerStates] = useState<Record<string, AnswerState>>({});
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
    const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);

    // vérification de la session utilisateur
    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    /**
     * charge les questions du module et mélange les options pour chaque instance.
     */
    useEffect(() => {
        async function fetchQuestions() {
            if (!user || !id) return;
            try {
                // l'indicateur is_correct est exclu de la sélection pour éviter l'exposition client
                const { data } = await supabase
                    .from('questions')
                    .select(`id, question_text, quiz_options (id, option_text)`)
                    .eq('module_id', id)
                    .limit(10);

                // algorithme de mélange fisher-yates pour l'impartialité des options
                const shuffle = <T,>(arr: T[]): T[] => {
                    const a = [...arr];
                    for (let i = a.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [a[i], a[j]] = [a[j], a[i]];
                    }
                    return a;
                };

                const processed = (data || []).map(q => ({
                    id: q.id,
                    question_text: q.question_text,
                    options: shuffle((q.quiz_options || []) as Option[]),
                }));
                
                setQuestions(processed);
            } catch (err) {
                console.error('erreur lors de la récupération des questions:', err);
            } finally {
                setIsLoadingQuiz(false);
            }
        }
        if (user && id) fetchQuestions();
    }, [user, id]);

    /**
     * valide une réponse via un appel rpc sécurisé.
     */
    const handleAnswer = async (questionId: string, optionId: string) => {
        if (answerStates[questionId] || isCheckingAnswer) return;

        setIsCheckingAnswer(true);
        setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));

        try {
            // le serveur arbitre la validité sans exposition préalable des clés de réponse
            const { data, error } = await supabase.rpc('check_quiz_answer', {
                p_answer_id: optionId,
            });

            if (error) throw error;

            setAnswerStates(prev => ({
                ...prev,
                [questionId]: {
                    selected_id: optionId,
                    is_correct: data.is_correct,
                    correct_option_id: data.correct_option_id,
                },
            }));
        } catch (err) {
            console.error('erreur lors de la validation de la réponse:', err);
        } finally {
            setIsCheckingAnswer(false);
        }
    };

    /**
     * transition vers la question suivante ou déclenchement de la soumission finale.
     */
    const nextQuestion = () => {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(prev => prev + 1);
        } else {
            submitResults();
        }
    };

    /**
     * finalise l'évaluation et calcule les gains d'xp et les déblocages de modules.
     */
    const submitResults = async () => {
        setIsSubmitting(true);
        try {
            const answerIds = Object.values(selectedAnswers);

            // traitement centralisé côté serveur pour la persistence et l'xp
            const { data, error } = await supabase.rpc('submit_quiz_attempt', {
                p_module_id: id,
                p_answer_ids: answerIds,
            });

            if (error) throw error;
            setResult(data as QuizResult);
        } catch (err) {
            console.error('erreur lors de la soumission du quiz:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentQ = questions[currentIndex];
    const currentAnswerState = currentQ ? answerStates[currentQ.id] : null;

    if (isLoadingQuiz || (authLoading && !user)) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-accent animate-spin opacity-20" />
            </div>
        );
    }

    // état si aucune donnée n'est disponible pour ce trajet
    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8 text-center">
                <div className="max-w-md w-full animate-in fade-in zoom-in duration-700">
                    <Target className="w-20 h-20 text-text-muted/20 mx-auto mb-8" />
                    <h1 className="text-3xl font-black uppercase tracking-widest mb-4">trajectoire vide</h1>
                    <p className="text-text-muted/60 mb-12 font-medium leading-relaxed">aucune donnée d'évaluation n'a été détectée pour ce module opérationnel.</p>
                    <Link to={`/modules/${id}`} className="inline-flex items-center gap-4 px-10 py-4 bg-accent text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-accent/20 transition-transform active:scale-95">
                        <ChevronLeft size={16} /> retour module
                    </Link>
                </div>
            </div>
        );
    }

    if (isSubmitting) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8">
                <div className="relative">
                    <Loader2 className="w-16 h-16 text-accent animate-spin opacity-40" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-accent animate-pulse" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <p className="text-sm font-black uppercase tracking-[0.5em] text-text-muted animate-pulse">synchronisation des stats...</p>
                    <p className="text-[10px] font-bold text-text-muted/40 uppercase">ekloud scoring protocol active</p>
                </div>
            </div>
        );
    }

    // écran de bilan (results)
    if (result) {
        const pct = Math.floor(result.score);
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8 font-sans overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
                
                <div className="max-w-xl w-full bg-surface border-2 border-border/80 rounded-[3rem] p-12 text-center shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative animate-in zoom-in-95 fade-in duration-1000 fill-mode-both">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] ${result.passed ? 'bg-emerald-500 text-white shadow-emerald-500/30 rotate-12' : 'bg-rose-500 text-white shadow-rose-500/30 -rotate-12'}`}>
                            {result.passed ? <Award className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                        </div>
                    </div>
                    
                    <div className="mt-8 space-y-4">
                        <h1 className="text-5xl font-black uppercase tracking-tighter">{result.passed ? 'réussite totale' : 'échec simulé'}</h1>
                        <p className="text-text-muted/70 font-medium text-lg italic">débriefing de la mission d'évaluation terminé.</p>
                    </div>

                    <div className="my-12 grid grid-cols-2 gap-4">
                        <div className="p-8 bg-background border border-border/60 rounded-[2rem] flex flex-col items-center gap-3 shadow-inner">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">précision</span>
                            <span className="text-4xl font-black text-accent">{pct}%</span>
                        </div>
                        <div className="p-8 bg-background border border-border/60 rounded-[2rem] flex flex-col items-center gap-3 shadow-inner">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">score</span>
                            <span className="text-4xl font-black text-text">{result.correct}<span className="text-text-muted/30 text-2xl">/{result.total}</span></span>
                        </div>
                        
                        {result.passed && result.xp_earned > 0 && (
                            <div className="col-span-2 p-8 bg-amber-500/5 rounded-[2rem] border border-amber-500/20 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both">
                                <div className="flex items-center gap-4">
                                    <Sparkles className="text-amber-500 w-8 h-8" />
                                    <span className="text-lg font-black uppercase tracking-widest text-amber-500">potentiel xp</span>
                                </div>
                                <span className="text-3xl font-black text-amber-500">+{result.xp_earned} <span className="text-sm font-bold opacity-60">unités</span></span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <Link to={`/modules/${id}`} className="group flex items-center justify-center gap-4 py-8 bg-accent hover:bg-accent/90 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs transition-all shadow-xl shadow-accent/40 active:scale-95">
                            continuer vers les modules <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                        {!result.passed && (
                            <button
                                onClick={() => window.location.reload()}
                                className="flex items-center justify-center gap-4 py-6 bg-background hover:bg-surface-hover text-text rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] border border-border/60 transition-all active:scale-95"
                            >
                                <RefreshCcw size={14} /> relancer le protocole
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text flex flex-col font-sans">
            <header className="border-b border-border/80 bg-surface px-8 py-6 flex items-center justify-between sticky top-0 z-50 shadow-md">
                <nav className="flex items-center gap-6">
                    <Link to={`/modules/${id}`} className="p-3 bg-background hover:bg-surface-hover rounded-2xl transition-all text-text-muted hover:text-text border border-border/60 active:scale-90 shadow-sm" aria-label="retour au module">
                        <ChevronLeft size={20} />
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-text-muted/60">phase opérationnelle</span>
                        <h1 className="text-base font-black uppercase tracking-widest text-text">
                            question {currentIndex + 1} <span className="text-text-muted/40 font-bold mx-1">/</span> {questions.length}
                        </h1>
                    </div>
                </nav>
                <div className="hidden md:flex items-center gap-4 bg-background p-1.5 rounded-full border border-border/80 w-80 h-6 overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-accent rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </header>

            <main className="flex-grow max-w-4xl mx-auto w-full px-8 py-20 flex flex-col justify-center relative z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full aspect-square bg-accent/10 rounded-full blur-[160px] pointer-events-none" />
                
                <div className="relative z-20 space-y-24">
                    <h2 className="text-4xl md:text-6xl font-black text-center leading-[1] uppercase tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-700 decoration-accent/20 underline-offset-8">
                        {currentQ.question_text}
                    </h2>

                    <div className="grid gap-6">
                        {currentQ.options.map((option, idx) => {
                            const isSelected = currentAnswerState?.selected_id === option.id;
                            const isCorrectOption = currentAnswerState?.correct_option_id === option.id;
                            const answered = !!currentAnswerState;

                            let baseStyle = 'bg-surface border-border/80 hover:bg-accent/5 hover:border-accent/60 text-text/90 shadow-lg';
                            if (answered) {
                                if (isSelected && currentAnswerState.is_correct) {
                                    baseStyle = 'bg-emerald-500/10 border-emerald-500/60 text-emerald-500 shadow-xl shadow-emerald-500/10';
                                } else if (isSelected && !currentAnswerState.is_correct) {
                                    baseStyle = 'bg-rose-500/10 border-rose-500/60 text-rose-500 shadow-xl shadow-rose-500/10';
                                } else if (isCorrectOption) {
                                    baseStyle = 'bg-emerald-500/5 border-emerald-500/40 text-emerald-500/80';
                                } else {
                                    baseStyle = 'bg-background border-border/40 text-text-muted/20 opacity-40 grayscale';
                                }
                            }

                            return (
                                <button
                                    key={option.id}
                                    disabled={answered || isCheckingAnswer}
                                    onClick={() => handleAnswer(currentQ.id, option.id)}
                                    className={`w-full p-10 rounded-[3rem] border-2 text-left transition-all flex items-center justify-between group disabled:cursor-not-allowed animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both ${baseStyle}`}
                                    style={{ animationDelay: `${idx * 150}ms` }}
                                >
                                    <div className="flex items-center gap-10">
                                        <div className={`w-12 h-12 rounded-2xl border-2 border-current/20 flex items-center justify-center text-sm font-black transition-all ${isSelected ? 'bg-accent text-white border-accent scale-110 shadow-lg' : 'group-hover:bg-accent/10 group-hover:border-accent/40 group-hover:text-accent'}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className="font-black text-xl md:text-2xl tracking-tight uppercase leading-none">{option.option_text}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        {answered && isSelected && (
                                            currentAnswerState.is_correct
                                                ? <CheckCircle className="w-10 h-10 shrink-0 text-emerald-500 animate-in zoom-in duration-500" />
                                                : <XCircle className="w-10 h-10 shrink-0 text-rose-500 animate-in zoom-in duration-500" />
                                        )}
                                        {answered && !isSelected && isCorrectOption && (
                                            <CheckCircle className="w-8 h-8 shrink-0 opacity-60 text-emerald-500" />
                                        )}
                                        {isCheckingAnswer && isSelected && !answered && (
                                            <Loader2 className="w-8 h-8 animate-spin text-accent" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>

            <footer className="p-12 sticky bottom-0 z-50 bg-gradient-to-t from-background via-background to-transparent">
                <div className="max-w-4xl mx-auto flex justify-center md:justify-end">
                    {currentAnswerState && (
                        <button
                            onClick={nextQuestion}
                            className="group flex items-center gap-8 px-20 py-8 bg-accent hover:bg-accent/90 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-xs shadow-[0_25px_60px_rgba(99,102,241,0.5)] animate-in fade-in slide-in-from-bottom-8 duration-700 transition-all transform hover:scale-105 active:scale-95"
                        >
                            <span>{currentIndex + 1 === questions.length ? 'exfiltrer les résultats' : 'itération suivante'}</span>
                            <ChevronRight size={22} className="group-hover:translate-x-3 transition-transform duration-500" />
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
}
