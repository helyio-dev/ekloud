import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

/**
 * structure du contexte d'authentification ekloud.
 */
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
    signOut: async () => { },
    refreshSession: async () => null,
    refreshProfile: async () => { },
});

/**
 * fournisseur du contexte d'authentification.
 * gère la session utilisateur, les droits et les données de gamification.
 */
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

    // référence pour éviter les boucles infinies de récupération de profil
    const lastFetchedIdRef = useRef<string | null>(null);
    const isInitialMount = useRef(true);

    /**
     * récupère les informations de profil depuis la base de données.
     * crée un profil par défaut si l'utilisateur est nouveau.
     */
    const fetchProfile = React.useCallback(async (userId: string, newUser?: any) => {
        if (!userId) return;
        
        // si on a déjà chargé ce profil récemment, on évite le doublon
        // sauf si on force le rafraîchissement
        if (lastFetchedIdRef.current === userId && isInitialMount.current === false) return;
        lastFetchedIdRef.current = userId;
        isInitialMount.current = false;
        
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role, xp, level, streak, username, clan')
                .eq('id', userId)
                .single();

            if (!error && data) {
                // mise à jour des droits et statistiques utilisateur
                setIsAdmin(data.role === 'admin');
                setIsContributor(data.role === 'contributor');
                setXp(data.xp || 0);
                setLevel(data.level || 1);
                setStreak(data.streak || 0);
                setUsername(data.username || null);
                setClan(data.clan || null);
            } else if (error && (error.code === 'PGRST116' || error.message?.includes('no rows'))) {
                // génération d'une identité visuelle par défaut
                console.log('profil manquant, initialisation pour:', userId);
                
                const meta = newUser?.user_metadata;
                const baseName = meta?.user_name || meta?.full_name || newUser?.email?.split('@')[0] || 'explorateur';
                const finalName = `${baseName.toLowerCase().substring(0, 15)}_${Math.floor(Math.random() * 1000)}`;

                const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert([{ 
                        id: userId, 
                        username: finalName,
                        xp: 0,
                        level: 1,
                        streak: 0,
                        role: 'student'
                    }])
                    .select()
                    .single();

                if (!insertError && newProfile) {
                    setIsAdmin(false);
                    setIsContributor(false);
                    setXp(0);
                    setLevel(1);
                    setStreak(0);
                    setUsername(newProfile.username);
                }
            }
        } catch (err) {
            console.error('erreur inattendue profile_fetch:', err);
        }
    }, []);

    // Lock pour syncSession
    const isSyncing = useRef(false);

    const resetState = useCallback(() => {
        lastFetchedIdRef.current = null;
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setIsContributor(false);
        setXp(0);
        setLevel(1);
        setStreak(0);
        setUsername(null);
        setClan(null);
        localStorage.removeItem('ekloud_last_uid');
    }, []);

    const syncSession = useCallback(async (currentSession: Session | null) => {
        if (isSyncing.current) return;
        isSyncing.current = true;
        
        try {
            if (currentSession) {
                setSession(currentSession);
                setUser(currentSession.user);
                
                // Persistence Shield : On garde l'ID utilisateur en dehors de la session Supabase
                // pour permettre une récupération si le cache est partiellement corrompu.
                localStorage.setItem('ekloud_last_uid', currentSession.user.id);
                
                await fetchProfile(currentSession.user.id, currentSession.user);
            } else {
                // Tentative de récupération silensieuse si session absente
                const lastUid = localStorage.getItem('ekloud_last_uid');
                if (lastUid) {
                    console.log('[AUTH] Tentative de récupération via Shield pour:', lastUid);
                }
                resetState();
            }
        } finally {
            setIsLoading(false);
            isSyncing.current = false;
        }
    }, [fetchProfile, resetState]);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('[AUTH] Erreur session au démarrage:', error);
                    // On ne déconnecte pas forcément, on tente un refresh
                    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                    if (refreshError) {
                        console.warn('[AUTH] Récupération impossible. Nettoyage.');
                        resetState();
                    } else if (mounted) {
                        await syncSession(refreshData.session);
                    }
                } else if (mounted) {
                    await syncSession(initialSession);
                }
            } catch (err) {
                console.error('[AUTH] Erreur critique init:', err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log(`[AUTH] Event Flow: ${event}`);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                if (mounted) await syncSession(currentSession);
            } else if (event === 'SIGNED_OUT') {
                if (mounted) resetState();
            }
        });

        init();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [syncSession, resetState]);

    // procédure de déconnexion globale
    const signOut = async () => {
        setIsLoading(true);
        try {
            await supabase.auth.signOut();
            resetState();
        } finally {
            setIsLoading(false);
        }
    };

    // rafraîchissement manuel de l'état de la session
    const refreshSession = async () => {
        const { data: { session: currentSession }, error } = await supabase.auth.refreshSession();
        if (!error && currentSession) {
            await syncSession(currentSession);
        }
        return currentSession;
    };

    // rafraîchissement forcé des données de profil
    const refreshProfile = async () => {
        if (user) {
            // on force le rafraîchissement en bypassant la ref
            lastFetchedIdRef.current = null;
            await fetchProfile(user.id);
        }
    };

    return (
        <AuthContext.Provider value={{
            user, session, isAdmin, isContributor, isLoading, xp, level, streak, username, clan,
            signOut, refreshSession, refreshProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};
