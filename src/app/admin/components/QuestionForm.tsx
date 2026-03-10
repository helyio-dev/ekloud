import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface Answer {
    id?: string;
    text: string;
    isCorrect: boolean;
}

interface QuestionFormData {
    module_id: string | null;
    skill_id: string | null;
    question_text: string;
    difficulty: string;
    type: string;
    answers: Answer[];
}

interface QuestionFormProps {
    initialData?: QuestionFormData;
    onSubmit: (data: QuestionFormData) => Promise<void>;
    isSubmitting: boolean;
    buttonText: string;
    context?: 'module' | 'skill';
}

export default function QuestionForm({ initialData, onSubmit, isSubmitting, buttonText, context = 'module' }: QuestionFormProps) {
    const [modules, setModules] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);

    const [moduleId, setModuleId] = useState(initialData?.module_id || '');
    const [skillId, setSkillId] = useState(initialData?.skill_id || '');
    const [questionText, setQuestionText] = useState(initialData?.question_text || '');
    const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'easy');
    const [type, setType] = useState(initialData?.type || 'multiple_choice');
    const [answers, setAnswers] = useState<Answer[]>(initialData?.answers || [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false }
    ]);

    useEffect(() => {
        const fetchData = async () => {
            const [
                { data: modData },
                { data: skillData }
            ] = await Promise.all([
                supabase.from('modules').select('id, title').order('order_index'),
                supabase.from('skills').select('id, name').order('name')
            ]);
            if (modData) setModules(modData);
            if (skillData) setSkills(skillData);
        };
        fetchData();
    }, []);

    const handleAddAnswer = () => {
        if (answers.length < 5) {
            setAnswers([...answers, { text: '', isCorrect: false }]);
        }
    };

    const handleRemoveAnswer = (index: number) => {
        if (answers.length > 2) {
            const newAnswers = [...answers];
            newAnswers.splice(index, 1);
            if (!newAnswers.some(a => a.isCorrect)) newAnswers[0].isCorrect = true;
            setAnswers(newAnswers);
        }
    };

    const handleAnswerChange = (index: number, field: keyof Answer, value: any) => {
        const newAnswers = [...answers];
        if (field === 'isCorrect' && value === true) {
            newAnswers.forEach(a => a.isCorrect = false);
        }
        (newAnswers[index] as any)[field] = value;
        setAnswers(newAnswers);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            module_id: context === 'module' ? (moduleId || null) : null,
            skill_id: context === 'skill' ? (skillId || null) : null,
            question_text: questionText,
            difficulty,
            type,
            answers
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-surface border border-white/5 p-8 rounded-[32px]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {context === 'module' ? (
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest mb-3 text-text-muted ml-1">Module Parent</label>
                        <select
                            required
                            value={moduleId}
                            onChange={(e) => setModuleId(e.target.value)}
                            className="w-full px-5 py-4 bg-background border border-white/5 rounded-2xl outline-none focus:border-accent transition-all appearance-none text-white font-bold"
                        >
                            <option value="" disabled>Sélectionnez un module</option>
                            {modules.map(mod => (
                                <option key={mod.id} value={mod.id}>{mod.title}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest mb-3 text-text-muted ml-1">Compétence (Examen)</label>
                        <select
                            required
                            value={skillId}
                            onChange={(e) => setSkillId(e.target.value)}
                            className="w-full px-5 py-4 bg-background border border-white/5 rounded-2xl outline-none focus:border-accent transition-all appearance-none text-white font-bold"
                        >
                            <option value="" disabled>Sélectionnez une compétence</option>
                            {skills.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-black uppercase tracking-widest mb-3 text-text-muted ml-1">Difficulté</label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full px-5 py-4 bg-background border border-white/5 rounded-2xl outline-none focus:border-accent transition-all appearance-none text-white font-bold"
                    >
                        <option value="easy">Facile</option>
                        <option value="medium">Moyen</option>
                        <option value="hard">Difficile</option>
                        <option value="very_hard">Très Difficile</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-black uppercase tracking-widest mb-3 text-text-muted ml-1">Type de question</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full px-5 py-4 bg-background border border-white/5 rounded-2xl outline-none focus:border-accent transition-all appearance-none text-white font-bold"
                    >
                        <option value="multiple_choice">Choix Multiple</option>
                        <option value="true_false">Vrai / Faux</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Énoncé de la question</label>
                <textarea
                    required
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="w-full px-6 py-5 bg-background border border-white/5 rounded-3xl outline-none focus:border-accent transition-all text-white font-medium min-h-[120px] leading-relaxed"
                    placeholder="Posez votre question ici..."
                />
            </div>

            <div className="space-y-6 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-white uppercase tracking-wider">Réponses</h2>
                    {answers.length < 5 && type !== 'true_false' && (
                        <button
                            type="button"
                            onClick={handleAddAnswer}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black transition-all"
                        >
                            <Plus className="w-4 h-4" /> AJOUTER
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {answers.map((answer, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${answer.isCorrect ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'border-white/5 bg-background hover:border-white/10'}`}
                        >
                            <div className="shrink-0">
                                <label className="relative flex items-center justify-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={answer.isCorrect}
                                        onChange={() => handleAnswerChange(index, 'isCorrect', true)}
                                        className="hidden"
                                    />
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${answer.isCorrect ? 'bg-green-500 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'border-white/10'}`}>
                                        {answer.isCorrect && <CheckCircle2 className="w-5 h-5 text-black" />}
                                    </div>
                                </label>
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    required
                                    value={answer.text}
                                    onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
                                    className="w-full bg-transparent outline-none text-white font-bold"
                                    placeholder={`Réponse ${index + 1}`}
                                />
                            </div>
                            {answers.length > 2 && type !== 'true_false' && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAnswer(index)}
                                    className="p-2 text-red-400/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest text-center">Sélectionnez la réponse correcte via l'icône de gauche.</p>
            </div>

            <div className="pt-8 border-t border-white/5 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-3 px-10 py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-lg transition-all shadow-2xl shadow-accent/20 disabled:opacity-50 active:scale-95"
                >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                    {buttonText}
                </button>
            </div>
        </form>
    );
}
