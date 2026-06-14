import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Loader2, ArrowLeft, HelpCircle, Sparkles, Layout, Zap,
    FileJson, X, BookOpen, ChevronDown, ChevronRight,
    CheckCircle2, AlertCircle, Code, Bold, List, Hash,
    Quote, Link2, Eye, Info, Terminal
} from 'lucide-react';
import QuestionForm from '../../components/QuestionForm';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ParsedQuestion {
    question_text: string;
    type?: string;
    answers: { text: string; isCorrect: boolean }[];
}

// ─── Sous-composant : Section de documentation escamotable ────────────────────

interface DocSectionProps {
    icon: React.ReactNode;
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

function DocSection({ icon, title, defaultOpen = false, children }: DocSectionProps) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-border/40 rounded-2xl overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-background/60 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <span className="text-accent/70">{icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/80 group-hover:text-text transition-colors">
                        {title}
                    </span>
                </div>
                {open
                    ? <ChevronDown size={14} className="text-text-muted/40" />
                    : <ChevronRight size={14} className="text-text-muted/40" />
                }
            </button>
            {open && (
                <div className="px-5 pb-5 pt-1 border-t border-border/30 animate-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}

// ─── Sous-composant : Badge de tag ────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-block px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-md text-[9px] font-black uppercase tracking-widest text-accent font-mono">
            {children}
        </span>
    );
}

// ─── Panneau de documentation interne ────────────────────────────────────────

function HelpPanel({ onClose }: { onClose: () => void }) {
    return (
        <div className="flex flex-col h-full">
            {/* En-tête */}
            <div className="p-6 border-b border-border/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-xl text-accent">
                        <BookOpen size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest">Documentation</h2>
                        <p className="text-[8px] text-text-muted/40 font-black uppercase tracking-widest italic">
                            Guide de création de questions
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-background border border-border/40 rounded-xl transition-all"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Corps scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">

                {/* ── Format JSON ───────────────────────────────────────── */}
                <DocSection icon={<FileJson size={14} />} title="Format JSON d'import" defaultOpen>
                    <div className="space-y-4 mt-3">
                        <p className="text-[10px] text-text-muted/60 leading-relaxed">
                            Collez un tableau JSON pour injecter plusieurs questions à la fois.
                            Chaque objet représente une question avec ses options de réponse.
                        </p>
                        <pre className="bg-background border border-border/40 rounded-xl p-4 text-[10px] font-mono text-text-muted/80 leading-relaxed overflow-x-auto custom-scrollbar">{`[
  {
    "question_text": "Quel est le rôle d'un DNS ?",
    "type": "multiple_choice",
    "answers": [
      { "text": "Résoudre des noms de domaine", "isCorrect": true },
      { "text": "Chiffrer les données",         "isCorrect": false },
      { "text": "Router les paquets IP",         "isCorrect": false }
    ]
  },
  {
    "question_text": "HTTP est un protocole sécurisé.",
    "type": "true_false",
    "answers": [
      { "text": "Vrai", "isCorrect": false },
      { "text": "Faux", "isCorrect": true }
    ]
  }
]`}</pre>
                        <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/50">Champs reconnus</p>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { key: 'question_text', desc: 'Énoncé de la question (Markdown supporté)', required: true },
                                    { key: 'type', desc: '"multiple_choice" ou "true_false"', required: false },
                                    { key: 'answers[].text', desc: 'Libellé de l\'option', required: true },
                                    { key: 'answers[].isCorrect', desc: 'true pour la bonne réponse', required: true },
                                ].map(f => (
                                    <div key={f.key} className="flex items-start gap-2">
                                        <Tag>{f.key}</Tag>
                                        {f.required && (
                                            <span className="text-[8px] font-black text-rose-400/80 uppercase tracking-widest shrink-0 mt-0.5">requis</span>
                                        )}
                                        <span className="text-[9px] text-text-muted/50 leading-relaxed">{f.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DocSection>

                {/* ── Syntaxe Markdown ─────────────────────────────────── */}
                <DocSection icon={<Bold size={14} />} title="Syntaxe Markdown">
                    <div className="mt-3 space-y-2">
                        {[
                            { syntax: '**texte**', result: 'Gras', icon: <Bold size={11} /> },
                            { syntax: '*texte*',   result: 'Italique', icon: <span className="italic text-[10px] font-serif">I</span> },
                            { syntax: '# Titre',   result: 'Titre H1', icon: <Hash size={11} /> },
                            { syntax: '## Titre',  result: 'Titre H2', icon: <Hash size={11} /> },
                            { syntax: '- item',    result: 'Liste à puces', icon: <List size={11} /> },
                            { syntax: '> texte',   result: 'Citation', icon: <Quote size={11} /> },
                            { syntax: '`code`',    result: 'Code inline', icon: <Code size={11} /> },
                            { syntax: '```\ncode\n```', result: 'Bloc de code', icon: <Terminal size={11} /> },
                            { syntax: '[lien](url)', result: 'Hyperlien', icon: <Link2 size={11} /> },
                        ].map(item => (
                            <div key={item.syntax} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/20 last:border-0">
                                <span className="font-mono text-[9px] text-accent/80 bg-accent/5 px-2 py-0.5 rounded-md">
                                    {item.syntax}
                                </span>
                                <div className="flex items-center gap-1.5 text-text-muted/60 shrink-0">
                                    <span className="text-accent/50">{item.icon}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">{item.result}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </DocSection>

                {/* ── Règles de rédaction ───────────────────────────────── */}
                <DocSection icon={<CheckCircle2 size={14} />} title="Règles de rédaction">
                    <ul className="mt-3 space-y-3">
                        {[
                            'Une seule option doit être marquée comme correcte (isCorrect: true).',
                            'Minimum 2 options, maximum 5 pour le format QCM.',
                            'Le format Vrai/Faux impose exactement 2 réponses fixes.',
                            'L\'énoncé est limité à 2 000 caractères. Le Markdown y est pleinement supporté.',
                            'Les options vides sont bloquées à la soumission.',
                        ].map((rule, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="shrink-0 w-4 h-4 mt-0.5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[7px] font-black text-accent">
                                    {i + 1}
                                </span>
                                <span className="text-[10px] text-text-muted/60 leading-relaxed">{rule}</span>
                            </li>
                        ))}
                    </ul>
                </DocSection>

                {/* ── Contextes ─────────────────────────────────────────── */}
                <DocSection icon={<Info size={14} />} title="Contextes d'affectation">
                    <div className="mt-3 space-y-3">
                        <p className="text-[10px] text-text-muted/60 leading-relaxed">
                            Une question est automatiquement affectée au contexte courant via les paramètres d'URL.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-start gap-3 p-3 bg-accent/5 border border-accent/20 rounded-xl">
                                <span className="shrink-0 px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-md text-[8px] font-black uppercase text-accent">Module</span>
                                <span className="text-[9px] text-text-muted/60">
                                    Affecté via <code className="text-accent/80">?moduleId=…</code> — accessible dans le contenu du module.
                                </span>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                                <span className="shrink-0 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-[8px] font-black uppercase text-yellow-500">Skill</span>
                                <span className="text-[9px] text-text-muted/60">
                                    Affecté via <code className="text-yellow-500/80">?skillId=…</code> — compose l'examen d'accréditation Helix.
                                </span>
                            </div>
                        </div>
                    </div>
                </DocSection>

                {/* ── Astuces ───────────────────────────────────────────── */}
                <DocSection icon={<Sparkles size={14} />} title="Astuces avancées">
                    <ul className="mt-3 space-y-3">
                        {[
                            { tip: 'Import JSON massif', desc: 'Générez 20 questions en une passe via le bouton "Coller JSON". Idéal avec un LLM (ChatGPT, Gemini…).' },
                            { tip: 'Aperçu Markdown', desc: 'Basculez en mode Aperçu pour vérifier le rendu de l\'énoncé avant publication.' },
                            { tip: 'Drag & drop', desc: 'Réordonnez les options de réponse par glisser-déposer dans le panneau droit.' },
                            { tip: 'Prompt LLM', desc: 'Demandez : "Génère 10 questions QCM au format JSON Ekloud sur le sujet [X]" pour un import rapide.' },
                        ].map((item, i) => (
                            <li key={i} className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-accent/70">{item.tip}</span>
                                <p className="text-[10px] text-text-muted/50 leading-relaxed">{item.desc}</p>
                            </li>
                        ))}
                    </ul>
                </DocSection>

                {/* ── Prompt LLM prêt à l'emploi ────────────────────────── */}
                <DocSection icon={<Terminal size={14} />} title="Prompt LLM prêt à l'emploi">
                    <div className="mt-3 space-y-3">
                        <p className="text-[9px] text-text-muted/50 leading-relaxed">
                            Copiez ce prompt dans un LLM en remplaçant <code className="text-accent/80">[SUJET]</code> et <code className="text-accent/80">[N]</code>.
                        </p>
                        <pre className="bg-background border border-border/40 rounded-xl p-4 text-[9px] font-mono text-text-muted/70 leading-relaxed whitespace-pre-wrap">{`Génère [N] questions QCM sur le sujet [SUJET].
Retourne uniquement un tableau JSON valide, sans commentaires.
Chaque élément doit respecter ce schéma :
{
  "question_text": "string (Markdown supporté)",
  "type": "multiple_choice",
  "answers": [
    { "text": "string", "isCorrect": true },
    { "text": "string", "isCorrect": false },
    { "text": "string", "isCorrect": false }
  ]
}
Règles : exactement 1 isCorrect: true par question,
entre 3 et 5 options, langage clair et professionnel.`}</pre>
                    </div>
                </DocSection>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/20 shrink-0">
                <p className="text-center text-[8px] font-black uppercase tracking-widest text-text-muted/20 italic">
                    Ekloud — Evaluation Core v2.1
                </p>
            </div>
        </div>
    );
}

// ─── Modal d'import JSON améliorée ────────────────────────────────────────────

interface JsonImportModalProps {
    isSkillContext: boolean;
    initialModuleId: string;
    initialSkillId: string;
    onClose: () => void;
    onSuccess: () => void;
}

function JsonImportModal({ isSkillContext, initialModuleId, initialSkillId, onClose, onSuccess }: JsonImportModalProps) {
    const [bulkJson, setBulkJson] = useState('');
    const [isBulkImporting, setIsBulkImporting] = useState(false);
    const [bulkError, setBulkError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<number | null>(null);

    /**
     * Parse le JSON en temps réel pour afficher une preview.
     * Retourne null si le JSON est invalide ou vide.
     */
    const parsedPreview = useMemo<ParsedQuestion[] | null>(() => {
        if (!bulkJson.trim()) return null;
        try {
            const parsed = JSON.parse(bulkJson);
            return Array.isArray(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }, [bulkJson]);

    const isJsonValid  = bulkJson.trim() === '' || parsedPreview !== null;
    const questionCount = parsedPreview?.length ?? 0;

    /**
     * Règles de validation structurelle sur le JSON parsé avant injection.
     */
    const structureErrors = useMemo(() => {
        if (!parsedPreview) return [];
        const errors: string[] = [];
        parsedPreview.forEach((q, i) => {
            if (!q.question_text?.trim()) errors.push(`Question ${i + 1} : champ "question_text" manquant.`);
            if (!Array.isArray(q.answers) || q.answers.length < 2)
                errors.push(`Question ${i + 1} : au moins 2 réponses requises.`);
            else if (!q.answers.some((a: any) => a.isCorrect))
                errors.push(`Question ${i + 1} : aucune bonne réponse désignée (isCorrect: true).`);
        });
        return errors;
    }, [parsedPreview]);

    const handleBulkImport = async () => {
        setBulkError(null);
        setImportSuccess(null);
        setIsBulkImporting(true);

        try {
            const questions = JSON.parse(bulkJson);
            if (!Array.isArray(questions)) throw new Error('Le format doit être un tableau JSON d\'objets.');
            if (structureErrors.length > 0) throw new Error(structureErrors[0]);

            for (const q of questions) {
                const { data: qData, error: qErr } = await supabase
                    .from('questions')
                    .insert([{
                        module_id:     initialModuleId || null,
                        skill_id:      initialSkillId  || null,
                        question_text: q.question_text || q.question || '',
                        type:          q.type || 'multiple_choice',
                    }])
                    .select()
                    .single();

                if (qErr) throw qErr;

                const options = (q.answers || q.options || []).map((o: any) => ({
                    question_id: qData.id,
                    option_text: o.text || o.option_text || '',
                    is_correct:  !!(o.isCorrect || o.is_correct || o.correct),
                }));

                if (options.length > 0) {
                    const { error: oErr } = await supabase.from('quiz_options').insert(options);
                    if (oErr) throw oErr;
                }
            }

            setImportSuccess(questions.length);
            setTimeout(onSuccess, 1500);

        } catch (err: any) {
            setBulkError(err.message || 'Erreur de parsing ou d\'injection.');
        } finally {
            setIsBulkImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-5xl bg-surface border border-border/60 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <header className="p-7 border-b border-border/40 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent/10 rounded-xl text-accent">
                            <FileJson size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight">Importation massive</h2>
                            <p className="text-[9px] text-text-muted/40 font-black uppercase tracking-widest italic">
                                Injection multi-questions via protocole JSON
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-background border border-border/40 rounded-2xl transition-all">
                        <X size={18} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-full">

                        {/* ── Colonne gauche : éditeur ────────────────────────── */}
                        <div className="p-7 space-y-5 border-r border-border/20">

                            {/* Bannière succès */}
                            {importSuccess !== null && (
                                <div className="flex items-center gap-3 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-emerald-400 animate-in slide-in-from-top-2">
                                    <CheckCircle2 size={16} />
                                    <p className="text-[11px] font-black uppercase tracking-widest">
                                        {importSuccess} question{importSuccess > 1 ? 's' : ''} injectée{importSuccess > 1 ? 's' : ''} avec succès !
                                    </p>
                                </div>
                            )}

                            {/* Erreur */}
                            {bulkError && (
                                <div className="flex items-start gap-3 p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-rose-400 animate-in slide-in-from-top-2">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{bulkError}</p>
                                </div>
                            )}

                            {/* Indicateur de statut JSON en temps réel */}
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-text-muted/50 uppercase tracking-widest">
                                    Coller le JSON ici
                                </label>
                                {bulkJson.trim() && (
                                    <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${
                                        !isJsonValid
                                            ? 'text-rose-400'
                                            : structureErrors.length > 0
                                            ? 'text-yellow-400'
                                            : 'text-emerald-400'
                                    }`}>
                                        {!isJsonValid ? (
                                            <><AlertCircle size={11} /> JSON invalide</>
                                        ) : structureErrors.length > 0 ? (
                                            <><AlertCircle size={11} /> {structureErrors.length} erreur{structureErrors.length > 1 ? 's' : ''}</>
                                        ) : (
                                            <><CheckCircle2 size={11} /> {questionCount} question{questionCount > 1 ? 's' : ''} valide{questionCount > 1 ? 's' : ''}</>
                                        )}
                                    </div>
                                )}
                            </div>

                            <textarea
                                value={bulkJson}
                                onChange={e => setBulkJson(e.target.value)}
                                className={`w-full h-[340px] bg-background border rounded-[1.5rem] p-6 outline-none transition-all text-[11px] font-mono leading-relaxed custom-scrollbar shadow-inner resize-none ${
                                    !isJsonValid && bulkJson.trim()
                                        ? 'border-rose-500/40 focus:border-rose-500/60 focus:ring-4 focus:ring-rose-500/5'
                                        : structureErrors.length > 0 && bulkJson.trim()
                                        ? 'border-yellow-500/40 focus:border-yellow-500/60 focus:ring-4 focus:ring-yellow-500/5'
                                        : 'border-border/60 focus:border-accent/40 focus:ring-4 focus:ring-accent/5'
                                }`}
                                placeholder={`[\n  {\n    "question_text": "Quel est le rôle d'un DNS ?",\n    "type": "multiple_choice",\n    "answers": [\n      { "text": "Résoudre des noms de domaine", "isCorrect": true },\n      { "text": "Chiffrer les données",          "isCorrect": false }\n    ]\n  }\n]`}
                                spellCheck={false}
                            />

                            {/* Erreurs de structure */}
                            {structureErrors.length > 0 && isJsonValid && (
                                <ul className="space-y-1">
                                    {structureErrors.slice(0, 3).map((err, i) => (
                                        <li key={i} className="flex items-start gap-2 text-[9px] font-black uppercase tracking-widest text-yellow-400/80">
                                            <AlertCircle size={10} className="shrink-0 mt-0.5" />
                                            {err}
                                        </li>
                                    ))}
                                    {structureErrors.length > 3 && (
                                        <li className="text-[9px] font-black uppercase tracking-widest text-yellow-400/60 pl-4">
                                            +{structureErrors.length - 3} autre{structureErrors.length - 3 > 1 ? 's' : ''}…
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>

                        {/* ── Colonne droite : preview ────────────────────────── */}
                        <div className="p-7 bg-background/30">
                            <div className="flex items-center gap-2 mb-5">
                                <Eye size={14} className="text-accent/60" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">
                                    Aperçu — {questionCount > 0 ? `${questionCount} question${questionCount > 1 ? 's' : ''}` : 'en attente de JSON valide'}
                                </span>
                            </div>

                            {parsedPreview && parsedPreview.length > 0 ? (
                                <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
                                    {parsedPreview.map((q, i) => {
                                        const correctAnswer = q.answers?.find((a: any) => a.isCorrect || a.is_correct);
                                        const hasError = structureErrors.some(e => e.startsWith(`Question ${i + 1}`));
                                        return (
                                            <div
                                                key={i}
                                                className={`p-4 rounded-2xl border transition-all ${
                                                    hasError
                                                        ? 'border-yellow-500/30 bg-yellow-500/5'
                                                        : 'border-border/40 bg-surface/60'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3 mb-3">
                                                    <span className={`shrink-0 w-5 h-5 rounded-lg flex items-center justify-center text-[8px] font-black ${
                                                        hasError
                                                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                            : 'bg-accent/10 text-accent border border-accent/20'
                                                    }`}>
                                                        {i + 1}
                                                    </span>
                                                    <p className="text-[11px] font-bold text-text/80 leading-relaxed line-clamp-2 flex-1">
                                                        {q.question_text || <span className="text-rose-400 italic">Énoncé manquant</span>}
                                                    </p>
                                                </div>
                                                <div className="space-y-1.5 pl-8">
                                                    {(q.answers || []).slice(0, 4).map((a: any, ai: number) => (
                                                        <div key={ai} className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-wide ${
                                                            (a.isCorrect || a.is_correct)
                                                                ? 'text-accent'
                                                                : 'text-text-muted/40'
                                                        }`}>
                                                            <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${
                                                                (a.isCorrect || a.is_correct)
                                                                    ? 'bg-accent border-accent'
                                                                    : 'border-border/50'
                                                            }`}>
                                                                {(a.isCorrect || a.is_correct) && (
                                                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                                )}
                                                            </div>
                                                            <span className="truncate">{a.text || a.option_text || '—'}</span>
                                                        </div>
                                                    ))}
                                                    {(q.answers || []).length > 4 && (
                                                        <span className="text-[8px] text-text-muted/30 pl-5">+{q.answers.length - 4} option(s)…</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] gap-4 opacity-20">
                                    <FileJson size={40} />
                                    <p className="text-[9px] font-black uppercase tracking-widest italic text-center">
                                        La prévisualisation apparaît<br />dès que le JSON est valide.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="p-6 border-t border-border/40 flex items-center justify-between gap-4 shrink-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/30 italic hidden md:block">
                        Schéma : <code className="text-accent/50">question_text</code> + <code className="text-accent/50">answers[]</code>
                    </p>
                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleBulkImport}
                            disabled={isBulkImporting || !bulkJson.trim() || !isJsonValid || structureErrors.length > 0}
                            className="px-8 py-3 bg-accent hover:bg-accent/90 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-xl shadow-accent/20 flex items-center gap-3"
                        >
                            {isBulkImporting ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                            Injecter {questionCount > 0 ? `(${questionCount})` : ''}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────

/**
 * `CreateQuizPage` — Page de création de questions QCM/Vrai-Faux.
 *
 * Intègre :
 * - `QuestionForm` pour la création unitaire.
 * - `JsonImportModal` pour l'injection massive via JSON.
 * - `HelpPanel` : documentation contextuelle escamotable accessible en sidebar.
 */
export default function CreateQuizPage() {
    const { isAdmin, isContributor, isLoading } = useAuth();
    const navigate  = useNavigate();
    const location  = useLocation();

    const queryParams      = new URLSearchParams(location.search);
    const initialModuleId  = queryParams.get('moduleId') || '';
    const initialSkillId   = queryParams.get('skillId')  || '';
    const isSkillContext   = !!initialSkillId;

    const [isSubmitting, setIsSubmitting]         = useState(false);
    const [error, setError]                       = useState<string | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen]             = useState(false);

    // Guard admin
    useEffect(() => {
        if (!isLoading && !isAdmin && !isContributor) navigate('/dashboard');
    }, [isAdmin, isContributor, isLoading, navigate]);

    /**
     * Crée une question unique puis insère ses options dans quiz_options.
     */
    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const { data: questionData, error: questionError } = await supabase
                .from('questions')
                .insert([{
                    module_id:     data.module_id || null,
                    skill_id:      data.skill_id  || null,
                    question_text: data.question_text,
                    type:          data.type || 'multiple_choice',
                }])
                .select()
                .single();

            if (questionError) throw questionError;

            const optionsToInsert = data.answers.map((a: any) => ({
                question_id: questionData.id,
                option_text: a.text,
                is_correct:  a.isCorrect,
            }));

            const { error: answersError } = await supabase
                .from('quiz_options')
                .insert(optionsToInsert);

            if (answersError) throw answersError;

            // Routage contextuel post-injection
            if (data.skill_id)       navigate(`/admin/skills/${data.skill_id}/exam`);
            else if (data.module_id) navigate(`/admin/modules/${data.module_id}/content`);
            else                     navigate('/admin');
        } catch (err: any) {
            setError(err.message || 'Échec lors de la création de la question.');
            setIsSubmitting(false);
        }
    };

    const handleImportSuccess = () => {
        if (initialSkillId)       navigate(`/admin/skills/${initialSkillId}/exam`);
        else if (initialModuleId) navigate(`/admin/modules/${initialModuleId}/content`);
        else                      navigate('/admin');
    };

    // ── Loader ────────────────────────────────────────────────────────────────
    if (isLoading || (!isAdmin && !isContributor)) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 animate-spin text-accent opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted/40 italic">
                    initialisation du studio d'évaluation…
                </span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text font-sans selection:bg-accent/30 relative overflow-hidden">

            {/* Décor de fond */}
            <div className="absolute top-0 right-0 p-32 opacity-[0.015] pointer-events-none rotate-12">
                <Layout size={600} />
            </div>

            {/* Modal d'import JSON */}
            {isImportModalOpen && (
                <JsonImportModal
                    isSkillContext={isSkillContext}
                    initialModuleId={initialModuleId}
                    initialSkillId={initialSkillId}
                    onClose={() => setIsImportModalOpen(false)}
                    onSuccess={handleImportSuccess}
                />
            )}

            {/* Layout principal — deux colonnes quand le panneau d'aide est ouvert */}
            <div className="flex h-screen overflow-hidden">

                {/* ── Zone de contenu principale ─────────────────────────────── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-10 p-8 md:p-14 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

                        {/* Navigation retour */}
                        <Link
                            to={
                                isSkillContext
                                    ? `/admin/skills/${initialSkillId}/exam`
                                    : initialModuleId
                                    ? `/admin/modules/${initialModuleId}/content`
                                    : '/admin'
                            }
                            className="inline-flex items-center gap-4 text-[10px] font-black text-text-muted hover:text-accent uppercase tracking-[0.3em] transition-all group"
                        >
                            <div className="p-2.5 bg-surface border border-border/40 rounded-xl group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            </div>
                            retour au contexte parent
                        </Link>

                        {/* En-tête */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <HelpCircle className="w-4 h-4 text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60">
                                        module d'interrogation
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-tight">
                                    nouvelle question
                                </h1>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Bouton aide */}
                                <button
                                    onClick={() => setIsHelpOpen(o => !o)}
                                    className={`flex items-center gap-3 px-6 py-3.5 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                                        isHelpOpen
                                            ? 'bg-accent border-accent text-white shadow-accent/20'
                                            : 'bg-surface border-border/60 hover:border-accent/40 text-text-muted hover:text-accent'
                                    }`}
                                >
                                    <BookOpen size={14} />
                                    Aide
                                </button>

                                {/* Import JSON */}
                                <button
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="flex items-center gap-3 px-6 py-3.5 bg-surface border border-border/60 hover:border-accent/40 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-text-muted hover:text-accent shadow-sm"
                                >
                                    <FileJson size={14} />
                                    Import JSON
                                </button>

                                {/* Badge de contexte */}
                                <div className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                    isSkillContext
                                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                                        : 'bg-accent/10 border-accent/20 text-accent'
                                }`}>
                                    {isSkillContext ? 'Accréditation Helix' : 'Quiz Standard'}
                                </div>
                            </div>
                        </div>

                        {/* Erreur globale */}
                        {error && (
                            <div className="flex items-start gap-4 p-6 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] text-rose-400 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <p className="text-[11px] font-black uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        {/* Formulaire */}
                        <div className="bg-surface/20 backdrop-blur-3xl border border-border/40 p-1 rounded-[3rem] shadow-2xl">
                            <div className="p-8 md:p-12">
                                <QuestionForm
                                    initialData={{
                                        module_id: initialModuleId || null,
                                        skill_id:  initialSkillId  || null,
                                        question_text: '',
                                        type: 'multiple_choice',
                                        answers: [
                                            { text: '', isCorrect: true },
                                            { text: '', isCorrect: false },
                                        ],
                                    }}
                                    context={isSkillContext ? 'skill' : 'module'}
                                    onSubmit={handleSubmit}
                                    isSubmitting={isSubmitting}
                                    buttonText="Déployer la question"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <footer className="flex justify-center pt-6 border-t border-border/20">
                            <div className="flex items-center gap-2 opacity-20">
                                <Sparkles size={12} />
                                <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">
                                    Evaluation Core v2.1
                                </p>
                                <Zap size={12} />
                            </div>
                        </footer>
                    </div>
                </div>

                {/* ── Panneau d'aide latéral droit ──────────────────────────── */}
                <div className={`shrink-0 border-l border-border/40 bg-surface/60 backdrop-blur-xl transition-all duration-500 overflow-hidden ${
                    isHelpOpen ? 'w-[380px]' : 'w-0'
                }`}>
                    {isHelpOpen && (
                        <div className="w-[380px] h-full animate-in slide-in-from-right-4 duration-500">
                            <HelpPanel onClose={() => setIsHelpOpen(false)} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
