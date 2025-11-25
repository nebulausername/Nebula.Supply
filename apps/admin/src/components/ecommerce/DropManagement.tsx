import React, { useState } from 'react';
import { RealtimeDropTest } from './RealtimeDropTest';
import { DropManagementAdvanced } from './DropManagementAdvanced';
import { Button } from '../ui/Button';

export function DropManagement() {
  const [showTest, setShowTest] = useState(false);
  const [useAdvanced, setUseAdvanced] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drop Management</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowTest(!showTest)}
          >
            {showTest ? 'Hide' : 'Show'} Test Panel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setUseAdvanced(!useAdvanced)}
          >
            {useAdvanced ? 'Legacy View' : 'Advanced View'}
          </Button>
        </div>
      </div>

      {showTest && <RealtimeDropTest />}
      
      {useAdvanced ? (
        <DropManagementAdvanced />
      ) : (
        <div className="p-6 text-center text-muted">
          Legacy view is deprecated. Please use Advanced View.
        </div>
      )}
    </div>
  );
}

export function DropManagementLegacy() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDrop, setEditingDrop] = useState<Drop | null>(null);

  const { data: dropsData, isLoading, error } = useDrops({
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: 50
  });

  const createDropMutation = useCreateDrop();
  const updateDropMutation = useUpdateDrop();
  const deleteDropMutation = useDeleteDrop();

  const handleCreateDrop = async (formData: DropFormData) => {
    try {
      await createDropMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create drop:', error);
    }
  };

  const handleUpdateDrop = async (formData: DropFormData) => {
    if (!editingDrop) return;

    try {
      await updateDropMutation.mutateAsync({
        id: editingDrop.id,
        data: formData
      });
      setEditingDrop(null);
    } catch (error) {
      console.error('Failed to update drop:', error);
    }
  };

  const handleDeleteDrop = async (dropId: string) => {
    if (confirm('Are you sure you want to delete this drop?')) {
      try {
        await deleteDropMutation.mutateAsync(dropId);
      } catch (error) {
        console.error('Failed to delete drop:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      sold_out: 'destructive',
      scheduled: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getAccessBadge = (access: string) => {
    const colors = {
      free: 'bg-green-500',
      limited: 'bg-yellow-500',
      vip: 'bg-purple-500',
      standard: 'bg-blue-500'
    };

    return (
      <div className={`w-3 h-3 rounded-full ${colors[access as keyof typeof colors] || 'bg-gray-500'}`} />
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          Error loading drops: {error.message}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Drop Management</h1>
          <p className="text-muted">Manage product drops and inventory</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-neon hover:bg-neon/80">
              <Plus className="w-4 h-4 mr-2" />
              Create Drop
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Drop</DialogTitle>
              <DialogDescription>
                Add a new product drop to your catalog
              </DialogDescription>
            </DialogHeader>
            <DropForm onSubmit={handleCreateDrop} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                placeholder="Search drops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-white/10 rounded-md bg-black/25 text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="sold_out">Sold Out</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </Card>

      {/* Drops Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Sold</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dropsData?.data?.map((drop) => (
              <TableRow key={drop.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{drop.name}</div>
                    {drop.badge && (
                      <Badge variant="outline" className="mt-1">
                        {drop.badge}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getAccessBadge(drop.access)}
                    <span className="capitalize">{drop.access}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(drop.status)}</TableCell>
                <TableCell>{drop.totalStock || 0}</TableCell>
                <TableCell>{drop.soldCount || 0}</TableCell>
                <TableCell>€{drop.revenue?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setEditingDrop(drop)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteDrop(drop.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {(!dropsData?.data || dropsData.data.length === 0) && (
          <div className="text-center py-12">
            <p className="text-muted">No drops found</p>
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingDrop} onOpenChange={() => setEditingDrop(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Drop</DialogTitle>
            <DialogDescription>
              Update drop information and settings
            </DialogDescription>
          </DialogHeader>
          {editingDrop && (
            <DropForm
              initialData={editingDrop}
              onSubmit={handleUpdateDrop}
              onCancel={() => setEditingDrop(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Drop Form Component
function DropForm({
  initialData,
  onSubmit,
  onCancel
}: {
  initialData?: Drop;
  onSubmit: (data: DropFormData) => void;
  onCancel?: () => void;
}) {
  const [formData, setFormData] = useState<DropFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    badge: initialData?.badge || '',
    access: initialData?.access || 'standard',
    status: initialData?.status || 'active',
    scheduledDate: initialData?.scheduledDate || '',
    variants: initialData?.variants || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Badge</label>
          <Input
            value={formData.badge || ''}
            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
            placeholder="NEW, LIMITED, etc."
          />
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium mb-2">Images</label>
        <ImagePicker
          multiple
          value={(formData as any).images || []}
          onChange={(images) => setFormData({ ...(formData as any), images })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Access Level</label>
          <select
            value={formData.access}
            onChange={(e) => setFormData({ ...formData, access: e.target.value as any })}
            className="w-full px-3 py-2 border border-white/10 rounded-md bg-black/25 text-white"
          >
            <option value="free">Free</option>
            <option value="standard">Standard</option>
            <option value="limited">Limited</option>
            <option value="vip">VIP</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-3 py-2 border border-white/10 rounded-md bg-black/25 text-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="sold_out">Sold Out</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {formData.status === 'scheduled' && (
        <div>
          <label className="block text-sm font-medium mb-2">Scheduled Date</label>
          <Input
            type="datetime-local"
            value={formData.scheduledDate || ''}
            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-white/10 rounded-md bg-black/25 text-white resize-none"
        />
      </div>

      <DialogFooter>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="bg-neon hover:bg-neon/80">
          {initialData ? 'Update' : 'Create'} Drop
        </Button>
      </DialogFooter>
    </form>
  );
}


