import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Zap, Gift, RefreshCcw, ShieldCheck, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import SoldeGels from './components/SoldeGels';

/**
 * Configuration des packs de gels et récupération de streak
 */
const STREAK_RECOVERY = {
  name: 'Récupérateur de streak',
  price: '1.99€',
  description: "Permet de restaurer instantanément votre série (streak) d'apprentissage qui vient d'être brisée. Votre historique est intégralement récupéré.",
  stripeUrl: 'https://buy.stripe.com/7sY6oH3xI0Dp86O8csaEE04',
  icon: RefreshCcw,
};

const GEL_PACKS = [
  {
    id: 'ping',
    name: 'Pack PING',
    price: '0.99€',
    gels: 1,
    description: "Sécurisez votre progression. Contient 1 gel de série pour Ekloud. S'active automatiquement pour bloquer le reset de votre streak en cas d'absence d'une journée.",
    stripeUrl: 'https://buy.stripe.com/fZu00j0lwbi35YG1O4aEE00',
    icon: Zap,
    popular: false,
    badgeColor: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30',
    glowColor: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:border-cyan-500/40',
  },
  {
    id: 'reboot',
    name: 'Pack REBOOT',
    price: '2.49€',
    gels: 3,
    description: "Partez l'esprit tranquille. Contient 3 gels de série pour Ekloud. Permet de geler votre streak pendant un week-end complet ou une courte absence sans perdre votre historique.",
    stripeUrl: 'https://buy.stripe.com/28E28r0lw5XJ86OgIYaEE01',
    icon: RefreshCcw,
    popular: false,
    badgeColor: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30',
    glowColor: 'group-hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:border-indigo-500/40',
  },
  {
    id: 'afk',
    name: 'Pack AFK',
    price: '3.99€',
    gels: 5,
    description: "Le mode vacances activé. Contient 5 gels de série pour Ekloud. Parfait pour décrocher des écrans pendant une semaine complète sans ruiner des mois d'efforts.",
    stripeUrl: 'https://buy.stripe.com/14A00j8S25XJ72K64kaEE02',
    icon: Sparkles,
    popular: true,
    badgeColor: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
    glowColor: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.2)] hover:border-rose-500/50',
  },
  {
    id: 'overclock',
    name: 'Pack OVERCLOCK',
    price: '6.99€',
    gels: 10,
    description: "Le kit de secours ultime. Contient 10 gels de série pour Ekloud, parfait pour se déconnecter après une série d'apprentissage sur la plateforme.",
    stripeUrl: 'https://buy.stripe.com/3cI6oHd8igCn0EmeAQaEE03',
    icon: ShieldCheck,
    popular: false,
    badgeColor: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
    glowColor: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:border-amber-500/40',
  },
];

