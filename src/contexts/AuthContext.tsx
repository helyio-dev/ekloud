import { createContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
    user: User | null;
    session: Session | null;
    isAdmin: boolean;
    isContributor: boolean;
    isLoading: boolean;
    xp: number;
    level: number;
    streak: number;
    lostStreak: number;
    freezeGels: number;
    username: string | null;
    clan: string | null;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<Session | null>;
    refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isAdmin: false,
    isContributor: false,
    isLoading: true,
    xp: 0,
    level: 1,
    streak: 0,
    lostStreak: 0,
    freezeGels: 0,
    username: null,
    clan: null,
    signOut: async () => {},
    refreshSession: async () => null,
    refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isContributor, setIsContributor] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [streak, setStreak] = useState(0);
    const [lostStreak, setLostStreak] = useState(0);
    const [freezeGels, setFreezeGels] = useState(0);
    const [username, setUsername] = useState<string | null>(null);
    const [clan, setClan] = useState<string | null>(null);

    // uid du dernier profil chargé — évite les double-fetch
    const fetchedUidRef = useRef<string | null>(null);
    // indique si l'init() a terminé — onAuthStateChange attend ça avant d'agir
    const initDoneRef = useRef(false);
    // session courante en ref pour ne pas avoir de dépendances cycliques
    const sessionRef = useRef<Session | null>(null);

    // ── fetchProfile via fetch() direct (bypasse le client Supabase JS + RLS récursion) ──
    const fetchProfile = useCallback(async (userId: string, accessToken: string) => {
        try {
            const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
            const res = await fetch(
                `${base}/rest/v1/profiles?id=eq.${userId}&select=role,xp,level,streak,lost_streak,username,clan,freeze_gels&limit=1`, 
                {

                    headers: {
                        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                        Authorization: `Bearer ${accessToken}`,
                        Accept: 'application/json',
                    },
                }
            );

            if (!res.ok) {
                console.error('[AUTH] fetchProfile HTTP', res.status);
                return;
            }

            const rows = await res.json();
            const data = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

            if (data) {
                setIsAdmin(data.role === 'admin');
                setIsContributor(data.role === 'contributor');
                setXp(data.xp || 0);
                setLevel(data.level || 1);
                setStreak(data.streak || 0);
                setLostStreak(data.lost_streak || 0);
                setFreezeGels(data.freeze_gels || 0);
                setUsername(data.username || null);
                setClan(data.clan || null);
            } else {
                // nouveau compte sans profil — en créer un
                const meta = sessionRef.current?.user?.user_metadata;
                const baseName = meta?.user_name || meta?.full_name || 'explorateur';
                const finalName = `${baseName.toLowerCase().substring(0, 15)}_${Math.floor(Math.random() * 1000)}`;

                await fetch(`${base}/rest/v1/profiles`, {
                    method: 'POST',
                    headers: {
                        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        Prefer: 'return=minimal',
                    },
                    body: JSON.stringify({ id: userId, username: finalName, xp: 0, level: 1, streak: 0, role: 'student', freeze_gels: 0 }),
                });
                setUsername(finalName);
            }
        } catch (err) {
            console.error('[AUTH] fetchProfile error:', err);
        }
    }, []);

    // ── resetState : tout remettre à zéro ──
    const resetState = useCallback(() => {
        fetchedUidRef.current = null;
        sessionRef.current = null;
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setIsContributor(false);
        setXp(0);
        setLevel(1);
        setStreak(0);
        setFreezeGels(0);
        setUsername(null);
        setClan(null);
        setIsLoading(false);
    }, []);

    // ── applySession : applique une session et charge le profil si besoin ──
    const applySession = useCallback(async (s: Session) => {
        sessionRef.current = s;
        setSession(s);
        setUser(s.user);

        // ne recharge le profil que si l'uid a changé
        if (fetchedUidRef.current !== s.user.id) {
            fetchedUidRef.current = s.user.id;
            await fetchProfile(s.user.id, s.access_token);
        }

        setIsLoading(false);
    }, [fetchProfile]);

    useEffect(() => {
        let mounted = true;

        // ── init : source de vérité au démarrage ──
        const init = async () => {
            const { data: { session: s } } = await supabase.auth.getSession();
            if (!mounted) return;

            if (s) {
                await applySession(s);
            } else {
                resetState();
            }
            initDoneRef.current = true;
        };

        // ── onAuthStateChange : gère uniquement les événements POST-init ──
        // On ignore tout ce qui arrive avant la fin de init() pour éviter
        // que INITIAL_SESSION ou un SIGNED_IN parasite n'écrase l'état.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
            if (!mounted) return;
            if (!initDoneRef.current) return; // init() n'a pas encore fini

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                if (s) await applySession(s);
            } else if (event === 'SIGNED_OUT') {
                resetState();
            }
        });

        init();

        // failsafe : débloquer l'UI au bout de 8s quoi qu'il arrive
        const failsafe = setTimeout(() => {
            if (mounted && initDoneRef.current === false) {
                console.warn('[AUTH] failsafe triggered');
                resetState();
                initDoneRef.current = true;
            }
        }, 8000);

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(failsafe);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── API publique ──
    const signOut = async () => {
        await supabase.auth.signOut();
        resetState();
    };

    const refreshSession = async () => {
        const { data: { session: s } } = await supabase.auth.refreshSession();
        if (s) await applySession(s);
        return s;
    };

    const refreshProfile = async () => {
        if (sessionRef.current) {
            fetchedUidRef.current = null;
            await fetchProfile(sessionRef.current.user.id, sessionRef.current.access_token);
        }
    };

    return (
        <AuthContext.Provider value={{
            user, session, isAdmin, isContributor, isLoading,
            xp, level, streak, lostStreak, freezeGels, username, clan,
            signOut, refreshSession, refreshProfile,
        }}>

            {children}
        </AuthContext.Provider>
    );
};
