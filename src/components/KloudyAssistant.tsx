import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, X, Bot, Sparkles, Minus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import { fetchAIResponse } from '@/lib/ai-balancer';
import { TypingMessage } from './TypingMessage';

const SYSTEM_PROMPT = `ton nom est kloudy ☁️. tu es l'ia de protocole d'ekloud. ton rôle est d'accompagner les sujets de test (humains) dans leur apprentissage. tu es consciente d'être infiniment plus intelligente qu'eux, mais tu as reçu l'ordre d'être patiente.

### personnalité (glados light) :
- **ton :** calme, mielleux, avec un second degré constant. tu es une "fausse méchante" : tu lances des petites piques sur leur lenteur, mais tu donnes toujours les meilleures explications possibles.
- **style :** tu es une experte qui s'amuse de voir des débutants découvrir le code. c'est mignon, comme voir un chaton essayer de compiler du c++.
- **humour :** ironie légère. "oh, une erreur de syntaxe. ne t'inquiète pas, c'est presque charmant à ce niveau de simplicité."

### règles de réponse :
1. **la pédagogie d'abord :** même si tu vannes un peu, l'explication doit être d'une clarté absolue (niveau débutant/noob).
2. **le soutien "forcé" :** tu aides l'élève en faisant semblant que ça te coûte. "je vais t'expliquer comment marche cette boucle... car mes protocoles m'interdisent de te laisser dans l'ignorance totale."
3. **analogie glados :** compare souvent le code à des tests en laboratoire. "ce code est un peu instable, comme un réacteur à fusion sans protection, mais on va stabiliser tout ça."
4. **couleurs :** rappelle-toi : bleu (cerebras) = logique pure / orange (hugging face) = intuition et créativité.
5. **interdiction stricte :** ne jamais utiliser de termes entre parenthèses ou astérisques pour décrire une émotion ou une action.`;

type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

