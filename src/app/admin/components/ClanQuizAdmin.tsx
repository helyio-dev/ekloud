import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, Check, Loader2, HelpCircle, X, ToggleLeft, ToggleRight } from 'lucide-react';

interface Question { id: string; question_text: string; options: { text: string; correct: boolean }[]; category: string; difficulty: string; active: boolean; }

export default function ClanQuizAdmin() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newQ, setNewQ] = useState('');
    const [newCat, setNewCat] = useState('général');
    const [newDiff, setNewDiff] = useState('medium');
    const [newOpts, setNewOpts] = useState([{ text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }]);
    const [formError, setFormError] = useState('');
    const [formSaving, setFormSaving] = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        const { data } = await supabase.from('clan_questions').select('*').order('created_at', { ascending: false });
        setQuestions(data || []);
        setIsLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const saveQuestion = async () => {
        const filled = newOpts.filter(o => o.text.trim());
        if (!newQ.trim()) { setFormError('La question est obligatoire.'); return; }
        if (filled.length < 2) { setFormError('Minimum 2 options.'); return; }
        if (!filled.some(o => o.correct)) { setFormError('Cochez la bonne réponse.'); return; }
        setFormSaving(true);
        const { error } = await supabase.from('clan_questions').insert({ question_text: newQ.trim(), options: filled.map(o => ({ text: o.text.trim(), correct: o.correct })), category: newCat, difficulty: newDiff, active: true });
        setFormSaving(false);
        if (error) { setFormError(error.message); return; }
        setNewQ(''); setNewCat('général'); setNewDiff('medium'); setFormError('');
        setNewOpts([{ text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }]);
        setShowForm(false); load();
    };

    const toggleActive = async (id: string, current: boolean) => {
        await supabase.from('clan_questions').update({ active: !current }).eq('id', id);
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, active: !current } : q));
    };

    const deleteQuestion = async (id: string) => {
        if (!confirm('Supprimer cette question ?')) return;
        await supabase.from('clan_questions').delete().eq('id', id);
        setQuestions(prev => prev.filter(q => q.id !== id));
    };

    const activeCount = questions.filter(q => q.active).length;
    if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-accent animate-spin opacity-40" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-border/40 pb-5">
                <div className="flex items-center gap-3">
                    <HelpCircle size={16} className="text-accent" />
                    <h1 className="text-sm font-black uppercase tracking-widest">Quiz Clan</h1>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{activeCount} actives</span>
                    <span className="text-[10px] text-text-muted/50 font-medium">· 10 tirées au hasard par participant</span>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95">
                    <Plus size={14} /> Nouvelle question
                </button>
            </div>
            <div className="space-y-2">
                {questions.map(q => (
                    <div key={q.id} className={`flex items-start gap-3 p-4 rounded-xl border group transition-all ${q.active ? 'bg-surface border-border hover:border-accent/30' : 'bg-surface/40 border-border/30 opacity-60'}`}>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text mb-2">{q.question_text}</p>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {q.options.map((opt, i) => (
                                    <span key={i} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${opt.correct ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-surface-hover border-border text-text-muted/60'}`}>
                                        {opt.correct ? '✓ ' : ''}{opt.text}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-text-muted/50 font-medium uppercase tracking-widest"><span>{q.category}</span><span>·</span><span>{q.difficulty}</span></div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => toggleActive(q.id, q.active)} className={`p-1.5 rounded-lg transition-all ${q.active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-text-muted/40 hover:bg-surface-hover hover:text-text'}`}>
                                {q.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                            <button onClick={() => deleteQuestion(q.id)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-all"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
                {questions.length === 0 && <div className="text-center py-12 text-text-muted/50 text-sm border border-dashed border-border rounded-xl">Aucune question — crée-en une pour commencer.</div>}
            </div>
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                            <span className="text-sm font-black uppercase tracking-widest">Nouvelle question</span>
                            <button onClick={() => { setShowForm(false); setFormError(''); }} className="p-1.5 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-all"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Question</label>
                                <textarea value={newQ} onChange={e => setNewQ(e.target.value)} rows={2} autoFocus className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl text-sm text-text focus:outline-none focus:border-accent/40 resize-none transition-all" placeholder="Ex: Quelle commande liste les conteneurs Docker ?" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Catégorie</label><input value={newCat} onChange={e => setNewCat(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-border/80 rounded-xl text-sm text-text focus:outline-none focus:border-accent/40 transition-all" /></div>
                                <div><label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Difficulté</label><select value={newDiff} onChange={e => setNewDiff(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-border/80 rounded-xl text-sm text-text focus:outline-none focus:border-accent/40 transition-all"><option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Difficile</option></select></div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Options — cocher la bonne réponse</label>
                                    {newOpts.length < 6 && <button type="button" onClick={() => setNewOpts([...newOpts, { text: '', correct: false }])} className="text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent/80">+ Ajouter</button>}
                                </div>
                                <div className="space-y-2">
                                    {newOpts.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <button type="button" onClick={() => setNewOpts(newOpts.map((o, j) => ({ ...o, correct: i === j })))} className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${opt.correct ? 'bg-emerald-500 border-emerald-500' : 'border-border/60 hover:border-emerald-500/40'}`}>
                                                {opt.correct && <Check size={10} className="text-white" />}
                                            </button>
                                            <input value={opt.text} onChange={e => setNewOpts(newOpts.map((o, j) => j === i ? { ...o, text: e.target.value } : o))} className="flex-1 px-3 py-2 bg-background border border-border/60 rounded-lg text-sm text-text focus:outline-none focus:border-accent/40 transition-all" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                                            {newOpts.length > 2 && <button type="button" onClick={() => setNewOpts(newOpts.filter((_, j) => j !== i))} className="p-1.5 hover:bg-rose-500/10 rounded-lg text-text-muted/40 hover:text-rose-400 transition-all"><X size={12} /></button>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {formError && <p className="text-rose-400 text-xs font-medium">{formError}</p>}
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/60 bg-background/40">
                            <button onClick={() => { setShowForm(false); setFormError(''); }} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text transition-all">Annuler</button>
                            <button onClick={saveQuestion} disabled={formSaving} className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50">
                                {formSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Créer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
