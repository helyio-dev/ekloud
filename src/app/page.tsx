import Hero from '@/components/Hero';
import Features from '@/components/Features';
import BackgroundParticles from '@/components/BackgroundParticles';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <main className="flex-grow flex flex-col items-center">
            <BackgroundParticles />
            <Hero />
            <Features />

            {}
            <section className="py-24 px-6 w-full bg-surface/30 border-t border-white/5">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold mb-16 text-center">Un système conçu pour la réussite</h2>
                    <div className="space-y-12">
                        <ConceptItem
                            num="1"
                            title="Leçons structurées"
                            desc="Des contenus clairs, optimisés pour un apprentissage rapide et efficace."
                        />
                        <ConceptItem
                            num="2"
                            title="Quiz & feedback"
                            desc="Validez chaque concept avec des tests interactifs immédiats."
                        />
                        <ConceptItem
                            num="3"
                            title="Examen final"
                            desc="Démontrez votre maîtrise pour débloquer les modules avancés."
                        />
                    </div>
                </div>
            </section>
        </main>
    );
}

function ConceptItem({ num, title, desc }: { num: string; title: string; desc: string }) {
    return (
        <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-accent flex items-center justify-center font-black text-white text-xl shadow-lg shadow-accent/20">
                {num}
            </div>
            <div>
                <h3 className="text-2xl font-bold mb-2">{title}</h3>
                <p className="text-text-muted text-lg leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
