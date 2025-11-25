import React from 'react';
import { useAuthStore } from '../lib/store/auth';
import { Ability, Action, Subject } from '@nebula/shared';

// Local permission checking functions (browser-compatible)
function can(user: any, ability: Ability): boolean {
  if (!user || !user.permissions) {
    return false;
  }

  const { action, subject, conditions } = ability;
  
  // Check if user has the specific permission
  const permission = `${subject}:${action}`;
  const hasPermission = user.permissions.includes(permission) || user.permissions.includes('admin:full');
  
  if (!hasPermission) {
    return false;
  }

  // If conditions are provided, check them
  if (conditions) {
    // Simple condition checking - can be extended
    for (const [key, value] of Object.entries(conditions)) {
      if (user[key] !== value) {
        return false;
      }
    }
  }

  return true;
}

function canAny(user: any, abilities: Ability[]): boolean {
  return abilities.some(ability => can(user, ability));
}

function canAll(user: any, abilities: Ability[]): boolean {
  return abilities.every(ability => can(user, ability));
}

interface CanProps {
  action: Action;
  subject: Subject;
  conditions?: Record<string, any>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface CanAnyProps {
  abilities: Ability[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface CanAllProps {
  abilities: Ability[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

// Can component - renders children if user has specific ability
export const Can: React.FC<CanProps> = ({ 
  action, 
  subject, 
  conditions, 
  fallback = null, 
  children 
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <>{fallback}</>;
  }

  const hasPermission = can(user, { action, subject, conditions });
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

// CanAny component - renders children if user has any of the specified abilities
export const CanAny: React.FC<CanAnyProps> = ({ 
  abilities, 
  fallback = null, 
  children 
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <>{fallback}</>;
  }

  const hasAnyPermission = canAny(user, abilities);
  
  return hasAnyPermission ? <>{children}</> : <>{fallback}</>;
};

// CanAll component - renders children if user has all of the specified abilities
export const CanAll: React.FC<CanAllProps> = ({ 
  abilities, 
  fallback = null, 
  children 
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <>{fallback}</>;
  }

  const hasAllPermissions = canAll(user, abilities);
  
  return hasAllPermissions ? <>{children}</> : <>{fallback}</>;
};

// Hook for checking permissions
export const useCan = () => {
  const { user } = useAuthStore();

  const checkPermission = (action: Action, subject: Subject, conditions?: Record<string, any>): boolean => {
    if (!user) return false;
    return can(user, { action, subject, conditions });
  };

  const checkAny = (abilities: Ability[]): boolean => {
    if (!user) return false;
    return canAny(user, abilities);
  };

  const checkAll = (abilities: Ability[]): boolean => {
    if (!user) return false;
    return canAll(user, abilities);
  };

  return {
    can: checkPermission,
    canAny: checkAny,
    canAll: checkAll,
    user
  };
};

// Higher-order component for permission-based rendering
export const withPermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  action: Action,
  subject: Subject,
  fallback?: React.ComponentType<P>
) => {
  const WithPermissionComponent = (props: P) => {
    const { can } = useCan();
    
    if (!can(action, subject)) {
      if (fallback) {
        return <fallback {...props} />;
      }
      return null;
    }
    
    return <WrappedComponent {...props} />;
  };

  WithPermissionComponent.displayName = `withPermission(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithPermissionComponent;
};

// Hook for getting user abilities
export const useAbilities = () => {
  const { user } = useAuthStore();
  
  if (!user) {
    return {
      abilities: [],
      canManage: () => false,
      canRead: () => false,
      canCreate: () => false,
      canUpdate: () => false,
      canDelete: () => false
    };
  }

  const abilities = [
    { action: 'read' as Action, subject: 'order' as Subject },
    { action: 'update' as Action, subject: 'order' as Subject },
    { action: 'read' as Action, subject: 'product' as Subject },
    { action: 'create' as Action, subject: 'product' as Subject },
    { action: 'update' as Action, subject: 'product' as Subject },
    { action: 'read' as Action, subject: 'media' as Subject },
    { action: 'create' as Action, subject: 'media' as Subject },
    { action: 'update' as Action, subject: 'media' as Subject },
    { action: 'delete' as Action, subject: 'media' as Subject },
    { action: 'read' as Action, subject: 'inventory' as Subject },
    { action: 'update' as Action, subject: 'inventory' as Subject },
    { action: 'read' as Action, subject: 'user' as Subject },
    { action: 'read' as Action, subject: 'system' as Subject },
    { action: 'update' as Action, subject: 'settings' as Subject }
  ].filter(ability => can(user, ability));

  return {
    abilities,
    canManage: (subject: Subject) => can(user, { action: 'manage', subject }),
    canRead: (subject: Subject) => can(user, { action: 'read', subject }),
    canCreate: (subject: Subject) => can(user, { action: 'create', subject }),
    canUpdate: (subject: Subject) => can(user, { action: 'update', subject }),
    canDelete: (subject: Subject) => can(user, { action: 'delete', subject })
  };
};
