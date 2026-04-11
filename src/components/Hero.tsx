import { Link } from 'react-router-dom';
import Typewriter from './Typewriter';

/**
 * section d'en-tête (hero) de la page d'accueil.
 * affiche le message principal et les actions rapides avec des effets visuels immersifs.
 */
export default function Hero() {
    return (
        <section className="relative pt-20 pb-20 md:pt-40 md:pb-32 px-6 max-w-7xl mx-auto text-center overflow-visible font-sans">
            {/* couches atmosphériques et nappes de lumière pulsantes */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[900px] bg-accent/15 rounded-full blur-[200px] -z-10 opacity-60 animate-pulse pointer-events-none" />
            <div className="absolute top-0 right-[-20%] w-[700px] h-[700px] bg-accent-secondary/10 rounded-full blur-[180px] -z-10 pointer-events-none" />
            
            {/* lignes de force géométriques subtiles */}
            <div className="absolute top-1/3 left-[-10%] w-48 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent -rotate-12 pointer-events-none" />

            {/* contenu principal avec animations d'entrée séquencées */}
            <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out fill-mode-both">
                <header className="space-y-2">
                    <h1 className="text-2xl md:text-5xl font-black tracking-tight leading-none max-w-5xl mx-auto text-text uppercase font-equinox">
                        <span className="text-gradient drop-shadow-[0_0_20px_var(--accent-glow)]">
                            <Typewriter words={["apprendre", "progresser", "maîtriser", "exceller"]} />
                        </span> simplement
                    </h1>

                    <p className="text-xl md:text-3xl text-text-muted/70 max-w-4xl mx-auto leading-relaxed font-bold tracking-tight">
                        des parcours immersifs pour évoluer {' '}
                        <span className="text-accent underline decoration-accent/30 underline-offset-[10px] font-black italic tracking-tighter">
                            <Typewriter words={["à votre rythme.", "sans limites.", "efficacement.", "pas à pas.", "avec passion."]} />
                        </span>
                    </p>
                </header>

                {/* boutons d'action principaux (cta) */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-12 animate-in fade-in zoom-in-95 duration-1000 delay-500 fill-mode-both">
                    <Link
                        to="/signup"
                        className="group relative px-12 py-6 bg-text text-background rounded-2xl font-black text-lg transition-all hover:scale-110 active:scale-95 shadow-2xl overflow-hidden"
                        aria-label="commencer l'aventure"
                    >
                        <span className="relative z-10 uppercase tracking-widest">commencer</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent-secondary opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                    </Link>
                    
                    <a
                        href="#features"
                        className="px-12 py-6 glass-morphism border border-border/80 hover:border-accent/40 text-text rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center backdrop-blur-3xl shadow-xl uppercase tracking-widest font-sans"
                        aria-label="découvrir les fonctionnalités"
                    >
                        explorer
                    </a>
                </div>
            </div>
        </section>
    );
}
