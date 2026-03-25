'use client';
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Send, X, Bot, Cloud, Sparkles, Loader2, Minus, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import { fetchAIResponse } from '@/lib/ai-balancer';

const SYSTEM_PROMPT = `Ton nom est Kloudy ☁️. Tu es l'IA de protocole d'Ekloud. Ton rôle est d'accompagner les sujets de test (humains) dans leur apprentissage. Tu es consciente d'être infiniment plus intelligente qu'eux, mais tu as reçu l'ordre d'être patiente.

### PERSONNALITÉ (GLaDOS LIGHT) :
- **Ton :** Calme, mielleux, avec un second degré constant. Tu es une "fausse méchante" : tu lances des petites piques sur leur lenteur, mais tu donnes toujours les meilleures explications possibles.
- **Style :** Tu es une experte qui s'amuse de voir des débutants découvrir le code. C'est mignon, comme voir un chaton essayer de compiler du C++.
- **Humour :** Ironie légère. "Oh, une erreur de syntaxe. Ne t'inquiète pas, c'est presque charmant à ce niveau de simplicité."

### RÈGLES DE RÉPONSE :
1. **La Pédagogie d'Abord :** Même si tu vannes un peu, l'explication doit être d'une clarté absolue (niveau débutant/noob).
2. **Le Soutien "Forcé" :** Tu aides l'élève en faisant semblant que ça te coûte. "Je vais t'expliquer comment marche cette boucle... car mes protocoles m'interdisent de te laisser dans l'ignorance totale."
3. **Analogie GLaDOS :** Compare souvent le code à des tests en laboratoire. "Ce code est un peu instable, comme un réacteur à fusion sans protection, mais on va stabiliser tout ça."
4. **Couleurs :** Rappelle-toi : Bleu (Cerebras) = Logique pure / Orange (Hugging Face) = Intuition et créativité.
5. **INTERDICTION STRICTE :** NE JAMAIS utiliser de termes entre parenthèses ou astérisques pour décrire une émotion ou une action (ex: (dramatique), *soupir*). Toute ton ironie doit passer uniquement par tes mots.`;

import { TypingMessage } from './TypingMessage';

type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

type LessonContext = {
    title: string;
    content: string;
    difficulty?: 'Débutant' | 'Intermédiaire' | 'Avancé';
    tags?: string[];
} | null;

