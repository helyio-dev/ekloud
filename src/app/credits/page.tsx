import { useMemo } from 'react';
import { Heart, Shield, Terminal, Zap, ChevronRight, Sparkles } from 'lucide-react';

/**
 * ekloud credits system // studio master list.
 * une architecture d'information épurée et hautement lisible.
 */
export default function CreditsPage() {
    const creditsRegistry = [
        {
            category: "infrastructure",
            items: [
                { role: "moteur de données & auth", name: "supabase", link: "https://supabase.com/" },
                { role: "réseau edge & sécurité", name: "cloudflare", link: "https://cloudflare.com/" }
            ]
        },
        {
            category: "cœur applicatif",
            items: [
                { role: "ui framework", name: "react ecosystem", link: "https://react.dev/" },
                { role: "build engine", name: "vite js", link: "https://vitejs.dev/" },
                { role: "type safety protocol", name: "typescript", link: "https://typescriptlang.org/" }
            ]
        },
        {
            category: "système visuel",
            items: [
                { role: "styling framework", name: "tailwind css", link: "https://tailwindcss.com/" },
                { role: "iconographic engine", name: "lucide react", link: "https://lucide.dev/" },
                { role: "graph logic engine", name: "dagre engine", link: "https://github.com/dagrejs/dagre" }
            ]
        }
    ];

    /**
     * constellation stellaire (180 points).
     */
    const nightSkyStars = useMemo(() => Array.from({ length: 180 }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.3,
        delay: Math.random() * 10,
        duration: Math.random() * 6 + 4,
    })), []);

    /**
     * météores orbitaux (15 points).
     */
    const meteors = useMemo(() => Array.from({ length: 15 }).map(() => ({
        top: -30 + Math.random() * -30,
        left: Math.random() * 100 + 40,
        delay: Math.random() * 12,
        duration: Math.random() * 3 + 1.5,
    })), []);

    return (
        <div className="min-h-screen bg-background text-text flex flex-col relative overflow-hidden pb-48 font-sans lowercase selection:bg-accent/40 selection:text-white">
            {/* background immersif nebula */}
            <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
                {nightSkyStars.map((star, i) => (
                    <div 
                        key={`star-${i}`}
                        className="absolute rounded-full bg-accent dark:bg-white animate-twinkle opacity-30"
                        style={{
                            left: `${star.x}%`,
                            top: `${star.y}%`,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            animationDelay: `${star.delay}s`,
                            animationDuration: `${star.duration}s`
                        }}
                    />
                ))}
            </div>

            {/* météores orbitaux */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
                {meteors.map((meteor, i) => (
                    <div 
                        key={`meteor-${i}`}
                        className="absolute origin-left animate-shooting-star"
                        style={{
                            top: `${meteor.top}%`,
                            left: `${meteor.left}%`,
                            animationDelay: `${meteor.delay}s`,
                            animationDuration: `${meteor.duration}s`
                        }}
                    >
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-[1px] bg-accent dark:bg-white rounded-full z-10 opacity-40"></div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[0.5px] bg-gradient-to-r from-accent/30 dark:from-white/30 to-transparent"></div>
                    </div>
                ))}
            </div>

            <main className="max-w-4xl mx-auto px-6 md:px-12 pt-40 w-full relative z-10 flex-1 flex flex-col items-center">
                {/* header ultra-lisible */}
                <header className="mb-48 text-center">
                    <h1 className="text-8xl md:text-[12rem] font-black uppercase tracking-tighter italic font-equinox leading-none text-text dark:text-white drop-shadow-2xl">
                        crédits
                    </h1>
                    <p className="mt-12 text-[11px] font-black uppercase tracking-[0.6em] text-accent italic opacity-60">
                        ekloud tech registry // v3.8.2
                    </p>
                </header>

                {/* liste maîtresse des crédits (une seule colonne, lisibilité maximale) */}
                <div className="w-full space-y-40">
                    {creditsRegistry.map((group, groupIndex) => (
                        <section 
                            key={group.category} 
                            className="animate-in fade-in slide-in-from-bottom-12 fill-mode-both"
                            style={{ animationDelay: `${200 + (groupIndex * 150)}ms` }}
                        >
                            <div className="flex items-center gap-6 mb-12">
                                <h2 className="text-[13px] font-black uppercase tracking-[0.5em] text-accent italic whitespace-nowrap">
                                    {group.category}
                                </h2>
                                <div className="h-px w-full bg-border/20"></div>
                            </div>

                            <div className="space-y-10">
                                {group.items.map((item) => (
                                    <a 
                                        key={item.name} 
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex flex-col md:flex-row md:items-baseline justify-between py-4 border-b border-border/10 hover:border-accent/40 transition-all duration-300"
                                    >
                                        <span className="text-3xl md:text-5xl font-black text-text group-hover:text-accent italic tracking-tighter uppercase transition-colors">
                                            {item.name}
                                        </span>
                                        <div className="flex items-center gap-4 mt-2 md:mt-0">
                                            <span className="text-[11px] font-bold tracking-widest text-text-muted/40 uppercase group-hover:text-text-muted transition-colors">
                                                {item.role}
                                            </span>
                                            <ChevronRight size={14} className="text-text-muted/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {/* footer simple et efficace */}
                <footer className="mt-60 pt-40 border-t border-border/10 w-full text-center animate-in fade-in duration-1000 fill-mode-both" style={{ animationDelay: '1s' }}>
                    <div className="flex flex-col items-center gap-12">
                        <Heart className="w-12 h-12 text-rose-500/80 animate-pulse" />
                        
                        <p className="text-xl md:text-3xl font-black text-text-muted/20 uppercase tracking-tighter italic leading-tight max-w-2xl px-6">
                            reconnaissance éternelle envers la communauté open-source et les bâtisseurs du web moderne.
                        </p>

                        <div className="flex items-center justify-center gap-8 pt-8">
                            <Sparkles size={16} className="text-accent opacity-20" />
                            <div className="px-14 py-6 bg-accent border border-accent rounded-full text-[12px] font-black uppercase tracking-[0.5em] text-background hover:bg-background hover:text-accent transition-all duration-500 cursor-default shadow-2xl shadow-accent/20">
                                merci
                            </div>
                            <Sparkles size={16} className="text-accent opacity-20 rotate-45" />
                        </div>

                        <div className="pt-24 flex items-center gap-4 opacity-5 pointer-events-none scale-75 md:scale-100 italic">
                            <Terminal size={14} />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] font-mono">ekloud credits certified protocol // 2026</span>
                            <Shield size={14} />
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
