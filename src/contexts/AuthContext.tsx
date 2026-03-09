import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
    user: User | null;
    session: Session | null;
    isAdmin: boolean;
    isLoading: boolean;
    xp: number;
    level: number;
    streak: number;
    username: string | null;
    clan: string | null;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<Session | null>;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isAdmin: false,
    isLoading: true,
    xp: 0,
    level: 1,
    streak: 0,
    username: null,
    clan: null,
    signOut: async () => { },
    refreshSession: async () => null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [streak, setStreak] = useState(0);
    const [username, setUsername] = useState<string | null>(null);
    const [clan, setClan] = useState<string | null>(null);

    
    const lastFetchedIdRef = useRef<string | null>(null);

    const fetchProfile = async (userId: string, retry = true) => {
        
        if (lastFetchedIdRef.current === userId) {
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role, xp, level, streak, username, clan')
                .eq('id', userId)
                .single();

            if (error) {
                if (retry && (error.message?.includes('JWT expired') || error.code === 'PGRST303')) {
                    console.log('AuthProvider: JWT expired, refreshing...');
                    const session = await refreshSession();
                    if (session) return fetchProfile(userId, false);
                }
                console.error('AuthProvider: fetchProfile error:', error);
                setIsLoading(false);
                return;
            }

            if (data) {
                setIsAdmin(data.role === 'admin');
                setXp(data.xp || 0);
                setLevel(data.level || 1);
                setStreak(data.streak || 0);
                setUsername(data.username || null);
                setClan(data.clan || null);
                lastFetchedIdRef.current = userId;
            }
        } catch (err) {
            console.error('AuthProvider: fetchProfile error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            const newUser = currentSession?.user ?? null;

            setSession(currentSession);
            setUser(newUser);

            if (newUser) {
                fetchProfile(newUser.id);
            } else {
                
                lastFetchedIdRef.current = null;
                setIsAdmin(false);
                setXp(0);
                setLevel(1);
                setStreak(0);
                setUsername(null);
                setClan(null);
                setIsLoading(false);
            }
        });

        
        const safetyTimer = setTimeout(() => {
            setIsLoading(prev => {
                if (prev) console.warn('AuthProvider: Safety timeout triggered.');
                return false;
            });
        }, 4000);

        return () => {
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const refreshSession = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('AuthProvider: refreshSession error:', error);
            return null;
        }
        setSession(session);
        setUser(session?.user ?? null);
        return session;
    };

    return (
        <AuthContext.Provider value={{
            user, session, isAdmin, isLoading, xp, level, streak, username, clan,
            signOut, refreshSession
        }}>
            {children}
        </AuthContext.Provider>
    );
};
