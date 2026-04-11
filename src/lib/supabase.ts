import { createClient } from '@supabase/supabase-js';

// récupération des identifiants supabase depuis les variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * instance partagée du client supabase pour l'application. 
 * permet d'interagir avec l'authentification et la base de données.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
