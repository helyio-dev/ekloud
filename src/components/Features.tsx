

import { BookOpen, ShieldCheck, Cpu } from 'lucide-react';

export default function Features() {
    return (
        <section id="features" className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <FeatureCard
                    icon={<BookOpen className="w-8 h-8 text-accent" />}
                    title="PARCOURS ACCESSIBLES"
                    description="Chaque module est conçu pour être compris par tous, sans jargon inutile, pour une progression sereine."
                    delay="delay-100"
                />
                <FeatureCard
                    icon={<ShieldCheck className="w-8 h-8 text-accent" />}
                    title="APPRENTISSAGE CONCRET"
                    description="Validez vos connaissances avec des exercices pratiques et des quiz basés sur des cas réels."
                    delay="delay-300"
                />
                <FeatureCard
                    icon={<Cpu className="w-8 h-8 text-accent" />}
                    title="TECHNO DE DEMAIN"
                    description="Explorez les domaines qui vous passionnent, du développement web à l'administration système."
                    delay="delay-500"
                />
            </div>
        </section>
    );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: string }) {
    return (
        <div className={`p-10 rounded-[2.5rem] bg-surface/20 border border-white/5 backdrop-blur-md transition-all duration-700 group animate-in slide-up hover-glow hover:bg-surface/40 flex flex-col items-center text-center ${delay}`}>
            <div className="mb-8 p-5 rounded-2xl bg-background border border-white/5 w-fit group-hover:bg-accent/20 group-hover:border-accent/30 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-700">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-4 tracking-tight text-accent/90 group-hover:text-accent transition-colors duration-500 whitespace-nowrap overflow-hidden text-ellipsis uppercase w-full">
                {title}
            </h3>
            <p className="text-text-muted leading-relaxed text-lg group-hover:text-text transition-colors duration-500">
                {description}
            </p>
            <div className="mt-8 w-12 h-1 bg-accent/20 rounded-full group-hover:w-full group-hover:bg-accent/40 transition-all duration-700" />
        </div>
    );
}
