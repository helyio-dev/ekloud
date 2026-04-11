import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Loader2, Award, Shield, RefreshCcw, ChevronRight, Zap, Target, Sparkles } from 'lucide-react';
import { addXp } from '@/lib/gamification';

/**
 * structure d'une question d'examen incluant ses options de réponse.
 */
type Question = {
    id: string;
    question_text: string;
    answers: {
        id: string;
        answer_text: string;
        is_correct: boolean;
    }[];
};

/**
 * page d'examen de palier ekloud.
 * évaluation finale de module avec un seuil de réussite de 80%.
 * gère la validation persistante du module et l'attribution de récompenses xp doublées.
 */
export default function ExamPage() {
    const { id } = useParams();
    const { user, isLoading: authLoading, xp, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [earnedXp, setEarnedXp] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // protection de la route (authentification requise)
    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    /**
     * charge et mélange les questions et réponses pour garantir l'intégrité de l'examen.
     */
    useEffect(() => {
        async function fetchExamQuestions() {
            if (!user || !id) return;

            try {
                // récupération du pool de questions pour l'évaluation finale
                const { data: qData } = await supabase
                    .from('questions')
                    .select(`id, question_text, quiz_options (id, option_text, is_correct)`)
                    .eq('module_id', id)
                    .limit(20);

                // utilitaire de mélange fisher-yates
                const shuffle = <T,>(arr: T[]): T[] => {
                    const a = [...arr];
                    for (let i = a.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [a[i], a[j]] = [a[j], a[i]];
                    }
                    return a;
                };

                const processed = (qData || []).map(q => ({
                    id: q.id,
                    question_text: q.question_text,
                    answers: shuffle((q.quiz_options || []).map((o: any) => ({
                        id: o.id,
                        answer_text: o.option_text,
                        is_correct: o.is_correct
                    })))
                }));
                
                // double mélange : options et ordre des questions
                setQuestions(shuffle(processed));
            } catch (err) {
                console.error("erreur lors de la récupération des questions d'examen:", err);
            } finally {
                setIsLoading(false);
            }
        }

        if (user && id) fetchExamQuestions();
    }, [user, id]);

    /**
     * traite la sélection d'une réponse et incrémente le score si correct.
     */
    const handleAnswer = (answerId: string) => {
        if (selectedAnswer) return;
        setSelectedAnswer(answerId);

        const currentQ = questions[currentIndex];
        const answer = currentQ.answers.find(a => a.id === answerId);
        if (answer?.is_correct) {
            setScore(prev => prev + 1);
            setEarnedXp(prev => prev + 2); // bonus examen : double xp
        }
    };

    /**
     * navigue vers le bloc d'évaluation suivant ou déclenche le calcul final.
     */
    const nextQuestion = () => {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            finalizeExam();
        }
    };

    /**
     * clôture l'examen, valide le module et synchronise les récompenses.
     */
    const finalizeExam = async () => {
        setIsSubmitting(true);
        const finalScorePercentage = (score / questions.length) * 100;
        const passed = finalScorePercentage >= 80; // seuil de rigueur ekloud

        try {
            if (passed) {
                // validation du module pour déblocage des paliers suivants
                await supabase.from('user_modules').upsert({
                    user_id: user?.id,
                    module_id: id,
                    completed: true,
                    unlocked: true
                }, { onConflict: 'user_id,module_id' });
            }

            // archivage de la tentative
            await supabase.from('quiz_attempts').insert({
                user_id: user?.id,
                module_id: id,
                score: finalScorePercentage,
                passed: passed,
                is_exam: true
            });

            if (passed && earnedXp > 0 && user) {
                await addXp(supabase, user.id, xp || 0, earnedXp);
                await refreshProfile();
            } else if (passed) {
                await refreshProfile();
            }

            setShowResult(true);
        } catch (err) {
            console.error("erreur lors de la finalisation de l'examen:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentQ = questions[currentIndex];

    if (isLoading || (authLoading && !user)) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-accent animate-spin opacity-20" />
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8 text-center">
                <div className="max-w-md w-full animate-in fade-in zoom-in duration-700">
                    <Shield className="w-20 h-20 text-text-muted/20 mx-auto mb-8" />
                    <h1 className="text-3xl font-black uppercase tracking-widest mb-4">examen indisponible</h1>
                    <p className="text-text-muted/60 mb-12 font-medium leading-relaxed">impossible de localiser les protocoles d'examen pour ce module.</p>
                    <Link to={`/modules/${id}`} className="inline-flex items-center gap-4 px-10 py-4 bg-accent text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-accent/20 active:scale-95">
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
                    <p className="text-sm font-black uppercase tracking-[0.5em] text-text-muted animate-pulse">calcul du score final...</p>
                    <p className="text-[10px] font-bold text-text-muted/40 uppercase">ekloud grading protocol v1.0</p>
                </div>
            </div>
        );
    }

    if (showResult) {
        const passed = (score / questions.length) * 100 >= 80;
        const pct = Math.floor((score / questions.length) * 100);
        
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8 font-sans overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
                
                <div className="max-w-xl w-full bg-surface/40 backdrop-blur-3xl border border-border/80 rounded-[3rem] p-12 text-center shadow-2xl relative animate-in zoom-in-95 fade-in duration-1000 fill-mode-both">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl ${passed ? 'bg-emerald-500 text-white shadow-emerald-500/30 rotate-12' : 'bg-rose-500 text-white shadow-rose-500/30 -rotate-12'}`}>
                            {passed ? <Shield className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                        </div>
                    </div>
                    
                    <div className="mt-8 space-y-4">
                        <h1 className="text-5xl font-black uppercase tracking-tighter font-equinox">{passed ? 'examen validé' : 'accès refusé'}</h1>
                        <p className="text-text-muted/70 font-medium text-lg italic">délibération finale sur vos compétences cloud.</p>
                    </div>

                    <div className="my-12 grid grid-cols-2 gap-4">
                        <div className="p-8 bg-surface/60 rounded-[2rem] border border-border/40 flex flex-col items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">précision finale</span>
                            <span className="text-4xl font-black text-accent">{pct}%</span>
                            <span className="text-[9px] font-bold text-text-muted/40 uppercase whitespace-nowrap">seuil requis : 80%</span>
                        </div>
                        <div className="p-8 bg-surface/60 rounded-[2rem] border border-border/40 flex flex-col items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">recherches exactes</span>
                            <span className="text-4xl font-black text-text">{score}<span className="text-text-muted/30 text-2xl">/{questions.length}</span></span>
                        </div>
                        
                        {passed && earnedXp > 0 && (
                            <div className="col-span-2 p-8 bg-amber-500/5 rounded-[2rem] border border-amber-500/20 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both">
                                <div className="flex items-center gap-4">
                                    <Sparkles className="text-amber-500 w-8 h-8" />
                                    <span className="text-lg font-black uppercase tracking-widest text-amber-500">prime d'élite</span>
                                </div>
                                <span className="text-3xl font-black text-amber-500">+{earnedXp} <span className="text-sm font-bold opacity-60">unités</span></span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <Link to={`/dashboard`} className="group flex items-center justify-center gap-4 py-6 bg-accent hover:bg-accent/90 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs transition-all shadow-xl shadow-accent/20 active:scale-95">
                            retour au centre de contrôle <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                        {!passed && (
                            <button
                                onClick={() => window.location.reload()}
                                className="flex items-center justify-center gap-4 py-6 bg-surface-hover/50 hover:bg-surface-hover text-text rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] border border-border/40 transition-all active:scale-95"
                            >
                                <RefreshCcw size={14} /> réinitialiser l'examen
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text flex flex-col font-sans">
            <header className="border-b border-border/60 bg-surface/40 px-8 py-5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-3xl shadow-sm">
                <nav className="flex items-center gap-6">
                    <Link to={`/modules/${id}`} className="p-2.5 bg-surface-hover/50 hover:bg-surface-hover rounded-2xl transition-all text-text-muted hover:text-text border border-border/40 active:scale-90" aria-label="quitter l'examen">
                        <ChevronLeft size={20} />
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-rose-500 animate-pulse">examen de certification</span>
                        <h1 className="text-sm font-black uppercase tracking-widest text-text">
                            objectif {currentIndex + 1} <span className="text-text-muted/40 font-bold mx-1">/</span> {questions.length}
                        </h1>
                    </div>
                </nav>
                <div className="hidden md:flex items-center gap-4 bg-surface/50 p-1.5 rounded-full border border-border/60 w-64 h-5 overflow-hidden">
                    <div
                        className="h-full bg-accent rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </header>

            <main className="flex-grow max-w-4xl mx-auto w-full px-8 py-20 flex flex-col justify-center relative z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full aspect-square bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="relative z-20 space-y-20">
                    <h2 className="text-3xl md:text-5xl font-black text-center leading-[1.1] uppercase font-equinox tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {currentQ?.question_text}
                    </h2>

                    <div className="grid gap-5">
                        {currentQ?.answers?.map((answer, idx) => {
                            const isSelected = selectedAnswer === answer.id;
                            const isCorrect = isSelected && answer.is_correct;
                            const answered = !!selectedAnswer;

                            let baseStyle = 'bg-surface/30 border-border/80 hover:bg-accent/5 hover:border-accent/40 text-text/80 shadow-sm';
                            if (answered) {
                                if (isSelected) {
                                    baseStyle = isCorrect 
                                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-emerald-500/10' 
                                        : 'bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-rose-500/10';
                                } else {
                                    baseStyle = 'bg-surface/10 border-border/20 text-text-muted/40 opacity-50 grayscale';
                                }
                            }

                            return (
                                <button
                                    key={answer.id}
                                    disabled={answered}
                                    onClick={() => handleAnswer(answer.id)}
                                    className={`w-full p-8 rounded-[2.5rem] border text-left transition-all flex items-center justify-between group disabled:cursor-not-allowed animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both ${baseStyle}`}
                                    style={{ animationDelay: `${idx * 150}ms` }}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-8 h-8 rounded-full border border-current/20 flex items-center justify-center text-[10px] font-black group-hover:bg-accent group-hover:text-white transition-all ${isSelected ? 'bg-accent text-white scale-110' : ''}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className="font-black text-lg md:text-xl tracking-tight uppercase">{answer.answer_text}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        {answered && isSelected && (
                                            isCorrect 
                                                ? <CheckCircle className="w-8 h-8 shrink-0 text-emerald-500 animate-in zoom-in duration-500" />
                                                : <XCircle className="w-8 h-8 shrink-0 text-rose-500 animate-in zoom-in duration-500" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>

            <footer className="p-8 md:p-12 sticky bottom-0 z-50">
                <div className="max-w-4xl mx-auto flex justify-center md:justify-end">
                    {selectedAnswer && (
                        <button
                            onClick={nextQuestion}
                            disabled={isSubmitting}
                            className="group flex items-center gap-6 px-16 py-6 bg-accent hover:bg-accent/90 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs shadow-[0_20px_50px_rgba(99,102,241,0.3)] animate-in fade-in slide-in-from-bottom-8 duration-700 transition-all transform hover:scale-105 active:scale-95"
                        >
                            <span>{currentIndex + 1 === questions.length ? 'exfiltrer les résultats' : 'itération suivante'}</span>
                            <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
}
