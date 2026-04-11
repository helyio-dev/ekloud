import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, Trophy, Flame, Zap, Shield, Globe, UserX, ArrowLeft, Share2, Sparkles } from 'lucide-react';
import { formatXP } from '@/lib/gamification';

type Profile = {
    id: string;
    username: string;
    xp: number;
    level: number;
    streak: number;
    clan: string | null;
    created_at: string;
};

export default function PublicProfilePage() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    useEffect(() => {
        async function fetchPublicData() {
            if (!username) return;
            setIsLoading(true);
            try {
                // 1. récupérer le profil par le pseudo
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', username)
                    .single();

                if (profileError || !profileData) {
                    setError(true);
                } else {
                    setProfile(profileData);
                }
            } catch (err) {
                console.error("Error fetching public profile:", err);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPublicData();
    }, [username]);

    useEffect(() => {
        // désactiver le défilement sur le body lorsque le profil public est monté
        document.body.style.overflow = 'hidden';
        
        // réactiver le défilement lorsque le composant est démonté
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setNotification({ message: "Lien copié dans le presse-papier !", type: 'success' });
        setTimeout(() => setNotification(null), 3000);
    };

    if (isLoading) {
        return (
            <div className="h-screen bg-background flex flex-col items-center justify-center gap-4 overflow-hidden">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
                <p className="text-text-muted font-medium animate-pulse">Chargement du profil...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-8 overflow-hidden">
                <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20">
                    <UserX className="w-12 h-12 text-red-500" />
                </div>
                <div className="space-y-3">
                    <h1 className="text-4xl font-black font-equinox uppercase">Hacker introuvable</h1>
                    <p className="text-text-muted max-w-md mx-auto">Ce pseudo ne correspond à aucune base de données connue du réseau Ekloud.</p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="px-8 py-4 bg-surface hover:bg-surface-hover border border-border rounded-2xl flex items-center gap-3 text-text font-bold transition-all"
                >
                    <ArrowLeft className="w-5 h-5" /> RETOUR AU RÉSEAU
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            {/* en-tête / carte de profil */}
            <div className="bg-surface/30 border-b border-border backdrop-blur-xl relative z-20">
                <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 md:w-32 md:h-32 bg-accent rounded-3xl flex items-center justify-center shadow-[0_0_50px_var(--accent-glow)]">
                                    <span className="text-4xl md:text-6xl font-black text-text">{profile.username.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-background border-4 border-surface p-2 rounded-2xl">
                                    <Shield className="w-6 h-6 text-accent" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-text font-equinox uppercase leading-none">{profile.username}</h1>
                                </div>
                                <p className="text-text-muted font-bold flex items-center gap-2">
                                    <Globe className="w-4 h-4" /> Niveau {profile.level} • 
                                    {profile.clan ? (
                                        <span className={`font-black tracking-widest ${
                                            profile.clan === 'ROOT' ? 'text-orange-400' :
                                            profile.clan === 'VOID' ? 'text-violet-400' :
                                            profile.clan === 'CORE' ? 'text-blue-400' :
                                            profile.clan === 'CYPHER' ? 'text-green-400' : 'text-red-500'
                                        }`}>{profile.clan}</span>
                                    ) : (
                                        <span className="text-red-500 uppercase text-[10px] tracking-widest font-black">Inactif</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 w-full md:w-auto">
                            <button 
                                onClick={handleShare}
                                className="flex-grow md:flex-none px-8 py-4 bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-2xl font-black text-accent flex items-center justify-center gap-2 transition-all"
                            >
                                <Share2 className="w-5 h-5" /> PARTAGER LE PROFIL
                            </button>
                        </div>
                    </div>

                    {/* grille des statistiques rapides */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <div className="bg-surface-hover/30 border border-border p-6 rounded-3xl overflow-hidden relative group">
                            <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={100} /></div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1 font-equinox">Expérience globale</p>
                            <p className="text-2xl font-black text-text">{formatXP(profile.xp)} XP</p>
                        </div>
                        <div className="bg-surface-hover/30 border border-border p-6 rounded-3xl overflow-hidden relative group">
                            <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity"><Flame size={100} /></div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1 font-equinox">Série d'activités</p>
                            <p className="text-2xl font-black text-orange-400">{profile.streak} JOURS 🔥</p>
                        </div>
                        <div className="bg-surface border border-border p-6 rounded-3xl overflow-hidden relative group text-accent border-accent/20 bg-accent/5">
                            <div className="absolute -top-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity"><Trophy size={100} /></div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60 font-equinox">Niveau Actuel</p>
                            <p className="text-3xl font-black">{profile.level}</p>
                        </div>
                    </div>
                </div>
            </div>


            {/* notification toast */}
            {notification && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl border backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 ${notification.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-surface border-border text-text-muted/80'}`}>
                    <Sparkles size={20} />
                    <span className="font-bold tracking-wide">{notification.message}</span>
                </div>
            )}
        </div>
    );
}
