import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Mail, Globe, Scale } from 'lucide-react';

export default function LegalPage() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const existing = document.querySelector('meta[name="robots"]');
    if (existing) existing.remove();

    const meta = document.createElement('meta');
    meta.setAttribute('name', 'robots');
    meta.setAttribute('content', 'noindex,nofollow');
    document.head.appendChild(meta);

    const t = window.setTimeout(() => setHidden(false), 1500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-text selection:bg-accent/20 font-sans leading-relaxed selection:text-white lowercase scroll-smooth">
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
            <div className="h-4 w-px bg-border hidden md:block" />
            <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest bg-accent-glow/5 border border-accent/10 px-3 py-1 rounded-full text-accent">
              Status : Active v3.0 FIX
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-12 md:pt-20 pb-0">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl md:text-6xl font-black text-text mb-6 uppercase tracking-tighter leading-none italic">
              Mentions légales
            </h1>
            <p className="text-text-muted text-xl leading-relaxed italic opacity-80 decoration-accent/20 underline underline-offset-8">
              Informations relatives à l’éditeur, au contact et à l’hébergement.
            </p>

            <div className="mt-8 p-6 bg-surface border border-border rounded-3xl flex items-center gap-6 group hover:border-accent/40 transition-colors">
              <FileText className="w-8 h-8 text-accent shrink-0" />
              <p className="text-xs font-bold leading-relaxed">
                accès public, mais non indexé.
              </p>
            </div>
          </div>

          <div
            className={`space-y-8 p-8 bg-surface/40 border border-border rounded-3xl shadow-2xl shadow-black/10 transition-opacity duration-500 ${hidden ? 'opacity-0' : 'opacity-100'}`}
            aria-label="contenu mentions légales"
          >
            {/* 01. Éditeur */}
            <section className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-black text-text uppercase tracking-tight flex items-center gap-4 italic underline underline-offset-2 decoration-accent/20">
                01. Éditeur du service
              </h2>
              <div className="pl-6 md:pl-10 border-l border-border space-y-4 text-base md:text-lg italic text-text-muted">
                <div className="flex items-start gap-3">
                  <Scale className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-accent uppercase tracking-widest">Identité</p>
                    <p>Lilian Auzimour</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-accent uppercase tracking-widest">Statut juridique</p>
                    <p>Entrepreneur Individuel (EI)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-accent uppercase tracking-widest">SIRET</p>
                    <p>10683353600019</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-accent uppercase tracking-widest">Siège social</p>
                    <p>18 rue du stade, 65800 Orleix</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 02. Contact */}
            <section className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-black text-text uppercase tracking-tight flex items-center gap-4 italic underline underline-offset-2 decoration-accent/20">
                02. Contact
              </h2>
              <div className="pl-6 md:pl-10 border-l border-border space-y-4 text-base md:text-lg italic text-text-muted">
                <div className="p-4 bg-surface border border-border rounded-2xl flex items-start gap-4">
                  <Mail className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Email webmaster</p>
                    <p className="mt-1">helyio.pro@gmail.com</p>
                  </div>
                </div>
                <div className="p-4 bg-surface border border-border rounded-2xl flex items-start gap-4">
                  <Mail className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Email support</p>
                    <p className="mt-1">ekloud.support@gmail.com</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 03. Hébergement */}
            <section className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-black text-text uppercase tracking-tight flex items-center gap-4 italic underline underline-offset-2 decoration-accent/20">
                03. Hébergement
              </h2>
              <div className="pl-6 md:pl-10 border-l border-border space-y-4 text-base md:text-lg italic text-text-muted">
                <div className="p-4 bg-surface border border-border rounded-2xl flex items-start gap-4">
                  <Globe className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Hébergeur</p>
                    <p className="mt-1">Cloudflare, Inc.</p>
                  </div>
                </div>
                <div className="p-4 bg-surface border border-border rounded-2xl flex items-start gap-4">
                  <Globe className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Adresse</p>
                    <p className="mt-1">101 Townsend St, San Francisco, CA 94107, États-Unis</p>
                  </div>
                </div>
                <div className="p-4 bg-surface border border-border rounded-2xl flex items-start gap-4">
                  <Globe className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Contact hébergeur</p>
                    <p className="mt-1">+1 (888) 993 5273</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="pt-6 border-t border-border/60 text-center opacity-60">
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">Kloud Team</p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em]">dernière révision : 29/06/2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


