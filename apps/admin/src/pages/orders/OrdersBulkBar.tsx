import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useToastHelpers } from '../../components/ui/Toast';
import { OrderStatus, canTransition, getNextStatuses } from '@nebula/shared';
import { logger } from '../../lib/logger';

interface OrdersBulkBarProps {
  selectedOrderIds: string[];
  currentStatus: OrderStatus;
  onBulkStatusChange: (orderIds: string[], newStatus: OrderStatus) => Promise<void>;
  onClearSelection: () => void;
  className?: string;
}

export const OrdersBulkBar: React.FC<OrdersBulkBarProps> = ({
  selectedOrderIds,
  currentStatus,
  onBulkStatusChange,
  onClearSelection,
  className
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { success, error: showError } = useToastHelpers();

  const nextStatuses = getNextStatuses(currentStatus);
  const canBulkTransition = nextStatuses.length > 0;

  const handleBulkStatusChange = async (newStatus: OrderStatus) => {
    if (!canTransition(currentStatus, newStatus)) {
      showError('Invalid Transition', `Cannot transition from ${currentStatus} to ${newStatus}`);
      return;
    }

    setIsProcessing(true);
    try {
      await onBulkStatusChange(selectedOrderIds, newStatus);
      success(
        'Bulk Update Successful',
        `Updated ${selectedOrderIds.length} orders to ${newStatus}`
      );
      logger.logUserAction('bulk_order_status_change', {
        orderIds: selectedOrderIds,
        fromStatus: currentStatus,
        toStatus: newStatus,
        count: selectedOrderIds.length
      });
    } catch (err) {
      showError('Bulk Update Failed', 'Some orders could not be updated');
      logger.error('Bulk order status change failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedOrderIds.length === 0) {
    return null;
  }

  return (
    <div className={`bg-blue-900/20 border border-blue-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-blue-200">
            {selectedOrderIds.length} order{selectedOrderIds.length !== 1 ? 's' : ''} selected
          </span>
          
          {canBulkTransition && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Change status to:</span>
              <Select
                value=""
                onChange={(e) => {
                  const newStatus = e.target.value as OrderStatus;
                  if (newStatus) {
                    handleBulkStatusChange(newStatus);
                  }
                }}
                disabled={isProcessing}
                className="min-w-32"
              >
                <option value="">Select status...</option>
                {nextStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          )}
          
          <Button
            onClick={onClearSelection}
            variant="outline"
            size="sm"
            disabled={isProcessing}
          >
            Clear Selection
          </Button>
        </div>
      </div>
    </div>
  );
};