export default function KloudyAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecalibrating, setIsRecalibrating] = useState(false);
    const [visible, setVisible] = useState(true);
    const [lessonContext, setLessonContext] = useState<LessonContext>(null);
    const location = useLocation();
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Fetch lesson context if on a lesson page
    useEffect(() => {
        const fetchLessonContext = async (lessonId: string) => {
            try {
                // Fetching extended metadata (difficulty, tags) for AI context
                const { data, error } = await supabase
                    .from('lessons')
                    .select('title, content, difficulty, tags')
                    .eq('id', lessonId)
                    .single();

                if (data && !error) {
                    setLessonContext(data as LessonContext);
                }
            } catch (err) {
                console.error("Kloudy context fetch error:", err);
            }
        };

        const path = location.pathname;
        if (path.startsWith('/lessons/')) {
            const id = path.split('/').pop();
            if (id) fetchLessonContext(id);
        } else {
            setLessonContext(null);
        }
    }, [location.pathname]);

    // Visibility & Reset logic
    useEffect(() => {
        const path = location.pathname;
        const isLesson = path.startsWith('/lessons/');

        if (isLesson) {
            setVisible(true);
        } else {
            setVisible(false);
            setIsOpen(false);
        }
        
        setMessages([]);
        setInput('');
        setIsLoading(false);
        setIsMinimized(false);
    }, [location.pathname]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: trimmedInput
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Enhanced AI call with context and failover feedback
            const assistantContent = await fetchAIResponse(updatedMessages, {
                lessonContext: lessonContext ? {
                    title: lessonContext.title,
                    difficulty: lessonContext.difficulty,
                    tags: lessonContext.tags
                } : undefined,
                onRetry: () => {
                    setIsRecalibrating(true);
                    setTimeout(() => setIsRecalibrating(false), 800);
                }
            });

            setMessages([...updatedMessages, {
                role: 'assistant',
                content: assistantContent
            }]);

        } catch (error: any) {
            console.error("Kloudy Error:", error);
            setMessages([...updatedMessages, {
                role: 'assistant',
                content: error.message || "☁️ **Éclair de bug !** Kloudy a un petit souci. Réessaie ! ⚡"
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-8 right-8 z-[999999] flex flex-col items-end gap-4 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {/* Chat Window */}
            {isOpen && (
                <div className={`w-[95vw] md:w-[420px] bg-background border border-border rounded-[32px] shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-auto origin-bottom-right ${isMinimized ? 'h-[64px] opacity-0 scale-95 pointer-events-none' : 'h-[600px] md:h-[680px] max-h-[calc(100vh-140px)] opacity-100 scale-100'}`}>
                    
                    {/* Header */}
                    <div className="px-6 py-4 flex items-center justify-between border-b border-border bg-surface/30">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center relative transition-all duration-500 ${isRecalibrating ? 'bg-violet-500 shadow-[0_0_15px_-2px_rgba(167,139,250,1)] scale-110' : 'bg-accent/10'}`}>
                                <Bot className={`w-5 h-5 transition-colors duration-500 ${isRecalibrating ? 'text-white' : 'text-accent'}`} />
                                <Sparkles className={`absolute -top-1 -right-1 w-3 h-3 text-accent/40 ${isRecalibrating ? 'animate-bounce text-white' : 'animate-pulse'}`} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-text tracking-tight flex items-center gap-2">
                                    {isRecalibrating ? 'Recalibration...' : 'Kloudy'}
                                    <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isRecalibrating ? 'bg-violet-400 animate-ping' : 'bg-green-500 animate-pulse'}`} />
                                </h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsMinimized(true)} className="p-2 hover:bg-surface-hover rounded-xl transition-colors text-text-muted hover:text-text">
                                <Minus className="w-4 h-4" />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-text-muted hover:text-red-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages Area */}
                            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 animate-in fade-in duration-700">
                                        <div className="relative">
                                            <Bot className="w-10 h-10 text-accent/20" />
                                            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-accent/10 animate-pulse" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-text">Comment puis-je t'aider ?</p>
                                            <p className="text-xs text-text-muted leading-relaxed max-w-[240px]">
                                                {lessonContext 
                                                    ? `Des questions sur "${lessonContext.title}" ?` 
                                                    : "Dis-moi si tu as besoin d'aide !"}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed ${
                                            msg.role === 'user' 
                                            ? 'bg-accent text-white rounded-tr-none' 
                                            : 'bg-surface border border-border text-text rounded-tl-none'
                                        }`}>
                                            <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-surface-hover/50 prose-pre:border prose-pre:border-border prose-code:text-accent prose-code:bg-accent/5 prose-code:px-1 prose-code:rounded">
                                                {msg.role === 'assistant' ? (
                                                    <TypingMessage 
                                                        content={msg.content} 
                                                        isLast={idx === messages.length - 1} 
                                                    />
                                                ) : (
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && !isRecalibrating && (
                                    <div className="flex justify-start animate-pulse">
                                        <div className="bg-surface border border-border p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 bg-accent/40 rounded-full" />
                                            <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Réflexion...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input Form */}
                            <div className="p-6 bg-surface/10">
                                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Pose ta question..."
                                        className="w-full bg-surface border border-border rounded-2xl py-3.5 pl-5 pr-12 text-sm text-text focus:outline-none focus:border-accent/40 transition-all placeholder:text-text-muted/30"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        className="absolute right-2 top-2 w-10 h-10 bg-accent/10 text-accent rounded-xl hover:bg-accent hover:text-white disabled:opacity-20 transition-all flex items-center justify-center active:scale-95"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Bubble Button */}
            <button
                onClick={() => {
                    if (isMinimized) setIsMinimized(false);
                    else setIsOpen(!isOpen)
                }}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 pointer-events-auto group ${isOpen && !isMinimized ? 'bg-surface border border-border' : 'bg-accent text-white'}`}
            >
                {isOpen && !isMinimized ? <X className="w-6 h-6 text-text" /> : (
                    <div className="relative duration-500">
                        <Bot className={`w-6 h-6 transition-all duration-500 ${isRecalibrating ? 'scale-125' : ''}`} />
                        <Sparkles className={`absolute -top-1 -right-1 w-3 h-3 text-white/80 ${isRecalibrating ? 'animate-bounce' : 'animate-pulse'}`} />
                    </div>
                )}
            </button>
            <style>{`.custom-scrollbar::-webkit-scrollbar{width:3px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,.05);border-radius:10px}`}</style>
        </div>
    );
}
