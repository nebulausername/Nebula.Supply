import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Loader2,
  X
} from 'lucide-react';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { logger } from '../../lib/logger';
import { api } from '../../lib/api/client';
import { exportToCSV, exportToJSON } from '../../lib/utils/export';
import { useToast } from '../ui/Toast';

interface BulkExportModalProps {
  open: boolean;
  onClose: () => void;
  type: 'products' | 'drops';
  selectedIds?: string[];
  filters?: any;
  products?: any[]; // Pass products data for export
}

export function BulkExportModal({ open, onClose, type, selectedIds, filters, products }: BulkExportModalProps) {
  const { handleError } = useErrorHandler('BulkExportModal');
  const { showToast } = useToast();
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const allFields = type === 'products'
    ? ['id', 'name', 'description', 'price', 'stock', 'sku', 'status', 'access', 'category', 'createdAt', 'updatedAt']
    : ['id', 'name', 'description', 'badge', 'status', 'access', 'progress', 'totalStock', 'soldCount', 'revenue', 'interestCount', 'createdAt'];

  // Initialize selected fields
  React.useEffect(() => {
    if (open) {
      setSelectedFields(new Set(allFields));
    }
  }, [open, allFields]);

  const handleFieldToggle = useCallback((field: string) => {
    setSelectedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  }, []);

  const handleExport = useCallback(async () => {
    if (selectedFields.size === 0) {
      showToast({ type: 'error', title: 'Please select at least one field to export' });
      return;
    }

    setIsExporting(true);
    
    try {
      logger.info('Bulk export requested', { type, format: exportFormat, fields: Array.from(selectedFields) });
      
      let data: any[] = [];
      
      // Try to fetch data from API if not provided
      if (!products || products.length === 0) {
        try {
          if (type === 'products') {
            const response = await api.get<{ success: boolean; data: any[] }>('/api/products', {
              limit: 1000,
              ...filters
            });
            data = response.data || [];
          } else if (type === 'drops') {
            const response = await api.get<{ success: boolean; data: any[] }>('/api/admin/drops', {
              limit: 1000,
              ...filters
            });
            data = response.data || [];
          }
        } catch (apiError) {
          logger.warn('Failed to fetch data from API, using provided data', { apiError });
          // Fallback to provided products or empty array
          data = products || [];
        }
      } else {
        data = products;
      }

      // Filter by selected IDs if provided
      if (selectedIds && selectedIds.length > 0) {
        data = data.filter((item: any) => selectedIds.includes(item.id));
      }

      // Map data to selected fields
      const exportData = data.map((item: any) => {
        const exportItem: any = {};
        selectedFields.forEach(field => {
          switch (field) {
            case 'id':
              exportItem.id = item.id;
              break;
            case 'name':
              exportItem.name = item.name;
              break;
            case 'description':
              exportItem.description = item.description || '';
              break;
            case 'price':
              exportItem.price = item.price || item.basePrice || 0;
              break;
            case 'stock':
            case 'inventory':
              exportItem.stock = item.inventory || item.stock || 0;
              break;
            case 'sku':
              exportItem.sku = item.sku || '';
              break;
            case 'status':
              exportItem.status = item.status || 'active';
              break;
            case 'access':
              exportItem.access = item.access || 'standard';
              break;
            case 'category':
              exportItem.category = item.categoryName || item.categoryId || '';
              break;
            case 'createdAt':
              exportItem.createdAt = item.createdAt || '';
              break;
            case 'updatedAt':
              exportItem.updatedAt = item.updatedAt || '';
              break;
            default:
              exportItem[field] = item[field] || '';
          }
        });
        return exportItem;
      });

      const headers = Array.from(selectedFields);
      const filename = `${type}-export-${new Date().toISOString().split('T')[0]}`;

      if (exportFormat === 'json') {
        exportToJSON(exportData, filename);
      } else if (exportFormat === 'csv') {
        exportToCSV({
          headers,
          rows: exportData.map(item => headers.map(h => item[h] || '')),
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Export`,
          metadata: {
            'Generated': new Date().toLocaleString(),
            'Total Items': exportData.length,
            'Selected Fields': headers.join(', '),
          }
        }, filename);
      } else {
        // Excel fallback to CSV
        exportToCSV({
          headers,
          rows: exportData.map(item => headers.map(h => item[h] || '')),
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Export`,
        }, filename);
      }

      logger.logUserAction('bulk_export', { type, format: exportFormat, fieldCount: selectedFields.size, itemCount: exportData.length });
      showToast({ type: 'success', title: 'Export completed', message: `${exportData.length} items exported successfully` });
      onClose();
    } catch (error) {
      logger.error('Bulk export failed', { error, type, format: exportFormat });
      handleError(error, { operation: 'bulk_export', type });
      showToast({ type: 'error', title: 'Export failed', message: 'Failed to export data. Please try again.' });
    } finally {
      setIsExporting(false);
    }
  }, [exportFormat, selectedFields, type, selectedIds, filters, products, onClose, handleError, showToast]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Export - {type === 'products' ? 'Produkte' : 'Drops'}</DialogTitle>
          <DialogDescription>
            Exportiere {type === 'products' ? 'Produkte' : 'Drops'} in verschiedenen Formaten
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Export-Format</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                />
                <FileText className="w-4 h-4" />
                <span>CSV</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                />
                <FileText className="w-4 h-4" />
                <span>JSON</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                />
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </label>
            </div>
          </Card>

          {/* Field Selection */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Felder auswählen</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFields(new Set(allFields))}
                >
                  Alle auswählen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFields(new Set())}
                >
                  Alle abwählen
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {allFields.map(field => (
                <label key={field} className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={selectedFields.has(field)}
                    onCheckedChange={() => handleFieldToggle(field)}
                  />
                  <span>{field}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Export Options */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Export-Optionen</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Export-Bereich:</span>
                <span className="font-medium">
                  {selectedIds && selectedIds.length > 0
                    ? `${selectedIds.length} ausgewählte`
                    : filters
                    ? 'Gefilterte'
                    : 'Alle'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Felder:</span>
                <span className="font-medium">{selectedFields.size} von {allFields.length}</span>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            <X className="w-4 h-4 mr-2" />
            Abbrechen
          </Button>
          <Button onClick={handleExport} disabled={isExporting || selectedFields.size === 0}>
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exportiere...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportieren
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

