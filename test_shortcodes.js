const COLOR_MAP = {
    indigo: '#818cf8',
    vert: '#22c55e',
    rouge: '#ef4444',
    jaune: '#eab308',
};

const BG_MAP = {
    'bg-indigo': 'background-color: rgba(129, 138, 248, 0.15); border-radius: 6px; padding: 2px 6px',
    'bg-vert': 'background-color: rgba(34, 197, 94, 0.15); border-radius: 6px; padding: 2px 6px',
    'bg-rouge': 'background-color: rgba(239, 68, 68, 0.15); border-radius: 6px; padding: 2px 6px',
    'bg-jaune': 'background-color: rgba(234, 179, 8, 0.15); border-radius: 6px; padding: 2px 6px',
};

function parseShortcodes(text) {
    if (!text) return '';
    return text.replace(/\[\[([\w-]+):(?:([\w-]+):)?(.*?)\]\]/g, (match, key1, key2, content) => {
        let style = '';
        let innerStyle = '';
        if (BG_MAP[key1]) style = BG_MAP[key1];
        else if (COLOR_MAP[key1]) style = `color: ${COLOR_MAP[key1]}`;
        if (key2) {
            if (BG_MAP[key2]) innerStyle = BG_MAP[key2];
            else if (COLOR_MAP[key2]) innerStyle = `color: ${COLOR_MAP[key2]}`;
        }
        if (style && innerStyle) {
            return `<span style="${style}"><span style="${innerStyle}">${content}</span></span>`;
        } else if (style) {
            return `<span style="${style}">${content}</span>`;
        }
        return match;
    });
}

console.log('Single:', parseShortcodes('[[rouge:Mon texte]]'));
console.log('Combined:', parseShortcodes('[[bg-jaune:rouge:Mon texte]]'));
console.log('Reverse Combined:', parseShortcodes('[[rouge:bg-jaune:Mon texte]]'));
