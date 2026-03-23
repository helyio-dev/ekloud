import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePalette = 'normal' | 'amoled' | 'nebula' | 'aurora' | 'sunset' | 'ocean' | 'sakura' | 'hacker' | 'midnight' | 'lava' | 'cyber' | 'coffee' | 'mint' | 'lavender' | 'slate' | 'rose';
export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
    palette: ThemePalette;
    mode: ThemeMode;
    setPalette: (palette: ThemePalette) => void;
    toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [palette, setPaletteState] = useState<ThemePalette>(() => {
        return (localStorage.getItem('theme-palette') as ThemePalette) || 'nebula';
    });

    const [mode, setMode] = useState<ThemeMode>(() => {
        return (localStorage.getItem('theme-mode') as ThemeMode) || 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        // Remove all possible theme classes (all palettes × modes)
        const allPalettes: ThemePalette[] = [
            'normal', 'amoled', 'nebula', 'aurora', 'sunset', 'ocean', 'sakura', 'hacker',
            'midnight', 'lava', 'cyber', 'coffee', 'mint', 'lavender', 'slate', 'rose'
        ];
        const modes: ThemeMode[] = ['dark', 'light'];
        allPalettes.forEach(p => modes.forEach(m => root.classList.remove(`${p}-${m}`)));

        root.classList.add(`${palette}-${mode}`);
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

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
