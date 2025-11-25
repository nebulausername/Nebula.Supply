import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/Table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/DropdownMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import {
  Users,
  UserPlus,
  UserCog,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  MoreHorizontal,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Lock,
  Unlock,
  Mail,
  FileText,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Key
} from 'lucide-react';
import { usersApi, AdminUser, Role, UserActivity, UserStats } from '../../lib/api/users';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { logger } from '../../lib/logger';
import { motion } from 'framer-motion';
import { springConfigs } from '../../utils/springConfigs';

export function UserManagement() {
  const { measureAsync } = usePerformanceMonitor('UserManagement');
  const { handleError } = useErrorHandler('UserManagement');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'activity' | 'permissions'>('users');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  // Fetch users
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users', 'list', roleFilter, statusFilter],
    queryFn: () => usersApi.getUsers({
      role: roleFilter !== 'all' ? roleFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }),
    retry: 2,
    onError: (error) => {
      handleError(error, { operation: 'fetch_users' });
    },
  });

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['users', 'roles'],
    queryFn: () => usersApi.getRoles(),
  });

  // Fetch user stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => usersApi.getUserStats(),
    refetchInterval: 30000,
  });

  // Fetch activities
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['users', 'activities'],
    queryFn: () => usersApi.getActivities({ limit: 50 }),
  });

  // Memoized data
  const users = useMemo(() => {
    if (!usersData) return [];
    return Array.isArray(usersData) ? usersData : usersData.data || [];
  }, [usersData]);

  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(query) ||
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [users, searchQuery]);

  const activities = useMemo(() => {
    if (!activitiesData) return [];
    return Array.isArray(activitiesData) ? activitiesData : activitiesData.data || [];
  }, [activitiesData]);

  // Mutations
  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: AdminUser['status'] }) =>
      usersApi.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      logger.logUserAction('user_status_updated', {});
    },
    onError: (error) => {
      handleError(error, { operation: 'update_user_status' });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role, roles }: { userId: string; role: string; roles?: string[] }) =>
      usersApi.updateUserRole(userId, role, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      logger.logUserAction('user_role_updated', {});
    },
    onError: (error) => {
      handleError(error, { operation: 'update_user_role' });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ userIds, updates }: { userIds: string[]; updates: any }) =>
      usersApi.bulkUpdateUsers(userIds, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedUsers(new Set());
      logger.logUserAction('bulk_users_updated', {});
    },
    onError: (error) => {
      handleError(error, { operation: 'bulk_update_users' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => usersApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      logger.logUserAction('user_deleted', {});
    },
    onError: (error) => {
      handleError(error, { operation: 'delete_user' });
    },
  });

  // Handlers
  const handleStatusUpdate = useCallback(async (userId: string, status: AdminUser['status']) => {
    await measureAsync('update_status', async () => {
      await updateUserStatusMutation.mutateAsync({ userId, status });
    });
  }, [measureAsync, updateUserStatusMutation]);

  const handleRoleUpdate = useCallback(async (userId: string, role: string, roles?: string[]) => {
    await measureAsync('update_role', async () => {
      await updateUserRoleMutation.mutateAsync({ userId, role, roles });
    });
  }, [measureAsync, updateUserRoleMutation]);

  const handleBulkStatusUpdate = useCallback(async (status: AdminUser['status']) => {
    if (selectedUsers.size === 0) return;
    await measureAsync('bulk_status_update', async () => {
      await bulkUpdateMutation.mutateAsync({
        userIds: Array.from(selectedUsers),
        updates: { status }
      });
    });
  }, [measureAsync, bulkUpdateMutation, selectedUsers]);

  const handleUserSelect = useCallback((userId: string, checked: boolean) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  }, [selectedUsers.size, filteredUsers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'inactive': return 'text-gray-400 bg-gray-400/20';
      case 'suspended': return 'text-red-400 bg-red-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const handleExport = useCallback(async () => {
    await measureAsync('export_users', async () => {
      try {
        const blob = await usersApi.exportUsers('csv', {
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        logger.logUserAction('users_exported', {});
      } catch (error) {
        handleError(error, { operation: 'export_users' });
      }
    });
  }, [measureAsync, handleError, roleFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-orbitron text-white">User Management</h1>
          <p className="text-muted mt-1">Manage users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsUserDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {statsError && (
        <Card className="p-6 border-red-500/20 bg-red-500/10">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load user statistics. Please try again.</p>
          </div>
        </Card>
      )}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-800" />
          ))}
        </div>
      ) : stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springConfigs.gentle, delay: 0 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Total Users</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springConfigs.gentle, delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Active Users</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.activeUsers}</p>
                </div>
                <div className="p-3 rounded-full bg-green-500/20">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springConfigs.gentle, delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Suspended</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.suspendedUsers}</p>
                </div>
                <div className="p-3 rounded-full bg-red-500/20">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springConfigs.gentle, delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Recent Logins</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.recentLogins}</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/20">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <option value="all">All Roles</option>
              {roles?.map(role => (
                <option key={role.id} value={role.code}>{role.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
            {selectedUsers.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedUsers.size} selected</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Bulk Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('active')}>
                      Activate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('inactive')}>
                      Deactivate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('suspended')}>
                      Suspend
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Users Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-white/20"
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <p className="text-red-400">Failed to load users</p>
                        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}>
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-5 w-5 animate-spin text-muted mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                          className="rounded border-white/20"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{user.email}</p>
                          {user.firstName || user.lastName ? (
                            <p className="text-sm text-muted">
                              {user.firstName} {user.lastName}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.twoFactorEnabled ? (
                          <Shield className="h-4 w-4 text-green-400 fill-green-400/20" />
                        ) : (
                          <Shield className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setIsUserDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(user.id, user.status === 'active' ? 'inactive' : 'active')}>
                              {user.status === 'active' ? (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(user.id, 'suspended')}>
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteUserMutation.mutate(user.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Roles & Permissions</h2>
            <Button onClick={() => setIsRoleDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </div>

          {rolesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-800" />
              ))}
            </div>
          ) : roles && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <Card key={role.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{role.name}</h3>
                      <p className="text-sm text-muted">{role.code}</p>
                    </div>
                    {role.isSystem && (
                      <Badge variant="outline">System</Badge>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-sm text-muted mb-4">{role.description}</p>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm text-muted">
                      {role.permissions.length} permissions
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    {!role.isSystem && (
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activitiesLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <RefreshCw className="h-5 w-5 animate-spin text-muted mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted">
                      No activity found
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.userEmail}</TableCell>
                      <TableCell>{activity.action}</TableCell>
                      <TableCell>{activity.resource}</TableCell>
                      <TableCell className="text-sm text-muted">{activity.ipAddress || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-muted">
                        {new Date(activity.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card className="p-6">
            <p className="text-muted">Permission management coming soon...</p>
            <p className="text-sm text-muted mt-2">
              Manage granular permissions for roles and users
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Create User'}</DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Update user information' : 'Add a new user to the system'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-muted mb-2 block">Email</label>
                <Input placeholder="user@example.com" defaultValue={selectedUser?.email} />
              </div>
              <div>
                <label className="text-sm text-muted mb-2 block">Role</label>
                <select className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white">
                  {roles?.map(role => (
                    <option key={role.id} value={role.code}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-muted mb-2 block">First Name</label>
                <Input placeholder="John" defaultValue={selectedUser?.firstName} />
              </div>
              <div>
                <label className="text-sm text-muted mb-2 block">Last Name</label>
                <Input placeholder="Doe" defaultValue={selectedUser?.lastName} />
              </div>
            </div>
            {!selectedUser && (
              <div>
                <label className="text-sm text-muted mb-2 block">Password</label>
                <Input type="password" placeholder="••••••••" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsUserDialogOpen(false);
              setSelectedUser(null);
            }}>
              Cancel
            </Button>
            <Button>
              {selectedUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