export default function Shop() {
  const { user, freezeGels, streak, lostStreak } = useAuth();
  // Guard: si lostStreak = 0 => bouton désactivé (impossible d'acheter)
  const hasLostStreak = (lostStreak ?? 0) > 0;


  const [redirecting, setRedirecting] = useState<string | null>(null);

  const handleCheckoutRedirect = (url: string, id: string) => {
    if (!user) return;
    setRedirecting(id);
    // On passe le client_reference_id dans l'URL pour associer le paiement à l'utilisateur
    const checkoutUrl = new URL(url);
    checkoutUrl.searchParams.set('client_reference_id', user.id);
    window.location.href = checkoutUrl.toString();
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10 space-y-16">
        {/* Header */}
        <header className="relative">
          <div className="flex items-start justify-center">
            <div className="w-full max-w-3xl text-center space-y-6">
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-text uppercase bg-clip-text bg-gradient-to-r from-text via-text to-text-muted">
                BOUTIQUE EKLOUD
              </h1>
              <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
                Soutenez le développement d'Ekloud tout en protégeant vos séries d'apprentissage grâce à nos packs et outils de secours.
              </p>
            </div>
          </div>

          {/* Solde Actuel déplacé en haut à droite (fixed) */}
          <SoldeGels freezeGels={freezeGels} />

        </header>

        {/* Streak Recovery Section */}
        <section className={`relative overflow-hidden p-8 rounded-2xl backdrop-blur-md border shadow-lg transition-all duration-500 ${
          hasLostStreak
            ? 'bg-surface/30 border-emerald-500/30 shadow-emerald-500/5 group hover:border-emerald-500/50'
            : 'bg-surface/20 border-border/30 opacity-60'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-start gap-5 max-w-2xl">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 transition-transform ${
                hasLostStreak
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:scale-105'
                  : 'bg-white/5 border-white/10 text-text-muted'
              }`}>
                <RefreshCcw className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-2xl font-black tracking-tight text-text uppercase">
                    {STREAK_RECOVERY.name}
                  </h3>
                  {hasLostStreak ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                      Secours Instantané
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase text-text-muted tracking-wider">
                      Non disponible
                    </span>
                  )}
                </div>

                <p className="text-sm text-text-muted leading-relaxed">
                  {STREAK_RECOVERY.description}
                </p>

                {hasLostStreak ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400/80 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-lg w-fit">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Vous avez perdu votre série — la récupération est disponible !</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-lg w-fit">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Votre série est active — la récupération n'est pas nécessaire pour le moment.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-white/5">
              <div className="text-left md:text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60">Prix Unique</p>
                <p className={`text-4xl font-black ${hasLostStreak ? 'text-emerald-400' : 'text-text-muted/40'}`}>{STREAK_RECOVERY.price}</p>
              </div>

              <button
                onClick={() => handleCheckoutRedirect(STREAK_RECOVERY.stripeUrl, 'streak_recovery')}
                disabled={!hasLostStreak || redirecting !== null}
                className={`px-8 h-12 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs transition-all duration-300 disabled:cursor-not-allowed ${
                  hasLostStreak
                    ? 'bg-emerald-500 text-white hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-50'
                    : 'bg-white/5 border border-white/10 text-text-muted/50'
                }`}
              >
                {redirecting === 'streak_recovery' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : hasLostStreak ? (
                  <>Restaurer ma série <ArrowRight className="w-3.5 h-3.5" /></>
                ) : (
                  <>Série active</>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Gel Packs Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-cyan-500 rounded-full" />
            <h2 className="text-2xl font-black tracking-tight text-text uppercase">
              Packs de Gels
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {GEL_PACKS.map((pack) => {
              const Icon = pack.icon;
              const isCurrentRedirecting = redirecting === pack.id;
              return (
                <div
                  key={pack.id}
                  className={`group relative flex flex-col justify-between p-6 rounded-2xl bg-surface/30 backdrop-blur-md border transition-all duration-500 ${
                    pack.popular
                      ? 'border-rose-500/40 shadow-lg shadow-rose-500/5 ring-1 ring-rose-500/20'
                      : 'border-border/50 hover:border-cyan-500/30'
                  } ${pack.glowColor}`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-rose-500/20 animate-pulse">
                      Recommandé
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pack.badgeColor} border flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-text-muted">
                        +{pack.gels} Gel{pack.gels > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-black uppercase tracking-tight text-text group-hover:text-cyan-400 transition-colors">
                        {pack.name}
                      </h3>
                      <p className="text-xs text-text-muted leading-relaxed min-h-[64px]">
                        {pack.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/5 space-y-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-text">{pack.price.replace('€', '')}</span>
                      <span className="text-sm font-bold text-text-muted">€</span>
                    </div>

                    <button
                      onClick={() => handleCheckoutRedirect(pack.stripeUrl, pack.id)}
                      disabled={redirecting !== null}
                      className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs transition-all duration-300 ${
                        pack.popular
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:brightness-110 active:scale-95 shadow-lg shadow-rose-500/20'
                          : 'bg-white/5 border border-white/10 text-text hover:bg-white/10 hover:border-cyan-500/30 active:scale-95'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isCurrentRedirecting ? (
                        <div className="w-4 h-4 border-2 border-text border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>Acheter <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}