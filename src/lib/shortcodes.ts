const COLOR_MAP: Record<string, string> = {
    indigo: '#818cf8',
    vert: '#22c55e',
    rouge: '#ef4444',
    jaune: '#eab308',
};

const BG_MAP: Record<string, string> = {
    'bg-indigo': 'background-color: rgba(129, 138, 248, 0.15); border-radius: 6px; padding: 2px 6px',
    'bg-vert':   'background-color: rgba(34, 197, 94, 0.15); border-radius: 6px; padding: 2px 6px',
    'bg-rouge':  'background-color: rgba(239, 68, 68, 0.15); border-radius: 6px; padding: 2px 6px',
    'bg-jaune':  'background-color: rgba(234, 179, 8, 0.15); border-radius: 6px; padding: 2px 6px',
};

/**
 * analyse les shortcodes [[color:text]] et [[bg-color:text]] en balises span html.
 * ignore les [[check:...]] — gérés séparément.
 */
export function parseShortcodes(text: string): string {
    if (!text) return '';
    let result = text;
    const regex = /\[\[([\w-]+):([^\]]*)\]\]/g;
    let iterations = 0;
    while (iterations < 5) {
        const next = result.replace(regex, (match, key, content) => {
            if (key === 'check') return match;
            if (BG_MAP[key]) return `<span style="${BG_MAP[key]}">${content}</span>`;
            if (COLOR_MAP[key]) return `<span style="color: ${COLOR_MAP[key]}">${content}</span>`;
            return match;
        });
        if (next === result) break;
        result = next;
        iterations++;
    }
    return result;
}

export interface InlineQuizData {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
}

/**
 * Un segment de contenu : soit du markdown brut, soit un quiz.
 */
export type ContentSegment =
    | { type: 'markdown'; content: string }
    | { type: 'quiz'; data: InlineQuizData };

/**
 * Découpe le contenu en segments markdown / quiz.
 *
 * Syntaxe :
 *   [[check:Question|Option A|Option B|Option C|indexBonneReponse]]
 *   [[check:Question|Option A|Option B|Option C|indexBonneReponse|Explication si faux]]
 *
 * Le shortcode doit être seul sur sa ligne (précédé/suivi d'une ligne vide).
 *
 * Exemple :
 *   [[check:C'est quoi une IP ?|Une adresse physique|Une adresse logique|0|
 *   Une IP est une adresse logique qui identifie un appareil sur un réseau.]]
 */
export function splitContentSegments(rawContent: string): ContentSegment[] {
    if (!rawContent) return [];

    // Regex : [[check: suivi de tout jusqu'à ]] — pas de flag s pour éviter les captures multi-lignes involontaires
    // On supporte les sauts de ligne à l'intérieur du shortcode pour les explications longues
    const QUIZ_REGEX = /\[\[check:([\s\S]*?)\]\]/g;

    const segments: ContentSegment[] = [];
    let lastIndex = 0;
    let quizCount = 0;
    let match: RegExpExecArray | null;

    while ((match = QUIZ_REGEX.exec(rawContent)) !== null) {
        const before = rawContent.slice(lastIndex, match.index);
        if (before) {
            segments.push({ type: 'markdown', content: parseShortcodes(before) });
        }

        const inner = match[1];
        const parts = inner.split('|').map(p => p.trim()).filter(Boolean);

        // Minimum : question + 2 options + index = 4 parties
        if (parts.length >= 4) {
            const question = parts[0];
            const lastPart = parts[parts.length - 1];
            const lastAsInt = parseInt(lastPart, 10);
            const secondToLast = parts[parts.length - 2];
            const secondToLastAsInt = parseInt(secondToLast, 10);

            let options: string[];
            let correctIndex: number;
            let explanation: string | undefined;

            if (!isNaN(lastAsInt)) {
                // format simple : question|optA|optB|...|index
                correctIndex = lastAsInt;
                options = parts.slice(1, parts.length - 1);
            } else if (!isNaN(secondToLastAsInt)) {
                // format avec explication : question|optA|optB|...|index|explication
                correctIndex = secondToLastAsInt;
                options = parts.slice(1, parts.length - 2);
                explanation = lastPart;
            } else {
                // format invalide — afficher en brut
                segments.push({ type: 'markdown', content: match[0] });
                lastIndex = match.index + match[0].length;
                continue;
            }

            if (
                question &&
                options.length >= 2 &&
                correctIndex >= 0 &&
                correctIndex < options.length
            ) {
                segments.push({
                    type: 'quiz',
                    data: {
                        id: `quiz-${quizCount++}`,
                        question,
                        options,
                        correctIndex,
                        explanation,
                    },
                });
                lastIndex = match.index + match[0].length;
                continue;
            }
        }

        // shortcode invalide — le laisser en brut
        segments.push({ type: 'markdown', content: match[0] });
        lastIndex = match.index + match[0].length;
    }

    const remaining = rawContent.slice(lastIndex);
    if (remaining) {
        segments.push({ type: 'markdown', content: parseShortcodes(remaining) });
    }

    return segments;
}
