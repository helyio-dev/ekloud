import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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

    /**
     * récupère les informations de profil depuis la base de données.
     * crée un profil par défaut si l'utilisateur est nouveau.
     */
    const fetchProfile = async (userId: string, newUser?: any) => {
        if (lastFetchedIdRef.current === userId) return;
        lastFetchedIdRef.current = userId;
        
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
                } else {
                    console.error('échec de la création du profil:', insertError?.message);
                }
            } else if (error) {
                console.error('erreur lors de la récupération du profil:', error.message);
            }
        } catch (err) {
            console.error('erreur inattendue profile_fetch:', err);
        }
    };

    useEffect(() => {
        /**
         * initialise la session active au montage de l'application.
         */
        const initSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                if (initialSession) {
                    setSession(initialSession);
                    setUser(initialSession.user);
                    await fetchProfile(initialSession.user.id, initialSession.user);
                }
            } catch (err) {
                console.error('erreur d\'initialisation de session:', err);
            } finally {
                setIsLoading(false);
            }
        };

        // écoute des changements d'état (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
            const newUser = currentSession?.user ?? null;
            setSession(currentSession);
            setUser(newUser);
            
            if (newUser) {
                await fetchProfile(newUser.id, newUser);
            } else {
                // remise à zéro des états d'authentification
                lastFetchedIdRef.current = null;
                setIsAdmin(false);
                setIsContributor(false);
                setXp(0);
                setLevel(1);
                setStreak(0);
                setUsername(null);
                setClan(null);
            }
            
            setIsLoading(false);
        });

        initSession();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // procédure de déconnexion globale
    const signOut = async () => {
        await supabase.auth.signOut();
    };

    // rafraîchissement manuel de l'état de la session
    const refreshSession = async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        return currentSession;
    };

    // rafraîchissement forcé des données de profil
    const refreshProfile = async () => {
        if (user) {
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
