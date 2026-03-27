import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, CheckCircle, XCircle, Loader2, Award } from 'lucide-react';

// is_correct is intentionally NOT in this type — it is never fetched from the client.
type Option = {
    id: string;
    option_text: string;
};

type Question = {
    id: string;
    question_text: string;
    options: Option[];
};

// Result returned by the submit_quiz_attempt Supabase RPC
type QuizResult = {
    score: number;
    passed: boolean;
    correct: number;
    total: number;
    xp_earned: number;
};

// Per-answer state after the server validates it
type AnswerState = {
    selected_id: string;
    is_correct: boolean;
    correct_option_id: string;
};

export default function QuizPage() {
    const { id } = useParams();
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Map of questionId → validated answer state (returned by RPC)
    const [answerStates, setAnswerStates] = useState<Record<string, AnswerState>>({});
    // Map of questionId → answerId chosen by the user (to submit at the end)
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

    const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
    const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        async function fetchQuestions() {
            if (!user || !id) return;
            try {
                // ⚠️ is_correct is NOT selected — prevents answer leakage
                const { data } = await supabase
                    .from('questions')
                    .select(`id, question_text, quiz_options (id, option_text)`)
                    .eq('module_id', id)
                    .limit(10);

                const shuffled = (data || []).map(q => ({
                    id: q.id,
                    question_text: q.question_text,
                    options: ((q.quiz_options || []) as Option[]).sort(() => Math.random() - 0.5),
                }));
                setQuestions(shuffled);
            } catch (err) {
                console.error('Quiz fetchQuestions error:', err);
            } finally {
                setIsLoadingQuiz(false);
            }
        }
        if (user && id) fetchQuestions();
    }, [user, id]);

    const handleAnswer = async (questionId: string, optionId: string) => {
        // Already answered this question
        if (answerStates[questionId] || isCheckingAnswer) return;

        setIsCheckingAnswer(true);
        setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));

        try {
            // 🔒 Server validates the answer — is_correct never comes from the initial query
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
            console.error('check_quiz_answer error:', err);
        } finally {
            setIsCheckingAnswer(false);
        }
    };

    const nextQuestion = () => {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(prev => prev + 1);
        } else {
            submitResults();
        }
    };

    const submitResults = async () => {
        setIsSubmitting(true);
        try {
            const answerIds = Object.values(selectedAnswers);

            // 🔒 Score, XP, and module unlock are all calculated server-side
            const { data, error } = await supabase.rpc('submit_quiz_attempt', {
                p_module_id: id,
                p_answer_ids: answerIds,
            });

            if (error) throw error;
            setResult(data as QuizResult);
        } catch (err) {
            console.error('submit_quiz_attempt error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentQ = questions[currentIndex];
    const currentAnswerState = currentQ ? answerStates[currentQ.id] : null;

    if (isLoadingQuiz || (authLoading && !user)) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full">
                    <HelpCircle className="w-16 h-16 text-text-muted mx-auto mb-6" />
                    <h1 className="text-2xl font-bold mb-4">Quiz non disponible</h1>
                    <p className="text-text-muted mb-8">Aucune question n'a été trouvée pour ce module.</p>
                    <Link to={`/modules/${id}`} className="inline-block px-8 py-3 bg-accent text-white rounded-xl font-bold">
                        Retour au module
                    </Link>
                </div>
            </div>
        );
    }

    if (isSubmitting) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
                <p className="text-text-muted font-medium animate-pulse">Calcul des résultats...</p>
            </div>
        );
    }

    if (result) {
        const pct = result.score;
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-surface/50 border border-border rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md">
                    <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${result.passed ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {result.passed ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{result.passed ? 'Félicitations !' : 'Dommage...'}</h1>
                    <p className="text-text-muted mb-6">Vous avez obtenu un score de {pct.toFixed(0)}%</p>

                    <div className="space-y-4">
                        <div className="p-4 bg-background/50 rounded-xl border border-border flex justify-between items-center">
                            <span className="text-sm font-medium">Réponses correctes</span>
                            <span className="font-bold text-accent">{result.correct} / {result.total}</span>
                        </div>
                        {result.passed && result.xp_earned > 0 && (
                            <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20 flex justify-between items-center animate-in zoom-in">
                                <span className="text-sm font-medium text-orange-400">XP Gagnée</span>
                                <span className="font-bold text-orange-400">+{result.xp_earned} XP 🚀</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 flex flex-col gap-3">
                        <Link to={`/modules/${id}`} className="w-full py-4 bg-accent text-white rounded-xl font-bold transition-all hover:bg-accent/90">
                            Retour au module
                        </Link>
                        {!result.passed && (
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-4 bg-surface text-text rounded-xl font-bold border border-border hover:bg-surface-hover"
                            >
                                Réessayer
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text flex flex-col">
            <header className="border-b border-border bg-surface/30 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to={`/modules/${id}`} className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-muted hover:text-text">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xs font-bold text-text-muted uppercase tracking-widest">
                        Question {currentIndex + 1} / {questions.length}
                    </h1>
                </div>
                <div className="w-32 h-2 bg-surface rounded-full overflow-hidden border border-border">
                    <div
                        className="h-full bg-accent transition-all duration-500"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </header>

            <main className="flex-grow max-w-2xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center leading-tight">
                    {currentQ.question_text}
                </h2>

                <div className="grid gap-4">
                    {currentQ.options.map((option) => {
                        const isSelected = currentAnswerState?.selected_id === option.id;
                        const isCorrectOption = currentAnswerState?.correct_option_id === option.id;
                        const answered = !!currentAnswerState;

                        let style = 'bg-surface border-border hover:border-accent/50 text-text';
                        if (answered) {
                            if (isSelected && currentAnswerState.is_correct) {
                                style = 'bg-green-500/10 border-green-500/50 text-green-400';
                            } else if (isSelected && !currentAnswerState.is_correct) {
                                style = 'bg-red-500/10 border-red-500/50 text-red-400';
                            } else if (isCorrectOption) {
                                style = 'bg-green-500/5 border-green-500/30 text-green-400/70';
                            }
                        }

                        return (
                            <button
                                key={option.id}
                                disabled={answered || isCheckingAnswer}
                                onClick={() => handleAnswer(currentQ.id, option.id)}
                                className={`w-full p-5 rounded-2xl border text-left transition-all flex items-center justify-between group disabled:cursor-not-allowed ${style}`}
                            >
                                <span className="font-medium">{option.option_text}</span>
                                {answered && isSelected && (
                                    currentAnswerState.is_correct
                                        ? <CheckCircle className="w-5 h-5 shrink-0" />
                                        : <XCircle className="w-5 h-5 shrink-0" />
                                )}
                                {answered && !isSelected && isCorrectOption && (
                                    <CheckCircle className="w-5 h-5 shrink-0 opacity-60" />
                                )}
                                {isCheckingAnswer && !answered && (
                                    <Loader2 className="w-4 h-4 animate-spin opacity-50 shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </main>

            <footer className="p-6 sticky bottom-0">
                <div className="max-w-2xl mx-auto flex justify-end">
                    {currentAnswerState && (
                        <button
                            onClick={nextQuestion}
                            className="px-10 py-4 bg-accent text-white rounded-xl font-bold shadow-lg shadow-accent/20 animate-in fade-in slide-in-from-bottom-4"
                        >
                            {currentIndex + 1 === questions.length ? 'Voir le résultat' : 'Question suivante'}
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
}
