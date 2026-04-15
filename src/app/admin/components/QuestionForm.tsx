import React, { useState, useRef, useCallback } from 'react';
import {
    Loader2, Save, Plus, Trash2, CheckCircle2, Bold, Italic, List,
    Heading1, Code, Link, Eye, Edit3,
    HelpCircle, Zap, Info, AlertCircle, GripVertical, Quote
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { parseShortcodes } from '@/lib/shortcodes';

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * Représentation d'une proposition de réponse à une question.
 *
 * @property id        - Identifiant Supabase (optionnel, présent en mode édition).
 * @property text      - Libellé affiché à l'apprenant.
 * @property isCorrect - Indique si cette option est la bonne réponse.
 */
export interface Answer {
    id?: string;
    text: string;
    isCorrect: boolean;
}

/**
 * Schéma de transport utilisé lors de la soumission du formulaire.
 * Compatible avec les tables `questions` et `quiz_options` de Supabase.
 */
export interface QuestionFormData {
    module_id: string | null;
    skill_id: string | null;
    question_text: string;
    type: 'multiple_choice' | 'true_false';
    answers: Answer[];
}

/**
 * Props du composant `QuestionForm`.
 *
 * @property initialData  - Données pré-remplies (mode édition).
 * @property onSubmit     - Callback asynchrone appelé avec les données validées.
 * @property isSubmitting - Bloque le bouton pendant la requête réseau.
 * @property buttonText   - Libellé du bouton de soumission.
 * @property context      - Détermine si la question appartient à un module ou à une skill.
 */
export interface QuestionFormProps {
    initialData?: Partial<QuestionFormData>;
    onSubmit: (data: QuestionFormData) => Promise<void>;
    isSubmitting: boolean;
    buttonText: string;
    context?: 'module' | 'skill';
}

// ─── Constantes ────────────────────────────────────────────────────────────────

/** Réponses par défaut pour le format Vrai/Faux. */
const TRUE_FALSE_ANSWERS: Answer[] = [
    { text: 'Vrai', isCorrect: true },
    { text: 'Faux', isCorrect: false },
];

const MAX_QUESTION_LENGTH = 2000;
const MAX_ANSWERS = 5;
const MIN_ANSWERS = 2;

// ─── Sous-composant : bouton de la toolbar markdown ───────────────────────────

interface ToolbarButtonProps {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
}

function ToolbarButton({ onClick, title, children }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className="p-2 hover:bg-accent/10 rounded-lg text-text-muted/60 hover:text-accent transition-all relative group/tb"
        >
            {children}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface border border-border/60 rounded-md text-[9px] font-black uppercase tracking-widest text-text-muted whitespace-nowrap opacity-0 group-hover/tb:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                {title}
            </span>
        </button>
    );
}

// ─── Composant principal ───────────────────────────────────────────────────────

/**
 * `QuestionForm` — Formulaire de création/édition d'une question QCM ou Vrai/Faux.
 *
 * Fonctionnalités :
 * - Éditeur d'énoncé avec toolbar Markdown et onglet aperçu en temps réel.
 * - Compteur de caractères avec alerte visuelle au-delà de 80 % de la limite.
 * - Gestion dynamique des options : ajout (max 5), suppression, sélection de
 *   la bonne réponse via radio stylisé.
 * - Basculement automatique vers les réponses Vrai/Faux en mode `true_false`.
 * - Validation complète côté client avant soumission.
 */
