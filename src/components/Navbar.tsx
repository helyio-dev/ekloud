import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Cloud, Layout, LogOut, Settings, Flame, Trophy, Menu, Users, User, BookOpen, Heart, MessageSquare } from 'lucide-react';
import { calculateLevelProgress, formatXP } from '@/lib/gamification';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
    const { user, isAdmin, isContributor, signOut, xp, streak, clan } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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
        <nav className="border-b border-white/5 bg-surface/50 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-2 md:gap-3 group">
                    <div className="bg-accent/10 p-2 rounded-xl border border-accent/20 group-hover:scale-110 transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        <Cloud className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                        <span className="text-xl font-bold tracking-tight group-hover:text-accent transition-colors duration-300 font-equinox">EKLOUD</span>
                        <span className="hidden md:block text-xs text-text-muted font-black border-l border-white/10 pl-2 opacity-70 group-hover:opacity-100 transition-opacity font-equinox uppercase tracking-widest">
                            Level UP YOUR TECH KNOWLEDGE
                        </span>
                    </div>
                </Link>

                <div className="flex items-center gap-6">
                    {/* Stats Section (Desktop Only) */}
                    {user && (
                        <div className="hidden lg:flex items-center gap-4 bg-background/50 border border-white/5 pl-4 pr-2 py-1.5 rounded-2xl">
                            <div title={`${streak} jours de suite !`} className="flex items-center gap-1.5 text-orange-400 font-bold text-sm">
                                <Flame className="w-4 h-4 fill-orange-400/20" />
                                {streak}
                            </div>
                            <div className="w-[1px] h-6 bg-white/10"></div>
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
                                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
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
                                <a
                                    href="https://discord.gg/WnwyMHm4Gc"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-xl transition-all"
                                >
                                    <MessageSquare className="w-4 h-4 fill-blue-400/20" />
                                    <span>Discord</span>
                                </a>
                                <Link
                                    to="/support"
                                    className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-xl transition-all"
                                >
                                    <Heart className="w-4 h-4 fill-rose-400/20" />
                                    <span>Soutenir</span>
                                </Link>
                                <Link to="/login" className="text-xs md:text-sm font-medium text-text-muted hover:text-text transition-colors">
                                    Connexion
                                </Link>
                                <Link to="/signup" className="px-4 py-2 md:px-5 md:py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs md:text-sm font-black transition-all shadow-lg shadow-accent/20 active:scale-95 hover:-translate-y-0.5">
                                    S'inscrire
                                </Link>
                            </>
                        ) : (
                            <div className="relative group/menu" ref={menuRef}>
                                <button 
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2 bg-surface hover:bg-surface/80 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all text-white shadow-lg"
                                >
                                    Menu
                                    <Menu className="w-4 h-4" />
                                </button>

                                {/* Dropdown Menu */}
                                <div 
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`fixed inset-x-4 top-[80px] md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-64 bg-[#09090b]/95 backdrop-blur-3xl md:bg-[#09090b] border border-white/10 rounded-[28px] md:rounded-2xl shadow-2xl overflow-y-auto max-h-[calc(100vh-100px)] md:max-h-none transition-all duration-300 transform z-50 ${isMenuOpen ? 'opacity-100 visible pointer-events-auto translate-y-0' : 'opacity-0 invisible pointer-events-none translate-y-4 md:translate-y-2'}`}
                                >
                                    <div className="p-2 flex flex-col gap-1">
                                        <Link to="/account" className="px-3 py-2 text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3">
                                            <User className="w-4 h-4 text-accent" />
                                            Compte
                                        </Link>
                                        <Link to="/courses" className="px-3 py-2 text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3">
                                            <BookOpen className="w-4 h-4 text-green-400" />
                                            Cours
                                        </Link>
                                        <Link to="/dashboard" className="px-3 py-2 text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3">
                                            <Layout className="w-4 h-4 text-accent" />
                                            Dashboard
                                        </Link>
                                        <Link to="/leaderboard" className="px-3 py-2 text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3">
                                            <Trophy className="w-4 h-4 text-yellow-500" />
                                            Classement
                                        </Link>
                                        <Link to="/friends" className="px-3 py-2 text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3">
                                            <Users className="w-4 h-4 text-blue-400" />
                                            Amis
                                        </Link>

                                        <div className="h-[1px] w-full bg-white/5 my-1"></div>

                                        <Link to="/clan-quiz" className="px-3 py-2 text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3">
                                            <span className={`w-4 h-4 rounded-full border border-white/20 flex-shrink-0 ${clan === 'ROOT' ? 'bg-orange-400' :
                                                    clan === 'VOID' ? 'bg-violet-400' :
                                                        clan === 'CORE' ? 'bg-blue-400' :
                                                            clan === 'CYPHER' ? 'bg-green-400' : 'bg-red-500'
                                                }`} />
                                            {clan ? (
                                                <span>TechSquad {clan}</span>
                                            ) : (
                                                <span className="text-red-500">TechSquad inactive</span>
                                            )}
                                        </Link>

                                        <div className="h-[1px] w-full bg-white/5 my-1"></div>

                                        {(isAdmin || isContributor) && (
                                            <>
                                                <Link to="/admin" className="px-3 py-2 text-sm font-medium text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3">
                                                    <Settings className="w-4 h-4 text-purple-400" />
                                                    {isAdmin ? 'Administration' : 'Contribution'}
                                                </Link>
                                                <div className="h-[1px] w-full bg-white/5 my-1"></div>
                                            </>
                                        )}

                                        <a
                                            href="https://discord.gg/WnwyMHm4Gc"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors flex items-center gap-3"
                                        >
                                            <MessageSquare className="w-4 h-4 fill-blue-400/20" />
                                            Rejoindre le Discord
                                        </a>

                                        <Link
                                            to="/support"
                                            className="px-3 py-2 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-lg transition-colors flex items-center gap-3"
                                        >
                                            <Heart className="w-4 h-4 fill-rose-400/20" />
                                            Soutenir le projet
                                        </Link>

                                        <div className="h-[1px] w-full bg-white/5 my-1"></div>

                                        <button
                                            onClick={() => signOut()}
                                            className="w-full text-left px-3 py-2 text-sm font-medium text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-3"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Déconnexion
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
