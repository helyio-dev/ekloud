import Hero from '@/components/Hero';
import Features from '@/components/Features';
import BackgroundParticles from '@/components/BackgroundParticles';
import { Rocket, GraduationCap, Target, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

/**
 * page d'accueil principale de la plateforme ekloud.
 * propose une expérience immersive avec animations et présentation de la méthodologie.
 */
export default function LandingPage() {
    const [copied, setCopied] = useState(false);

    return (
        <main className="flex-grow flex flex-col items-center w-full bg-grid-pattern overflow-x-hidden font-sans">
            <BackgroundParticles />
            <Hero />
            <Features />

            {/* section concept : présentation de la méthodologie pédagogique */}
            <section className="py-20 px-6 w-full relative overflow-hidden mesh-gradient border-t border-border/50">
                <div className="absolute top-1/2 left-0 w-full h-px bg-border/20 -z-10" />

                <div className="max-w-5xl mx-auto relative">
                    <header className="text-center mb-16 space-y-4">
                        <div className="text-accent font-black tracking-[0.5em] uppercase text-[10px]">méthodologie</div>
                        <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase font-equinox">
                            conçu pour la <span className="text-gradient drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">réussite</span>
                        </h2>
                    </header>

                    <div className="grid grid-cols-1 gap-8">
                        <ConceptItem
                            icon={<Rocket className="w-8 h-8" />}
                            num="01"
                            title="leçons structurées"
                            desc="des contenus clairs, optimisés pour un apprentissage rapide et efficace. aucune perte de temps."
                        />
                        <ConceptItem
                            icon={<GraduationCap className="w-8 h-8" />}
                            num="02"
                            title="quiz & feedback"
                            desc="validez chaque concept avec des tests interactifs immédiats pour ancrer vos savoirs durablement."
                        />
                        <ConceptItem
                            icon={<Target className="w-8 h-8" />}
                            num="03"
                            title="examen final"
                            desc="démontrez votre maîtrise réelle, validez vos acquis et débloquez la suite de votre parcours."
                        />
                    </div>
                </div>
            </section>

            {/* pied de page global : navigation secondaire et réseaux */}
            <footer className="py-20 px-6 border-t border-border w-full text-center mesh-gradient bg-surface/5">
                <div className="max-w-7xl mx-auto flex flex-col items-center gap-10">
                    <div className="text-4xl font-black tracking-tighter text-gradient font-equinox uppercase">EKLOUD</div>
                    
                    <p className="text-text-muted text-[10px] font-black tracking-[0.3em] uppercase opacity-60">
                        © {new Date().getFullYear()} • plateforme d'apprentissage technologique avancée
                    </p>

                    <nav className="flex flex-wrap justify-center gap-8 text-text-muted/60 text-[10px] font-black tracking-widest uppercase">
                        <a href="https://discord.gg/WnwyMHm4Gc" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-accent transition-colors group">
                            discord <ExternalLink size={10} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                        <Link to="/support" className="hover:text-accent transition-colors underline-offset-4 hover:underline">soutenir</Link>
                        <Link to="/terms" className="hover:text-accent transition-colors underline-offset-4 hover:underline">cgu</Link>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                navigator.clipboard.writeText('contact@ekloud.qzz.io');
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            className="hover:text-accent transition-colors underline-offset-4 hover:underline"
                        >
                            {copied ? "email copié !" : "contact support"}
                        </button>
                    </nav>
                </div>
            </footer>
        </main>
    );
}

/**
 * composant interne pour illustrer une phase de la méthodologie.
 */
function ConceptItem({ icon, num, title, desc }: { icon: React.ReactNode; num: string; title: string; desc: string }) {
    return (
        <article className="group relative flex flex-col md:flex-row gap-8 md:gap-16 items-center md:items-start p-10 md:p-20 rounded-[4rem] transition-all duration-700 hover:bg-surface border-2 border-border/60 hover:border-accent/40 bg-surface shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/[0.01] rounded-full blur-[128px] -z-10 group-hover:bg-accent/[0.05] transition-colors duration-1000" />

            {/* indicateur numérique et icône au survol */}
            <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-background border border-border/80 flex items-center justify-center font-black text-text text-4xl md:text-6xl shadow-inner group-hover:bg-accent group-hover:border-accent/40 group-hover:text-white group-hover:shadow-[0_0_80px_rgba(99,102,241,0.3)] transition-all duration-1000 relative overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 group-hover:scale-0 transition-transform duration-500">{num}</span>
                <div className="absolute flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-110 transition-all duration-700 delay-100 z-10">
                    {icon}
                </div>
            </div>

            {/* contenu textuel descriptif */}
            <div className="md:pt-4 text-center md:text-left space-y-6 max-w-2xl">
                <div className="flex items-center gap-6 justify-center md:justify-start overflow-hidden">
                    <div className="h-[2px] w-12 bg-accent/30 group-hover:w-20 transition-all duration-700" />
                    <span className="text-accent font-black text-[10px] tracking-[0.5em] uppercase whitespace-nowrap">phase {num}</span>
                </div>
                <h3 className="text-3xl md:text-5xl font-black tracking-tight text-text group-hover:text-accent transition-colors duration-500 font-equinox uppercase leading-none">{title}</h3>
                <p className="text-text-muted text-lg md:text-2xl leading-relaxed font-medium group-hover:text-text transition-colors duration-500 opacity-80 group-hover:opacity-100 italic">{desc}</p>
            </div>
        </article>
    );
}