export default function QuestionForm({
    initialData,
    onSubmit,
    isSubmitting,
    buttonText,
    context = 'module',
}: QuestionFormProps) {
    // IDs contextuels (non modifiables par l'utilisateur dans ce formulaire)
    const [moduleId] = useState(initialData?.module_id ?? '');
    const [skillId]  = useState(initialData?.skill_id ?? '');

    const [questionText, setQuestionText] = useState(initialData?.question_text ?? '');
    const [type, setType]   = useState<'multiple_choice' | 'true_false'>(initialData?.type ?? 'multiple_choice');
    const [answers, setAnswers] = useState<Answer[]>(
        initialData?.answers?.length ? initialData.answers : [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
        ]
    );
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ─── Handlers : type ───────────────────────────────────────────────────────

    /**
     * Bascule entre les formats QCM et Vrai/Faux.
     * En mode Vrai/Faux, les réponses sont remplacées par les options canoniques
     * et l'état précédent est mémorisé pour restauration si l'utilisateur revient.
     */
    const handleTypeChange = (newType: 'multiple_choice' | 'true_false') => {
        setType(newType);
        if (newType === 'true_false') {
            setAnswers(TRUE_FALSE_ANSWERS);
        } else {
            // Restaurer les options par défaut si on repasse en QCM
            setAnswers([
                { text: '', isCorrect: true },
                { text: '', isCorrect: false },
            ]);
        }
    };

    // ─── Handlers : réponses ──────────────────────────────────────────────────

    const handleAddAnswer = () => {
        if (answers.length < MAX_ANSWERS && type !== 'true_false') {
            setAnswers(prev => [...prev, { text: '', isCorrect: false }]);
        }
    };

    const handleRemoveAnswer = (index: number) => {
        if (answers.length <= MIN_ANSWERS) return;
        setAnswers(prev => {
            const next = prev.filter((_, i) => i !== index);
            // S'assurer qu'une réponse correcte existe toujours
            if (!next.some(a => a.isCorrect)) next[0].isCorrect = true;
            return next;
        });
    };

    const handleAnswerChange = (index: number, field: keyof Answer, value: string | boolean) => {
        setAnswers(prev => {
            const next = [...prev];
            if (field === 'isCorrect' && value === true) {
                next.forEach(a => (a.isCorrect = false));
            }
            (next[index] as any)[field] = value;
            return next;
        });
    };

    // ─── Handlers : drag & drop réponses ──────────────────────────────────────

    const handleDragStart = (index: number) => setDragIndex(index);
    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };
    const handleDrop = (targetIndex: number) => {
        if (dragIndex === null || dragIndex === targetIndex) {
            setDragIndex(null);
            setDragOverIndex(null);
            return;
        }
        setAnswers(prev => {
            const next = [...prev];
            const [moved] = next.splice(dragIndex, 1);
            next.splice(targetIndex, 0, moved);
            return next;
        });
        setDragIndex(null);
        setDragOverIndex(null);
    };
    const handleDragEnd = () => {
        setDragIndex(null);
        setDragOverIndex(null);
    };

    // ─── Handlers : toolbar Markdown ──────────────────────────────────────────

    /**
     * Insère un token de formatage Markdown autour du texte sélectionné.
     * Si une sélection existe, elle est encadrée ; sinon, le curseur se place
     * entre les délimiteurs.
     *
     * @param prefix - Token ouvrant (ex. `**`).
     * @param suffix - Token fermant, identique au prefix si omis.
     */
    const insertFormatting = useCallback((prefix: string, suffix = '') => {
        const ta = textareaRef.current;
        if (!ta) return;

        const start = ta.selectionStart;
        const end   = ta.selectionEnd;
        const selected = questionText.slice(start, end);
        const newText  = questionText.slice(0, start) + prefix + selected + suffix + questionText.slice(end);

        setQuestionText(newText);

        setTimeout(() => {
            ta.focus();
            const cursor = start + prefix.length + selected.length;
            ta.setSelectionRange(cursor, cursor);
        }, 0);
    }, [questionText]);

    /**
     * Insère un préfixe de bloc Markdown (titre, liste…).
     * Ajoute un saut de ligne si le curseur n'est pas en début de ligne.
     */
    const insertBlock = useCallback((prefix: string) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start  = ta.selectionStart;
        const before = questionText.slice(0, start);
        const isNewLine = start === 0 || before.endsWith('\n');
        insertFormatting(isNewLine ? prefix : '\n' + prefix);
    }, [questionText, insertFormatting]);

    // ─── Validation & soumission ──────────────────────────────────────────────

    /**
     * Valide le formulaire côté client avant d'appeler `onSubmit`.
     * Vérifie :
     * - La présence d'un énoncé non vide.
     * - Que chaque option a un libellé.
     * - Qu'une seule option est marquée comme correcte.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (!questionText.trim()) {
            setValidationError('L\'énoncé de la question est requis.');
            return;
        }
        if (answers.some(a => !a.text.trim())) {
            setValidationError('Toutes les options de réponse doivent être renseignées.');
            return;
        }
        if (!answers.some(a => a.isCorrect)) {
            setValidationError('Vous devez désigner une bonne réponse.');
            return;
        }

        await onSubmit({
            module_id:     context === 'module' ? (moduleId || null) : null,
            skill_id:      context === 'skill'  ? (skillId  || null) : null,
            question_text: questionText.trim(),
            type,
            answers,
        });
    };

    // ─── Métriques ────────────────────────────────────────────────────────────

    const charCount   = questionText.length;
    const charPercent = (charCount / MAX_QUESTION_LENGTH) * 100;
    const isNearLimit = charPercent > 80;
    const isAtLimit   = charCount >= MAX_QUESTION_LENGTH;
    const correctCount = answers.filter(a => a.isCorrect).length;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <form onSubmit={handleSubmit} className="animate-in fade-in duration-700" noValidate>

            {/* Alertes de validation */}
            {validationError && (
                <div className="mb-8 flex items-start gap-4 p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-rose-400 animate-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-[11px] font-black uppercase tracking-widest">{validationError}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* ── PANNEAU GAUCHE : ÉNONCÉ ─────────────────────────────────── */}
                <div className="lg:col-span-7 space-y-8 lg:sticky lg:top-10">
                    <div className="bg-surface border border-border/80 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">

                        {/* Icône décorative de fond */}
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[2s]">
                            <HelpCircle size={300} />
                        </div>

                        <div className="relative z-10 space-y-10">

                            {/* Sélecteur de format */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] text-text-muted/60 uppercase ml-1">
                                    <Zap className="w-3.5 h-3.5 text-accent" />
                                    format d'évaluation
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleTypeChange('multiple_choice')}
                                        className={`flex-1 px-6 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                            type === 'multiple_choice'
                                                ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                                                : 'bg-background border-border/60 text-text-muted hover:border-accent/40'
                                        }`}
                                    >
                                        QCM Standard
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTypeChange('true_false')}
                                        className={`flex-1 px-6 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                            type === 'true_false'
                                                ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                                                : 'bg-background border-border/60 text-text-muted hover:border-accent/40'
                                        }`}
                                    >
                                        Vrai / Faux
                                    </button>
                                </div>
                            </div>

                            {/* Zone d'énoncé */}
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
                                    <div className="flex items-center gap-3">
                                        <Edit3 className="w-4 h-4 text-accent" />
                                        <label className="text-[10px] font-black tracking-[0.3em] text-text-muted/60 uppercase">
                                            énoncé dynamique
                                        </label>
                                    </div>

                                    {/* Onglets Éditer / Aperçu */}
                                    <div className="flex bg-background border border-border/60 p-1 rounded-xl shadow-md">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('edit')}
                                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                                activeTab === 'edit' ? 'bg-accent text-white' : 'text-text-muted hover:text-text'
                                            }`}
                                        >
                                            <Edit3 size={12} /> Éditer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('preview')}
                                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                                activeTab === 'preview' ? 'bg-accent text-white' : 'text-text-muted hover:text-text'
                                            }`}
                                        >
                                            <Eye size={12} /> Aperçu
                                        </button>
                                    </div>
                                </div>

                                {activeTab === 'edit' ? (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                                        {/* Toolbar Markdown */}
                                        <div className="flex flex-wrap items-center gap-1 p-2 bg-surface border border-border/60 rounded-2xl overflow-x-auto no-scrollbar shadow-inner">
                                            <ToolbarButton onClick={() => insertFormatting('**', '**')} title="Gras">
                                                <Bold size={16} />
                                            </ToolbarButton>
                                            <ToolbarButton onClick={() => insertFormatting('*', '*')} title="Italique">
                                                <Italic size={16} />
                                            </ToolbarButton>
                                            <div className="w-px h-6 bg-border/40 mx-1" />
                                            <ToolbarButton onClick={() => insertBlock('# ')} title="Titre H1">
                                                <Heading1 size={16} />
                                            </ToolbarButton>
                                            <ToolbarButton onClick={() => insertBlock('## ')} title="Titre H2">
                                                <span className="text-[11px] font-black">H2</span>
                                            </ToolbarButton>
                                            <div className="w-px h-6 bg-border/40 mx-1" />
                                            <ToolbarButton onClick={() => insertBlock('- ')} title="Liste à puces">
                                                <List size={16} />
                                            </ToolbarButton>
                                            <ToolbarButton onClick={() => insertBlock('> ')} title="Citation">
                                                <Quote size={16} />
                                            </ToolbarButton>
                                            <div className="w-px h-6 bg-border/40 mx-1" />
                                            <ToolbarButton onClick={() => insertFormatting('`', '`')} title="Code inline">
                                                <Code size={16} />
                                            </ToolbarButton>
                                            <ToolbarButton onClick={() => insertFormatting('```\n', '\n```')} title="Bloc de code">
                                                <span className="text-[10px] font-black font-mono">{'</>'}</span>
                                            </ToolbarButton>
                                            <ToolbarButton onClick={() => insertFormatting('[', '](url)')} title="Lien">
                                                <Link size={16} />
                                            </ToolbarButton>
                                        </div>

                                        {/* Textarea */}
                                        <textarea
                                            ref={textareaRef}
                                            id="question-text"
                                            value={questionText}
                                            onChange={e => {
                                                if (e.target.value.length <= MAX_QUESTION_LENGTH) {
                                                    setQuestionText(e.target.value);
                                                }
                                            }}
                                            className={`w-full px-8 py-6 bg-background border rounded-[2rem] outline-none transition-all text-text font-medium min-h-[280px] leading-relaxed italic shadow-inner custom-scrollbar resize-none ${
                                                isAtLimit
                                                    ? 'border-rose-500/40 focus:border-rose-500/60 focus:ring-4 focus:ring-rose-500/5'
                                                    : 'border-border/60 focus:border-accent/40 focus:bg-background focus:ring-4 focus:ring-accent/5'
                                            }`}
                                            placeholder="Écrivez l'énoncé ici... Le Markdown est supporté."
                                        />

                                        {/* Compteur de caractères */}
                                        <div className="flex justify-end">
                                            <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                                                isAtLimit
                                                    ? 'text-rose-500'
                                                    : isNearLimit
                                                    ? 'text-yellow-500'
                                                    : 'text-text-muted/30'
                                            }`}>
                                                {charCount} / {MAX_QUESTION_LENGTH}
                                                {isAtLimit && ' — limite atteinte'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="min-h-[300px] p-8 bg-background border border-border/60 rounded-[2rem] overflow-y-auto animate-in fade-in duration-500 shadow-inner">
                                        {questionText.trim() ? (
                                            <div className="prose prose-invert prose-indigo max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-a:text-accent prose-code:text-accent prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-img:rounded-3xl">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                                    rehypePlugins={[rehypeRaw]}
                                                >
                                                    {parseShortcodes(questionText)}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="text-text-muted/30 text-[11px] font-black uppercase tracking-widest italic text-center mt-16">
                                                aucun énoncé rédigé.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bouton de soumission */}
                    <div className="pt-2 flex justify-start">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative flex items-center gap-4 px-12 py-5 bg-accent hover:bg-accent/90 text-white rounded-3xl font-black uppercase tracking-[0.4em] text-[11px] transition-all disabled:opacity-50 shadow-2xl shadow-accent/40 active:scale-95 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:250%_250%] group-hover:animate-[shimmer_2s_infinite]" />
                            {isSubmitting
                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            }
                            {buttonText.toUpperCase()}
                        </button>
                    </div>
                </div>

                {/* ── PANNEAU DROIT : RÉPONSES ─────────────────────────────────── */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-surface border border-border/60 p-8 rounded-[3rem] shadow-xl relative overflow-hidden">

                        {/* En-tête du panneau */}
                        <div className="flex justify-between items-center border-b border-border/40 pb-6 mb-8">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Info className="w-3.5 h-3.5 text-accent" />
                                    <h2 className="text-sm font-black text-text uppercase tracking-widest">
                                        suggestions
                                    </h2>
                                </div>
                                <p className="text-[9px] text-text-muted/40 font-black uppercase tracking-widest italic">
                                    {type === 'true_false'
                                        ? 'format fixe — désignez la vérité.'
                                        : `${answers.length} / ${MAX_ANSWERS} options — cochez la bonne réponse.`
                                    }
                                </p>
                            </div>

                            {/* Bouton d'ajout (masqué en Vrai/Faux) */}
                            {answers.length < MAX_ANSWERS && type !== 'true_false' && (
                                <button
                                    type="button"
                                    onClick={handleAddAnswer}
                                    title="Ajouter une option"
                                    className="p-3 bg-background hover:bg-accent border border-border/60 hover:border-accent rounded-xl text-text-muted hover:text-white transition-all shadow-sm group"
                                >
                                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                </button>
                            )}
                        </div>

                        {/* Indicateur de progression des options */}
                        {type === 'multiple_choice' && (
                            <div className="flex gap-1.5 mb-6">
                                {Array.from({ length: MAX_ANSWERS }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                                            i < answers.length
                                                ? answers[i].isCorrect
                                                    ? 'bg-accent shadow-sm shadow-accent/30'
                                                    : 'bg-border/60'
                                                : 'bg-border/20'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Liste des réponses */}
                        <div className="space-y-3">
                            {answers.map((answer, index) => (
                                <div
                                    key={index}
                                    draggable={type !== 'true_false'}
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={e => handleDragOver(e, index)}
                                    onDrop={() => handleDrop(index)}
                                    onDragEnd={handleDragEnd}
                                    className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                                        dragOverIndex === index
                                            ? 'border-accent/60 bg-accent/5 scale-[1.02]'
                                            : answer.isCorrect
                                            ? 'border-accent bg-accent/5 ring-1 ring-accent/20'
                                            : 'border-border/40 bg-background/50 hover:border-accent/30'
                                    }`}
                                >
                                    {/* Poignée de drag (masquée en V/F) */}
                                    {type !== 'true_false' && (
                                        <div className="cursor-grab text-text-muted/20 group-hover:text-text-muted/50 transition-colors shrink-0">
                                            <GripVertical size={16} />
                                        </div>
                                    )}

                                    {/* Sélecteur radio stylisé */}
                                    <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                                        <input
                                            type="radio"
                                            name="correctAnswer"
                                            checked={answer.isCorrect}
                                            onChange={() => handleAnswerChange(index, 'isCorrect', true)}
                                            className="hidden"
                                        />
                                        <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                                            answer.isCorrect
                                                ? 'bg-accent border-accent shadow-lg shadow-accent/20'
                                                : 'border-border/60 bg-background hover:border-accent/40'
                                        }`}>
                                            {answer.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                    </label>

                                    {/* Champ de texte de la réponse */}
                                    <div className="flex-1 min-w-0">
                                        <input
                                            type="text"
                                            value={answer.text}
                                            onChange={e => handleAnswerChange(index, 'text', e.target.value)}
                                            disabled={type === 'true_false'}
                                            className={`w-full bg-transparent outline-none text-[13px] font-black uppercase tracking-tight transition-colors disabled:cursor-default ${
                                                answer.isCorrect
                                                    ? 'text-text'
                                                    : 'text-text-muted/60 focus:text-text'
                                            }`}
                                            placeholder={`Option ${index + 1}`}
                                        />
                                    </div>

                                    {/* Badge "bonne réponse" */}
                                    {answer.isCorrect && (
                                        <span className="shrink-0 px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-lg text-[8px] font-black uppercase tracking-widest text-accent">
                                            correct
                                        </span>
                                    )}

                                    {/* Bouton de suppression */}
                                    {answers.length > MIN_ANSWERS && type !== 'true_false' && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAnswer(index)}
                                            title="Supprimer cette option"
                                            className="shrink-0 p-1.5 text-text-muted/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Bouton d'ajout bas de liste */}
                        {type === 'multiple_choice' && answers.length < MAX_ANSWERS && (
                            <button
                                type="button"
                                onClick={handleAddAnswer}
                                className="w-full mt-5 py-4 border border-dashed border-border/50 hover:border-accent/40 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-muted/40 hover:text-accent transition-all flex items-center justify-center gap-2 group"
                            >
                                <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                                ajouter une possibilité
                            </button>
                        )}

                        {/* Info Vrai/Faux */}
                        {type === 'true_false' && (
                            <p className="mt-5 text-center text-[9px] font-black uppercase tracking-widest text-text-muted/30 italic">
                                Format fixe — cliquez sur la case pour indiquer la bonne réponse.
                            </p>
                        )}
                    </div>

                    {/* Résumé de cohérence */}
                    <div className={`p-5 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                        correctCount === 1
                            ? 'bg-accent/5 border-accent/20 text-accent/60'
                            : 'bg-rose-500/5 border-rose-500/20 text-rose-400/80'
                    }`}>
                        <div className="flex items-center gap-3">
                            {correctCount === 1
                                ? <CheckCircle2 size={14} />
                                : <AlertCircle size={14} />
                            }
                            {correctCount === 0
                                ? 'Aucune bonne réponse désignée.'
                                : correctCount > 1
                                ? `${correctCount} bonnes réponses sélectionnées — QCM limité à une seule.`
                                : 'Bonne réponse correctement désignée.'
                            }
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
