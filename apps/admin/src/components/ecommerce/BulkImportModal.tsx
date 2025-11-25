import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  X,
  Loader2
} from 'lucide-react';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { logger } from '../../lib/logger';
import { api } from '../../lib/api/client';
import { useToast } from '../ui/Toast';

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  type: 'products' | 'drops';
}

interface ImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicates: number;
  errors: Array<{ row: number; field: string; message: string }>;
  preview: any[];
}

export function BulkImportModal({ open, onClose, onSuccess, type }: BulkImportModalProps) {
  const { handleError } = useErrorHandler('BulkImportModal');
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'json' | 'excel'>('csv');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: any[] } | null>(null);

  // Parse file based on type
  const parseFile = useCallback(async (file: File): Promise<any[]> => {
    const text = await file.text();
    
    if (fileType === 'json') {
      return JSON.parse(text);
    } else if (fileType === 'csv') {
      // Simple CSV parser
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      }).filter(obj => Object.values(obj).some(v => v));
    }
    
    return [];
  }, [fileType]);

  // Validate and preview data
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    try {
      const data = await parseFile(selectedFile);
      
      // Auto-detect field mapping
      const autoMapping: Record<string, string> = {};
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const standardFields = type === 'products' 
          ? ['name', 'description', 'price', 'stock', 'sku', 'status', 'access', 'category']
          : ['name', 'description', 'badge', 'status', 'access', 'progress'];
        
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase();
          const match = standardFields.find(field => 
            lowerHeader.includes(field) || field.includes(lowerHeader)
          );
          if (match) {
            autoMapping[header] = match;
          }
        });
      }
      setFieldMapping(autoMapping);

      // Validate data
      const errors: Array<{ row: number; field: string; message: string }> = [];
      const validRows: any[] = [];
      const seenIds = new Set<string>();

      data.forEach((row, index) => {
        const rowErrors: Array<{ field: string; message: string }> = [];
        
        // Validate required fields
        if (type === 'products') {
          if (!row.name || row.name.trim().length < 2) {
            rowErrors.push({ field: 'name', message: 'Name muss mindestens 2 Zeichen lang sein' });
          }
          if (row.price && isNaN(parseFloat(row.price))) {
            rowErrors.push({ field: 'price', message: 'Preis muss eine Zahl sein' });
          }
        } else {
          if (!row.name || row.name.trim().length < 2) {
            rowErrors.push({ field: 'name', message: 'Name muss mindestens 2 Zeichen lang sein' });
          }
        }

        // Check for duplicates
        const id = row.id || row.sku || row.name;
        if (id && seenIds.has(id)) {
          rowErrors.push({ field: 'id', message: 'Duplikat gefunden' });
        } else if (id) {
          seenIds.add(id);
        }

        if (rowErrors.length > 0) {
          rowErrors.forEach(err => errors.push({ row: index + 1, ...err }));
        } else {
          validRows.push(row);
        }
      });

      setPreview({
        totalRows: data.length,
        validRows: validRows.length,
        invalidRows: errors.length,
        duplicates: data.length - seenIds.size - errors.length,
        errors: errors.slice(0, 10), // Show first 10 errors
        preview: validRows.slice(0, 5) // Show first 5 valid rows
      });
    } catch (error) {
      handleError(error, { operation: 'file_parse' });
    }
  }, [parseFile, type, handleError]);

  // Handle import
  const handleImport = useCallback(async () => {
    if (!file || !preview) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const data = await parseFile(file);
      const mappedData = data.map(row => {
        const mapped: any = {};
        Object.entries(fieldMapping).forEach(([csvField, apiField]) => {
          if (row[csvField] !== undefined) {
            mapped[apiField] = row[csvField];
          }
        });
        return mapped;
      });

      // Simulate import progress
      let success = 0;
      let failed = 0;
      const errors: any[] = [];

      // Batch import for better performance (import in chunks)
      const BATCH_SIZE = 10;
      const batches: any[][] = [];
      for (let i = 0; i < mappedData.length; i += BATCH_SIZE) {
        batches.push(mappedData.slice(i, i + BATCH_SIZE));
      }

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        try {
          if (type === 'products') {
            // Use bulk import API for products
            const response = await api.post('/api/products/bulk', { products: batch });
            if (response.success) {
              success += response.data.success || batch.length;
              failed += response.data.failed || 0;
              if (response.data.errors) {
                response.data.errors.forEach((err: any, idx: number) => {
                  errors.push({ 
                    row: batchIndex * BATCH_SIZE + idx + 1, 
                    error: err.error || err.message || 'Unknown error' 
                  });
                });
              }
            } else {
              // If batch fails, try individual items
              for (let itemIndex = 0; itemIndex < batch.length; itemIndex++) {
                try {
                  await api.post('/api/products', batch[itemIndex]);
                  success++;
                } catch (itemError) {
                  failed++;
                  errors.push({ 
                    row: batchIndex * BATCH_SIZE + itemIndex + 1, 
                    error: itemError instanceof Error ? itemError.message : 'Unknown error' 
                  });
                }
              }
            }
          } else {
            // For drops or other types, import individually
            for (let itemIndex = 0; itemIndex < batch.length; itemIndex++) {
              try {
                if (type === 'drops') {
                  await api.post('/api/admin/drops', batch[itemIndex]);
                } else {
                  // Fallback for other types
                  logger.warn('Bulk import not supported for type', { type });
                }
                success++;
              } catch (itemError) {
                failed++;
                errors.push({ 
                  row: batchIndex * BATCH_SIZE + itemIndex + 1, 
                  error: itemError instanceof Error ? itemError.message : 'Unknown error' 
                });
              }
            }
          }
        } catch (batchError) {
          // If batch fails completely, try individual items
          logger.warn('Batch import failed, trying individual items', { batchError });
          for (let itemIndex = 0; itemIndex < batch.length; itemIndex++) {
            try {
              if (type === 'products') {
                await api.post('/api/products', batch[itemIndex]);
              } else if (type === 'drops') {
                await api.post('/api/admin/drops', batch[itemIndex]);
              }
              success++;
            } catch (itemError) {
              failed++;
              errors.push({ 
                row: batchIndex * BATCH_SIZE + itemIndex + 1, 
                error: itemError instanceof Error ? itemError.message : 'Unknown error' 
              });
            }
          }
        }
        
        // Update progress
        const totalProcessed = (batchIndex + 1) * BATCH_SIZE;
        setImportProgress(Math.min((totalProcessed / mappedData.length) * 100, 100));
        
        // Small delay to prevent overwhelming the API
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setImportResult({ success, failed, errors });
      logger.logUserAction('bulk_import', { type, success, failed });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      handleError(error, { operation: 'bulk_import', type });
    } finally {
      setIsImporting(false);
    }
  }, [file, preview, fieldMapping, parseFile, type, onSuccess, handleError]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setFieldMapping({});
    setImportResult(null);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import - {type === 'products' ? 'Produkte' : 'Drops'}</DialogTitle>
          <DialogDescription>
            Importiere {type === 'products' ? 'Produkte' : 'Drops'} aus CSV, JSON oder Excel Dateien
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          {!file && (
            <Card className="p-6 border-dashed border-2 border-white/20">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Datei auswählen</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Unterstützte Formate: CSV, JSON, Excel
                </p>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="fileType"
                      value="csv"
                      checked={fileType === 'csv'}
                      onChange={(e) => setFileType(e.target.value as any)}
                      className="mr-2"
                    />
                    CSV
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="fileType"
                      value="json"
                      checked={fileType === 'json'}
                      onChange={(e) => setFileType(e.target.value as any)}
                      className="mr-2"
                    />
                    JSON
                  </label>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={fileType === 'csv' ? '.csv' : '.json'}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Datei auswählen
                </Button>
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => {
                    // Download template
                    const template = type === 'products'
                      ? { name: '', description: '', price: 0, stock: 0, sku: '', status: 'active', access: 'standard' }
                      : { name: '', description: '', badge: '', status: 'active', access: 'standard', progress: 0 };
                    const blob = new Blob([JSON.stringify([template], null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${type}-template.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}>
                    <Download className="w-4 h-4 mr-2" />
                    Template herunterladen
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Preview */}
          {preview && !importResult && (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Import-Vorschau</h3>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Gesamt</div>
                    <div className="text-2xl font-bold">{preview.totalRows}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Gültig</div>
                    <div className="text-2xl font-bold text-green-400">{preview.validRows}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Ungültig</div>
                    <div className="text-2xl font-bold text-red-400">{preview.invalidRows}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Duplikate</div>
                    <div className="text-2xl font-bold text-yellow-400">{preview.duplicates}</div>
                  </div>
                </div>

                {/* Field Mapping */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Feld-Mapping</h4>
                  <div className="space-y-2">
                    {Object.entries(fieldMapping).map(([csvField, apiField]) => (
                      <div key={csvField} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{csvField}</span>
                        <span>→</span>
                        <select
                          value={apiField}
                          onChange={(e) => setFieldMapping(prev => ({ ...prev, [csvField]: e.target.value }))}
                          className="px-2 py-1 bg-black/25 border border-white/20 rounded text-sm"
                        >
                          {type === 'products' ? (
                            <>
                              <option value="name">Name</option>
                              <option value="description">Beschreibung</option>
                              <option value="price">Preis</option>
                              <option value="stock">Lagerbestand</option>
                              <option value="sku">SKU</option>
                              <option value="status">Status</option>
                              <option value="access">Access</option>
                            </>
                          ) : (
                            <>
                              <option value="name">Name</option>
                              <option value="description">Beschreibung</option>
                              <option value="badge">Badge</option>
                              <option value="status">Status</option>
                              <option value="access">Access</option>
                              <option value="progress">Progress</option>
                            </>
                          )}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Errors */}
                {preview.errors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2 text-red-400">Fehler</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {preview.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-400">
                          Zeile {error.row}: {error.field} - {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Data */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Vorschau (erste 5 Zeilen)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10">
                          {preview.preview[0] && Object.keys(preview.preview[0]).map(key => (
                            <th key={key} className="text-left p-2">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.preview.map((row, index) => (
                          <tr key={index} className="border-b border-white/5">
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td key={cellIndex} className="p-2 text-muted-foreground">
                                {String(value).substring(0, 30)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Import läuft...</span>
                  <span className="text-sm text-muted-foreground">{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            </Card>
          )}

          {/* Import Result */}
          {importResult && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Import-Ergebnis</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-sm text-muted-foreground">Erfolgreich</div>
                    <div className="text-xl font-bold text-green-400">{importResult.success}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
                    <div className="text-xl font-bold text-red-400">{importResult.failed}</div>
                  </div>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2 text-red-400">Fehler-Details</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-400">
                        Zeile {error.row}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        <DialogFooter>
          {importResult ? (
            <Button onClick={() => { handleReset(); onClose(); }}>
              Schließen
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleReset} disabled={isImporting}>
                <X className="w-4 h-4 mr-2" />
                Zurücksetzen
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!preview || preview.validRows === 0 || isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importiere...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importieren ({preview?.validRows || 0} Zeilen)
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

