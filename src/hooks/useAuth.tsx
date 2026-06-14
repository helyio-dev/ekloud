import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

/**
 * hook utilitaire pour accéder aux données d'authentification ekloud.
 * expose l'utilisateur, son profil et les droits d'administration.
 */
export const useAuth = () => useContext(AuthContext);
