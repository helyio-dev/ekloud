import { useState } from 'react';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';

interface InlineQuizProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  onAnswered?: () => void;
}

/**
 * mini-exercice inline embarqué dans le contenu d'une leçon.
 * purement indicatif — aucun appel BDD, état local uniquement.
 * appelle onAnswered() une fois que l'utilisateur a sélectionné une réponse.
 */
export default function InlineQuiz({ question, options, correctIndex, explanation, onAnswered }: InlineQuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const isCorrect = answered && selected === correctIndex;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    onAnswered?.();
  };

  return (
    <div className="my-12 rounded-[2rem] border border-accent/20 bg-accent/5 overflow-hidden not-prose">
      {/* header */}
      <div className="flex items-center gap-3 px-8 py-5 border-b border-accent/10 bg-accent/5">
        <HelpCircle className="w-5 h-5 text-accent shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">
          vérification rapide
        </span>
      </div>

      <div className="px-8 py-7 space-y-6">
        {/* question */}
        <p className="text-lg font-black text-text leading-snug uppercase tracking-tight">
          {question}
        </p>

        {/* options */}
        <div className="grid gap-3">
          {options.map((option, idx) => {
            const isSelected = selected === idx;
            const isRight = idx === correctIndex;

            let style = 'border-border/60 bg-background text-text-muted hover:border-accent/40 hover:text-text hover:bg-accent/5 cursor-pointer';

            if (answered) {
              if (isSelected && isCorrect)        style = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 cursor-default';
              else if (isSelected && !isCorrect)  style = 'border-rose-500/50 bg-rose-500/10 text-rose-400 cursor-default';
              else if (isRight)                   style = 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500/70 cursor-default';
              else                                style = 'border-border/20 bg-background/50 text-text-muted/30 opacity-50 cursor-default';
            }

            return (
              <button
                key={idx}
                disabled={answered}
                onClick={() => handleSelect(idx)}
                className={`w-full flex items-center justify-between gap-4 px-6 py-4 rounded-xl border text-left transition-all duration-200 text-sm font-bold ${style}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${
                    isSelected
                      ? isCorrect
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-rose-500 border-rose-500 text-white'
                      : answered && isRight
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'border-border/60 text-text-muted/60'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-snug">{option}</span>
                </div>

                <div className="shrink-0">
                  {answered && isSelected && (
                    isCorrect
                      ? <CheckCircle className="w-5 h-5 text-emerald-500 animate-in zoom-in duration-300" />
                      : <XCircle className="w-5 h-5 text-rose-500 animate-in zoom-in duration-300" />
                  )}
                  {answered && !isSelected && isRight && (
                    <CheckCircle className="w-5 h-5 text-emerald-500/60" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* feedback après réponse */}
        {answered && (
          <div className={`rounded-xl border px-5 py-4 animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-1 ${
            isCorrect
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              {isCorrect
                ? <><CheckCircle className="w-4 h-4 shrink-0" /> bonne réponse !</>
                : <><XCircle className="w-4 h-4 shrink-0" /> mauvaise réponse</>
              }
            </div>
            {!isCorrect && (
              <p className="text-sm font-semibold opacity-80">
                La bonne réponse était : <span className="font-black">{options[correctIndex]}</span>
              </p>
            )}
            {explanation && (
              <p className="text-sm font-medium opacity-70 pt-1 border-t border-current/10 mt-2">
                {explanation}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
