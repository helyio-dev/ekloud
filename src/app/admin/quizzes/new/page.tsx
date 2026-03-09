import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

interface Answer {
    text: string;
    isCorrect: boolean;
}

export default function CreateQuizPage() {
    const { isAdmin, isLoading } = useAuth();
    const navigate = useNavigate();

    const [modules, setModules] = useState<any[]>([]);
    const [selectedModule, setSelectedModule] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [difficulty, setDifficulty] = useState('easy');
    const [type, setType] = useState('multiple_choice');
    const [answers, setAnswers] = useState<Answer[]>([
        { text: '', isCorrect: true },
        { text: '', isCorrect: false }
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            navigate('/dashboard');
        }
    }, [isAdmin, isLoading, navigate]);

    useEffect(() => {
        if (isAdmin) {
            const fetchModules = async () => {
                const { data } = await supabase.from('modules').select('id, title').order('order_index');
                if (data) {
                    setModules(data);
                    if (data.length > 0) setSelectedModule(data[0].id);
                }
            };
            fetchModules();
        }
    }, [isAdmin]);

    const handleAddAnswer = () => {
        if (answers.length < 5) {
            setAnswers([...answers, { text: '', isCorrect: false }]);
        }
    };

    const handleRemoveAnswer = (index: number) => {
        if (answers.length > 2) {
            const newAnswers = [...answers];
            newAnswers.splice(index, 1);


            if (!newAnswers.some(a => a.isCorrect)) {
                newAnswers[0].isCorrect = true;
            }
            setAnswers(newAnswers);
        }
    };

    const handleAnswerChange = (index: number, field: keyof Answer, value: string | boolean) => {
        const newAnswers = [...answers];
        if (field === 'isCorrect' && value === true) {

            newAnswers.forEach(a => a.isCorrect = false);
        }


        (newAnswers[index] as any)[field] = value;
        setAnswers(newAnswers);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedModule) {
            setError("Veuillez sélectionner un module.");
            return;
        }

        if (answers.some(a => a.text.trim() === '')) {
            setError("Toutes les réponses doivent avoir un texte.");
            return;
        }

        if (!answers.some(a => a.isCorrect)) {
            setError("Au moins une réponse doit être marquée comme correcte.");
            return;
        }

        setIsSubmitting(true);
        setError(null);


        const { data: questionData, error: questionError } = await supabase
            .from('questions')
            .insert([
                { module_id: selectedModule, question_text: questionText, difficulty, type }
            ])
            .select()
            .single();

        if (questionError || !questionData) {
            setError(questionError?.message || "Erreur lors de la création de la question");
            setIsSubmitting(false);
            return;
        }


        const answersToInsert = answers.map(a => ({
            question_id: questionData.id,
            answer_text: a.text,
            is_correct: a.isCorrect
        }));

        const { error: answersError } = await supabase
            .from('answers')
            .insert(answersToInsert);

        if (answersError) {
            setError(answersError.message);
            setIsSubmitting(false);
        } else {
            navigate('/admin');
        }
    };

    if (isLoading || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <Link to="/admin" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Retour au Dashboard
                </Link>

                <h1 className="text-3xl font-black mb-8">Créer une Question (Quiz)</h1>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-8">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8 bg-surface border border-white/5 p-8 rounded-3xl">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-muted">Module Parent</label>
                            <select
                                required
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none"
                            >
                                <option value="" disabled>Sélectionnez un module</option>
                                {modules.map(mod => (
                                    <option key={mod.id} value={mod.id}>{mod.title}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-muted">Difficulté</label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none"
                            >
                                <option value="easy">Facile</option>
                                <option value="medium">Moyen</option>
                                <option value="hard">Difficile</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-muted">Type de question</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none"
                            >
                                <option value="multiple_choice">Choix Multiple</option>
                                <option value="true_false">Vrai/Faux</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-text-muted">Texte de la question</label>
                        <textarea
                            required
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all min-h-[120px]"
                            placeholder="Ex: Que signifie l'acronyme HTML ?"
                        />
                    </div>

                    <div className="border-t border-white/5 pt-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Réponses</h2>
                            {answers.length < 5 && type !== 'true_false' && (
                                <button
                                    type="button"
                                    onClick={handleAddAnswer}
                                    className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-white/5 border border-white/10 rounded-lg text-sm transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Ajouter
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {answers.map((answer, index) => (
                                <div key={index} className={`flex items-start gap-4 p-4 rounded-xl border ${answer.isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-white/5 bg-background'}`}>
                                    <div className="pt-3">
                                        <input
                                            type="radio"
                                            name="correctAnswer"
                                            checked={answer.isCorrect}
                                            onChange={() => handleAnswerChange(index, 'isCorrect', true)}
                                            className="w-5 h-5 accent-accent"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            required
                                            value={answer.text}
                                            onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
                                            className="w-full px-4 py-3 bg-background border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                                            placeholder={`Réponse ${index + 1}`}
                                        />
                                    </div>
                                    {answers.length > 2 && type !== 'true_false' && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAnswer(index)}
                                            className="p-3 mt-1 text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-text-muted mt-4">Cochez le bouton radio à côté de la bonne réponse.</p>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Enregistrer la question</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
