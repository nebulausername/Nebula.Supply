import React from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './Dialog';
import {
  Check,
  X,
  MoreHorizontal,
  Download,
  Printer,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  disabled?: (selectedCount: number) => boolean;
  onAction: (selectedIds: string[]) => Promise<void> | void;
}

interface BulkActionBarProps {
  selectedCount: number;
  selectedIds: string[];
  onClearSelection: () => void;
  actions: BulkAction[];
  className?: string;
  isSticky?: boolean;
  showProgress?: boolean;
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
}

export function BulkActionBar({
  selectedCount,
  selectedIds,
  onClearSelection,
  actions,
  className,
  isSticky = true,
  showProgress = false,
  progress
}: BulkActionBarProps) {
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [confirmationAction, setConfirmationAction] = React.useState<BulkAction | null>(null);

  if (selectedCount === 0) return null;

  const handleAction = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setConfirmationAction(action);
      return;
    }

    await executeAction(action);
  };

  const executeAction = async (action: BulkAction) => {
    setIsExecuting(true);
    try {
      await action.onAction(selectedIds);
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsExecuting(false);
      setConfirmationAction(null);
    }
  };

  const availableActions = actions.filter(action => 
    !action.disabled || !action.disabled(selectedCount)
  );

  const primaryActions = availableActions.slice(0, 3);
  const overflowActions = availableActions.slice(3);

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between gap-4 p-4 bg-gray-900/50 border border-white/10 rounded-lg',
          isSticky && 'sticky bottom-4 z-50',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-text">
              {selectedCount} selected
            </span>
          </div>
          
          {showProgress && progress && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted">
                {progress.current}/{progress.total}
                {progress.label && ` ${progress.label}`}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Primary Actions */}
          {primaryActions.map((action) => {
            const Icon = action.icon;
            const isDisabled = action.disabled?.(selectedCount) || isExecuting;

            return (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => handleAction(action)}
                disabled={isDisabled}
                className="flex items-center gap-2"
              >
                {isExecuting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : Icon ? (
                  <Icon className="w-4 h-4" />
                ) : null}
                {action.label}
              </Button>
            );
          })}

          {/* Overflow Actions */}
          {overflowActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" size="sm" disabled={isExecuting}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {overflowActions.map((action) => {
                  const Icon = action.icon;
                  const isDisabled = action.disabled?.(selectedCount) || isExecuting;

                  return (
                    <DropdownMenuItem
                      key={action.id}
                      onClick={() => handleAction(action)}
                      disabled={isDisabled}
                      className="flex items-center gap-2"
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      {action.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isExecuting}
            className="text-muted hover:text-text"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmationAction} onOpenChange={() => setConfirmationAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              {confirmationAction?.confirmationTitle || 'Confirm Action'}
            </DialogTitle>
            <DialogDescription>
              {confirmationAction?.confirmationMessage || 
                `Are you sure you want to perform this action on ${selectedCount} items?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmationAction(null)}
              disabled={isExecuting}
            >
              Cancel
            </Button>
            <Button
              variant={confirmationAction?.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={() => confirmationAction && executeAction(confirmationAction)}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Predefined bulk actions for common use cases
export const commonBulkActions: BulkAction[] = [
  {
    id: 'export-csv',
    label: 'Export CSV',
    icon: Download,
    onAction: (selectedIds) => {
      console.log('Exporting to CSV:', selectedIds);
      // Implement CSV export
    }
  },
  {
    id: 'export-pdf',
    label: 'Export PDF',
    icon: Printer,
    onAction: (selectedIds) => {
      console.log('Exporting to PDF:', selectedIds);
      // Implement PDF export
    }
  },
  {
    id: 'print-labels',
    label: 'Print Labels',
    icon: Printer,
    onAction: (selectedIds) => {
      console.log('Printing labels:', selectedIds);
      // Implement label printing
    }
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmationTitle: 'Delete Selected Items',
    confirmationMessage: 'Are you sure you want to delete these items? This action cannot be undone.',
    onAction: (selectedIds) => {
      console.log('Deleting:', selectedIds);
      // Implement delete
    }
  }
];

// Status update bulk action factory
export const createStatusUpdateAction = (
  status: string,
  onUpdate: (selectedIds: string[], status: string) => Promise<void>
): BulkAction => ({
  id: `update-status-${status}`,
  label: `Mark as ${status}`,
  icon: Edit,
  onAction: (selectedIds) => onUpdate(selectedIds, status)
});

// Bulk action for updating multiple orders to a specific status
export const createBulkStatusUpdateActions = (
  statuses: string[],
  onStatusUpdate: (selectedIds: string[], status: string) => Promise<void>
): BulkAction[] => 
  statuses.map(status => createStatusUpdateAction(status, onStatusUpdate));
