import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

type Role = 'admin' | 'contributor';

interface ProtectedRouteProps {
  children: ReactNode;
  /** If provided, user must have at least one of these roles. */
  roles?: Role[];
  /** Where to redirect if unauthorized. Defaults to /dashboard */
  redirectTo?: string;
}

/**
 * Blocks rendering of protected routes until auth is fully resolved.
 * Redirects unauthenticated or unauthorized users early.
 */
export default function ProtectedRoute({
  children,
  roles,
  redirectTo = '/dashboard',
}: ProtectedRouteProps) {
  const { user, isAdmin, isContributor, isLoading } = useAuth();

  // Show a spinner while the auth state is being resolved
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  // Not logged in at all
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role check
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
