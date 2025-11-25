import { api } from './client';

// User Management Types
export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  roles: string[];
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastLogin?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneNumber?: string;
  avatar?: string;
  metadata?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  category: string;
  description?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
  byRole: Array<{
    role: string;
    count: number;
  }>;
  recentSignups: number;
  recentLogins: number;
}

// User Management API
export const usersApi = {
  // Get all users
  getUsers: (params?: {
    search?: string;
    role?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'lastLogin' | 'email';
    sortOrder?: 'asc' | 'desc';
  }) => api.getPaginated<AdminUser>('/api/admin/users', params),

  // Get single user
  getUser: (userId: string) => api.get<AdminUser>(`/api/admin/users/${userId}`),

  // Create user
  createUser: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: string;
    roles?: string[];
    status?: AdminUser['status'];
    sendWelcomeEmail?: boolean;
  }) => api.post<AdminUser>('/api/admin/users', data),

  // Update user
  updateUser: (userId: string, data: Partial<AdminUser>) =>
    api.patch<AdminUser>(`/api/admin/users/${userId}`, data),

  // Delete user
  deleteUser: (userId: string) => api.delete<void>(`/api/admin/users/${userId}`),

  // Update user status
  updateUserStatus: (userId: string, status: AdminUser['status']) =>
    api.patch<AdminUser>(`/api/admin/users/${userId}/status`, { status }),

  // Update user role
  updateUserRole: (userId: string, role: string, roles?: string[]) =>
    api.patch<AdminUser>(`/api/admin/users/${userId}/role`, { role, roles }),

  // Update user permissions
  updateUserPermissions: (userId: string, permissions: string[]) =>
    api.patch<AdminUser>(`/api/admin/users/${userId}/permissions`, { permissions }),

  // Bulk update users
  bulkUpdateUsers: (userIds: string[], updates: {
    status?: AdminUser['status'];
    role?: string;
    roles?: string[];
  }) => api.post<{
    success: number;
    failed: number;
    errors: Array<{ userId: string; error: string }>;
  }>('/api/admin/users/bulk-update', { userIds, updates }),

  // Get user activity
  getUserActivity: (userId: string, params?: {
    limit?: number;
    offset?: number;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.getPaginated<UserActivity>(`/api/admin/users/${userId}/activity`, params),

  // Get all activities
  getActivities: (params?: {
    userId?: string;
    action?: string;
    resource?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) => api.getPaginated<UserActivity>('/api/admin/users/activities', params),

  // Get roles
  getRoles: () => api.get<Role[]>('/api/admin/roles'),

  // Create role
  createRole: (data: {
    name: string;
    code: string;
    description?: string;
    permissions: string[];
  }) => api.post<Role>('/api/admin/roles', data),

  // Update role
  updateRole: (roleId: string, data: Partial<Role>) =>
    api.patch<Role>(`/api/admin/roles/${roleId}`, data),

  // Delete role
  deleteRole: (roleId: string) => api.delete<void>(`/api/admin/roles/${roleId}`),

  // Get permissions
  getPermissions: () => api.get<Permission[]>('/api/admin/permissions'),

  // Get user stats
  getUserStats: (params?: {
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
    
    const url = searchParams.toString() 
      ? `/api/admin/users/stats?${searchParams.toString()}`
      : '/api/admin/users/stats';
    
    return api.get<UserStats>(url);
  },

  // Enable/disable 2FA
  toggleTwoFactor: (userId: string, enabled: boolean) =>
    api.patch<AdminUser>(`/api/admin/users/${userId}/2fa`, { enabled }),

  // Reset user password
  resetUserPassword: (userId: string, newPassword: string, sendEmail?: boolean) =>
    api.post<void>(`/api/admin/users/${userId}/reset-password`, { newPassword, sendEmail }),

  // Export users
  exportUsers: (format: 'csv' | 'excel', params?: {
    role?: string;
    status?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.set('role', params.role);
    if (params?.status) searchParams.set('status', params.status);
    searchParams.set('format', format);
    
    return api.get<Blob>(`/api/admin/users/export?${searchParams.toString()}`);
  },

  // Import users
  importUsers: (file: File, options?: {
    updateExisting?: boolean;
    sendWelcomeEmail?: boolean;
    defaultRole?: string;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.updateExisting) formData.append('updateExisting', 'true');
    if (options?.sendWelcomeEmail) formData.append('sendWelcomeEmail', 'true');
    if (options?.defaultRole) formData.append('defaultRole', options.defaultRole);
    
    return api.postForm<{
      success: number;
      failed: number;
      errors: Array<{ row: number; error: string }>;
    }>('/api/admin/users/import', formData);
  },
};


