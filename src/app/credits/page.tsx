import { useMemo } from 'react';
import {
  ExternalLink,
  Heart,
  Info,
  Shield,
  Sparkles,
  Terminal,
  Workflow,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ListChecks } from 'lucide-react';

type CreditItem = {
  role: string;
  name: string;
  link: string;
  description: string;
};

type CreditGroup = {
  id: string;
  category: string;
  items: CreditItem[];
  summary: string;
  icon: 'workflow' | 'shield' | 'sparkles' | 'terminal';
};

const CREDITS_REGISTRY: CreditGroup[] = [
  {
    id: 'infrastructure-edge',
    category: 'infrastructure & edge',
    summary:
      "Tout ce qui permet d’exécuter l’app et de la protéger avant même qu’elle n’arrive dans le navigateur.",
    icon: 'shield',
    items: [
      {
        role: 'auth + base de données',
        name: 'Supabase',
        link: 'https://supabase.com/',
        description:
          "Fournit l’authentification et la base de données. Dans ekloud : suivi de progression, statistiques, contrôles d’accès.",
      },
      {
        role: 'distribution & sécurité',
        name: 'Cloudflare',
        link: 'https://cloudflare.com/',
        description:
          "Optimise la diffusion (edge) et renforce la sécurité réseau : latence réduite, accès plus robuste.",
      },
    ],
  },
  {
    id: 'core-app',
    category: 'cœur applicatif',
    summary:
      "La base de l’interface et du code : structurer, compiler, sécuriser et rendre les écrans maintenables.",
    icon: 'workflow',
    items: [
      {
        role: 'interface & composants',
        name: 'React',
        link: 'https://react.dev/',
        description:
          "Structure l’interface et les interactions. Dans ekloud : parcours, quiz et écrans fluides.",
      },
      {
        role: 'build engine',
        name: 'Vite',
        link: 'https://vitejs.dev/',
        description:
          "Accélère développement et build : workflow moderne, itérations rapides et chargements optimisés.",
      },
      {
        role: 'type safety',
        name: 'TypeScript',
        link: 'https://www.typescriptlang.org/',
        description:
          "Ajoute de la robustesse via le typage : moins d’erreurs, contrats plus sûrs, base de code fiable.",
      },
    ],
  },
  {
    id: 'visual-experience',
    category: 'expérience visuelle',
    summary:
      "Le style, la cohérence graphique et la lisibilité des données (y compris les graphes / relations).",
    icon: 'sparkles',
    items: [
      {
        role: 'design system',
        name: 'Tailwind CSS',
        link: 'https://tailwindcss.com/',
        description:
          "Permet une UI cohérente : rythme typographique, états et homogénéité des composants.",
      },
      {
        role: 'icônes légères',
        name: 'lucide-react',
        link: 'https://lucide.dev/',
        description:
          "Icônes fines et homogènes pour améliorer la compréhension et la navigation.",
      },
      {
        role: 'layout de graphes',
        name: 'dagre',
        link: 'https://github.com/dagrejs/dagre',
        description:
          "Aide au positionnement de graphes pour rendre les relations visuelles plus lisibles.",
      },
    ],
  },
  {
    id: 'payments',
    category: 'paiements',
    summary:
      "La gestion des paiements et de l’activation des fonctionnalités associées.",
    icon: 'terminal',
    items: [
      {
        role: 'achats & facturation',
        name: 'Stripe',
        link: 'https://stripe.com/',
        description:
          "Gère paiements et facturation : activation fiable des avantages après validation.",
      },
    ],
  },
];

function getGroupIcon(groupIcon: CreditGroup['icon']) {
  switch (groupIcon) {
    case 'workflow':
      return <Workflow className="w-4 h-4" />;
    case 'shield':
      return <Shield className="w-4 h-4" />;
    case 'sparkles':
      return <Sparkles className="w-4 h-4" />;
    case 'terminal':
    default:
      return <Terminal className="w-4 h-4" />;
  }
}

