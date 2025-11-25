import React, { useState, useCallback } from 'react';
import { Button } from '../ui/Button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select';
import { Input } from '../ui/Input';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Order } from '../../lib/api/ecommerce';
import { logger } from '../../lib/logger';

export interface OrderExportOptions {
  format: 'csv' | 'pdf';
  columns: string[];
  includeHeaders: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}

interface OrderExportProps {
  orders: Order[];
  selectedOrderIds?: string[];
  onExport?: (options: OrderExportOptions) => Promise<void>;
  className?: string;
}

const availableColumns = [
  { id: 'orderId', label: 'Order ID', default: true },
  { id: 'customerName', label: 'Customer Name', default: true },
  { id: 'customerEmail', label: 'Customer Email', default: true },
  { id: 'status', label: 'Status', default: true },
  { id: 'totalAmount', label: 'Total Amount', default: true },
  { id: 'currency', label: 'Currency', default: true },
  { id: 'createdAt', label: 'Created Date', default: true },
  { id: 'updatedAt', label: 'Updated Date', default: false },
  { id: 'trackingNumber', label: 'Tracking Number', default: false },
  { id: 'paymentStatus', label: 'Payment Status', default: false },
  { id: 'paymentMethod', label: 'Payment Method', default: false },
  { id: 'items', label: 'Items', default: false },
];

export function OrderExport({
  orders,
  selectedOrderIds,
  onExport,
  className
}: OrderExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    availableColumns.filter(col => col.default).map(col => col.id)
  );
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const ordersToExport = selectedOrderIds && selectedOrderIds.length > 0
    ? orders.filter(order => selectedOrderIds.includes(order.id))
    : orders;

  const handleExport = useCallback(async () => {
    if (ordersToExport.length === 0) {
      alert('No orders to export');
      return;
    }

    setIsExporting(true);
    try {
      const options: OrderExportOptions = {
        format,
        columns: selectedColumns,
        includeHeaders,
      };

      if (onExport) {
        await onExport(options);
      } else {
        // Default export implementation
        if (format === 'csv') {
          await exportToCSV(ordersToExport, options);
        } else {
          await exportToPDF(ordersToExport, options);
        }
      }

      logger.logUserAction('orders_exported', {
        format,
        count: ordersToExport.length,
        columns: selectedColumns,
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [ordersToExport, format, selectedColumns, includeHeaders, onExport]);

  const toggleColumn = (columnId: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Download className="w-4 h-4 mr-2" />
          Export {selectedOrderIds && selectedOrderIds.length > 0 ? `(${selectedOrderIds.length})` : ''}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Orders</DialogTitle>
          <DialogDescription>
            Export {ordersToExport.length} order{ordersToExport.length !== 1 ? 's' : ''} to {format.toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Export Format</label>
            <Select value={format} onValueChange={(value) => setFormat(value as 'csv' | 'pdf')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    CSV (Excel compatible)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PDF Document
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Column Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Columns</label>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border border-white/10 rounded">
              {availableColumns.map((column) => (
                <label key={column.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column.id)}
                    onChange={() => toggleColumn(column.id)}
                    className="rounded border-white/20 bg-black/25"
                  />
                  <span className="text-sm">{column.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedColumns(availableColumns.map(col => col.id))}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedColumns([])}
              >
                Deselect All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedColumns(availableColumns.filter(col => col.default).map(col => col.id))}
              >
                Reset to Default
              </Button>
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeHeaders}
                onChange={(e) => setIncludeHeaders(e.target.checked)}
                className="rounded border-white/20 bg-black/25"
              />
              <span className="text-sm">Include column headers</span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || selectedColumns.length === 0}>
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// CSV Export Implementation
async function exportToCSV(orders: Order[], options: OrderExportOptions) {
  const headers = options.includeHeaders
    ? options.columns.map(col => {
        const column = availableColumns.find(c => c.id === col);
        return column?.label || col;
      })
    : [];

  const rows = orders.map(order => {
    return options.columns.map(col => {
      switch (col) {
        case 'orderId':
          return order.orderId;
        case 'customerName':
          return order.customerName;
        case 'customerEmail':
          return order.customerEmail;
        case 'status':
          return order.status;
        case 'totalAmount':
          return order.totalAmount.toFixed(2);
        case 'currency':
          return order.currency;
        case 'createdAt':
          return new Date(order.createdAt).toLocaleString();
        case 'updatedAt':
          return new Date(order.updatedAt).toLocaleString();
        case 'trackingNumber':
          return order.trackingNumber || '';
        case 'paymentStatus':
          return order.paymentStatus || '';
        case 'paymentMethod':
          return order.paymentMethod || '';
        case 'items':
          return order.items.map(item => `${item.name} (x${item.quantity})`).join('; ');
        default:
          return '';
      }
    });
  });

  const csvContent = [
    ...(headers.length > 0 ? [headers.join(',')] : []),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// PDF Export Implementation (simplified - would need a PDF library in production)
async function exportToPDF(orders: Order[], options: OrderExportOptions) {
  // For now, we'll create a simple HTML table and use browser print
  // In production, you'd use a library like jsPDF or pdfkit
  
  const table = document.createElement('table');
  table.style.borderCollapse = 'collapse';
  table.style.width = '100%';
  
  // Headers
  if (options.includeHeaders) {
    const headerRow = document.createElement('tr');
    options.columns.forEach(col => {
      const th = document.createElement('th');
      const column = availableColumns.find(c => c.id === col);
      th.textContent = column?.label || col;
      th.style.border = '1px solid #000';
      th.style.padding = '8px';
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
  }
  
  // Rows
  orders.forEach(order => {
    const row = document.createElement('tr');
    options.columns.forEach(col => {
      const td = document.createElement('td');
      let value = '';
      switch (col) {
        case 'orderId':
          value = order.orderId;
          break;
        case 'customerName':
          value = order.customerName;
          break;
        case 'customerEmail':
          value = order.customerEmail;
          break;
        case 'status':
          value = order.status;
          break;
        case 'totalAmount':
          value = order.totalAmount.toFixed(2);
          break;
        case 'currency':
          value = order.currency;
          break;
        case 'createdAt':
          value = new Date(order.createdAt).toLocaleString();
          break;
        case 'updatedAt':
          value = new Date(order.updatedAt).toLocaleString();
          break;
        case 'trackingNumber':
          value = order.trackingNumber || '';
          break;
        case 'paymentStatus':
          value = order.paymentStatus || '';
          break;
        case 'paymentMethod':
          value = order.paymentMethod || '';
          break;
        case 'items':
          value = order.items.map(item => `${item.name} (x${item.quantity})`).join('; ');
          break;
      }
      td.textContent = value;
      td.style.border = '1px solid #000';
      td.style.padding = '8px';
      row.appendChild(td);
    });
    table.appendChild(row);
  });
  
  // Create print window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Orders Export</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
          </style>
        </head>
        <body>
          <h1>Orders Export</h1>
          <p>Exported on ${new Date().toLocaleString()}</p>
          ${table.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}

