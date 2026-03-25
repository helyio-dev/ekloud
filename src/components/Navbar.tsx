import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Cloud, Layout, LogOut, Settings, Flame, Trophy, Menu, Users, User, BookOpen, Heart, MessageSquare, Mail, Check, Sun, Moon, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { calculateLevelProgress, formatXP } from '@/lib/gamification';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
    const { user, isAdmin, isContributor, signOut, xp, streak, clan } = useAuth();
    const { mode, toggleMode } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({ academie: true, commu: false, assistance: false });
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleCat = (cat: string) => {
        setExpandedCats(prev => ({
            ...prev,
            [cat]: !prev[cat]
        }));
    };

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const { progress, currentLevelXp, requiredXpForNext, level: currentLevel } = calculateLevelProgress(xp || 0);

    return (
        <nav className="border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-2 md:gap-3 group">
                    <div className="bg-accent/10 p-2 rounded-xl border border-accent/20 group-hover:scale-110 transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        <Cloud className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                        <span className="text-xl font-bold tracking-tight group-hover:text-accent transition-colors duration-300 font-equinox">EKLOUD</span>
                        <span className="hidden md:block text-xs text-text-muted font-black border-l border-border pl-2 opacity-90 group-hover:opacity-100 transition-opacity font-equinox uppercase tracking-widest">
                            Level UP YOUR TECH KNOWLEDGE
                        </span>
                    </div>
                </Link>

                <div className="flex items-center gap-6">
                    {/* Stats Section (Desktop Only) */}
                    {user && (
                        <div className="hidden lg:flex items-center gap-4 bg-background/50 border border-border/50 pl-4 pr-2 py-1.5 rounded-2xl">
                            <div title={`${streak} jours de suite !`} className="flex items-center gap-1.5 text-orange-500 font-bold text-sm">
                                <Flame className="w-4 h-4 fill-orange-500/20" />
                                {streak}
                            </div>
                            <div className="w-[1px] h-6 bg-border/50"></div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 border border-accent/30 text-accent font-black text-sm">
                                    {currentLevel}
                                </div>
                                <div className="flex justify-center flex-col w-32">
                                    <div className="flex justify-between text-[10px] text-text-muted font-bold mb-1">
                                        <span>XP</span>
                                        <span>{formatXP(currentLevelXp)} / {formatXP(requiredXpForNext)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent relative"
                                            style={{ width: `${progress}%` }}
                                        >
                                            <div className="absolute inset-0 bg-accent/20 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right Section: Menu or Login */}
                    <div className="flex items-center gap-2 md:gap-3">
                        {!user ? (
                            <>
                                <Link to="/login" className="text-xs md:text-sm font-medium text-text-muted hover:text-text transition-colors">
                                    Connexion
                                </Link>
                                <Link to="/signup" className="px-4 py-2 md:px-5 md:py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs md:text-sm font-black transition-all shadow-lg shadow-accent/20 active:scale-95 hover:-translate-y-0.5">
                                    S'inscrire
                                </Link>
                            </>
                        ) : null}

                        <button
                            onClick={toggleMode}
                            className="p-2.5 rounded-xl bg-surface hover:bg-surface/80 border border-border text-text-muted hover:text-text transition-all duration-300"
                            title={mode === 'light' ? 'Mode Sombre' : 'Mode Clair'}
                        >
                            {mode === 'light' ? <Moon className="w-5 h-5 flex-shrink-0" /> : <Sun className="w-5 h-5 flex-shrink-0" />}
                        </button>

                        {user && (
                            <div className="relative group/menu" ref={menuRef}>
                                <button 
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2 bg-surface hover:bg-surface/80 border border-border px-4 py-2 rounded-xl text-sm font-bold transition-all text-text shadow-lg"
                                >
                                    Menu
                                    <Menu className="w-4 h-4" />
                                </button>

                                {/* Dropdown Menu */}
                                <div 
                                    className={`fixed inset-x-4 top-[80px] md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-80 bg-surface/95 backdrop-blur-3xl md:bg-surface border border-border rounded-[32px] md:rounded-2xl shadow-2xl transition-all duration-300 transform z-50 ${isMenuOpen ? 'opacity-100 visible pointer-events-auto translate-y-0' : 'opacity-0 invisible pointer-events-none translate-y-4 md:translate-y-2'}`}
                                >
                                    <div className="p-4 flex flex-col gap-5">
                                        
                                        {/* Main Grid Apps */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <Link 
                                                onClick={() => setIsMenuOpen(false)} 
                                                to="/courses" 
                                                className="group/tile flex flex-col items-center justify-center gap-2 p-3 bg-green-500/5 hover:bg-green-500/10 border border-green-500/10 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/10"
                                            >
                                                <div className="p-2.5 bg-green-500/10 rounded-xl group-hover/tile:scale-110 transition-transform">
                                                    <BookOpen className="w-5 h-5 text-green-500" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-text-muted group-hover/tile:text-green-500 transition-colors">Cours</span>
                                            </Link>

                                            <Link 
                                                onClick={() => setIsMenuOpen(false)} 
                                                to="/dashboard" 
                                                className="group/tile flex flex-col items-center justify-center gap-2 p-3 bg-accent/5 hover:bg-accent/10 border border-accent/10 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/10"
                                            >
                                                <div className="p-2.5 bg-accent/10 rounded-xl group-hover/tile:scale-110 transition-transform">
                                                    <Layout className="w-5 h-5 text-accent" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-text-muted group-hover/tile:text-accent transition-colors">Progrès</span>
                                            </Link>

                                            <Link 
                                                onClick={() => setIsMenuOpen(false)} 
                                                to="/clan-quiz" 
                                                className="group/tile flex flex-col items-center justify-center gap-2 p-3 bg-surface/30 hover:bg-surface-hover border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                            >
                                                <div className={`p-2.5 rounded-xl group-hover/tile:scale-110 transition-transform ${
                                                    clan === 'ROOT' ? 'bg-orange-500/20 text-orange-400 shadow-[0_0_15px_-4px_rgba(249,115,22,0.4)]' : 
                                                    clan === 'VOID' ? 'bg-violet-500/20 text-violet-400 shadow-[0_0_15px_-4px_rgba(167,139,250,0.4)]' : 
                                                    clan === 'CORE' ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_-4px_rgba(59,130,246,0.4)]' : 
                                                    clan === 'CYPHER' ? 'bg-green-500/20 text-green-400 shadow-[0_0_15px_-4px_rgba(34,197,94,0.4)]' : 
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                    <Shield className="w-5 h-5 fill-current/10" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-text-muted group-hover/tile:text-text transition-colors">Squad</span>
                                            </Link>

                                            <Link 
                                                onClick={() => setIsMenuOpen(false)} 
                                                to="/leaderboard" 
                                                className="group/tile flex flex-col items-center justify-center gap-2 p-3 bg-yellow-600/5 hover:bg-yellow-600/10 border border-yellow-600/10 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-600/10"
                                            >
                                                <div className="p-2.5 bg-yellow-600/10 rounded-xl group-hover/tile:scale-110 transition-transform">
                                                    <Trophy className="w-5 h-5 text-yellow-600" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-text-muted group-hover/tile:text-yellow-600 transition-colors">Class.</span>
                                            </Link>

                                            <Link 
                                                onClick={() => setIsMenuOpen(false)} 
                                                to="/friends" 
                                                className="group/tile flex flex-col items-center justify-center gap-2 p-3 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10"
                                            >
                                                <div className="p-2.5 bg-blue-500/10 rounded-xl group-hover/tile:scale-110 transition-transform">
                                                    <Users className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-text-muted group-hover/tile:text-blue-500 transition-colors">Amis</span>
                                            </Link>

                                            <Link 
                                                onClick={() => setIsMenuOpen(false)} 
                                                to="/settings" 
                                                className="group/tile flex flex-col items-center justify-center gap-2 p-3 bg-surface/30 hover:bg-surface-hover border border-border rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                            >
                                                <div className="p-2.5 bg-surface-hover rounded-xl group-hover/tile:scale-110 transition-transform">
                                                    <Settings className="w-5 h-5 text-text-muted group-hover:rotate-45 transition-transform duration-500" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-text-muted group-hover/tile:text-text transition-colors">Param.</span>
                                            </Link>
                                        </div>

                                        {/* Bottom Actions Section */}
                                        <div className="space-y-3 pt-2 border-t border-border/50">
                                            <div className="flex flex-col gap-1">
                                                <a 
                                                    href="https://discord.gg/WnwyMHm4Gc" 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/5 rounded-xl transition-colors flex items-center gap-3"
                                                >
                                                    <MessageSquare className="w-4 h-4 fill-current/10" />
                                                    Rejoindre le Discord
                                                </a>
                                                <Link onClick={() => setIsMenuOpen(false)} to="/support" className="px-3 py-2 text-xs font-bold text-text-muted hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-colors flex items-center gap-3">
                                                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                                                    Soutenir le projet
                                                </Link>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText('contact@ekoud.qzz.io');
                                                        setCopied(true);
                                                        setTimeout(() => setCopied(false), 2000);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-xs font-bold text-text-muted hover:text-emerald-400 hover:bg-emerald-400/5 rounded-xl transition-colors flex items-center gap-3"
                                                >
                                                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Mail className="w-4 h-4 text-emerald-500" />}
                                                    {copied ? "Adresse copiée !" : "Contacter le support"}
                                                </button>
                                                
                                                {(isAdmin || isContributor) && (
                                                    <Link onClick={() => setIsMenuOpen(false)} to="/admin" className="px-3 py-2 text-xs font-black text-purple-600 dark:text-purple-400 hover:bg-purple-400/5 rounded-xl transition-colors flex items-center gap-3 border-t border-border mt-2 pt-2">
                                                        <Settings className="w-4 h-4" />
                                                        {isAdmin ? 'ADMINISTRATION' : 'CONTRIBUTION'}
                                                    </Link>
                                                )}
                                            </div>

                                            {/* Logout Footer */}
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    signOut();
                                                }}
                                                className="w-full text-left px-4 py-3 text-xs font-black text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                                    DÉCONNEXION
                                                </div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-400/50" />
                                            </button>
                                        </div>
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
