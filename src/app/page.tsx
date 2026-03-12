import Hero from '@/components/Hero';
import Features from '@/components/Features';
import BackgroundParticles from '@/components/BackgroundParticles';
import { Rocket, GraduationCap, Target } from 'lucide-react';
import { Link } from 'react-router-dom';


export default function LandingPage() {
    return (
        <main className="flex-grow flex flex-col items-center w-full bg-grid-pattern">
            <BackgroundParticles />
            <Hero />
            <Features />

            {/* Concept Section - Immersive Timeline */}
            <section className="py-20 px-6 w-full relative overflow-hidden mesh-gradient">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/[0.02] -z-10" />
                
                <div className="max-w-5xl mx-auto relative">
                    <div className="text-center mb-12 space-y-4">
                        <div className="text-accent font-black tracking-[0.5em] uppercase text-sm">Méthodologie</div>
                        <h2 className="text-4xl md:text-7xl font-black tracking-tighter">
                            Conçu pour la <span className="text-gradient drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">réussite</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <ConceptItem
                            icon={<Rocket className="w-8 h-8" />}
                            num="01"
                            title="Leçons structurées"
                            desc="Des contenus clairs, optimisés pour un apprentissage rapide et efficace. Sans perte de temps."
                        />
                        <ConceptItem
                            icon={<GraduationCap className="w-8 h-8" />}
                            num="02"
                            title="Quiz & feedback"
                            desc="Validez chaque concept avec des tests interactifs immédiats pour ancrer vos savoirs."
                        />
                        <ConceptItem
                            icon={<Target className="w-8 h-8" />}
                            num="03"
                            title="Examen final"
                            desc="Démontrez votre maîtrise réelle, validez vos acquis et débloquez la suite du parcours."
                        />
                    </div>
                </div>
            </section>
            
            <footer className="py-12 px-6 border-t border-white/[0.05] w-full text-center mesh-gradient">
                <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
                    <div className="text-3xl font-black tracking-tighter text-gradient mb-2 font-equinox">EKLOUD</div>
                    <p className="text-text-muted text-lg font-medium tracking-widest uppercase opacity-60">
                        © {new Date().getFullYear()} • Plateforme d'apprentissage technologique
                    </p>
                    <div className="flex gap-8 text-white/40 text-sm font-bold tracking-widest uppercase">
                        <a href="https://discord.gg/WnwyMHm4Gc" target="_blank" rel="noopener noreferrer" className="hover:text-accent cursor-pointer transition-colors">Discord</a>
                        <Link to="/support" className="hover:text-accent cursor-pointer transition-colors">Soutenir</Link>
                    </div>

                </div>
            </footer>
        </main>
    );
}

function ConceptItem({ icon, num, title, desc }: { icon: React.ReactNode; num: string; title: string; desc: string }) {
    return (
        <div className="group relative flex flex-col md:flex-row gap-10 items-center md:items-start p-12 rounded-[3.5rem] transition-all duration-700 hover:bg-white/[0.03] border border-white/[0.03] hover:border-accent/20 glass-morphism backdrop-blur-3xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -z-10 group-hover:bg-accent/10 transition-colors" />
            
            <div className="flex-shrink-0 w-24 h-24 rounded-[2rem] bg-surface border border-white/5 flex items-center justify-center font-black text-white text-4xl shadow-2xl group-hover:bg-accent group-hover:border-accent/50 group-hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all duration-700 relative overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-white/5" />
                <span className="relative z-10 group-hover:hidden">{num}</span>
                <span className="hidden group-hover:flex items-center justify-center relative z-10 animate-in zoom-in duration-500">{icon}</span>
            </div>
            
            <div className="md:pt-4 text-center md:text-left space-y-4 max-w-2xl">
                <div className="flex items-center gap-4 justify-center md:justify-start">
                    <div className="h-px w-8 bg-accent/30" />
                    <span className="text-accent font-black text-xs tracking-[0.4em] uppercase">Phase {num}</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black tracking-tight text-white group-hover:text-accent transition-colors duration-500">{title}</h3>
                <p className="text-text-muted text-xl leading-relaxed font-medium group-hover:text-white/80 transition-colors duration-500">{desc}</p>
            </div>
        </div>
    );
}
