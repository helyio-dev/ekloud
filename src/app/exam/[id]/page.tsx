import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, CheckCircle, XCircle, Loader2, Award, Shield } from 'lucide-react';
import { addXp } from '@/lib/gamification';

type Question = {
    id: string;
    question_text: string;
    answers: {
        id: string;
        answer_text: string;
        is_correct: boolean;
    }[];
};

export default function ExamPage() {
    const { id } = useParams();
    const { user, isLoading: authLoading, xp, refreshProfile } = useAuth();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [earnedXp, setEarnedXp] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        async function fetchQuestions() {
            if (!user || !id) return;

            try {
                // Fetch up to 20 questions for the final exam
                const { data: qData } = await supabase
                    .from('questions')
                    .select(`
          id,
          question_text,
          quiz_options (id, option_text, is_correct)
        `)
                    .eq('module_id', id)
                    .limit(20);

                const shuffled = (qData || []).map(q => ({
                    ...q,
                    answers: (q.quiz_options || []).map((o: any) => ({
                        id: o.id,
                        answer_text: o.option_text,
                        is_correct: o.is_correct
                    })).sort(() => Math.random() - 0.5)
                }));
                // Also shuffle the questions themselves
                const completelyShuffled = shuffled.sort(() => Math.random() - 0.5);
                setQuestions(completelyShuffled);
            } catch (err) {
                console.error("Exam fetchQuestions error:", err);
            } finally {
                setIsLoading(false);
            }
        }

        if (user && id) fetchQuestions();
    }, [user, id]);

    const handleAnswer = (answerId: string) => {
        if (selectedAnswer) return;
        setSelectedAnswer(answerId);

        const currentQ = questions[currentIndex];
        const answer = currentQ.answers.find(a => a.id === answerId);
        if (answer?.is_correct) {
            setScore(prev => prev + 1);
            setEarnedXp(prev => prev + 2); // Double XP for exams
        }
    };

    const nextQuestion = () => {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            submitResults();
        }
    };

    const submitResults = async () => {
        setIsSubmitting(true);
        const finalScore = (score / questions.length) * 100;
        // Exam pass threshold is 80%
        const passed = finalScore >= 80;

        if (passed) {
            await supabase.from('user_modules').upsert({
                user_id: user?.id,
                module_id: id,
                completed: true,
                unlocked: true
            }, { onConflict: 'user_id,module_id' });
        }

        await supabase.from('quiz_attempts').insert({
            user_id: user?.id,
            module_id: id,
            score: finalScore,
            passed: passed,
            is_exam: true
        });

        if (passed && earnedXp > 0 && user) {
            await addXp(supabase, user.id, xp || 0, earnedXp);
            // Re-fetch profile to ensure local state has updated XP and potentially new skills
            await refreshProfile();
        } else if (passed) {
            await refreshProfile();
        }

        setShowResult(true);
        setIsSubmitting(false);
    };

    const currentQ = questions[currentIndex];

    return (
        <div className="min-h-screen bg-background text-text flex flex-col">
            {isLoading ? (
                <div className="flex-grow flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-accent animate-spin" />
                </div>
            ) : questions.length === 0 ? (
                <div className="flex-grow flex items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full">
                        <Shield className="w-16 h-16 text-text-muted mx-auto mb-6" />
                        <h1 className="text-2xl font-bold mb-4">Examen non disponible</h1>
                        <p className="text-text-muted mb-8">Désolé, aucune question trouvée pour cet examen.</p>
                        <Link to={`/modules/${id}`} className="inline-block px-8 py-3 bg-accent text-white rounded-xl font-bold">Retour au module</Link>
                    </div>
                </div>
            ) : showResult ? (
                <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                    <div className="max-w-md w-full bg-surface/50 border border-border rounded-3xl p-6 md:p-8 text-center shadow-2xl backdrop-blur-md">
                        <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${((score / questions.length) * 100) >= 80 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {((score / questions.length) * 100) >= 80 ? <Shield className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                        </div>
                        <h1 className="text-3xl font-bold mb-2">{((score / questions.length) * 100) >= 80 ? "Examen Réussi !" : "Échec à l'Examen"}</h1>
                        <p className="text-text-muted mb-6">Vous avez obtenu un score de {((score / questions.length) * 100).toFixed(0)}% (80% requis)</p>

                        <div className="space-y-4">
                            <div className="p-4 bg-background/50 rounded-xl border border-border flex justify-between items-center">
                                <span className="text-sm font-medium">Réponses correctes</span>
                                <span className="font-bold text-accent">{score} / {questions.length}</span>
                            </div>
                            {((score / questions.length) * 100) >= 80 && earnedXp > 0 && (
                                <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20 flex justify-between items-center animate-in zoom-in">
                                    <span className="text-sm font-medium text-orange-400">XP Gagnée</span>
                                    <span className="font-bold text-orange-400">+{earnedXp} XP 🚀</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-10 flex flex-col gap-3">
                            <Link
                                to={`/dashboard`}
                                className="w-full py-4 bg-accent text-white rounded-xl font-bold transition-all hover:bg-accent/90"
                            >
                                Retour à la Progression
                            </Link>
                            {((score / questions.length) * 100) < 80 && (
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full py-4 bg-surface text-text rounded-xl font-bold border border-border hover:bg-surface-hover"
                                >
                                    Repasser l'examen
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <header className="border-b border-border bg-surface/30 px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to={`/modules/${id}`} className="p-2 hover:bg-surface-hover rounded-lg transition-colors text-text-muted hover:text-text">
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                            <h1 className="text-xs font-bold text-text-muted uppercase tracking-widest">Question d'Examen {currentIndex + 1} / {questions.length}</h1>
                        </div>
                        <div className="w-32 h-2 bg-surface rounded-full overflow-hidden border border-border">
                            <div
                                className="h-full bg-accent transition-all duration-500"
                                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>
                    </header>

                    <main className="flex-grow max-w-2xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
                        <h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-12 text-center leading-tight">
                            {currentQ?.question_text}
                        </h2>

                        <div className="grid gap-4">
                            {currentQ?.answers?.map((answer: Question['answers'][number]) => {
                                const isSelected = selectedAnswer === answer.id;
                                const isCorrect = isSelected && answer.is_correct;

                                return (
                                    <button
                                        key={answer.id}
                                        disabled={!!selectedAnswer}
                                        onClick={() => handleAnswer(answer.id)}
                                        className={`w-full p-5 rounded-2xl border text-left transition-all flex items-center justify-between group ${isSelected
                                            ? isCorrect
                                                ? 'bg-green-500/10 border-green-500/50 text-green-400'
                                                : 'bg-red-500/10 border-red-500/50 text-red-400'
                                            : 'bg-surface border-border hover:border-accent/50 text-text'
                                            }`}
                                    >
                                        <span className="font-medium">{answer.answer_text}</span>
                                        {isSelected && (
                                            isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </main>

                    <footer className="p-6 sticky bottom-0">
                        <div className="max-w-2xl mx-auto flex justify-end">
                            {selectedAnswer && (
                                <button
                                    onClick={nextQuestion}
                                    className="px-10 py-4 bg-accent text-white rounded-xl font-bold shadow-lg shadow-accent/20 animate-in fade-in slide-in-from-bottom-4"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Validation..." : (currentIndex + 1 === questions.length ? "Terminer l'Examen" : "Question suivante")}
                                </button>
                            )}
                        </div>
                    </footer>
                </>
            )}
        </div>
    );
}
