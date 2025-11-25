import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCan } from '../../auth/Can';
import { Action, Subject } from '@nebula/shared';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface RequireAbilityProps {
  action: Action;
  subject: Subject;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const RequireAbility: React.FC<RequireAbilityProps> = ({
  action,
  subject,
  children,
  fallback,
  redirectTo = '/dashboard'
}) => {
  const { can, user } = useCan();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!can(action, subject)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#0B0B12] to-[#050509] p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-red-400 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-400 mb-6">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Required permission: {action} {subject}
          </p>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="w-full"
          >
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

// Higher-order component for route protection
export const withAbility = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  action: Action,
  subject: Subject,
  fallback?: React.ComponentType<P>
) => {
  const WithAbilityComponent = (props: P) => {
    return (
      <RequireAbility action={action} subject={subject} fallback={fallback ? <fallback {...props} /> : undefined}>
        <WrappedComponent {...props} />
      </RequireAbility>
    );
  };

  WithAbilityComponent.displayName = `withAbility(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithAbilityComponent;
};

// Hook for checking route permissions
export const useRoutePermission = () => {
  const { can } = useCan();
  const location = useLocation();

  const checkRoutePermission = (action: Action, subject: Subject): boolean => {
    return can(action, subject);
  };

  const getRequiredPermission = (pathname: string): { action: Action; subject: Subject } | null => {
    // Define route permissions
    const routePermissions: Record<string, { action: Action; subject: Subject }> = {
      '/orders': { action: 'read', subject: 'order' },
      '/orders/create': { action: 'create', subject: 'order' },
      '/orders/edit': { action: 'update', subject: 'order' },
      '/products': { action: 'read', subject: 'product' },
      '/products/create': { action: 'create', subject: 'product' },
      '/products/edit': { action: 'update', subject: 'product' },
      '/media': { action: 'read', subject: 'media' },
      '/media/upload': { action: 'create', subject: 'media' },
      '/inventory': { action: 'read', subject: 'inventory' },
      '/inventory/update': { action: 'update', subject: 'inventory' },
      '/users': { action: 'read', subject: 'user' },
      '/users/create': { action: 'create', subject: 'user' },
      '/users/edit': { action: 'update', subject: 'user' },
      '/settings': { action: 'read', subject: 'settings' },
      '/system': { action: 'read', subject: 'system' }
    };

    return routePermissions[pathname] || null;
  };

  const canAccessCurrentRoute = (): boolean => {
    const permission = getRequiredPermission(location.pathname);
    if (!permission) return true; // No permission required
    
    return checkRoutePermission(permission.action, permission.subject);
  };

  return {
    checkRoutePermission,
    getRequiredPermission,
    canAccessCurrentRoute,
    currentPath: location.pathname
  };
};



