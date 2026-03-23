import { useState, useEffect } from 'react';

/**
 * Simulates a natural typing effect by revealing text word by word.
 */
export function useTypingEffect(text: string, speed: number = 30) {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (!text) {
            setDisplayedText('');
            return;
        }

        setDisplayedText('');
        setIsTyping(true);
        
        const words = text.split(' ');
        let currentWordIndex = 0;

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