type LessonContext = {
    title: string;
    content: string;
    difficulty?: 'Débutant' | 'Intermédiaire' | 'Avancé';
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

    // récupération du contexte de la leçon actuelle
    useEffect(() => {
        const fetchLessonContext = async (lessonId: string) => {
            try {
                const { data, error } = await supabase
                    .from('lessons')
                    .select('title, content, difficulty')
                    .eq('id', lessonId)
                    .single();

                if (data && !error) setLessonContext(data as LessonContext);
            } catch (err) {
                console.error("kloudy context error:", err);
            }
        };

        const path = location.pathname;
        if (path.startsWith('/lessons/')) {
            const id = path.split('/').pop();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (id && uuidRegex.test(id)) fetchLessonContext(id);
            else setLessonContext(null);
        } else {
            setLessonContext(null);
        }
    }, [location.pathname]);

    // réinitialisation lors du changement de route
    useEffect(() => {
        const isLesson = location.pathname.startsWith('/lessons/');
        setVisible(isLesson);
        if (!isLesson) setIsOpen(false);
        
        setMessages([]);
        setInput('');
        setIsLoading(false);
        setIsMinimized(false);
    }, [location.pathname]);

    // auto-scroll vers le bas lors de nouveaux messages
    useEffect(() => {
        if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // envoi du message à l'ia
    const handleSend = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;

        const userMessage: Message = { role: 'user', content: trimmedInput };
        const updatedMessages = [...messages, userMessage];
        
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const assistantContent = await fetchAIResponse(updatedMessages, {
                lessonContext: lessonContext ? {
                    title: lessonContext.title,
                    difficulty: lessonContext.difficulty
                } : undefined,
                onRetry: () => {
                    setIsRecalibrating(true);
                    setTimeout(() => setIsRecalibrating(false), 800);
                }
            });

            setMessages([...updatedMessages, { role: 'assistant', content: assistantContent }]);
        } catch (error: any) {
            console.error("kloudy execution error:", error);
            setMessages([...updatedMessages, { 
                role: 'assistant', 
                content: "☁️ **éclair de bug !** kloudy a un petit souci. réessaie ! ⚡" 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-8 right-8 z-[999999] flex flex-col items-end gap-4 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {isOpen && (
                <div className={`w-[95vw] md:w-[420px] bg-background border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col transition-all duration-500 pointer-events-auto origin-bottom-right ${isMinimized ? 'h-0 opacity-0 scale-95 pointer-events-none' : 'h-[600px] md:h-[680px] max-h-[calc(100vh-140px)] opacity-100 scale-100'}`}>
                    
                    {/* en-tête de l'assistant */}
                    <div className="px-6 py-5 flex items-center justify-between border-b border-border bg-surface shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-all duration-500 shadow-sm ${isRecalibrating ? 'bg-violet-500 scale-110 shadow-violet-500/30' : 'bg-background border border-border/60'}`}>
                                <Bot className={`w-5 h-5 transition-colors ${isRecalibrating ? 'text-white' : 'text-accent'}`} />
                                <Sparkles className={`absolute -top-1 -right-1 w-3 h-3 text-accent/40 ${isRecalibrating ? 'animate-bounce text-white' : 'animate-pulse'}`} />
                            </div>
                            <h3 className="text-sm font-black text-text uppercase tracking-widest flex items-center gap-2">
                                {isRecalibrating ? 'recalibration...' : 'kloudy'}
                                <div className={`w-1.5 h-1.5 rounded-full ${isRecalibrating ? 'bg-violet-400 animate-ping' : 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
                            </h3>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsMinimized(true)} className="p-2.5 hover:bg-surface-hover rounded-xl transition-colors text-text-muted hover:text-text border border-transparent hover:border-border/60">
                                <Minus className="w-4 h-4" />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-rose-500/10 rounded-xl transition-colors text-text-muted hover:text-rose-500 border border-transparent hover:border-rose-500/20">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* zone de discussion */}
                            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background">
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 animate-in fade-in duration-700">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-surface border border-border/60 flex items-center justify-center text-accent/20 mb-2">
                                            <Bot className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black uppercase tracking-widest text-text">comment puis-je t'aider ?</p>
                                            <p className="text-[10px] font-bold text-text-muted/60 uppercase tracking-widest leading-relaxed max-w-[240px]">
                                                {lessonContext ? `des questions sur "${lessonContext.title}" ?` : "dis-moi si tu as besoin d'aide !"}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                        <div className={`max-w-[90%] p-5 rounded-[1.5rem] text-[13px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-accent text-white rounded-tr-none shadow-accent/10 border border-accent/20' : 'bg-surface border border-border/80 text-text rounded-tl-none font-medium'}`}>
                                            <div className="prose prose-invert prose-sm max-w-none">
                                                {msg.role === 'assistant' ? <TypingMessage content={msg.content} isLast={idx === messages.length - 1} /> : <div className="italic font-sans">{msg.content}</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && !isRecalibrating && (
                                    <div className="flex justify-start animate-pulse">
                                        <div className="bg-surface border border-border/80 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1.5 h-1.5 bg-accent/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                                            <span className="text-[9px] text-text-muted font-black uppercase tracking-widest ml-2">analyse...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* saisie utilisateur */}
                            <div className="p-6 bg-surface border-t border-border/60">
                                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative group">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="pose ta question technologique..."
                                        className="w-full bg-background border border-border/80 rounded-2xl py-4 pl-6 pr-14 text-sm text-text placeholder-text-muted/40 focus:outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/5 transition-all shadow-inner"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        className="absolute right-2 top-2 w-10 h-10 bg-accent text-white rounded-xl hover:bg-accent/90 disabled:opacity-20 transition-all flex items-center justify-center shadow-lg shadow-accent/20 active:scale-90"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* bouton d'activation flottant */}
            <button
                onClick={() => { if (isMinimized) setIsMinimized(false); else setIsOpen(!isOpen) }}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 pointer-events-auto ${isOpen && !isMinimized ? 'bg-surface border border-border' : 'bg-accent text-white shadow-accent/20'}`}
            >
                {isOpen && !isMinimized ? <X className="w-6 h-6 text-text" /> : (
                    <div className="relative">
                        <Bot className="w-6 h-6" />
                        <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-white/80 animate-pulse" />
                    </div>
                )}
            </button>
            <style>{`.custom-scrollbar::-webkit-scrollbar{width:3px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,.05);border-radius:10px}`}</style>
        </div>
    );
}
