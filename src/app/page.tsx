import Hero from '@/components/Hero';
import Features from '@/components/Features';
import BackgroundParticles from '@/components/BackgroundParticles';
import { Rocket, GraduationCap, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function LandingPage() {
    const [copied, setCopied] = useState(false);
    return (
        <main className="flex-grow flex flex-col items-center w-full bg-grid-pattern">
            <BackgroundParticles />
            <Hero />
            <Features />

            {/* Concept Section - Immersive Timeline */}
            <section className="py-20 px-6 w-full relative overflow-hidden mesh-gradient">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border/20 -z-10" />

                <div className="max-w-5xl mx-auto relative">
                    <div className="text-center mb-12 space-y-4">
                        <div className="text-accent font-black tracking-[0.5em] uppercase text-sm">Méthodologie</div>
                        <h2 className="text-4xl md:text-7xl font-black tracking-tighter">
                            conçu pour la <span className="text-gradient drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">réussite</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <ConceptItem
                            icon={<Rocket className="w-8 h-8" />}
                            num="01"
                            title="LEçOns structuréEs"
                            desc="Des contenus clairs, optimisés pour un apprentissage rapide et efficace. Sans perte de temps."
                        />
                        <ConceptItem
                            icon={<GraduationCap className="w-8 h-8" />}
                            num="02"
                            title="Quiz & feEDbAck"
                            desc="Validez chaque concept avec des tests interactifs immédiats pour ancrer vos savoirs."
                        />
                        <ConceptItem
                            icon={<Target className="w-8 h-8" />}
                            num="03"
                            title="ExAmEn finAl"
                            desc="Démontrez votre maîtrise réelle, validez vos acquis et débloquez la suite du parcours."
                        />
                    </div>
                </div>
            </section>

            <footer className="py-12 px-6 border-t border-border w-full text-center mesh-gradient">
                <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
                    <div className="text-3xl font-black tracking-tighter text-gradient mb-2 font-equinox">EKLOUD</div>
                    <p className="text-text-muted text-lg font-medium tracking-widest uppercase opacity-80">
                        © {new Date().getFullYear()} • Plateforme d'apprentissage technologique
                    </p>
                    <div className="flex gap-8 text-text-muted/60 text-sm font-bold tracking-widest uppercase items-center">
                        <a href="https://discord.gg/WnwyMHm4Gc" target="_blank" rel="noopener noreferrer" className="hover:text-accent cursor-pointer transition-colors">Discord</a>
                        <Link to="/support" className="hover:text-accent cursor-pointer transition-colors">Soutenir</Link>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                navigator.clipboard.writeText('contact@ekoud.qzz.io');
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            className="hover:text-accent cursor-pointer transition-colors uppercase font-bold tracking-widest"
                        >
                            {copied ? "Email Copié !" : "Support"}
                        </button>
                    </div>

                </div>
            </footer>
        </main>
    );
}

function ConceptItem({ icon, num, title, desc }: { icon: React.ReactNode; num: string; title: string; desc: string }) {
    return (
        <div className="group relative flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] transition-all duration-700 hover:bg-accent/5 border border-border hover:border-accent/20 glass-morphism backdrop-blur-3xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -z-10 group-hover:bg-accent/10 transition-colors" />

            <div className="flex-shrink-0 w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] bg-surface border border-border flex items-center justify-center font-black text-text text-2xl md:text-4xl shadow-2xl group-hover:bg-accent group-hover:border-accent/50 group-hover:text-white group-hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all duration-700 relative overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-surface-hover/30" />
                <span className="relative z-10 group-hover:hidden">{num}</span>
                <span className="hidden group-hover:flex items-center justify-center relative z-10 animate-in zoom-in duration-500">{icon}</span>
            </div>

            <div className="md:pt-4 text-center md:text-left space-y-4 max-w-2xl">
                <div className="flex items-center gap-4 justify-center md:justify-start">
                    <div className="h-px w-8 bg-accent/30" />
                    <span className="text-accent font-black text-xs tracking-[0.4em] uppercase">Phase {num}</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black tracking-tight text-text group-hover:text-accent transition-colors duration-500 font-equinox">{title}</h3>
                <p className="text-text-muted text-xl leading-relaxed font-medium group-hover:text-text transition-colors duration-500">{desc}</p>
            </div>
        </div>
    );
}
