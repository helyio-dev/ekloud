import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, Bold, Italic, List, ListTodo, Heading1, Heading2, Heading3, Code, Link, Quote, Eye, Edit3, Type } from 'lucide-react';
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
     * insère des balises de formatage autour de la sélection actuelle dans le textarea.
     */
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

        // réinitialisation immédiate du focus et positionnement intelligent du curseur
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
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black tracking-widest text-text-muted uppercase">module de rattachement</label>
                    <div className="relative">
                        <select
                            required
                            value={moduleId}
                            onChange={(e) => setModuleId(e.target.value)}
                            className="w-full px-5 py-4 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all appearance-none text-text font-bold"
                        >
                            <option value="" disabled>choisir un module...</option>
                            {modules.map(mod => (
                                <option key={mod.id} value={mod.id}>{mod.title}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                            <List size={14} />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-2">
                    <label className="block text-[10px] font-black tracking-widest text-text-muted uppercase">titre de la leçon</label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-5 py-4 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all font-black text-text placeholder:opacity-20"
                        placeholder="ex: architecture serverless aws"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-black tracking-widest text-text-muted uppercase">index d'affichage</label>
                    <input
                        type="number"
                        min="1"
                        required
                        value={orderIndex}
                        onChange={(e) => setOrderIndex(parseInt(e.target.value))}
                        className="w-full px-5 py-4 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all text-text font-bold"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                    <div className="flex items-center gap-2">
                        <Type size={16} className="text-accent" />
                        <label className="text-[10px] font-black tracking-widest text-text-muted uppercase">contenu pédagogique (markdown)</label>
                    </div>
                    
                    <div className="flex bg-background border border-border p-1 rounded-xl shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveTab('edit')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black tracking-widest transition-all ${activeTab === 'edit' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
                        >
                            <Edit3 size={14} /> ÉDITION
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('preview')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black tracking-widest transition-all ${activeTab === 'preview' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
                        >
                            <Eye size={14} /> APERÇU
                        </button>
                    </div>
                </div>

                {activeTab === 'edit' ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                        {/* barre d'outils flottante enrichie */}
                        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-surface-hover/30 border border-border rounded-2xl overflow-x-auto no-scrollbar">
                            <button type="button" onClick={() => insertFormatting('**', '**')} className="p-2 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Gras"><Bold size={18} /></button>
                            <button type="button" onClick={() => insertFormatting('*', '*')} className="p-2 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Italique"><Italic size={18} /></button>
                            <div className="w-px h-6 bg-border mx-1" />
                            <button type="button" onClick={() => insertBlock('# ')} className="p-2 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Titre 1"><Heading1 size={18} /></button>
                            <button type="button" onClick={() => insertBlock('## ')} className="p-2 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Titre 2"><Heading2 size={18} /></button>
                            <button type="button" onClick={() => insertBlock('### ')} className="p-2 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Titre 3"><Heading3 size={18} /></button>
                            <div className="w-px h-6 bg-border mx-1" />
                            <button type="button" onClick={() => insertBlock('- ')} className="p-2 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Liste"><List size={18} /></button>
                            <button type="button" onClick={() => insertBlock('- [ ] ')} className="p-2 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Titre de tâches"><ListTodo size={18} /></button>
                            <div className="w-px h-6 bg-border mx-1" />
                            <button type="button" onClick={() => insertFormatting('`', '`')} className="p-2 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Code en ligne"><Type size={18} /></button>
                            <button type="button" onClick={() => insertBlock('```\n', '\n```')} className="p-2 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Bloc de code"><Code size={18} /></button>
                            <div className="w-px h-6 bg-border mx-1" />
                            <button type="button" onClick={() => insertFormatting('[', '](url)')} className="p-2 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Lien"><Link size={18} /></button>
                            <button type="button" onClick={() => insertBlock('> ')} className="p-2 hover:bg-accent/10 rounded-xl text-text-muted hover:text-accent transition-all" title="Citation"><Quote size={18} /></button>
                            <div className="w-px h-6 bg-border mx-1" />
                            <div className="flex items-center gap-1.5 px-3 border-x border-border">
                                <span className="text-[10px] font-black text-text-muted mr-1">TEXTE</span>
                                <button type="button" onClick={() => insertFormatting('[[indigo:', ']]')} className="w-5 h-5 rounded-full bg-[#818cf8] border border-white/20 hover:scale-125 transition-transform" />
                                <button type="button" onClick={() => insertFormatting('[[vert:', ']]')} className="w-5 h-5 rounded-full bg-[#22c55e] border border-white/20 hover:scale-125 transition-transform" />
                                <button type="button" onClick={() => insertFormatting('[[rouge:', ']]')} className="w-5 h-5 rounded-full bg-[#ef4444] border border-white/20 hover:scale-125 transition-transform" />
                            </div>
                        </div>

                        <textarea
                            id="lesson-content"
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-6 py-5 bg-background border border-border rounded-[24px] focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all min-h-[600px] font-mono text-sm leading-relaxed text-text shadow-inner custom-scrollbar"
                            placeholder="rédigez ici votre cours... utilisez le markdown pour enrichir le contenu pedagogical."
                        />
                    </div>
                ) : (
                    <div className="min-h-[600px] p-10 bg-background border border-border rounded-[24px] overflow-y-auto animate-in fade-in slide-in-from-bottom-1 duration-300">
                        <article className="prose prose-invert prose-indigo max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-accent prose-code:text-accent prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-img:rounded-3xl">
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

            <footer className="pt-8 border-t border-border flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-3 px-10 py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black text-xs tracking-widest transition-all disabled:opacity-30 shadow-[0_0_20px_var(--accent-glow)] active:scale-95"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {buttonText.toUpperCase()}
                </button>
            </footer>
        </form>
    );
}
