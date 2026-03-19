import { Link } from 'react-router-dom';
import { Heart, Coins, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import BackgroundParticles from '@/components/BackgroundParticles';

export default function SupportPage() {
    const [copied, setCopied] = useState<string | null>(null);

    const cryptoAddresses = [
        {
            name: 'MATIC (Polygon)',
            symbol: 'MATIC',
            address: '0xd5911d0Fe111B257465Ac322D906B54a7c23F585',
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
            border: 'border-purple-400/20'
        },
        {
            name: 'Stellar (XLM)',
            symbol: 'XLM',
            address: 'GACPNLMGB6ZTMMSMJJCWZWHYJFU263YQNIS6GXHEIVDIUWLOF5T6HWD3',
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
            border: 'border-blue-400/20'
        }
    ];

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <main className="min-h-screen pt-8 md:pt-32 pb-20 px-4 md:px-6 relative overflow-hidden bg-grid-pattern">
            <BackgroundParticles />
            
            <div className="max-w-4xl mx-auto relative z-10">
                <div className="text-center mb-16 space-y-4 animate-in fade-in slide-up duration-1000">
                    <div className="text-accent font-black tracking-[0.5em] uppercase text-sm">Soutenir le projet</div>
                    <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase">
                        Propulsez <span className="text-gradient drop-shadow-[0_0_30px_rgba(168,85,247,0.3)] font-equinox normal-case">EklouD</span> vers le futur
                    </h1>
                    <p className="text-text-muted text-base md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">

                        Chaque contribution nous permet de créer plus de contenu de qualité et d'améliorer la plateforme pour tout le monde.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-up duration-1000 delay-300 fill-mode-both">
                    {/* Liberapay Card */}
                    <div className="group relative p-6 md:p-8 rounded-2xl md:rounded-3xl bg-white/[0.01] border border-white/5 hover:border-rose-500/20 transition-all duration-500 flex flex-col items-center gap-6 glass-morphism">
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-center text-rose-500/50 group-hover:text-rose-500 group-hover:bg-rose-500/10 transition-all duration-500">
                            <Heart className="w-7 h-7 fill-current" />
                        </div>
                        <div className="space-y-1 text-center">
                            <h2 className="text-xl font-bold text-white/90 tracking-tight font-equinox">LIBERAPAY</h2>
                            <p className="text-text-muted text-sm font-medium">Soutien récurrent pour le projet.</p>
                        </div>
                        <a 
                            href="https://liberapay.com/Helyio/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full py-3.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-xl font-bold text-sm transition-all active:scale-95 text-center"
                        >
                            Soutenir
                        </a>
                    </div>

                    {/* Crypto Support Info */}
                    <div className="group relative p-6 md:p-8 rounded-2xl md:rounded-3xl bg-white/[0.01] border border-white/5 hover:border-accent/20 transition-all duration-500 flex flex-col items-center gap-6 glass-morphism">
                        <div className="w-14 h-14 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center text-accent/50 group-hover:text-accent group-hover:bg-accent/10 transition-all duration-500">
                            <Coins className="w-7 h-7" />
                        </div>
                        <div className="space-y-1 text-center">
                            <h2 className="text-xl font-bold text-white/90 tracking-tight font-equinox">CRYPTO</h2>
                            <p className="text-text-muted text-sm font-medium">MATIC ou XLM.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 w-full">
                            {cryptoAddresses.map((crypto) => (
                                <div key={crypto.symbol} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group/item">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${crypto.color}`}>{crypto.symbol}</span>
                                        <span className="text-[10px] font-mono text-white/40 truncate w-32 md:w-40">{crypto.address}</span>
                                    </div>
                                    <button 
                                        onClick={() => copyToClipboard(crypto.address, crypto.symbol)}
                                        className={`p-2 rounded-lg transition-all ${
                                            copied === crypto.symbol 
                                            ? 'bg-green-500/20 text-green-400' 
                                            : 'hover:bg-white/5 text-white/30 hover:text-white'
                                        }`}
                                    >
                                        {copied === crypto.symbol ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-20 text-center animate-in fade-in duration-1000 delay-700 fill-mode-both">
                    <Link to="/" className="text-text-muted/50 hover:text-accent font-bold text-xs tracking-[0.2em] uppercase transition-all">
                        ← RETOUR À L'ACCUEIL
                    </Link>
                </div>


            </div>
        </main>
    );
}
