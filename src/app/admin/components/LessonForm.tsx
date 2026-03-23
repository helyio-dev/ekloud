import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, Bold, Italic, List, ListTodo, Heading1, Heading2, Heading3, Code, Link, Quote, Eye, Edit3, Type, Paintbrush, Highlighter } from 'lucide-react';
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

export default function LessonForm({ initialData, onSubmit, isSubmitting, buttonText }: LessonFormProps) {
    const [modules, setModules] = useState<any[]>([]);
    const [moduleId, setModuleId] = useState(initialData?.module_id || '');
    const [title, setTitle] = useState(initialData?.title || '');
    const [content, setContent] = useState(initialData?.content || '');
    const [orderIndex, setOrderIndex] = useState(initialData?.order_index || 1);

    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

    useEffect(() => {
        const fetchModules = async () => {
            const { data } = await supabase.from('modules').select('id, title').order('order_index');
            if (data) {
                setModules(data);
                if (!moduleId && data.length > 0) setModuleId(data[0].id);
            }
        };
        fetchModules();
    }, []);

    const insertFormatting = (prefix: string, suffix: string = '') => {
        const textarea = document.getElementById('lesson-content') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const before = content.substring(0, start);
        const after = content.substring(end);

        const newText = before + prefix + selectedText + suffix + after;
        setContent(newText);

        // Reset focus and selection
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + prefix.length + selectedText.length + suffix.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const insertBlock = (prefix: string, suffix: string = '') => {
        const textarea = document.getElementById('lesson-content') as HTMLTextAreaElement;
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
        <form onSubmit={handleSubmit} className="space-y-6 bg-surface border border-border p-8 rounded-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-2 text-text-muted">Module Parent</label>
                    <select
                        required
                        value={moduleId}
                        onChange={(e) => setModuleId(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none text-text"
                    >
                        <option value="" disabled>Sélectionnez un module</option>
                        {modules.map(mod => (
                            <option key={mod.id} value={mod.id}>{mod.title}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-text-muted">Titre de la leçon</label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-bold text-text"
                        placeholder="Ex: Les fondamentaux des variables"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-text-muted">Ordre d'affichage (Index)</label>
                    <input
                        type="number"
                        min="1"
                        required
                        value={orderIndex}
                        onChange={(e) => setOrderIndex(parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-text"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-2">
                    <label className="text-sm font-medium text-text-muted">Contenu de la leçon</label>
                    <div className="flex bg-background border border-border p-1 rounded-xl shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveTab('edit')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'edit' ? 'bg-accent text-white' : 'text-text-muted hover:text-text'}`}
                        >
                            <Edit3 size={14} /> ÉDITION
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('preview')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'preview' ? 'bg-accent text-white' : 'text-text-muted hover:text-text'}`}
                        >
                            <Eye size={14} /> APERÇU
                        </button>
                    </div>
                </div>

                {activeTab === 'edit' ? (
                    <div className="space-y-2">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-1 p-2 bg-background border border-border rounded-xl overflow-x-auto no-scrollbar">
                            <button type="button" onClick={() => insertFormatting('**', '**')} className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors" title="Gras"><Bold size={18} /></button>
                            <button type="button" onClick={() => insertFormatting('*', '*')} className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors" title="Italique"><Italic size={18} /></button>
                            <div className="w-px h-6 bg-border mx-1"></div>
                            <button type="button" onClick={() => insertBlock('# ')} className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors" title="Titre 1"><Heading1 size={18} /></button>
                            <button type="button" onClick={() => insertBlock('## ')} className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors" title="Titre 2"><Heading2 size={18} /></button>
                            <button type="button" onClick={() => insertBlock('### ')} className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors" title="Titre 3"><Heading3 size={18} /></button>
                            <div className="w-px h-6 bg-border mx-1"></div>
                            <button type="button" onClick={() => insertBlock('- ')} className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors" title="Liste"><List size={18} /></button>
                            <button type="button" onClick={() => insertBlock('- [ ] ')} className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors" title="Liste de tâches"><ListTodo size={18} /></button>
                            <div className="w-px h-6 bg-border mx-1"></div>
                            <button type="button" onClick={() => insertFormatting('`', '`')} className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors" title="Code en ligne"><Type size={18} /></button>
                            <button type="button" onClick={() => insertBlock('```\n', '\n```')} className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors" title="Bloc de code"><Code size={18} /></button>
                            <div className="w-px h-6 bg-border mx-1"></div>
                            <button type="button" onClick={() => insertFormatting('[', '](url)')} className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors" title="Lien"><Link size={18} /></button>
                            <button type="button" onClick={() => insertBlock('> ')} className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors" title="Citation"><Quote size={18} /></button>
                            <button type="button" onClick={() => insertBlock('---\n')} className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors" title="Ligne horizontale"><div className="w-5 h-px bg-current opacity-50"></div></button>
                            <div className="w-px h-6 bg-border mx-1"></div>
                            <div className="flex items-center gap-1 px-2 border-x border-border">
                                <span className="text-[10px] text-text-muted mr-1">TEXTE</span>
                                <button type="button" onClick={() => insertFormatting('[[indigo:', ']]')} className="w-5 h-5 rounded-full bg-[#818cf8] border border-white/20 hover:scale-110 transition-transform" title="Texte Indigo"></button>
                                <button type="button" onClick={() => insertFormatting('[[vert:', ']]')} className="w-5 h-5 rounded-full bg-[#22c55e] border border-white/20 hover:scale-110 transition-transform" title="Texte Vert"></button>
                                <button type="button" onClick={() => insertFormatting('[[rouge:', ']]')} className="w-5 h-5 rounded-full bg-[#ef4444] border border-white/20 hover:scale-110 transition-transform" title="Texte Rouge"></button>
                                <button type="button" onClick={() => insertFormatting('[[jaune:', ']]')} className="w-5 h-5 rounded-full bg-[#eab308] border border-white/20 hover:scale-110 transition-transform" title="Texte Jaune"></button>
                            </div>
                            <div className="flex items-center gap-1 px-2">
                                <span className="text-[10px] text-text-muted mr-1">FOND</span>
                                <button type="button" onClick={() => insertFormatting('[[bg-indigo:', ']]')} className="w-5 h-5 rounded bg-[#818cf8]/20 border border-[#818cf8]/40 hover:scale-110 transition-transform" title="Fond Indigo"></button>
                                <button type="button" onClick={() => insertFormatting('[[bg-vert:', ']]')} className="w-5 h-5 rounded bg-[#22c55e]/20 border border-[#22c55e]/40 hover:scale-110 transition-transform" title="Fond Vert"></button>
                                <button type="button" onClick={() => insertFormatting('[[bg-jaune:', ']]')} className="w-5 h-5 rounded bg-[#eab308]/20 border border-[#eab308]/40 hover:scale-110 transition-transform" title="Fond Jaune"></button>
                                <button type="button" onClick={() => insertFormatting('[[bg-rouge:', ']]')} className="w-5 h-5 rounded bg-[#ef4444]/20 border border-[#ef4444]/40 hover:scale-110 transition-transform" title="Fond Rouge"></button>
                            </div>
                        </div>
                        <textarea
                            id="lesson-content"
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all min-h-[500px] font-mono text-sm leading-relaxed text-text shadow-inner"
                            placeholder="Rédigez le contenu de votre cours ici... Utlisez les icônes pour mettre en forme."
                        />
                    </div>
                ) : (
                    <div className="min-h-[500px] p-8 bg-background border border-border rounded-xl overflow-y-auto">
                        <div className="prose prose-invert prose-indigo max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-a:text-accent prose-code:text-accent prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-img:rounded-3xl">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                rehypePlugins={[rehypeRaw]}
                            >
                                {parseShortcodes(content) || "*Aucun contenu à afficher pour le moment.*"}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-6 border-t border-border flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> {buttonText}</>}
                </button>
            </div>
        </form>
    );
}
