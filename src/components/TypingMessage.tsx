import { useTypingEffect } from '@/hooks/useTypingEffect';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { CheckCircle, ChevronRight, AlertCircle, Info, Lightbulb, AlertTriangle } from 'lucide-react';

interface TypingMessageProps {
    content: string;
    isLast: boolean;
}

export function TypingMessage({ content, isLast }: TypingMessageProps) {
    // animer uniquement le tout dernier message pour maintenir les performances et la lisibilité
    const { displayedText } = useTypingEffect(content, isLast ? 20 : 0);
    
    // s'assurer que les alertes de style github sont reconnaissables comme des blockquotes
    const textToRender = (isLast ? displayedText : content)
        .replace(/^> ?\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\]\r?\n>\r?\n/gim, '> [!$1]\n> ')
        .replace(/^> ?\[!/gim, '> [!');

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeRaw]}
            components={{
                blockquote: ({ children }) => {
                    const alertTypes = {
                        IMPORTANT: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: <AlertCircle className="w-5 h-5" /> },
                        NOTE: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: <Info className="w-5 h-5" /> },
                        TIP: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <Lightbulb className="w-5 h-5" /> },
                        WARNING: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <AlertTriangle className="w-5 h-5" /> },
                        CAUTION: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: <AlertCircle className="w-5 h-5" /> },
                    };

                    const getText = (nodes: any): string => {
                        if (!nodes) return '';
                        if (typeof nodes === 'string') return nodes;
                        if (Array.isArray(nodes)) return nodes.map(getText).join(' ');
                        if (nodes.props?.children) return getText(nodes.props.children);
                        return '';
                    };

                    const fullText = getText(children).trim();
                    const match = fullText.match(/\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\]/i);
                    
                    if (match && fullText.indexOf(match[0]) < 5) {
                        const type = match[1].toUpperCase() as keyof typeof alertTypes;
                        const config = alertTypes[type];
                        
                        const cleanMarker = (nodes: any): any => {
                            if (!nodes) return nodes;
                            if (typeof nodes === 'string') {
                                return nodes.replace(/^(\s*)\[!(IMPORTANT|NOTE|TIP|WARNING|CAUTION)\](\s*)/i, '$1');
                            }
                            if (Array.isArray(nodes)) {
                                return nodes.map(node => cleanMarker(node));
                            }
                            if (nodes?.props?.children) {
                                return {
                                    ...nodes,
                                    props: { ...nodes.props, children: cleanMarker(nodes.props.children) }
                                };
                            }
                            return nodes;
                        };

                        return (
                            <div className={`my-4 p-4 rounded-xl border ${config.border} ${config.bg} backdrop-blur-md shadow-lg shadow-black/10 animate-in fade-in slide-in-from-left-2 duration-500 min-w-full`}>
                                <div className={`flex items-center gap-2 mb-2 font-black text-[10px] uppercase tracking-wider ${config.color}`}>
                                    {config.icon}
                                    {type}
                                </div>
                                <div className="text-sm opacity-90 italic leading-relaxed text-text unprose">
                                    {cleanMarker(children)}
                                </div>
                            </div>
                        );
                    }
                    return <blockquote className="border-l-2 border-accent/30 pl-4 my-4 italic opacity-80 text-base">{children}</blockquote>;
                }
            }}
        >
            {textToRender}
        </ReactMarkdown>
    );
}
