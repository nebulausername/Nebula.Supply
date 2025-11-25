export type Action = 'read' | 'create' | 'update' | 'delete' | 'manage';
export type Subject = 'order' | 'product' | 'media' | 'user' | 'inventory' | 'system' | 'settings';

export interface Ability {
  action: Action;
  subject: Subject;
  conditions?: Record<string, any>;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

// Role-based permissions
export const ROLE_PERMISSIONS: Record<string, Ability[]> = {
  admin: [
    { action: 'manage', subject: 'order' },
    { action: 'manage', subject: 'product' },
    { action: 'manage', subject: 'media' },
    { action: 'manage', subject: 'user' },
    { action: 'manage', subject: 'inventory' },
    { action: 'manage', subject: 'system' },
    { action: 'manage', subject: 'settings' }
  ],
  manager: [
    { action: 'read', subject: 'order' },
    { action: 'update', subject: 'order' },
    { action: 'read', subject: 'product' },
    { action: 'create', subject: 'product' },
    { action: 'update', subject: 'product' },
    { action: 'read', subject: 'media' },
    { action: 'create', subject: 'media' },
    { action: 'update', subject: 'media' },
    { action: 'delete', subject: 'media' },
    { action: 'read', subject: 'inventory' },
    { action: 'update', subject: 'inventory' },
    { action: 'read', subject: 'user' }
  ],
  viewer: [
    { action: 'read', subject: 'order' },
    { action: 'read', subject: 'product' },
    { action: 'read', subject: 'media' },
    { action: 'read', subject: 'inventory' },
    { action: 'read', subject: 'user' }
  ]
};

// Specific permission checks
export const SPECIFIC_PERMISSIONS: Record<string, Ability[]> = {
  'orders.bulk_update': [{ action: 'update', subject: 'order' }],
  'orders.export': [{ action: 'read', subject: 'order' }],
  'products.variants': [{ action: 'update', subject: 'product' }],
  'products.import': [{ action: 'create', subject: 'product' }],
  'media.upload': [{ action: 'create', subject: 'media' }],
  'inventory.reserve': [{ action: 'update', subject: 'inventory' }],
  'users.manage_roles': [{ action: 'update', subject: 'user' }],
  'system.health': [{ action: 'read', subject: 'system' }],
  'settings.update': [{ action: 'update', subject: 'settings' }]
};

// Check if user has specific ability
export function can(user: User, ability: Ability, context?: any): boolean {
  // Admin has all permissions
  if (user.role === 'admin') {
    return true;
  }

  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  const hasRolePermission = rolePermissions.some(permission => 
    permission.action === ability.action && 
    permission.subject === ability.subject
  );

  if (hasRolePermission) {
    return true;
  }

  // Check specific permissions
  const specificPermission = SPECIFIC_PERMISSIONS[ability.subject + '.' + ability.action];
  if (specificPermission) {
    const hasSpecificPermission = specificPermission.some(permission =>
      permission.action === ability.action &&
      permission.subject === ability.subject
    );
    
    if (hasSpecificPermission) {
      return true;
    }
  }

  // Check custom permissions
  const hasCustomPermission = user.permissions.some(permission => {
    if (permission === '*') return true; // Wildcard permission
    if (permission === `${ability.subject}:${ability.action}`) return true;
    if (permission === `${ability.subject}:*`) return true;
    if (permission === `*:${ability.action}`) return true;
    return false;
  });

  return hasCustomPermission;
}

// Check if user can perform action on specific resource
export function canAccess(user: User, action: Action, subject: Subject, resource?: any): boolean {
  const ability: Ability = { action, subject };
  
  // Basic permission check
  if (!can(user, ability)) {
    return false;
  }

  // Resource-specific checks
  if (resource && subject === 'order') {
    // Users can only update orders they created (unless admin/manager)
    if (action === 'update' && user.role === 'viewer') {
      return resource.createdBy === user.id;
    }
  }

  if (resource && subject === 'user') {
    // Users can only update their own profile (unless admin)
    if (action === 'update' && user.role !== 'admin') {
      return resource.id === user.id;
    }
  }

  return true;
}

// Get all abilities for a user
export function getUserAbilities(user: User): Ability[] {
  const abilities: Ability[] = [];

  // Add role-based abilities
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  abilities.push(...rolePermissions);

  // Add specific permissions
  for (const [permission, abilityList] of Object.entries(SPECIFIC_PERMISSIONS)) {
    if (user.permissions.includes(permission)) {
      abilities.push(...abilityList);
    }
  }

  // Add custom permissions
  for (const permission of user.permissions) {
    if (permission.includes(':')) {
      const [subject, action] = permission.split(':');
      abilities.push({ action: action as Action, subject: subject as Subject });
    }
  }

  return abilities;
}

// Check if user has any of the specified abilities
export function canAny(user: User, abilities: Ability[]): boolean {
  return abilities.some(ability => can(user, ability));
}

// Check if user has all of the specified abilities
export function canAll(user: User, abilities: Ability[]): boolean {
  return abilities.every(ability => can(user, ability));
}

// Get filtered resources based on user permissions
export function filterResources<T extends { id: string; createdBy?: string }>(
  user: User,
  resources: T[],
  action: Action,
  subject: Subject
): T[] {
  if (user.role === 'admin') {
    return resources;
  }

  return resources.filter(resource => canAccess(user, action, subject, resource));
}

// Permission decorator for functions
export function requirePermission(action: Action, subject: Subject) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (user: User, ...args: any[]) {
      if (!can(user, { action, subject })) {
        throw new Error(`Insufficient permissions: ${action} ${subject}`);
      }
      return originalMethod.apply(this, [user, ...args]);
    };

    return descriptor;
  };
}

// Utility to check if user can manage a specific subject
export function canManage(user: User, subject: Subject): boolean {
  return can(user, { action: 'manage', subject });
}

// Utility to check if user can read a specific subject
export function canRead(user: User, subject: Subject): boolean {
  return can(user, { action: 'read', subject });
}

// Utility to check if user can create a specific subject
export function canCreate(user: User, subject: Subject): boolean {
  return can(user, { action: 'create', subject });
}

// Utility to check if user can update a specific subject
export function canUpdate(user: User, subject: Subject): boolean {
  return can(user, { action: 'update', subject });
}

// Utility to check if user can delete a specific subject
export function canDelete(user: User, subject: Subject): boolean {
  return can(user, { action: 'delete', subject });
}



