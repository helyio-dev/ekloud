import React, { createContext, useContext, useEffect, useState } from 'react';

// listes des palettes et modes visuels supportés par ekloud
export type ThemePalette = 'normal' | 'amoled' | 'nebula' | 'aurora' | 'sunset' | 'ocean' | 'sakura' | 'hacker' | 'midnight' | 'lava' | 'cyber' | 'coffee' | 'mint' | 'lavender' | 'slate' | 'rose';
export type ThemeMode = 'dark' | 'light';

/**
 * interface du service de thématisation globale.
 */
interface ThemeContextType {
    palette: ThemePalette;
    mode: ThemeMode;
    setPalette: (palette: ThemePalette) => void;
    toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * fournisseur du contexte de thème.
 * gère la persistance locale et l'application des classes css sur le document.
 */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    // initialisation de la palette (défaut: nebula)
    const [palette, setPaletteState] = useState<ThemePalette>(() => {
        return (localStorage.getItem('theme-palette') as ThemePalette) || 'nebula';
    });

    // initialisation du mode (défaut: dark)
    const [mode, setMode] = useState<ThemeMode>(() => {
        return (localStorage.getItem('theme-mode') as ThemeMode) || 'dark';
    });

    // synchronisation des classes css racine
    useEffect(() => {
        const root = window.document.documentElement;
        
        // liste complète des combinaisons possibles pour le nettoyage
        const allPalettes: ThemePalette[] = [
            'normal', 'amoled', 'nebula', 'aurora', 'sunset', 'ocean', 'sakura', 'hacker',
            'midnight', 'lava', 'cyber', 'coffee', 'mint', 'lavender', 'slate', 'rose'
        ];
        const modes: ThemeMode[] = ['dark', 'light'];
        
        // purge des anciennes classes de thèmes
        allPalettes.forEach(p => modes.forEach(m => root.classList.remove(`${p}-${m}`)));

        // application de la nouvelle identité visuelle
        root.classList.add(`${palette}-${mode}`);
        
        // support standard de la classe .dark
        if (mode === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // sauvegarde des préférences dans le stockage local
        localStorage.setItem('theme-palette', palette);
        localStorage.setItem('theme-mode', mode);
    }, [palette, mode]);

    const setPalette = (newPalette: ThemePalette) => {
        setPaletteState(newPalette);
    };

    const toggleMode = () => {
        setMode(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={{ palette, mode, setPalette, toggleMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

/**
 * hook personnalisé pour consommer le système de thèmes.
 */
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme doit être utilisé au sein d\'un ThemeProvider');
    return context;
};
