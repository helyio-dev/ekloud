import { ArrowLeft, Shield, Trash2, Clock, Globe, FileText, Heart, Sun, Scale, AlertTriangle, Eye, Gavel, Cpu, Database, ChevronUp, Share2, Mail, Info, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function TermsPage() {
    const [activeSection, setActiveSection] = useState('intro');

    useEffect(() => {
        const handleScroll = () => {
            const sections = ['intro', 'objet', 'acces', 'compte', 'ethique', 'ia', 'support', 'propriete', 'donnees', 'limites', 'litiges'];
            // Détection hybride : si on est en bas de page, activer d'office la dernière section
            const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
            
            if (isBottom) {
                setActiveSection('litiges');
                const navElement = document.getElementById('nav-litiges');
                if (navElement) navElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                return;
            }

            for (const sectionId of [...sections].reverse()) {
                const element = document.getElementById(sectionId);
                if (element && window.scrollY >= element.offsetTop - 220) {
                    setActiveSection(sectionId);
                    const navElement = document.getElementById(`nav-${sectionId}`);
                    if (navElement) navElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    break;
                }
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { id: 'intro', label: '01. les bases' },
        { id: 'objet', label: '02. objet du service' },
        { id: 'acces', label: '03. accès & disponibilité' },
        { id: 'compte', label: '04. gestion du compte' },
        { id: 'ethique', label: '05. code de conduite' },
        { id: 'ia', label: '06. assistant ia kloudy' },
        { id: 'support', label: '07. dons & soutien' },
        { id: 'propriete', label: '08. propriété intellectuelle' },
        { id: 'donnees', label: '09. vie privée & rgpd' },
        { id: 'limites', label: '10. responsabilités' },
        { id: 'litiges', label: '11. droit & litiges' },
    ];

    const handleClick = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 140,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="min-h-screen bg-background text-text selection:bg-accent/20 font-sans leading-relaxed selection:text-white lowercase scroll-smooth">
            {/* Header minimaliste */}
            <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-[100] w-full px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-text-muted hover:text-text transition-all font-bold uppercase text-xs tracking-widest group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Retour</span>
                    </Link>
                    <div className="flex items-center gap-6 opacity-40">
                         <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-accent" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">ekloud legal protocol</span>
                         </div>
                         <div className="h-4 w-px bg-border hidden md:block"></div>
                         <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest bg-accent-glow/5 border border-accent/10 px-3 py-1 rounded-full text-accent">Status : Active v3.0 FIX</span>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 pt-12 md:pt-20 pb-0 grid grid-cols-1 lg:grid-cols-12 gap-16 relative">
                
                {/* 1. Menu de Gauche (Sidebar Structurée & Scrollable) */}
                <aside className="lg:col-span-3 hidden lg:block h-fit sticky top-32 z-[60]">
                    <div className="bg-surface/40 backdrop-blur-md border border-border rounded-[2.5rem] p-6 shadow-2xl shadow-black/10 max-h-[calc(100vh-160px)] flex flex-col">
                        <div className="flex items-center gap-2 mb-6 border-b border-border pb-4 shrink-0">
                            <FileText className="w-4 h-4 text-accent" />
                            <p className="text-[10px] font-black uppercase text-text tracking-[0.4em] italic">Navigation</p>
                        </div>
                        
                        <nav className="space-y-1 overflow-y-auto pr-2 custom-scrollbar">
                            {navLinks.map((link) => (
                                <button 
                                    key={link.id} 
                                    id={`nav-${link.id}`}
                                    onClick={() => handleClick(link.id)}
                                    className={`w-full text-left px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group ${activeSection === link.id ? 'bg-accent text-white shadow-lg shadow-accent/30 translate-y-2' : 'text-text-muted hover:text-text hover:bg-surface/50'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{link.label}</span>
                                        {activeSection === link.id && <ChevronRight className="w-3 h-3" />}
                                    </div>
                                </button>
                            ))}
                        </nav>
                        
                        {/* Rappel de support discret */}
                        <div className="mt-8 pt-6 border-t border-border shrink-0">
                            <p className="text-[9px] font-medium text-text-muted italic opacity-60 mb-2 px-2">des questions ?</p>
                            <a href="mailto:contact@ekoud.qzz.io" className="flex items-center gap-3 px-4 py-3 bg-accent/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/10 transition-all">
                                <Mail className="w-3 h-3" /> Support
                            </a>
                        </div>
                    </div>
                </aside>

                {/* 2. Contenu à Droite */}
                <main className="lg:col-span-9 space-y-40 pb-0">
                    {/* Hero simple */}
                    <div id="intro" className="mb-24 scroll-mt-40">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-text mb-8 uppercase tracking-tighter leading-none italic">Conditions Générales</h1>
                        <p className="text-text-muted text-xl max-w-3xl leading-relaxed italic opacity-80 decoration-accent/20 underline underline-offset-8">
                            Bienvenue sur Ekloud. nous nous engageons à offrir un environnement d'apprentissage technique d'excellence, régi par la transparence et la responsabilité mutuelle.
                        </p>
                        <div className="mt-12 p-6 bg-surface border border-border rounded-3xl flex items-center gap-6 group hover:border-accent/40 transition-colors">
                            <Info className="w-8 h-8 text-accent shrink-0" />
                            <p className="text-xs font-bold leading-relaxed">
                                en accédant à nos services, vous certifiez être majeur ou disposer d'une autorisation parentale, et acceptez sans réserve l'intégralité du présent protocole légal.
                            </p>
                        </div>
                    </div>

                    {/* Section 2 : Objet */}
                    <section id="objet" className="scroll-mt-40 space-y-10 border-t border-border/30 pt-20">
                        <h2 className="text-3xl font-black text-text uppercase tracking-tight flex items-center gap-6 italic underline underline-offset-2 decoration-accent/20">
                            02. Objet du Service
                        </h2>
                        <div className="pl-6 md:pl-16 border-l border-border hover:border-accent transition-colors space-y-6 text-base md:text-lg italic text-text-muted">
                            <p>Ekloud est une plateforme interactive dédiée à la montée en compétence en ingénierie logicielle et infrastructure.</p>
                            <p>Le service comprend : cours théoriques, examens pratiques, assistant IA Kloudy, gestion de clans et outils de gamification (XP, Leaderboard). Le contenu est strictement éducatif et ne constitue pas une garantie de succès professionnel.</p>
                        </div>
                    </section>

                    {/* Section 3 : Accès & Disponibilité */}
                    <section id="acces" className="scroll-mt-40 space-y-10 border-t border-border/30 pt-20">
                        <h2 className="text-3xl font-black text-text uppercase tracking-tight flex items-center gap-6 italic underline underline-offset-2 decoration-accent/20">
                            03. Accès & Disponibilité
                        </h2>
                        <div className="pl-6 md:pl-16 border-l border-border hover:border-accent transition-colors space-y-6 text-base md:text-lg italic text-text-muted">
                            <p>Nous visons une disponibilité de 99.5% hors périodes de maintenance programmée. Ekloud se réserve le droit d'interrompre le service à tout moment pour des mises à jour de sécurité critiques sans préavis.</p>
                            <div className="bg-surface p-6 rounded-2xl border border-border text-xs leading-relaxed">
                                <span className="text-accent font-black mr-2 uppercase">[clause technique]</span>
                                nous ne pourrons être tenus responsables des pannes liées à vos fournisseurs d'accès internet ou à des événements de force majeure (pannes serveurs hébergeur).
                            </div>
                        </div>
                    </section>

                    {/* Section 4 : Gestion du Compte */}
                    <section id="compte" className="scroll-mt-40 space-y-10 border-t border-border/30 pt-20">
                        <h2 className="text-3xl font-black text-text uppercase tracking-tight flex items-center gap-6 italic underline underline-offset-2 decoration-accent/20">
                            04. Gestion du Compte
                        </h2>
                        <div className="pl-6 md:pl-16 border-l border-border hover:border-accent transition-colors space-y-6 text-base md:text-lg italic text-text-muted">
                            <p>L'authentification s'effectue via OAuth (GitHub, Discord, Google). L'utilisateur est seul responsable du maintien de la sécurité de ses accès tiers.</p>
                            <div className="p-4 bg-surface border border-border rounded-xl flex items-center gap-4 text-xs">
                                <Shield className="w-4 h-4 text-accent" />
                                <span>les comptes sont personnels. la vente ou le partage de compte à des tiers est formellement interdit.</span>
                            </div>
                        </div>
                    </section>

                    {/* Section 5 : Code de Conduite */}
                    <section id="ethique" className="scroll-mt-40 space-y-10 border-t border-border/30 pt-20">
                        <h2 className="text-3xl font-black text-text uppercase tracking-tight flex items-center gap-6 italic underline underline-offset-2 decoration-accent/20">
                            05. Code de Conduite
                        </h2>
                        <div className="pl-6 md:pl-16 border-l border-border hover:border-accent transition-colors space-y-8 text-base md:text-lg italic text-text-muted">
                            <p>tout utilisateur doit respecter la charte de fair-play ekloud. tout manquement peut entraîner un bannissement total et définitif.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <RuleCard title="fraude aux quiz" desc="interdiction d'utiliser des bots ou scripts d'automatisation." />
                                <RuleCard title="toxicité clan" desc="propos haineux, harcèlement ou spam dans le système de clans." />
                                <RuleCard title="extraction" desc="interdiction de scraper massivement les cours ou assets visuels." />
                                <RuleCard title="technique" desc="attaques ddos, injections sql ou reverse-engineering de l'api." />
                            </div>
                        </div>
                    </section>

                    {/* Section 6 : Assistant Kloudy */}
                    <section id="ia" className="scroll-mt-40 space-y-10 border-t border-border/30 pt-20">
                        <h2 className="text-3xl font-black text-text uppercase tracking-tight flex items-center gap-6 italic underline underline-offset-2 decoration-accent/20">
                            06. Assistant IA Kloudy
                        </h2>
                        <div className="pl-6 md:pl-16 border-l border-border hover:border-accent transition-colors space-y-6 text-base md:text-lg italic text-text-muted">
                            <p>Kloudy utilise l'intelligence artificielle pour vous accompagner. ces modèles peuvent comporter des erreurs techniques ou des inexactitudes dites "hallucinations".</p>
                            <div className="p-8 bg-purple-500/5 border border-purple-500/20 rounded-[2.5rem] flex items-start gap-6">
                                <AlertTriangle className="w-8 h-8 text-purple-400 shrink-0" />
                                <p className="text-sm font-bold text-text mb-2 uppercase tracking-wide">
                                    décharge de responsabilité IA : <br />
                                    <span className="text-text-muted font-normal lowercase italic mt-2 block">
                                        le code généré doit être testé en environnement sécurisé (Sandbox). Ekloud décline toute responsabilité pour tout dommage réel (logique ou matériel) lié à l'application de suggestions IA sans supervision humaine experte.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 7 : Soutien & Dons */}
                    <section id="support" className="scroll-mt-40 space-y-10 border-t border-border/30 pt-20">
                        <h2 className="text-3xl font-black text-text uppercase tracking-tight flex items-center gap-6 italic underline underline-offset-2 decoration-accent/20">
                            07. Dons & Soutien
                        </h2>
                        <div className="pl-6 md:pl-16 border-l border-border hover:border-accent transition-colors space-y-6 text-base md:text-lg italic text-text-muted">
                            <p>nous offrons la possibilité aux utilisateurs de soutenir la maintenance des infrastructures via des contributions volontaires.</p>
                            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base italic opacity-70">
                                <li>les dons sont définitifs (non remboursables).</li>
                                <li>ils ne constituent pas un achat de service commercial.</li>
                                <li>ils ne confèrent aucun avantage de triche ou XP direct.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 8 : Propriété Intellectuelle */}
                    <section id="propriete" className="scroll-mt-40 space-y-10 border-t border-border/30 pt-20">
                        <h2 className="text-3xl font-black text-text uppercase tracking-tight flex items-center gap-6 italic underline underline-offset-2 decoration-accent/20">
                            08. Propriété Intellectuelle
                        </h2>
                        <div className="pl-6 md:pl-16 border-l border-border hover:border-accent transition-colors space-y-6 text-base md:text-lg italic text-text-muted">
                            <p>sauf mention contraire, Ekloud Technology Group détient les droits de propriété intellectuelle sur tout le matériel (textes, graphismes, logos, codes sources front-end, structure de cours).</p>
                            <p>toute reproduction, redistribution ou exploitation commerciale est strictement interdite sans accord écrit préalable.</p>
                        </div>
                    </section>

                    {/* Section 9 : Vie Privée & RGPD */}
                    <section id="donnees" className="scroll-mt-40 space-y-10 border-t border-border/30 pt-20">
                        <h2 className="text-3xl font-black text-text uppercase tracking-tight flex items-center gap-6 italic underline underline-offset-2 decoration-accent/20">
                            09. Vie Privée & RGPD
                        </h2>
                        <div className="pl-6 md:pl-16 border-l border-border hover:border-accent transition-colors space-y-8 text-base md:text-lg italic text-text-muted">
                            <p>nous respectons la réglementation européenne RGPD. seules les données essentielles à la personnalisation de votre apprentissage sont stockées.</p>
                            <div className="p-10 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] border-l-8 border-l-red-500 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/5 rounded-full blur-[100px] group-hover:bg-red-400/10 transition-all"></div>
                                <h4 className="flex items-center gap-3 text-[11px] font-black uppercase text-red-500 mb-6 tracking-[0.3em] underline">Protocole de Suppression Définitive :</h4>
                                <p className="text-sm md:text-base italic leading-relaxed text-text-muted leading-[2]">
                                    toute demande de suppression déclenche un cycle de purge de <span className="text-red-500 font-bold">7 jours glissants</span>. au-delà de cette fenêtre, l'intégralité de votre xp, vos statistiques de clans et logs de progression seront effacés de manière irréversible et totale de nos serveurs de production.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 10 : Responsabilités */}
                    <section id="limites" className="scroll-mt-40 space-y-10 border-t border-border/30 pt-20">
                        <h2 className="text-3xl font-black text-text uppercase tracking-tight flex items-center gap-6 italic underline underline-offset-2 decoration-accent/20">
                            10. Responsabilités
                        </h2>
                        <div className="pl-6 md:pl-16 border-l border-border hover:border-accent transition-colors space-y-6 text-base md:text-lg italic text-text-muted">
                            <p>Ekloud décline toute responsabilité pour tout dommage direct ou indirect résultant de l'utilisation des services.</p>
                            <p>le service étant un outil de formation, l'éditeur ne saurait être tenu responsable du succès ou de l'échec d'aspirations professionnelles ou techniques de ses utilisateurs.</p>
                        </div>
                    </section>

                    {/* Section 11 : Droit & Litiges */}
                    <section id="litiges" className="scroll-mt-40 space-y-10 border-t border-border/30 pt-20 pb-0 mb-0">
                        <h2 className="text-3xl font-black text-text uppercase tracking-tight flex items-center gap-6 italic underline underline-offset-2 decoration-accent/20">
                            11. Droit & Litiges
                        </h2>
                        <div className="pl-6 md:pl-16 border-l border-border hover:border-accent transition-colors space-y-8 text-base md:text-lg italic text-text-muted pb-0 mb-0">
                            <p>les présentes conditions sont régies exclusivement par le droit Français et Européen.</p>
                            <p>en cas de litige, après tentative de résolution à l'amiable via nos canaux de support officiels (Discord/Email), les parties soumettront le différend à la compétence exclusive des tribunaux territoriaux ou du siège légal de l'éditeur.</p>
                            <div className="py-20 text-center opacity-30 flex flex-col items-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-4">ekloud legal entity</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">dernière révision : 03/04/2026</p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>

        </div>
    );
}

// Composant local pour les cartes de règles
function RuleCard({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="p-6 bg-surface/40 border border-border rounded-3xl hover:border-accent/40 group transition-all">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_10px_rgba(99,102,241,1)]"></div>
                <h4 className="text-[11px] font-black bg-accent-glow/5 border border-accent/10 px-2 py-0.5 rounded-full text-accent uppercase tracking-widest leading-none">{title}</h4>
            </div>
            <p className="text-xs text-text-muted italic opacity-70 group-hover:opacity-100 transition-opacity">{desc}</p>
        </div>
    );
}
