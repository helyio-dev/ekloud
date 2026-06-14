import { BookOpen, ShieldCheck, Cpu } from 'lucide-react';

/**
 * section des points forts (features) de la plateforme.
 * présente les piliers de l'apprentissage ekloud via des cartes interactives.
 */
export default function Features() {
    return (
        <section id="features" className="relative z-10 py-20 px-6 max-w-7xl mx-auto font-sans">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <FeatureCard
                    icon={<BookOpen className="w-8 h-8" />}
                    title="parcours accessibles"
                    description="chaque module est conçu pour être compris par tous, sans jargon inutile, pour une progression sereine et maîtrisée."
                    delay="delay-100"
                />
                <FeatureCard
                    icon={<ShieldCheck className="w-8 h-8" />}
                    title="apprentissage concret"
                    description="validez vos connaissances avec des exercices pratiques et des quiz basés sur des cas réels d'architecture cloud."
                    delay="delay-300"
                />
                <FeatureCard
                    icon={<Cpu className="w-8 h-8" />}
                    title="technos de demain"
                    description="explorez les domaines qui définiront le futur, du développement web moderne à l'administration système avancée."
                    delay="delay-500"
                />
            </div>
        </section>
    );
}

/**
 * carte individuelle présentant une fonctionnalité clé.
 * utilise des micro-animations et des effets de profondeur au survol.
 */
function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: string }) {
    return (
        <article className={`group relative p-[1px] rounded-[3.5rem] bg-border/20 transition-all duration-1000 hover:scale-[1.05] hover:rotate-1 animate-in slide-in-from-bottom-12 fill-mode-both ${delay}`}>
            <div className="relative p-12 rounded-[3.4rem] bg-surface h-full flex flex-col items-center text-center overflow-hidden neon-border shadow-2xl">
                {/* effet de lueur atmosphérique localisé */}
                <div className="absolute -top-16 -right-16 w-36 h-36 bg-accent/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                {/* conteneur d'icône avec élévation dynamique */}
                <div className="mb-12 relative">
                    <div className="absolute inset-0 bg-accent blur-[40px] opacity-10 group-hover:opacity-30 transition-opacity duration-700" />
                    <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-br from-accent to-accent-secondary text-white transform group-hover:scale-110 group-hover:-translate-y-2 group-hover:rotate-6 transition-all duration-700 shadow-[0_20px_40px_-15px_rgba(99,102,241,0.4)]">
                        {icon}
                    </div>
                </div>

                <h3 className="text-2xl font-black mb-6 tracking-[0.2em] text-text uppercase w-full group-hover:text-accent transition-colors duration-500 font-equinox leading-tight">
                    {title}
                </h3>
                
                <p className="text-text-muted leading-relaxed text-lg font-medium group-hover:text-text transition-colors duration-500 opacity-80 group-hover:opacity-100">
                    {description}
                </p>

                {/* indicateur de progression visuelle ou accentuation basse */}
                <div className="mt-12 w-full h-[2px] bg-border/20 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 w-0 group-hover:w-full bg-gradient-to-r from-accent via-accent-secondary to-accent transition-all duration-1000 ease-in-out" />
                </div>
            </div>
        </article>
    );
}