function TinyStarfield() {
  const nightSkyStars = useMemo(
    () =>
      Array.from({ length: 110 }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.8 + 0.35,
        delay: Math.random() * 8,
        duration: Math.random() * 4 + 4,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
      {nightSkyStars.map((star, i) => (
        <div
          key={`star-${i}`}
          className="absolute rounded-full bg-accent dark:bg-white animate-twinkle opacity-25"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function Meteors() {
  const meteors = useMemo(
    () =>
      Array.from({ length: 7 }).map(() => ({
        top: -10 + Math.random() * -30,
        left: Math.random() * 100 + 10,
        delay: Math.random() * 10,
        duration: Math.random() * 2.5 + 1.2,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {meteors.map((meteor, i) => (
        <div
          key={`meteor-${i}`}
          className="absolute origin-left animate-shooting-star opacity-70"
          style={{
            top: `${meteor.top}%`,
            left: `${meteor.left}%`,
            animationDelay: `${meteor.delay}s`,
            animationDuration: `${meteor.duration}s`,
          }}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-[1px] bg-accent dark:bg-white rounded-full opacity-40" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[220px] h-[0.5px] bg-gradient-to-r from-accent/30 dark:from-white/30 to-transparent" />
        </div>
      ))}
    </div>
  );
}

function SmallPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 bg-surface/40 px-3 py-1 text-[11px] font-bold tracking-wide text-text-muted/85">
      {children}
    </span>
  );
}

export default function CreditsPage() {
  const nowYear = new Date().getFullYear();

  const creditsRegistry = CREDITS_REGISTRY;

  return (
    <div className="min-h-screen bg-background text-text flex flex-col relative overflow-hidden pb-16">
      <TinyStarfield />
      <Meteors />

      {/* Header */}
      <header className="sticky top-0 z-[100] w-full border-b border-border/10 bg-surface/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors font-bold uppercase tracking-widest text-xs"
          >
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface border border-border group hover:border-accent/40 transition-colors">
              <span aria-hidden="true">←</span>
            </span>
            <span>Retour</span>
          </Link>

          <div className="flex items-center gap-4 opacity-70">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">ekloud credits</span>
            </div>
            <div className="hidden md:block h-4 w-px bg-border/30" />
            <span className="text-[9px] font-black uppercase tracking-widest bg-accent/5 border border-accent/10 px-3 py-1 rounded-full text-accent">
              v3.8.2
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-10 w-full relative z-10 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Side summary */}
          <aside className="lg:col-span-3 hidden lg:block h-fit sticky top-28 z-[60]">
            <div className="bg-surface/40 backdrop-blur-md border border-border rounded-[1.5rem] p-6 shadow-2xl shadow-black/10">
                      <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
                <Terminal className="w-4 h-4 text-accent" />
                <p className="text-[10px] font-black uppercase text-text tracking-[0.4em] italic">Sommaire</p>
              </div>

              <nav className="space-y-2" aria-label="Sommaire crédits">
                {creditsRegistry.map((group, idx) => (
                  <a
                    key={group.id}
                    href={`#${group.id}`}
                    className="group block rounded-2xl px-4 py-3 border border-transparent hover:border-accent/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted group-hover:text-text transition-colors">
                        {String(idx + 1).padStart(2, '0')}. {group.category}
                      </span>
                      <span className="text-accent opacity-80 transition-opacity group-hover:opacity-100">
                        <ListChecks className="w-4 h-4" />
                      </span>
                    </div>
                  </a>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-accent mt-0.5" />
                  <div>
                    <p className="text-[9px] font-medium text-text-muted italic opacity-70 mb-2">
                      Pourquoi c’est important
                    </p>
                    <p className="text-sm text-text-muted/85 leading-relaxed italic">
                      Cette page valorise la chaîne technique utilisée pour rendre ekloud stable, rapide et maintenable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-9 space-y-10 pb-0">
            {/* Intro */}
            <section className="rounded-[1.8rem] bg-surface/30 border border-border/60 p-6 md:p-10">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="space-y-4">
                  <SmallPill>
                    <span className="text-accent font-black">credits</span>
                  </SmallPill>
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none font-equinox">
                    Crédits & fondations techniques
                  </h1>
                  <p className="text-text-muted/90 text-base md:text-lg leading-relaxed max-w-3xl">
                    Une liste claire des services et technologies qui construisent ekloud : interface, sécurité, performance, paiements et expérience visuelle.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <SmallPill>
                      <span className="font-bold text-text-muted/90">Lisibilité d’abord</span>
                    </SmallPill>
                    <SmallPill>
                      <span className="font-bold text-text-muted/90">Liens externes</span>
                    </SmallPill>
                    <SmallPill>
                      <span className="font-bold text-text-muted/90">Avec icônes</span>
                    </SmallPill>
                  </div>
                </div>

                <div className="shrink-0 hidden md:block">
                  <div className="px-5 py-4 rounded-[1.3rem] bg-accent/5 border border-accent/10 text-text-muted/80">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-accent" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">certified</p>
                        <p className="text-sm font-black uppercase tracking-wide text-text-muted/70">{nowYear}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile quick list */}
              <div className="mt-8 md:hidden">
                <div className="flex items-center gap-3 mb-4">
                  <Terminal className="w-4 h-4 text-accent" />
                  <p className="text-[10px] font-black uppercase tracking-widest italic text-text-muted">Sommaire</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {creditsRegistry.map((group, idx) => (
                    <a
                      key={group.id}
                      href={`#${group.id}`}
                      className="rounded-2xl px-4 py-3 border border-border/60 hover:border-accent/30 transition-colors flex items-center justify-between gap-4"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/90">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-text-muted/90 truncate">
                        {group.category}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </section>

            {/* Sections */}
            {creditsRegistry.map((group, groupIndex) => (
              <section key={group.id} id={group.id} className="scroll-mt-28">
                <div className="flex items-center gap-4 mb-4 md:mb-8">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-accent/5 border border-accent/10 text-accent">
                      {getGroupIcon(group.icon)}
                    </span>
                    <h2 className="text-[14px] md:text-[13px] font-black uppercase tracking-[0.35em] italic">
                      {String(groupIndex + 1).padStart(2, '0')} • {group.category}
                    </h2>
                  </div>
                  <div className="h-px w-full bg-border/20" />
                </div>

                <div className="rounded-[1.6rem] bg-surface/25 border border-border/60 p-5 md:p-8">
                  <p className="text-text-muted/90 leading-relaxed italic max-w-4xl">
                    {group.summary}
                  </p>

                  <div className="mt-6 space-y-3">
                    {group.items.map((item) => (
                      <article
                        key={item.link}
                        className="group rounded-2xl border border-border/60 bg-surface/30 hover:border-accent/30 transition-colors"
                      >
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 md:p-5"
                        >
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="text-2xl md:text-3xl font-black font-equinox tracking-tight text-text group-hover:text-accent transition-colors">
                                  {item.name}
                                </span>
                                <span className="text-[11px] font-bold tracking-widest uppercase text-text-muted/75">
                                  {item.role}
                                </span>
                              </div>
                              <p className="mt-2 text-sm md:text-base text-text-muted/90 leading-relaxed">
                                {item.description}
                              </p>
                            </div>

                            <div className="shrink-0 flex items-center gap-2 justify-start md:justify-end">
                              <span className="inline-flex items-center rounded-full border border-border/60 bg-surface/40 px-3 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-text-muted/75">
                                utilisé
                              </span>
                              <span className="inline-flex items-center gap-2 rounded-full bg-accent/5 border border-accent/10 px-3 py-2 text-accent/90">
                                <span className="text-[11px] font-black uppercase tracking-widest">ouvrir</span>
                                <ExternalLink className="w-4 h-4" />
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 h-px w-full bg-border/15 opacity-60 transition-opacity group-hover:opacity-100" />
                        </a>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            ))}

            {/* Licences */}
            <section className="rounded-[1.8rem] bg-surface/30 border border-border/60 p-6 md:p-10">
              <div className="flex items-center gap-4 mb-4 md:mb-8">
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-accent/5 border border-accent/10 text-accent">
                  <Shield className="w-4 h-4" />
                </span>
                <h2 className="text-[13px] font-black uppercase tracking-[0.45em] italic">Licences & attribution</h2>
                <div className="h-px w-full bg-border/20" />
              </div>

              <div className="space-y-3">
                <p className="text-base md:text-lg text-text-muted/90 leading-relaxed">
                  Les noms, marques et contenus appartiennent à leurs propriétaires respectifs. ekloud les cite uniquement pour expliciter la chaîne technique qui rend le produit possible.
                </p>
                <p className="text-base md:text-lg text-text-muted/90 leading-relaxed">
                  Cette page est une page d’hommage : elle documente les services tiers et les fondations techniques utilisées pour construire une expérience stable, rapide et maintenable.
                </p>
              </div>
            </section>

            <footer className="mt-8 pt-10 border-t border-border/10 w-full text-center">
              <div className="flex flex-col items-center gap-8">
                <Heart className="w-12 h-12 text-rose-500/80 animate-pulse" />
                <p className="text-xl md:text-3xl font-black text-text-muted/20 uppercase tracking-tight italic leading-tight max-w-2xl px-6">
                  Reconnaissance pour les fondations techniques d’ekloud.
                </p>

                <div className="flex items-center justify-center gap-8 pt-2">
                  <Sparkles size={16} className="text-accent opacity-30" />
                  <div className="px-10 py-4 bg-accent border border-accent rounded-full text-[12px] font-black uppercase tracking-[0.5em] text-background shadow-2xl shadow-accent/20">
                    merci
                  </div>
                  <Sparkles size={16} className="text-accent opacity-30 rotate-45" />
                </div>

                <div className="pt-2 flex items-center gap-3 opacity-60 italic">
                  <Terminal size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.35em] font-mono">
                    ekloud credits certified // {nowYear}
                  </span>
                  <Shield size={14} />
                </div>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}

