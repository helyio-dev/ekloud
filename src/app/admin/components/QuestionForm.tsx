import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Loader2, Save, Plus, Trash2, CheckCircle2, Bold, Italic, List, ListTodo, 
    Heading1, Heading2, Heading3, Code, Link, Quote, Eye, Edit3, Type, 
    Sparkles, Paintbrush, Highlighter, Target, Settings2, HelpCircle, Zap, 
    ChevronRight, Info
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { parseShortcodes } from '@/lib/shortcodes';

/**
 * structure de définition d'une proposition de réponse.
 */
interface Answer {
    id?: string;
    text: string;
    isCorrect: boolean;
}

/**
 * définition du schéma de transport pour les questions ekloud.
 */
interface QuestionFormData {
    module_id: string | null;
    skill_id: string | null;
    question_text: string;
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

/**
 * interface de configuration de l'évaluation formative/sommative.
 * permet la création de qcm immersifs avec support markdown intégral.
 */
export default function QuestionForm({ initialData, onSubmit, isSubmitting, buttonText, context = 'module' }: QuestionFormProps) {
    const [modules, setModules] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);

    const [moduleId, setModuleId] = useState(initialData?.module_id || '');
    const [skillId, setSkillId] = useState(initialData?.skill_id || '');
    const [questionText, setQuestionText] = useState(initialData?.question_text || '');
    const [type, setType] = useState(initialData?.type || 'multiple_choice');
    const [answers, setAnswers] = useState<Answer[]>(initialData?.answers || [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false }
    ]);

    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

    /**
     * synchronisation des listes de rattachement (modules/skills).
     */
    const fetchData = useCallback(async () => {
        try {
            const [
                { data: modData },
                { data: skillData }
            ] = await Promise.all([
                supabase.from('modules').select('id, title').order('order_index'),
                supabase.from('skills').select('id, name').order('name')
            ]);
            if (modData) setModules(modData);
            if (skillData) setSkills(skillData);
        } catch (err) {
            console.error('erreur synchronisation contextes évaluation:', err);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    /**
     * injection de tokens markdown via la toolbar ekloud.
     */
    const insertFormatting = (prefix: string, suffix: string = '') => {
        const textarea = document.getElementById('question-text') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = questionText.substring(start, end);
        const before = questionText.substring(0, start);
        const after = questionText.substring(end);

        const newText = before + prefix + selectedText + suffix + after;
        setQuestionText(newText);

        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + prefix.length + selectedText.length + suffix.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const insertBlock = (prefix: string, suffix: string = '') => {
        const textarea = document.getElementById('question-text') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const before = questionText.substring(0, start);
        const isNewLine = start === 0 || before.endsWith('\n');
        
        insertFormatting(isNewLine ? prefix : '\n' + prefix, suffix);
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
            type,
            answers
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in duration-700">
            <div className="bg-surface border border-border/80 p-8 md:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-[2s]">
                    <HelpCircle size={400} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 relative z-10">
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] text-text-muted/60 uppercase ml-1">
                            <Target className="w-3.5 h-3.5 text-accent" /> {context === 'module' ? 'ciblage module' : 'accréditation skill'}
                        </label>
                        <div className="relative group/select">
                            <select
                                required
                                value={context === 'module' ? moduleId : skillId}
                                onChange={(e) => context === 'module' ? setModuleId(e.target.value) : setSkillId(e.target.value)}
                                className="w-full px-8 py-5 bg-background border border-border/60 rounded-[1.8rem] outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all appearance-none text-text font-black uppercase tracking-widest text-[11px] shadow-sm"
                            >
                                <option value="" disabled>choisir l'origine...</option>
                                {context === 'module' ? (
                                    modules.map(mod => <option key={mod.id} value={mod.id}>{mod.title}</option>)
                                ) : (
                                    skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                )}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:translate-x-1 transition-transform">
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] text-text-muted/60 uppercase ml-1">
                            <Zap className="w-3.5 h-3.5 text-accent" /> format d'évaluation
                        </label>
                        <div className="relative group/select">
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-8 py-5 bg-background border border-border/60 rounded-[1.8rem] outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all appearance-none text-text font-black uppercase tracking-widest text-[11px] shadow-sm"
                            >
                                <option value="multiple_choice">qcm standard</option>
                                <option value="true_false">binaire (vrai/faux)</option>
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:translate-x-1 transition-transform">
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 mt-12 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-6">
                        <div className="flex items-center gap-3">
                            <Edit3 className="w-4 h-4 text-accent" />
                            <label className="text-[10px] font-black tracking-[0.3em] text-text-muted/60 uppercase">énoncé dynamique (markdown)</label>
                        </div>
                        
                        <div className="flex bg-background border border-border/60 p-1.5 rounded-2xl shadow-md">
                            <button
                                type="button"
                                onClick={() => setActiveTab('edit')}
                                className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'edit' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-muted hover:text-text'}`}
                            >
                                <Edit3 size={14} /> console
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('preview')}
                                className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-muted hover:text-text'}`}
                            >
                                <Eye size={14} /> rendu
                            </button>
                        </div>
                    </div>

                    {activeTab === 'edit' ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                            {/* barre d'outils héritée */}
                            <div className="flex flex-wrap items-center gap-1.5 p-3 bg-surface border border-border/60 rounded-[1.8rem] overflow-x-auto no-scrollbar shadow-lg">
                                <button type="button" onClick={() => insertFormatting('**', '**')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted/60 hover:text-accent transition-all"><Bold size={20} /></button>
                                <button type="button" onClick={() => insertFormatting('*', '*')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted/60 hover:text-accent transition-all"><Italic size={20} /></button>
                                <div className="w-px h-8 bg-border/40 mx-2" />
                                <button type="button" onClick={() => insertBlock('# ')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted/60 hover:text-accent transition-all"><Heading1 size={20} /></button>
                                <button type="button" onClick={() => insertBlock('## ')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted/60 hover:text-accent transition-all"><Heading2 size={20} /></button>
                                <button type="button" onClick={() => insertBlock('### ')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted/60 hover:text-accent transition-all"><Heading3 size={20} /></button>
                                <div className="w-px h-8 bg-border/40 mx-2" />
                                <button type="button" onClick={() => insertBlock('- ')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted/60 hover:text-accent transition-all"><List size={20} /></button>
                                <button type="button" onClick={() => insertBlock('- [ ] ')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted/60 hover:text-accent transition-all"><ListTodo size={20} /></button>
                                <div className="w-px h-8 bg-border/40 mx-2" />
                                <button type="button" onClick={() => insertFormatting('`', '`')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted/60 hover:text-accent transition-all"><Code size={20} /></button>
                                <button type="button" onClick={() => insertBlock('```\n', '\n```')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted/60 hover:text-accent transition-all"><Settings2 size={20} /></button>
                                <div className="w-px h-8 bg-border/40 mx-2" />
                                <button type="button" onClick={() => insertFormatting('[', '](url)')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted/60 hover:text-accent transition-all"><Link size={20} /></button>
                                <button type="button" onClick={() => insertBlock('> ')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted/60 hover:text-accent transition-all"><Quote size={20} /></button>
                            </div>
                            <textarea
                                id="question-text"
                                required
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                className="w-full px-8 py-6 bg-background border border-border/60 rounded-[2.5rem] outline-none focus:border-accent/40 focus:bg-background focus:ring-4 focus:ring-accent/5 transition-all text-text font-medium min-h-[220px] leading-relaxed italic shadow-inner custom-scrollbar"
                                placeholder="écrivez l'énoncé de la question ici..."
                            />
                        </div>
                    ) : (
                        <div className="min-h-[220px] p-10 bg-background border border-border/60 rounded-[2.5rem] overflow-y-auto animate-in fade-in duration-500 shadow-inner">
                            <div className="prose prose-invert prose-indigo max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-a:text-accent prose-code:text-accent prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-img:rounded-3xl italic opacity-80">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                    rehypePlugins={[rehypeRaw]}
                                >
                                    {parseShortcodes(questionText) || "*aucun énoncé rédigé par l'administrateur.*"}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-10 bg-surface border border-border/60 p-10 md:p-14 rounded-[3.5rem] shadow-xl">
                <div className="flex justify-between items-center relative z-10 border-b border-border/40 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Info className="w-4 h-4 text-accent" />
                            <h2 className="text-2xl font-black text-text uppercase tracking-tighter">vecteurs de réponse</h2>
                        </div>
                        <p className="text-[10px] text-text-muted/40 font-black uppercase tracking-widest italic">définissez les propositions et l'unique constante de vérité.</p>
                    </div>
                    {answers.length < 5 && type !== 'true_false' && (
                        <button
                            type="button"
                            onClick={handleAddAnswer}
                            className="group flex items-center gap-3 px-6 py-3 bg-background hover:bg-accent border border-border/60 hover:border-accent rounded-2xl text-[10px] font-black transition-all text-text-muted hover:text-white uppercase tracking-widest shadow-sm"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> proposition
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 relative z-10">
                    {answers.map((answer, index) => (
                        <div
                            key={index}
                            className={`flex flex-col md:flex-row items-start md:items-center gap-6 p-8 rounded-[2.5rem] border transition-all duration-500 ease-out animate-in slide-in-from-right-4 fill-mode-both ${answer.isCorrect ? 'border-accent bg-accent/5 shadow-2xl shadow-accent/10 scale-[1.01]' : 'border-border/60 bg-background hover:border-accent/40 shadow-sm'}`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="shrink-0 flex items-center gap-4">
                                <label className="relative flex items-center justify-center cursor-pointer group/radio">
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={answer.isCorrect}
                                        onChange={() => handleAnswerChange(index, 'isCorrect', true)}
                                        className="hidden"
                                    />
                                    <div className={`w-12 h-12 rounded-[1.2rem] border-2 flex items-center justify-center transition-all duration-300 ${answer.isCorrect ? 'bg-accent border-accent shadow-lg shadow-accent/40 scale-110' : 'border-border/80 group-hover/radio:border-accent/40 bg-background'}`}>
                                        {answer.isCorrect && <CheckCircle2 className="w-6 h-6 text-white" />}
                                    </div>
                                </label>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${answer.isCorrect ? 'text-accent' : 'text-text-muted/40'}`}>id: 0{index + 1}</span>
                            </div>

                            <div className="flex-1 w-full">
                                <input
                                    type="text"
                                    required
                                    value={answer.text}
                                    onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
                                    className={`w-full bg-transparent outline-none text-xl font-black uppercase tracking-tight transition-colors ${answer.isCorrect ? 'text-text placeholder:text-accent/20' : 'text-text-muted/60 focus:text-text'}`}
                                    placeholder={`RÉPONSE ${index + 1}`}
                                />
                            </div>

                            {answers.length > 2 && type !== 'true_false' && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAnswer(index)}
                                    className="p-4 text-text-muted/40 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-2xl transition-all active:scale-90"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-12 border-t border-border/40 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative flex items-center gap-4 px-14 py-6 bg-accent hover:bg-accent/90 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-sm transition-all disabled:opacity-50 shadow-2xl shadow-accent/40 active:scale-95"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%] group-hover:animate-[shimmer_2s_infinite]"></div>
                    {isSubmitting ? <Loader2 className="w-7 h-7 animate-spin" /> : <Save className="w-7 h-7 group-hover:scale-110 transition-transform" />}
                    {buttonText.toUpperCase()}
                </button>
            </div>
        </form>
    );
}
