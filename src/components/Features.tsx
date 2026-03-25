

import { BookOpen, ShieldCheck, Cpu } from 'lucide-react';

export default function Features() {
    return (
        <section id="features" className="relative z-10 py-16 px-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FeatureCard
                    icon={<BookOpen className="w-8 h-8" />}
                    title="PARCOURS ACCESSIBLES"
                    description="Chaque module est conçu pour être compris par tous, sans jargon inutile, pour une progression sereine."
                    delay="delay-100"
                />
                <FeatureCard
                    icon={<ShieldCheck className="w-8 h-8" />}
                    title="APPRENTISSAGE CONCRET"
                    description="Validez vos connaissances avec des exercices pratiques et des quiz basés sur des cas réels."
                    delay="delay-300"
                />
                <FeatureCard
                    icon={<Cpu className="w-8 h-8" />}
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
        <div className={`group relative p-[1px] rounded-[3.5rem] bg-border/20 transition-all duration-1000 hover:scale-[1.05] hover:rotate-1 animate-in slide-up ${delay}`}>
            <div className="relative p-8 rounded-[3.4rem] bg-surface h-full flex flex-col items-center text-center overflow-hidden neon-border">
                {/* Inner Glow Effect */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-accent blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative p-8 rounded-[2rem] bg-gradient-to-br from-accent to-accent-secondary text-white transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                        {icon}
                    </div>
                </div>

                <h3 className="text-2xl font-black mb-4 tracking-[0.3em] text-text uppercase w-full group-hover:text-accent transition-colors duration-500">
                    {title}
                </h3>
                
                <p className="text-text-muted leading-relaxed text-lg font-medium group-hover:text-text transition-colors duration-500">
                    {description}
                </p>

                <div className="mt-8 w-16 h-1 w-full bg-border/20 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 w-0 group-hover:w-full bg-gradient-to-r from-accent to-accent-secondary transition-all duration-1000 ease-out" />
                </div>
            </div>
        </div>
    );
}
