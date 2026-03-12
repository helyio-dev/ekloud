import { Link } from 'react-router-dom';
import Typewriter from './Typewriter';

export default function Hero() {
    return (
        <section className="relative pt-16 pb-16 md:pt-32 md:pb-28 px-6 max-w-7xl mx-auto text-center overflow-visible">
            {/* Ultra-Immersive Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[800px] bg-accent/20 rounded-full blur-[180px] -z-10 opacity-70 animate-pulse" />
            <div className="absolute top-0 right-[-15%] w-[600px] h-[600px] bg-accent-secondary/15 rounded-full blur-[160px] -z-10" />
            
            {/* Floating 3D Elements for the "Visual Slap" */}
            <div className="absolute top-10 left-10 md:left-40 w-16 h-16 border border-white/10 rounded-2xl rotate-45 animate-float-subtle -z-10 bg-white/5 backdrop-blur-sm" />
            <div className="absolute top-1/3 left-[-5%] w-32 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent -rotate-12" />

            <div className="relative z-10 space-y-4 animate-in fade-in slide-up duration-1000 ease-out">
                <div className="space-y-1">
                    <div className="text-xl md:text-3xl font-black tracking-tight leading-tight max-w-4xl mx-auto text-white">
                        <span className="text-gradient">
                            <Typewriter
                                words={["Apprendre", "Progresser", "Maîtriser"]}
                            />
                        </span> simplement
                    </div>

                    <div className="text-xl md:text-3xl text-text-muted/80 max-w-3xl mx-auto leading-relaxed font-bold tracking-tight">
                        Des parcours clairs pour progresser {' '}
                        <span className="text-white underline decoration-accent/40 underline-offset-[8px] font-black italic">
                            <Typewriter
                                words={["à votre rythme.", "sans pression.", "efficacement.", "pas à pas."]}
                            />
                        </span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-2 animate-in fade-in delay-700 fill-mode-both">
                    <Link
                        to="/signup"
                        className="group relative px-16 py-8 bg-white text-background rounded-full font-black text-2xl transition-all hover:scale-110 active:scale-95 shadow-[0_0_60px_rgba(255,255,255,0.2)] overflow-hidden"
                    >
                        <span className="relative z-10">Commencer maintenant</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent-secondary opacity-0 group-hover:opacity-10 transition-opacity" />
                    </Link>
                    <a
                        href="#features"
                        className="px-16 py-8 glass-morphism border border-white/10 hover:border-accent/40 text-text rounded-full font-black text-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center backdrop-blur-3xl shadow-2xl"
                    >
                        Explorer
                    </a>
                </div>
            </div>
        </section>
    );
}
