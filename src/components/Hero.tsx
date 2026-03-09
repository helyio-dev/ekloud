import { Link } from 'react-router-dom';
import Typewriter from './Typewriter';

export default function Hero() {
    return (
        <section className="relative py-32 px-6 max-w-7xl mx-auto text-center border-b border-white/5 overflow-hidden">
            {}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] -z-10 animate-pulse" />

            <div className="relative z-10 animate-in fade-in slide-up duration-1000 ease-out">
                <div className="text-lg md:text-xl text-text-muted mb-12 max-w-2xl mx-auto leading-relaxed min-h-[4em]">
                    <Typewriter
                        words={["Apprenez les bases de la tech", "Maîtrisez le développement web", "Découvrez la cybersécurité", "Explorez l'administration système"]}
                    /> {' '} simplement.
                    <br />
                    Des parcours clairs pour progresser {' '}
                    <Typewriter
                        words={["à votre rythme.", "sans pression.", "efficacement.", "pas à pas."]}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-6 justify-center animate-in fade-in delay-700 fill-mode-both">
                    <Link
                        to="/signup"
                        className="px-12 py-5 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl shadow-accent/20 active:scale-95"
                    >
                        Découvrir maintenant
                    </Link>
                    <a
                        href="#features"
                        className="px-12 py-5 bg-surface/50 hover:bg-surface text-text rounded-2xl font-bold text-lg transition-all border border-white/5 active:scale-95"
                    >
                        Explorer les modules
                    </a>
                </div>
            </div>
        </section>
    );
}
