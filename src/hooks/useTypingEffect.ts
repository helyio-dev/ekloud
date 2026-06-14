import { useState, useEffect } from 'react';

// simule un effet de frappe naturel en révélant le texte mot par mot
export function useTypingEffect(text: string, speed: number = 30) {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        // si aucun texte n'est fourni, on réinitialise l'état
        if (!text) {
            setDisplayedText('');
            return;
        }

        setDisplayedText('');
        setIsTyping(true);
        
        // on découpe le texte en mots pour l'animation
        const words = text.split(' ');
        let currentWordIndex = 0;

        // intervalle de temps pour afficher chaque mot progressivement
        const intervalId = setInterval(() => {
            if (currentWordIndex < words.length) {
                setDisplayedText((prev) => (prev ? prev + ' ' + words[currentWordIndex] : words[currentWordIndex]));
                currentWordIndex++;
            } else {
                setIsTyping(false);
                clearInterval(intervalId);
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [text, speed]);

    return { displayedText, isTyping };
}
