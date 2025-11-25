import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useBulkImportProducts } from '../../lib/api/shopHooks';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { useToastHelpers } from '../ui/Toast';
import { BulkProgressTracker } from './BulkProgressTracker';

interface BulkImportWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ImportRow {
  row: number;
  data: any;
  errors?: string[];
}

export function BulkImportWizard({ open, onClose, onSuccess }: BulkImportWizardProps) {
  const [step, setStep] = useState<'upload' | 'review' | 'importing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [validRows, setValidRows] = useState<ImportRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkImportMutation = useBulkImportProducts();
  const { handleError } = useErrorHandler('BulkImportWizard');
  const { success, error: showError } = useToastHelpers();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        showError('Invalid File', 'Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        showError('Invalid CSV', 'CSV must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['name', 'price', 'categoryid', 'sku'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        showError('Missing Headers', `Required headers: ${missingHeaders.join(', ')}`);
        return;
      }

      const rows: ImportRow[] = [];
      const valid: ImportRow[] = [];
      const invalid: ImportRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const rowData: any = {};
        const errors: string[] = [];

        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        // Validate required fields
        if (!rowData.name) errors.push('Name is required');
        if (!rowData.price || isNaN(parseFloat(rowData.price))) errors.push('Valid price is required');
        if (!rowData.categoryid) errors.push('Category ID is required');
        if (!rowData.sku) errors.push('SKU is required');

        const row: ImportRow = {
          row: i + 1,
          data: rowData,
          errors: errors.length > 0 ? errors : undefined
        };

        rows.push(row);
        if (errors.length > 0) {
          invalid.push(row);
        } else {
          valid.push(row);
        }
      }

      setParsedData(rows);
      setValidRows(valid);
      setInvalidRows(invalid);
      setStep('review');
    } catch (error) {
      handleError(error, { operation: 'parse_csv' });
    }
  };

  const handleImport = async () => {
    setIsProcessing(true);
    setStep('importing');
    
    try {
      const products = validRows.map(row => ({
        name: row.data.name,
        price: parseFloat(row.data.price),
        categoryId: row.data.categoryid,
        sku: row.data.sku,
        description: row.data.description || '',
        inventory: parseInt(row.data.inventory || '0') || 0,
        status: row.data.status || 'draft',
        currency: row.data.currency || 'EUR',
        type: row.data.type || 'shop',
      }));

      const result = await bulkImportMutation.mutateAsync(products);
      
      if (result.data) {
        const { success: successCount, failed, errors } = result.data;
        setStep('complete');
        
        if (successCount > 0) {
          success('Import Complete', `${successCount} products imported successfully`);
        }
        if (failed > 0) {
          showError('Partial Import', `${failed} products failed to import`);
        }
        
        onSuccess?.();
      }
    } catch (error) {
      handleError(error, { operation: 'bulk_import' });
      setStep('review');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['name', 'sku', 'price', 'categoryId', 'description', 'inventory', 'status', 'currency', 'type'];
    const csv = [headers.join(','), 'Example Product,PROD-001,29.99,category-id,Product description,100,active,EUR,shop'].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setParsedData([]);
    setValidRows([]);
    setInvalidRows([]);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-blue-400" />
            Bulk Import Products
          </DialogTitle>
          <DialogDescription>
            Import multiple products from a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
                <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a CSV file with product data. Download template for format reference.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Select File
                  </Button>
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <h4 className="font-medium mb-2">CSV Format Requirements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Required columns: name, sku, price, categoryId</li>
                  <li>• Optional columns: description, inventory, status, currency, type</li>
                  <li>• First row must be headers</li>
                  <li>• Price must be a valid number</li>
                  <li>• Status: active, inactive, draft, or archived</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Review Import Data</h3>
                  <p className="text-sm text-muted-foreground">
                    {validRows.length} valid, {invalidRows.length} invalid rows
                  </p>
                </div>
                <Button variant="outline" onClick={reset}>
                  Upload Different File
                </Button>
              </div>

              {invalidRows.length > 0 && (
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <h4 className="font-medium text-red-400">Invalid Rows ({invalidRows.length})</h4>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {invalidRows.slice(0, 10).map((row) => (
                      <div key={row.row} className="text-sm">
                        <span className="font-medium">Row {row.row}:</span>{' '}
                        <span className="text-muted-foreground">{row.errors?.join(', ')}</span>
                      </div>
                    ))}
                    {invalidRows.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        ... and {invalidRows.length - 10} more invalid rows
                      </p>
                    )}
                  </div>
                </div>
              )}

              {validRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <h4 className="font-medium">Valid Rows ({validRows.length})</h4>
                  </div>
                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-800/50 sticky top-0">
                          <tr>
                            <th className="text-left p-2">Row</th>
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">SKU</th>
                            <th className="text-left p-2">Price</th>
                            <th className="text-left p-2">Category</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validRows.slice(0, 20).map((row) => (
                            <tr key={row.row} className="border-t border-gray-800">
                              <td className="p-2">{row.row}</td>
                              <td className="p-2">{row.data.name}</td>
                              <td className="p-2">{row.data.sku}</td>
                              <td className="p-2">{row.data.price}</td>
                              <td className="p-2">{row.data.categoryid}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {validRows.length > 20 && (
                    <p className="text-xs text-muted-foreground">
                      Showing first 20 of {validRows.length} valid rows
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 'importing' && (
            <BulkProgressTracker
              total={validRows.length}
              current={bulkImportMutation.isPending ? 0 : validRows.length}
              status="importing"
            />
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Products have been imported successfully
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </>
          )}
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import {validRows.length} Product{validRows.length !== 1 ? 's' : ''}
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={() => { reset(); onClose(); }}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


