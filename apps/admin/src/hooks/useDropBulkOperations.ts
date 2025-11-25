import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dropsApi } from '../lib/api/ecommerce';
import { exportDropsToCSV, exportDropsToJSON } from '../lib/dropUtils';
import { useDropConfig } from '../store/dropConfigStore';
import type { Drop } from '@nebula/shared';

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

export const useDropBulkOperations = () => {
  const queryClient = useQueryClient();
  const config = useDropConfig();
  const [isProcessing, setIsProcessing] = useState(false);

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({
      dropIds,
      updates,
    }: {
      dropIds: string[];
      updates: Record<string, any>;
    }) => {
      const results = await Promise.allSettled(
        dropIds.map((id) =>
          dropsApi.updateDrop(id, updates)
        )
      );

      const success = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      const errors = results
        .filter((r) => r.status === 'rejected')
        .map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

      return {
        success: failed === 0,
        processed: dropIds.length,
        failed,
        errors,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drops', 'list'] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (dropIds: string[]) => {
      const results = await Promise.allSettled(
        dropIds.map((id) => dropsApi.deleteDrop(id))
      );

      const success = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      const errors = results
        .filter((r) => r.status === 'rejected')
        .map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

      return {
        success: failed === 0,
        processed: dropIds.length,
        failed,
        errors,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drops', 'list'] });
    },
  });

  const bulkUpdate = useCallback(
    async (
      dropIds: string[],
      updates: Record<string, any>
    ): Promise<BulkOperationResult> => {
      setIsProcessing(true);
      try {
        const result = await bulkUpdateMutation.mutateAsync({ dropIds, updates });
        return result;
      } finally {
        setIsProcessing(false);
      }
    },
    [bulkUpdateMutation]
  );

  const bulkDelete = useCallback(
    async (dropIds: string[]): Promise<BulkOperationResult> => {
      setIsProcessing(true);
      try {
        const result = await bulkDeleteMutation.mutateAsync(dropIds);
        return result;
      } finally {
        setIsProcessing(false);
      }
    },
    [bulkDeleteMutation]
  );

  const bulkExport = useCallback(
    async (
      drops: Drop[],
      format: 'csv' | 'json' | 'xlsx' = config.export.defaultFormat
    ): Promise<void> => {
      setIsProcessing(true);
      try {
        const fields = config.export.includeFields;
        let content: string;
        let filename: string;
        let mimeType: string;

        switch (format) {
          case 'csv':
            content = exportDropsToCSV(drops, fields);
            filename = `drops-export-${Date.now()}.csv`;
            mimeType = 'text/csv';
            break;
          case 'json':
            content = exportDropsToJSON(drops, fields);
            filename = `drops-export-${Date.now()}.json`;
            mimeType = 'application/json';
            break;
          default:
            throw new Error(`Unsupported format: ${format}`);
        }

        // Create download
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } finally {
        setIsProcessing(false);
      }
    },
    [config.export]
  );

  const bulkStatusUpdate = useCallback(
    async (dropIds: string[], status: string): Promise<BulkOperationResult> => {
      return bulkUpdate(dropIds, { status });
    },
    [bulkUpdate]
  );

  const bulkAccessUpdate = useCallback(
    async (dropIds: string[], access: string): Promise<BulkOperationResult> => {
      return bulkUpdate(dropIds, { access });
    },
    [bulkUpdate]
  );

  return {
    bulkUpdate,
    bulkDelete,
    bulkExport,
    bulkStatusUpdate,
    bulkAccessUpdate,
    isProcessing,
  };
};

