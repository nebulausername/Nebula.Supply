import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/Dialog';
import { useDropBulkOperations } from '../../hooks/useDropBulkOperations';
import { useDropSelection } from '../../store/dropStore';
import { Download, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import type { Drop } from '@nebula/shared';

interface BulkOperationsProps {
  drops: Drop[];
  onComplete?: () => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  drops,
  onComplete,
}) => {
  const { selectedDrops, clearSelection } = useDropSelection();
  const {
    bulkUpdate,
    bulkDelete,
    bulkExport,
    bulkStatusUpdate,
    bulkAccessUpdate,
    isProcessing,
  } = useDropBulkOperations();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedAccess, setSelectedAccess] = useState<string>('standard');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const selectedDropsArray = selectedDrops;
  const selectedCount = selectedDropsArray.length;
  const selectedDropsData = drops.filter((d) => selectedDropsArray.includes(d.id));

  if (selectedCount === 0) {
    return null;
  }

  const handleBulkDelete = async () => {
    try {
      const result = await bulkDelete(selectedDropsArray);
      setResult({
        success: result.success,
        message: result.success
          ? `Successfully deleted ${result.processed} drops`
          : `Failed to delete ${result.failed} of ${result.processed} drops`,
      });
      if (result.success) {
        setShowDeleteDialog(false);
        clearSelection();
        onComplete?.();
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${(error as Error).message}`,
      });
    }
  };

  const handleBulkStatusUpdate = async () => {
    try {
      const result = await bulkStatusUpdate(selectedDropsArray, selectedStatus);
      setResult({
        success: result.success,
        message: result.success
          ? `Successfully updated ${result.processed} drops`
          : `Failed to update ${result.failed} of ${result.processed} drops`,
      });
      if (result.success) {
        setShowStatusDialog(false);
        clearSelection();
        onComplete?.();
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${(error as Error).message}`,
      });
    }
  };

  const handleBulkAccessUpdate = async () => {
    try {
      const result = await bulkAccessUpdate(selectedDropsArray, selectedAccess);
      setResult({
        success: result.success,
        message: result.success
          ? `Successfully updated ${result.processed} drops`
          : `Failed to update ${result.failed} of ${result.processed} drops`,
      });
      if (result.success) {
        setShowAccessDialog(false);
        clearSelection();
        onComplete?.();
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${(error as Error).message}`,
      });
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      await bulkExport(selectedDropsData, format);
      setResult({
        success: true,
        message: `Exported ${selectedCount} drops to ${format.toUpperCase()}`,
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${(error as Error).message}`,
      });
    }
  };

  return (
    <>
      <Card className="p-4 bg-neon/10 border-neon/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium">
              {selectedCount} drop{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatusDialog(true)}
              disabled={isProcessing}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Update Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAccessDialog(true)}
              disabled={isProcessing}
            >
              Update Access
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={isProcessing}
            >
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
              disabled={isProcessing}
            >
              <Download className="w-4 h-4 mr-1" />
              Export JSON
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isProcessing}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        {result && (
          <div
            className={`mt-3 p-2 rounded flex items-center gap-2 ${
              result.success
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{result.message}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setResult(null)}
            >
              Dismiss
            </Button>
          </div>
        )}
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Drops</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} drop
              {selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Update status for {selectedCount} drop{selectedCount !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">New Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-white/10 rounded bg-black/25 text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="sold_out">Sold Out</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkStatusUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Update Dialog */}
      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Access</DialogTitle>
            <DialogDescription>
              Update access level for {selectedCount} drop{selectedCount !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">New Access Level</label>
              <select
                value={selectedAccess}
                onChange={(e) => setSelectedAccess(e.target.value)}
                className="w-full px-3 py-2 border border-white/10 rounded bg-black/25 text-white"
              >
                <option value="free">Free</option>
                <option value="standard">Standard</option>
                <option value="limited">Limited</option>
                <option value="vip">VIP</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAccessDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkAccessUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

