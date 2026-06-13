import React, { createContext, useEffect, useState, useRef, useCallback } from 'react';
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
    const [username, setUsername] = useState<string | null>(null);
    const [clan, setClan] = useState<string | null>(null);

    const fetchedUidRef = useRef<string | null>(null);
    const isSyncing = useRef(false);

    // Fetch profile via fetch() direct — bypasse tout problème du client Supabase JS
    const fetchProfile = useCallback(async (userId: string, accessToken: string) => {
        if (fetchedUidRef.current === userId) return;
        fetchedUidRef.current = userId;

        try {
            const url = `${import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')}/rest/v1/profiles?id=eq.${userId}&select=role,xp,level,streak,username,clan&limit=1`;
            const res = await fetch(url, {
                headers: {
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                },
            });

            if (!res.ok) {
                console.error('[AUTH] fetchProfile error:', res.status);
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
                setUsername(data.username || null);
                setClan(data.clan || null);
            } else {
                // Profil inexistant — créer un profil par défaut
                const meta = (user as any)?.user_metadata;
                const baseName = meta?.user_name || meta?.full_name || 'explorateur';
                const finalName = `${baseName.toLowerCase().substring(0, 15)}_${Math.floor(Math.random() * 1000)}`;

                await fetch(`${import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')}/rest/v1/profiles`, {
                    method: 'POST',
                    headers: {
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal',
                    },
                    body: JSON.stringify({ id: userId, username: finalName, xp: 0, level: 1, streak: 0, role: 'student' }),
                });
                setUsername(finalName);
            }
        } catch (err) {
            console.error('[AUTH] fetchProfile error:', err);
        }
    }, [user]);

    const resetState = useCallback(() => {
        fetchedUidRef.current = null;
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setIsContributor(false);
        setXp(0);
        setLevel(1);
        setStreak(0);
        setUsername(null);
        setClan(null);
        setIsLoading(false);
    }, []);

    const syncSession = useCallback(async (s: Session) => {
        if (isSyncing.current) return;
        isSyncing.current = true;
        try {
            setSession(s);
            setUser(s.user);
            await fetchProfile(s.user.id, s.access_token);
        } finally {
            isSyncing.current = false;
            setIsLoading(false);
        }
    }, [fetchProfile]);

    const syncRef = useRef(syncSession);
    const resetRef = useRef(resetState);
    useEffect(() => { syncRef.current = syncSession; }, [syncSession]);
    useEffect(() => { resetRef.current = resetState; }, [resetState]);

    useEffect(() => {
        let mounted = true;

        // 1. Récupérer la session existante immédiatement (synchrone depuis localStorage)
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (!mounted) return;
            if (s) {
                syncRef.current(s);
            } else {
                resetRef.current();
            }
        });

        // 2. Écouter les changements d'état auth pour les événements futurs
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, s) => {
                if (!mounted) return;
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                    if (s) await syncRef.current(s);
                } else if (event === 'SIGNED_OUT') {
                    resetRef.current();
                }
            }
        );

        // Failsafe : si après 10s isLoading est encore true, on débloque
        const failsafe = setTimeout(() => {
            if (mounted) {
                console.warn('[AUTH] failsafe timeout');
                resetRef.current();
            }
        }, 10000);

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(failsafe);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const signOut = async () => {
        await supabase.auth.signOut();
        resetState();
    };

    const refreshSession = async () => {
        const { data: { session: s } } = await supabase.auth.refreshSession();
        if (s) await syncSession(s);
        return s;
    };

    const refreshProfile = async () => {
        if (session) {
            fetchedUidRef.current = null;
            await fetchProfile(session.user.id, session.access_token);
        }
    };

    return (
        <AuthContext.Provider value={{
            user, session, isAdmin, isContributor, isLoading,
            xp, level, streak, username, clan,
            signOut, refreshSession, refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
