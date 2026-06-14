import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Cloud, Layout, LogOut, Settings, Flame, Trophy, Menu, Users, BookOpen, Heart, MessageSquare, Mail, Check, Sun, Moon, Info, Shield, Hash } from 'lucide-react';
import { calculateLevelProgress, formatXP } from '@/lib/gamification';
import { useState, useRef, useEffect } from 'react';

/**
 * barre de navigation principale de l'application.
 * gère l'affichage des statistiques de progression, le changement de thème et l'accès au menu utilisateur.
 */
export default function Navbar() {
    const { user, isAdmin, isContributor, signOut, xp, streak, clan } = useAuth();
    const { mode, toggleMode } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // fermeture automatique du menu lors d'un clic en dehors de son conteneur
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // calcul des données de progression basé sur l'xp actuelle
    const { progress, currentLevelXp, requiredXpForNext, level: currentLevel } = calculateLevelProgress(xp || 0);

    return (
        <nav className="border-b border-border bg-surface sticky top-0 z-50 px-4 md:px-6 py-5 font-sans shadow-lg">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                
                {/* identité visuelle et logo ekloud */}
                <Link to="/" className="flex items-center gap-2 md:gap-3 group">
                    <div className="bg-accent/10 p-2.5 rounded-xl border border-accent/20 group-hover:scale-110 transition-all duration-700 group-hover:shadow-[0_0_25px_var(--accent-glow)]">
                        <Cloud className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center md:gap-3">
                        <span className="text-xl font-black tracking-tight group-hover:text-accent transition-colors duration-300 font-equinox uppercase">EKLOUD</span>
                        <span className="hidden lg:block text-[10px] text-text-muted font-black border-l border-border pl-3 opacity-60 group-hover:opacity-100 transition-opacity font-equinox uppercase tracking-[0.2em] whitespace-nowrap">
                            level up your tech knowledge
                        </span>
                    </div>
                </Link>

                <div className="flex items-center gap-6">
                    {/* affichage des paliers de progression (desktop) */}
                    {user && (
                        <div className="hidden lg:flex items-center gap-5 bg-background border border-border/60 pl-5 pr-3 py-2.5 rounded-2xl shadow-inner group/stats hover:border-accent/40 transition-colors">
                            <div title={`${streak} jours de série consécutive`} className="flex items-center gap-2 text-orange-500 font-black text-xs tracking-tight">
                                <Flame className="w-4 h-4 fill-orange-500/20 group-hover/stats:scale-110 transition-transform" />
                                {streak}
                            </div>
                            <div className="w-[1px] h-6 bg-border/40" />
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 border border-accent/20 text-accent font-black text-xs shadow-sm">
                                    {currentLevel}
                                </div>
                                <div className="flex flex-col w-36">
                                    <div className="flex justify-between text-[9px] text-text-muted font-black uppercase tracking-widest mb-1.5 opacity-70">
                                        <span>expérience</span>
                                        <span>{formatXP(currentLevelXp)} / {formatXP(requiredXpForNext)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-surface-hover/30 rounded-full overflow-hidden p-[2px] border border-border/40">
                                        <div className="h-full bg-accent rounded-full relative transition-all duration-1000 shadow-[0_0_10px_var(--accent-glow)]" style={{ width: `${progress}%` }}>
                                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        {/* boutons d'accès utilisateur (invité) */}
                        {!user && (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text transition-colors">
                                    connexion
                                </Link>
                                <Link to="/signup" className="px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 hover:shadow-[0_0_20px_var(--accent-glow)]">
                                    rejoindre
                                </Link>
                            </div>
                        )}

                        {/* sélecteur de mode visuel (sombre/clair) */}
                        <button
                            onClick={toggleMode}
                            className="p-3 rounded-xl bg-background hover:bg-surface-hover border border-border text-text-muted hover:text-text transition-all duration-300 shadow-sm active:scale-90"
                            aria-label="changer de thème"
                        >
                            {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>

                        {/* menu interactif utilisateur (connecté) */}
                        {user && (
                            <div className="relative" ref={menuRef}>
                                <button 
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className={`flex items-center gap-3 border px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${isMenuOpen ? 'bg-accent border-accent text-white shadow-accent/20' : 'bg-background hover:bg-surface-hover border-border text-text hover:border-accent/40'}`}
                                >
                                    menu
                                    <Menu size={14} className={isMenuOpen ? 'rotate-90 transition-transform' : ''} />
                                </button>

                                {/* menu déroulant enrichi */}
                                <div className={`fixed inset-x-4 top-[85px] md:absolute md:inset-auto md:right-0 md:top-full md:mt-4 md:w-80 bg-surface border border-border/80 rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] transition-all duration-500 transform z-50 overflow-hidden ${isMenuOpen ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible translate-y-4 scale-95 md:translate-y-2'}`}>
                                    <div className="p-5 flex flex-col gap-6">
                                        
                                        {/* navigation par tuiles interactives */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <Link onClick={() => setIsMenuOpen(false)} to="/courses" className="group/tile flex flex-col items-center justify-center gap-2.5 p-4 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                                <div className="p-2.5 bg-emerald-500/10 rounded-xl group-hover/tile:scale-110 transition-transform shadow-inner">
                                                    <BookOpen size={20} className="text-emerald-500" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted group-hover/tile:text-emerald-500">cours</span>
                                            </Link>

                                            <Link onClick={() => setIsMenuOpen(false)} to="/dashboard" className="group/tile flex flex-col items-center justify-center gap-2.5 p-4 bg-accent/5 hover:bg-accent/10 border border-accent/10 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                                <div className="p-2.5 bg-accent/10 rounded-xl group-hover/tile:scale-110 transition-transform shadow-inner">
                                                    <Layout size={20} className="text-accent" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted group-hover/tile:text-accent">progrès</span>
                                            </Link>

                                            <Link onClick={() => setIsMenuOpen(false)} to="/clan-quiz" className="group/tile flex flex-col items-center justify-center gap-2.5 p-4 bg-surface/40 hover:bg-surface-hover border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                                <div className={`p-2.5 rounded-xl group-hover/tile:scale-110 transition-transform shadow-inner ${
                                                    clan === 'ROOT' ? 'bg-orange-500/20 text-orange-400' : 
                                                    clan === 'VOID' ? 'bg-violet-500/20 text-violet-400' : 
                                                    clan === 'CORE' ? 'bg-blue-500/20 text-blue-400' : 
                                                    clan === 'CYPHER' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                    <Shield size={20} className="fill-current/10" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted group-hover/tile:text-text">squad</span>
                                            </Link>

                                            <Link onClick={() => setIsMenuOpen(false)} to="/leaderboard" className="group/tile flex flex-col items-center justify-center gap-2.5 p-4 bg-yellow-600/5 hover:bg-yellow-600/10 border border-yellow-600/10 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                                <div className="p-2.5 bg-yellow-600/10 rounded-xl group-hover/tile:scale-110 transition-transform shadow-inner">
                                                    <Trophy size={20} className="text-yellow-600" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted group-hover/tile:text-yellow-600">classe</span>
                                            </Link>

                                            <Link onClick={() => setIsMenuOpen(false)} to="/friends" className="group/tile flex flex-col items-center justify-center gap-2.5 p-4 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                                <div className="p-2.5 bg-blue-500/10 rounded-xl group-hover/tile:scale-110 transition-transform shadow-inner">
                                                    <Users size={20} className="text-blue-500" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted group-hover/tile:text-blue-500">amis</span>
                                            </Link>

                                            <Link onClick={() => setIsMenuOpen(false)} to="/settings" className="group/tile flex flex-col items-center justify-center gap-2.5 p-4 bg-surface/40 hover:bg-surface-hover border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                                <div className="p-2.5 bg-surface-hover rounded-xl group-hover/tile:scale-110 transition-transform shadow-inner">
                                                    <Settings size={20} className="text-text-muted group-hover:rotate-90 transition-transform duration-700" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted group-hover/tile:text-text">param.</span>
                                            </Link>
                                        </div>

                                        {/* liens de service et support */}
                                        <div className="space-y-1.5 pt-4 border-t border-border/40">
                                            <a href="https://discord.gg/WnwyMHm4Gc" target="_blank" rel="noopener noreferrer" className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-blue-400 hover:bg-blue-400/5 rounded-2xl transition-all flex items-center gap-4 group">
                                                <MessageSquare size={16} className="text-blue-500/60 group-hover:text-blue-500" />
                                                communauté
                                            </a>
                                            <Link onClick={() => setIsMenuOpen(false)} to="/support" className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-rose-500 hover:bg-rose-500/5 rounded-2xl transition-all flex items-center gap-4 group">
                                                <Heart size={16} className="text-rose-500/60 group-hover:text-rose-500 fill-rose-500/10" />
                                                contribuer
                                            </Link>
                                            <Link onClick={() => setIsMenuOpen(false)} to="/credits" className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-indigo-400 hover:bg-indigo-400/5 rounded-2xl transition-all flex items-center gap-4 group">
                                                {copied ? "info copiée !" : "aide & support"}
                                            </Link>
                                            
                                            {/* outils d'administration conditionnels */}
                                            {(isAdmin || isContributor) && (
                                                <Link onClick={() => setIsMenuOpen(false)} to="/admin" className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 bg-purple-500/5 hover:bg-purple-500/10 rounded-2xl transition-all flex items-center gap-4 border border-purple-500/10 mt-3 group">
                                                    <Shield size={16} className="group-hover:scale-110 transition-transform" />
                                                    {isAdmin ? 'administration' : 'contribution'}
                                                </Link>
                                            )}
                                        </div>

                                        {/* action de déconnexion sécurisée */}
                                        <button
                                            onClick={() => { setIsMenuOpen(false); signOut(); }}
                                            className="w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-[1.5rem] transition-all flex items-center justify-between group bg-surface-hover/20"
                                        >
                                            <div className="flex items-center gap-4">
                                                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                                                terminer
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-red-500/30 group-hover:bg-red-500 group-hover:shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
