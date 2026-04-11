const COLOR_MAP: Record<string, string> = {
    indigo: '#818cf8',
    vert: '#22c55e',
    rouge: '#ef4444',
    jaune: '#eab308',
};

const BG_MAP: Record<string, string> = {
    'bg-indigo': 'background-color: rgba(129, 138, 248, 0.15); border-radius: 6px; padding: 2px 6px',
    'bg-vert': 'background-color: rgba(34, 197, 94, 0.15); border-radius: 6px; padding: 2px 6px',
    'bg-rouge': 'background-color: rgba(239, 68, 68, 0.15); border-radius: 6px; padding: 2px 6px',
    'bg-jaune': 'background-color: rgba(234, 179, 8, 0.15); border-radius: 6px; padding: 2px 6px',
};

/**
 * analyse les shortcodes personnalisés [[color:text]] ou [[bg-color:text]] en balises span html.
 * prend en charge l'imbrication comme [[bg-jaune:[[rouge:text]]]].
 */
export function parseShortcodes(text: string): string {
    if (!text) return '';
    
    let result = text;
    const regex = /\[\[([\w-]+):(.*?)\]\]/g;
    
    // on exécute le remplacement plusieurs fois pour gérer l'imbrication de l'intérieur vers l'extérieur.
    // passe 1 : [[rouge:text]] -> <span...>text</span>
    // passe 2 : [[bg-jaune:<span...>text</span>]] -> <span...><span...>text</span></span>
    let iterations = 0;
    while (iterations < 5) {
        const next = result.replace(regex, (match, key, content) => {
            if (BG_MAP[key]) {
                return `<span style="${BG_MAP[key]}">${content}</span>`;
            }
            if (COLOR_MAP[key]) {
                return `<span style="color: ${COLOR_MAP[key]}">${content}</span>`;
            }
            return match;
        });
        
        if (next === result) break;
        result = next;
        iterations++;
    }
    
    return result;
}
