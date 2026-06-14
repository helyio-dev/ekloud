import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

type Role = 'admin' | 'contributor';

interface ProtectedRouteProps {
  children: ReactNode;
  /** si fourni, l'utilisateur doit avoir au moins un de ces rôles */
  roles?: Role[];
  /** où rediriger en cas de non-autorisation (par défaut /dashboard) */
  redirectTo?: string;
}

/**
 * bloque le rendu des routes protégées jusqu'à résolution de l'authentification.
 * redirige prématurément les utilisateurs non authentifiés ou non autorisés.
 */
export default function ProtectedRoute({
  children,
  roles,
  redirectTo = '/dashboard',
}: ProtectedRouteProps) {
  const { user, isAdmin, isContributor, isLoading } = useAuth();

  // affichage d'un loader pendant la résolution de session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  // redirection si aucun utilisateur n'est connecté
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // vérification fine des droits d'accès par rôle
  if (roles && roles.length > 0) {
    const hasRole =
      (roles.includes('admin') && isAdmin) ||
      (roles.includes('contributor') && (isContributor || isAdmin));

    if (!hasRole) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
}
