import { createClient } from '@supabase/supabase-js';

// récupération des identifiants supabase depuis les variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * instance partagée du client supabase pour l'application. 
 * permet d'interagir avec l'authentification et la base de données.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        // detectSessionInUrl doit rester true (valeur par défaut) pour que Supabase
        // puisse parser le token depuis l'URL lors du callback OAuth/PKCE
        detectSessionInUrl: true,
        storage: window.localStorage
    }
});

// Expose pour debug rapide en dev
if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.supabase = supabase;
}
