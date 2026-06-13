import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, Bold, Italic, List, ListTodo, Heading1, Heading2, Heading3, Code, Link, Quote, Eye, Edit3, Type, HelpCircle, Plus, Trash2, X, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { parseShortcodes } from '@/lib/shortcodes';

interface LessonFormData {
    module_id: string;
    title: string;
    content: string;
    order_index: number;
}

interface LessonFormProps {
    initialData?: LessonFormData;
    onSubmit: (data: LessonFormData) => Promise<void>;
    isSubmitting: boolean;
    buttonText: string;
}

/**
 * formulaire de création/édition d'une leçon avec éditeur markdown interactif.
 * propose une barre d'outils de formatage et un mode aperçu temps réel.
 */
export default function LessonForm({ initialData, onSubmit, isSubmitting, buttonText }: LessonFormProps) {
    const [modules, setModules] = useState<any[]>([]);
    const [moduleId, setModuleId] = useState(initialData?.module_id || '');
    const [title, setTitle] = useState(initialData?.title || '');
    const [content, setContent] = useState(initialData?.content || '');
    const [orderIndex, setOrderIndex] = useState(initialData?.order_index || 1);
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ── état de la modale mini-quiz ──
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [quizQuestion, setQuizQuestion] = useState('');
    const [quizOptions, setQuizOptions] = useState(['', '', '']);
    const [quizCorrect, setQuizCorrect] = useState(0);
    const [quizExplanation, setQuizExplanation] = useState('');

    const resetQuizModal = () => {
        setQuizQuestion('');
        setQuizOptions(['', '', '']);
        setQuizCorrect(0);
        setQuizExplanation('');
        setShowQuizModal(false);
    };

    const insertQuizShortcode = () => {
        const filledOptions = quizOptions.filter(o => o.trim() !== '');
        if (!quizQuestion.trim() || filledOptions.length < 2) return;
        if (quizCorrect >= filledOptions.length) return;

        // format : [[check:Question|OptionA|OptionB|...|index|explication]]
        const parts = [quizQuestion.trim(), ...filledOptions, String(quizCorrect)];
        if (quizExplanation.trim()) parts.push(quizExplanation.trim());
        const shortcode = `[[check:${parts.join('|')}]]`;
        insertAtCursor(shortcode);
        resetQuizModal();
    };

    // chargement de la liste des modules disponibles pour le lien parent
    useEffect(() => {
        const fetchModules = async () => {
            const { data } = await supabase.from('modules').select('id, title').order('order_index');
            if (data) {
                setModules(data);
                if (!moduleId && data.length > 0) setModuleId(data[0].id);
            }
        };
        fetchModules();
    }, [moduleId]);

    /**
     * insère du texte à la position actuelle du curseur dans le textarea.
     */
    const insertAtCursor = (text: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = content.substring(0, start);
        const after = content.substring(end);
        const newContent = before + text + after;
        setContent(newContent);
        setTimeout(() => {
            textarea.focus();
            const pos = start + text.length;
            textarea.setSelectionRange(pos, pos);
        }, 0);
    };

    /**
     * insère des balises de formatage autour de la sélection actuelle dans le textarea.
     */
    const insertFormatting = (prefix: string, suffix: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const before = content.substring(0, start);
        const after = content.substring(end);

        const newText = before + prefix + selectedText + suffix + after;
        setContent(newText);

        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + prefix.length + selectedText.length + suffix.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    /**
     * insère un bloc de formatage (type titre ou liste) en début de ligne.
     */
    const insertBlock = (prefix: string, suffix: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const before = content.substring(0, start);
        const isNewLine = start === 0 || before.endsWith('\n');
        
        insertFormatting(isNewLine ? prefix : '\n' + prefix, suffix);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            module_id: moduleId,
            title,
            content,
            order_index: orderIndex
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-3">
                    <label className="block text-[10px] font-black tracking-[0.2em] text-text-muted uppercase ml-1">module de rattachement</label>
                    <div className="relative group">
                        <select
                            required
                            value={moduleId}
                            onChange={(e) => setModuleId(e.target.value)}
                            className="w-full px-6 py-5 bg-background border border-border/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent/40 transition-all appearance-none text-text font-bold shadow-sm"
                        >
                            <option value="" disabled>choisir un module...</option>
                            {modules.map(mod => (
                                <option key={mod.id} value={mod.id}>{mod.title}</option>
                            ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:text-accent transition-colors">
                            <List size={16} />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-3">
                    <label className="block text-[10px] font-black tracking-[0.2em] text-text-muted uppercase ml-1">titre de la leçon</label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-6 py-5 bg-background border border-border/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent/40 transition-all font-black text-text placeholder:opacity-20 shadow-sm"
                        placeholder="ex: architecture serverless aws"
                    />
                </div>

                <div className="space-y-3">
                    <label className="block text-[10px] font-black tracking-[0.2em] text-text-muted uppercase ml-1">index d'affichage</label>
                    <input
                        type="number"
                        min="1"
                        required
                        value={orderIndex}
                        onChange={(e) => setOrderIndex(parseInt(e.target.value))}
                        className="w-full px-6 py-5 bg-background border border-border/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent/40 transition-all text-text font-bold shadow-sm"
                    />
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-6">
                    <div className="flex items-center gap-3">
                        <Type size={18} className="text-accent" />
                        <label className="text-[10px] font-black tracking-[0.2em] text-text-muted uppercase">contenu pédagogique (markdown)</label>
                    </div>
                    
                    <div className="flex bg-surface border border-border/80 p-1.5 rounded-2xl shadow-md">
                        <button
                            type="button"
                            onClick={() => setActiveTab('edit')}
                            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeTab === 'edit' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-muted hover:text-text'}`}
                        >
                            <Edit3 size={14} /> ÉDITION
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('preview')}
                            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeTab === 'preview' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-muted hover:text-text'}`}
                        >
                            <Eye size={14} /> APERÇU
                        </button>
                    </div>
                </div>

                {activeTab === 'edit' ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                        {/* barre d'outils flottante enrichie */}
                        <div className="flex flex-wrap items-center gap-2 p-3 bg-surface border border-border/80 rounded-2xl overflow-x-auto no-scrollbar shadow-lg">
                            <button type="button" onClick={() => insertFormatting('**', '**')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Gras"><Bold size={20} /></button>
                            <button type="button" onClick={() => insertFormatting('*', '*')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Italique"><Italic size={20} /></button>
                            <div className="w-px h-8 bg-border/60 mx-1" />
                            <button type="button" onClick={() => insertBlock('# ')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Titre 1"><Heading1 size={20} /></button>
                            <button type="button" onClick={() => insertBlock('## ')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Titre 2"><Heading2 size={20} /></button>
                            <button type="button" onClick={() => insertBlock('### ')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Titre 3"><Heading3 size={20} /></button>
                            <div className="w-px h-8 bg-border/60 mx-1" />
                            <button type="button" onClick={() => insertBlock('- ')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Liste"><List size={20} /></button>
                            <button type="button" onClick={() => insertBlock('- [ ] ')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Titre de tâches"><ListTodo size={20} /></button>
                            <div className="w-px h-8 bg-border/60 mx-1" />
                            <button type="button" onClick={() => insertFormatting('`', '`')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Code en ligne"><Type size={20} /></button>
                            <button type="button" onClick={() => insertBlock('```\n', '\n```')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Bloc de code"><Code size={20} /></button>
                            <div className="w-px h-8 bg-border/60 mx-1" />
                            <button type="button" onClick={() => insertFormatting('[', '](url)')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Lien"><Link size={20} /></button>
                            <button type="button" onClick={() => insertBlock('> ')} className="p-2.5 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Citation"><Quote size={20} /></button>
                            <div className="w-px h-8 bg-border/60 mx-1" />
                            <div className="flex items-center gap-2 px-4 border-l border-border/60">
                                <span className="text-[9px] font-black text-text-muted mr-2 uppercase tracking-widest">Couleurs</span>
                                <button type="button" onClick={() => insertFormatting('[[indigo:', ']]')} className="w-6 h-6 rounded-full bg-[#818cf8] border-2 border-white/10 hover:scale-125 hover:border-white/40 transition-all shadow-sm" />
                                <button type="button" onClick={() => insertFormatting('[[vert:', ']]')} className="w-6 h-6 rounded-full bg-[#22c55e] border-2 border-white/10 hover:scale-125 hover:border-white/40 transition-all shadow-sm" />
                                <button type="button" onClick={() => insertFormatting('[[rouge:', ']]')} className="w-6 h-6 rounded-full bg-[#ef4444] border-2 border-white/10 hover:scale-125 hover:border-white/40 transition-all shadow-sm" />
                            </div>
                            <div className="w-px h-8 bg-border/60 mx-1" />
                            <button
                                type="button"
                                onClick={() => setShowQuizModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-xl text-accent text-[10px] font-black uppercase tracking-widest transition-all"
                                title="Insérer un mini-quiz"
                            >
                                <HelpCircle size={16} /> Quiz
                            </button>
                        </div>

                        <textarea
                            ref={textareaRef}
                            id="lesson-content"
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-8 py-7 bg-background border border-border/80 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-accent/5 transition-all min-h-[600px] font-mono text-sm leading-relaxed text-text shadow-inner custom-scrollbar"
                            placeholder="rédigez ici votre cours... utilisez le markdown pour enrichir le contenu pedagogical."
                        />
                    </div>
                ) : (
                    <div className="min-h-[600px] p-12 bg-background border border-border/60 rounded-[2.5rem] overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-inner">
                        <article className="prose prose-invert prose-indigo max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-a:text-accent prose-code:text-accent prose-pre:bg-surface prose-pre:border prose-pre:border-border/60 prose-img:rounded-[2rem] prose-p:leading-relaxed">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                rehypePlugins={[rehypeRaw]}
                            >
                                {parseShortcodes(content) || "*aucun contenu rédigé pour le moment.*"}
                            </ReactMarkdown>
                        </article>
                    </div>
                )}
            </div>

            <footer className="pt-10 border-t border-border/40 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex items-center gap-4 px-12 py-5 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-[11px] tracking-[0.2em] uppercase transition-all disabled:opacity-30 shadow-2xl shadow-accent/20 active:scale-95"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    {buttonText.toUpperCase()}
                </button>
            </footer>

            {/* ── Modale création mini-quiz ── */}
            {showQuizModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-surface border border-border rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* header */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-border/60">
                            <div className="flex items-center gap-3">
                                <HelpCircle className="w-5 h-5 text-accent" />
                                <span className="text-sm font-black uppercase tracking-widest">Nouveau mini-quiz</span>
                            </div>
                            <button type="button" onClick={resetQuizModal} className="p-2 hover:bg-surface-hover rounded-xl transition-colors text-text-muted hover:text-text">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* question */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Question</label>
                                <input
                                    type="text"
                                    value={quizQuestion}
                                    onChange={(e) => setQuizQuestion(e.target.value)}
                                    placeholder="Ex: Qu'est-ce qu'une adresse IP ?"
                                    className="w-full px-5 py-3 bg-background border border-border/80 rounded-xl font-bold text-sm text-text placeholder:opacity-30 focus:outline-none focus:border-accent/40 transition-all"
                                    autoFocus
                                />
                            </div>

                            {/* options */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Options (min. 2)</label>
                                    {quizOptions.length < 5 && (
                                        <button
                                            type="button"
                                            onClick={() => setQuizOptions([...quizOptions, ''])}
                                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent/80 transition-colors"
                                        >
                                            <Plus size={12} /> Ajouter
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {quizOptions.map((opt, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setQuizCorrect(idx)}
                                                title="Marquer comme bonne réponse"
                                                className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                                    quizCorrect === idx
                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                        : 'border-border/60 text-text-muted hover:border-emerald-500/40 hover:text-emerald-400'
                                                }`}
                                            >
                                                {quizCorrect === idx ? <Check size={14} /> : <span className="text-[10px] font-black">{String.fromCharCode(65 + idx)}</span>}
                                            </button>
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => {
                                                    const updated = [...quizOptions];
                                                    updated[idx] = e.target.value;
                                                    setQuizOptions(updated);
                                                }}
                                                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                                className={`flex-1 px-4 py-2.5 bg-background border rounded-xl text-sm font-medium text-text placeholder:opacity-30 focus:outline-none transition-all ${
                                                    quizCorrect === idx ? 'border-emerald-500/40 focus:border-emerald-500/60' : 'border-border/60 focus:border-accent/40'
                                                }`}
                                            />
                                            {quizOptions.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = quizOptions.filter((_, i) => i !== idx);
                                                        setQuizOptions(updated);
                                                        if (quizCorrect >= updated.length) setQuizCorrect(0);
                                                    }}
                                                    className="p-2 hover:bg-rose-500/10 rounded-xl text-text-muted/40 hover:text-rose-400 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-text-muted/60 font-medium">
                                    Clique sur la lettre pour marquer la bonne réponse <span className="text-emerald-400">(en vert)</span>
                                </p>
                            </div>

                            {/* explication affichée si mauvaise réponse */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                    Explication <span className="text-text-muted/40">(affichée si mauvaise réponse)</span>
                                </label>
                                <textarea
                                    value={quizExplanation}
                                    onChange={(e) => setQuizExplanation(e.target.value)}
                                    placeholder="Ex: Une adresse IP est une adresse logique qui identifie un appareil sur un réseau."
                                    rows={3}
                                    className="w-full px-5 py-3 bg-background border border-border/80 rounded-xl text-sm font-medium text-text placeholder:opacity-30 focus:outline-none focus:border-accent/40 transition-all resize-none"
                                />
                            </div>

                            {/* aperçu du shortcode */}
                            {quizQuestion.trim() && quizOptions.filter(o => o.trim()).length >= 2 && (
                                <div className="p-4 bg-background rounded-xl border border-border/40 font-mono text-xs text-text-muted/80 break-all">
                                    {(() => {
                                        const filled = quizOptions.filter(o => o.trim());
                                        const parts = [quizQuestion.trim(), ...filled, String(quizCorrect)];
                                        if (quizExplanation.trim()) parts.push(quizExplanation.trim());
                                        return `[[check:${parts.join('|')}]]`;
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* actions */}
                        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-border/60 bg-background/40">
                            <button type="button" onClick={resetQuizModal} className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text hover:bg-surface-hover transition-all">
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={insertQuizShortcode}
                                disabled={!quizQuestion.trim() || quizOptions.filter(o => o.trim()).length < 2}
                                className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Plus size={14} /> Insérer dans la leçon
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
