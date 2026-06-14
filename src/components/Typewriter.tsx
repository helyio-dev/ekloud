

import { useState, useEffect } from 'react';

// interface définissant les propriétés du composant d'animation de texte
interface TypewriterProps {
    words: string[];
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseTime?: number;
}

export default function Typewriter({
    words,
    typingSpeed = 100,
    deletingSpeed = 50,
    pauseTime = 2000
}: TypewriterProps) {
    // états gérant la rotation des mots et l'effet visuel de frappe
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const word = words[currentWordIndex];
        let timer: NodeJS.Timeout;

        // contrôle de l'animation d'écriture et de suppression
        if (isDeleting) {
            timer = setTimeout(() => {
                setCurrentText(word.substring(0, currentText.length - 1));
            }, deletingSpeed);
        } else {
            timer = setTimeout(() => {
                setCurrentText(word.substring(0, currentText.length + 1));
            }, typingSpeed);
        }

        // passage au mot suivant ou attente une fois qu'un mot est complet
        if (!isDeleting && currentText === word) {
            timer = setTimeout(() => setIsDeleting(true), pauseTime);
        } else if (isDeleting && currentText === '') {
            setIsDeleting(false);
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }

        return () => clearTimeout(timer);
    }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, pauseTime]);

    return (
        <span className="text-accent min-h-[1.5em] inline-block">
            {currentText}
            <span className="ml-1 border-r-2 border-accent animate-pulse" />
        </span>
    );
}
