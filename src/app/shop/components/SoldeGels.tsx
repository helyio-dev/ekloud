import { Snowflake } from 'lucide-react';

export default function SoldeGels({ freezeGels }: { freezeGels: number | null | undefined }) {
  const gels = freezeGels ?? 0;

  return (
    <div className="fixed top-[92px] right-2 md:top-[100px] md:right-2 z-20">
      <div className="group relative inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-surface/40 backdrop-blur-md border border-border/60 rounded-xl shadow-lg shadow-background/20">
        {/* Glowy accent (léger) */}
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500/15 via-indigo-500/10 to-rose-500/15 opacity-0 group-hover:opacity-100 blur-[14px] transition-opacity pointer-events-none" />

        <div className="relative w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <Snowflake className="w-4 h-4 animate-spin-slow" />
        </div>

        <div className="relative text-right leading-tight">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/70">Solde de gels</p>
          <p className="text-lg sm:text-xl font-black text-text flex items-baseline justify-end gap-1">
            {gels}
            <span className="text-[10px] sm:text-[11px] font-semibold text-text-muted">gel{gels > 1 ? 's' : ''}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

