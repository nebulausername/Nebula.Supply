import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  RefreshCw,
  Eye,
  FileJson,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { useCreateCategory, useCategories } from '../../lib/api/shopHooks';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { useToast } from '../ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import type { Category } from '../../lib/api/ecommerce';

interface CategoryImportItem {
  name: string;
  slug: string;
  parentId?: string;
  icon?: string;
  description?: string;
  order?: number;
}

interface ImportValidationResult {
  valid: boolean;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  warnings: string[];
}

interface CategoryBulkImporterProps {
  onComplete?: (categories: Category[]) => void;
}

export function CategoryBulkImporter({ onComplete }: CategoryBulkImporterProps) {
  const { handleError } = useErrorHandler('CategoryBulkImporter');
  const { showToast } = useToast();
  
  const [importData, setImportData] = useState<CategoryImportItem[]>([]);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [showPreview, setShowPreview] = useState(false);
  
  const createCategoryMutation = useCreateCategory();
  const { data: categoriesData, refetch } = useCategories({ limit: 1000 });
  const existingCategories = categoriesData?.data || [];

  // Helper: Erstelle Slug aus Text
  const createSlug = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  };

  // Berechne Level einer Kategorie
  const getCategoryLevel = useCallback((item: CategoryImportItem, allItems: CategoryImportItem[]): number => {
    if (!item.parentId) return 0;
    
    let level = 0;
    let currentParentId: string | undefined = item.parentId;
    const visited = new Set<string>();
    
    while (currentParentId) {
      if (visited.has(currentParentId)) return -1;
      visited.add(currentParentId);
      
      const parent = allItems.find(i => i.slug === currentParentId || i.name === currentParentId);
      if (!parent) {
        // Prüfe in existing categories
        const existingParent = existingCategories.find(c => c.id === currentParentId || c.slug === currentParentId);
        if (existingParent) {
          level++;
          currentParentId = existingParent.parentId;
        } else {
          break;
        }
      } else {
        level++;
        currentParentId = parent.parentId;
      }
      
      if (level > 10) break;
    }
    
    return level;
  }, [existingCategories]);

  // Validiere Import-Daten
  const validateImport = useCallback((items: CategoryImportItem[]): ImportValidationResult => {
    const errors: ImportValidationResult['errors'] = [];
    const warnings: string[] = [];
    const slugSet = new Set<string>();
    const nameSet = new Set<string>();
    
    items.forEach((item, index) => {
      const row = index + 1;
      
      // Name validieren
      if (!item.name || item.name.trim().length === 0) {
        errors.push({ row, field: 'name', message: 'Name ist erforderlich' });
      }
      
      // Slug validieren
      if (!item.slug || item.slug.trim().length === 0) {
        errors.push({ row, field: 'slug', message: 'Slug ist erforderlich' });
      } else {
        const slug = createSlug(item.slug);
        if (slugSet.has(slug)) {
          errors.push({ row, field: 'slug', message: `Doppelter Slug: ${slug}` });
        } else {
          slugSet.add(slug);
        }
        
        // Prüfe ob Slug bereits existiert
        if (existingCategories.some(c => c.slug === slug)) {
          warnings.push(`Zeile ${row}: Slug "${slug}" existiert bereits`);
        }
      }
      
      // Level validieren (max 3)
      const level = getCategoryLevel(item, items);
      if (level > 3) {
        errors.push({ row, field: 'parentId', message: `Level ${level} überschreitet Maximum von 3` });
      }
      
      // Parent-Existenz prüfen
      if (item.parentId) {
        const parentExists = items.some(i => i.slug === item.parentId || i.name === item.parentId) ||
                           existingCategories.some(c => c.id === item.parentId || c.slug === item.parentId);
        if (!parentExists) {
          errors.push({ row, field: 'parentId', message: `Parent "${item.parentId}" nicht gefunden` });
        }
      }
      
      // Zirkuläre Referenz prüfen
      if (item.parentId) {
        let currentParentId: string | undefined = item.parentId;
        const visited = new Set<string>();
        visited.add(item.slug);
        
        while (currentParentId) {
          if (visited.has(currentParentId)) {
            errors.push({ row, field: 'parentId', message: 'Zirkuläre Referenz erkannt' });
            break;
          }
          visited.add(currentParentId);
          
          const parent = items.find(i => i.slug === currentParentId || i.name === currentParentId);
          if (!parent) break;
          currentParentId = parent.parentId;
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }, [existingCategories, getCategoryLevel]);

  // CSV Parser
  const parseCSV = useCallback((csvText: string): CategoryImportItem[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const items: CategoryImportItem[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const item: CategoryImportItem = {
        name: '',
        slug: '',
        order: i - 1
      };
      
      headers.forEach((header, idx) => {
        const value = values[idx] || '';
        switch (header) {
          case 'name':
            item.name = value;
            if (!item.slug) item.slug = createSlug(value);
            break;
          case 'slug':
            item.slug = createSlug(value);
            break;
          case 'parentid':
          case 'parent_id':
            item.parentId = value || undefined;
            break;
          case 'icon':
            item.icon = value || '📦';
            break;
          case 'description':
            item.description = value || undefined;
            break;
          case 'order':
            item.order = parseInt(value) || i - 1;
            break;
        }
      });
      
      if (item.name) {
        items.push(item);
      }
    }
    
    return items;
  }, []);

  // JSON Parser
  const parseJSON = useCallback((jsonText: string): CategoryImportItem[] => {
    try {
      const data = JSON.parse(jsonText);
      if (!Array.isArray(data)) {
        throw new Error('JSON muss ein Array sein');
      }
      
      return data.map((item: any, index: number) => ({
        name: item.name || '',
        slug: item.slug || createSlug(item.name || ''),
        parentId: item.parentId || item.parent_id || undefined,
        icon: item.icon || '📦',
        description: item.description || undefined,
        order: item.order !== undefined ? item.order : index
      }));
    } catch (error) {
      throw new Error(`JSON Parse Fehler: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  // File Upload Handler
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      
      try {
        let items: CategoryImportItem[] = [];
        
        if (file.name.endsWith('.json')) {
          items = parseJSON(text);
        } else if (file.name.endsWith('.csv')) {
          items = parseCSV(text);
        } else {
          showToast({
            type: 'error',
            title: 'Ungültiges Dateiformat',
            message: 'Nur CSV und JSON Dateien werden unterstützt.'
          });
          return;
        }
        
        setImportData(items);
        const validation = validateImport(items);
        setValidationResult(validation);
        setShowPreview(true);
        
        if (validation.valid) {
          showToast({
            type: 'success',
            title: 'Datei geladen',
            message: `${items.length} Kategorien gefunden und validiert.`
          });
        } else {
          showToast({
            type: 'error',
            title: 'Validierungsfehler',
            message: `${validation.errors.length} Fehler gefunden. Bitte korrigieren Sie die Datei.`
          });
        }
      } catch (error) {
        handleError(error, { operation: 'parse_import_file' });
        showToast({
          type: 'error',
          title: 'Parse Fehler',
          message: error instanceof Error ? error.message : 'Fehler beim Parsen der Datei.'
        });
      }
    };
    
    reader.readAsText(file);
  }, [parseJSON, parseCSV, validateImport, showToast, handleError]);

  // Import ausführen
  const handleImport = useCallback(async () => {
    if (!validationResult?.valid || importData.length === 0) {
      showToast({
        type: 'error',
        title: 'Import nicht möglich',
        message: 'Bitte beheben Sie zuerst alle Validierungsfehler.'
      });
      return;
    }
    
    setIsImporting(true);
    setImportProgress({ current: 0, total: importData.length });
    
    const createdCategories: Category[] = [];
    const errors: string[] = [];
    
    // Erstelle Mapping für parentId-Referenzen
    const slugToIdMap = new Map<string, string>();
    existingCategories.forEach(cat => {
      slugToIdMap.set(cat.slug, cat.id);
    });
    
    for (let i = 0; i < importData.length; i++) {
      const item = importData[i];
      setImportProgress({ current: i + 1, total: importData.length });
      
      try {
        // Resolve parentId (kann slug oder id sein)
        let resolvedParentId: string | undefined = undefined;
        if (item.parentId) {
          // Prüfe ob es eine ID ist
          if (existingCategories.some(c => c.id === item.parentId)) {
            resolvedParentId = item.parentId;
          } else {
            // Prüfe ob es ein Slug ist
            const parentId = slugToIdMap.get(item.parentId);
            if (parentId) {
              resolvedParentId = parentId;
            } else {
              // Prüfe in bereits erstellten Kategorien
              const createdParent = createdCategories.find(c => c.slug === item.parentId);
              if (createdParent) {
                resolvedParentId = createdParent.id;
              }
            }
          }
        }
        
        const categoryData: Partial<Category> = {
          name: item.name,
          slug: createSlug(item.slug || item.name),
          description: item.description || '',
          icon: item.icon || '📦',
          order: item.order !== undefined ? item.order : i,
          featured: false,
          parentId: resolvedParentId
        };
        
        const response = await createCategoryMutation.mutateAsync(categoryData);
        const created = response.data;
        createdCategories.push(created);
        slugToIdMap.set(created.slug, created.id);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
        errors.push(`${item.name}: ${errorMsg}`);
        handleError(error, { operation: 'import_category', categoryName: item.name });
      }
    }
    
    setIsImporting(false);
    
    if (createdCategories.length > 0) {
      showToast({
        type: 'success',
        title: 'Import abgeschlossen',
        message: `${createdCategories.length} von ${importData.length} Kategorien erfolgreich importiert.`
      });
      
      if (errors.length > 0) {
        showToast({
          type: 'warning',
          title: 'Einige Fehler',
          message: `${errors.length} Kategorien konnten nicht importiert werden.`
        });
      }
      
      refetch();
      onComplete?.(createdCategories);
      setImportData([]);
      setValidationResult(null);
      setShowPreview(false);
    } else {
      showToast({
        type: 'error',
        title: 'Import fehlgeschlagen',
        message: 'Keine Kategorien konnten importiert werden.'
      });
    }
  }, [validationResult, importData, createCategoryMutation, showToast, handleError, refetch, onComplete, existingCategories]);

  // Download Template
  const downloadTemplate = useCallback(() => {
    const template: CategoryImportItem[] = [
      { name: 'SNEAKER', slug: 'sneaker', icon: '👟', description: 'Hauptkategorie', order: 0 },
      { name: 'NIKE', slug: 'nike', parentId: 'sneaker', icon: '🏷️', description: 'Marke', order: 0 },
      { name: 'AIRMAX 95', slug: 'airmax-95', parentId: 'nike', icon: '👟', description: 'Modell', order: 0 }
    ];
    
    const csv = [
      'name,slug,parentId,icon,description,order',
      ...template.map(t => `${t.name},${t.slug},${t.parentId || ''},${t.icon || ''},${t.description || ''},${t.order || 0}`)
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'category-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-white">Kategorien Bulk-Import</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
        >
          <Download className="w-4 h-4 mr-2" />
          Template herunterladen
        </Button>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-white/80">
          Datei auswählen (CSV oder JSON)
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="hidden"
              id="category-import-file"
            />
            <label
              htmlFor="category-import-file"
              className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-5 h-5 text-white/60" />
              <span className="text-sm text-white/80">
                Klicken Sie hier oder ziehen Sie eine Datei hierher
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className="mb-6 space-y-2">
          {validationResult.valid ? (
            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-400">
                Validierung erfolgreich: {importData.length} Kategorien bereit zum Import
              </span>
            </div>
          ) : (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm font-semibold text-red-400">
                  {validationResult.errors.length} Validierungsfehler gefunden
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {validationResult.errors.map((error, idx) => (
                  <div key={idx} className="text-xs text-red-300 p-2 bg-red-500/10 rounded">
                    <strong>Zeile {error.row}, {error.field}:</strong> {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {validationResult.warnings.length > 0 && (
            <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400">
                  {validationResult.warnings.length} Warnung(en)
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {validationResult.warnings.map((warning, idx) => (
                  <div key={idx} className="text-xs text-yellow-300">
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Progress */}
      {isImporting && (
        <div className="mb-6 p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/80">
              Importiere Kategorien...
            </span>
            <span className="text-sm text-white/60">
              {importProgress.current} / {importProgress.total}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Preview Table */}
      {showPreview && importData.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              Vorschau ({importData.length} Kategorien)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto border border-white/10 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-white/5 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-white/80">Name</th>
                  <th className="px-4 py-2 text-left text-white/80">Slug</th>
                  <th className="px-4 py-2 text-left text-white/80">Parent</th>
                  <th className="px-4 py-2 text-left text-white/80">Level</th>
                  <th className="px-4 py-2 text-left text-white/80">Status</th>
                </tr>
              </thead>
              <tbody>
                {importData.map((item, idx) => {
                  const level = getCategoryLevel(item, importData);
                  const hasError = validationResult?.errors.some(e => e.row === idx + 1);
                  
                  return (
                    <tr
                      key={idx}
                      className={cn(
                        'border-t border-white/10',
                        hasError && 'bg-red-500/10'
                      )}
                    >
                      <td className="px-4 py-2 text-white">
                        {item.icon} {item.name}
                      </td>
                      <td className="px-4 py-2 text-white/80 font-mono text-xs">
                        {createSlug(item.slug || item.name)}
                      </td>
                      <td className="px-4 py-2 text-white/60">
                        {item.parentId || '-'}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            level === 0 && 'bg-purple-500/20 border-purple-500/30 text-purple-400',
                            level === 1 && 'bg-blue-500/20 border-blue-500/30 text-blue-400',
                            level === 2 && 'bg-green-500/20 border-green-500/30 text-green-400',
                            level > 2 && 'bg-red-500/20 border-red-500/30 text-red-400'
                          )}
                        >
                          Level {level}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        {hasError ? (
                          <Badge variant="destructive" className="text-xs">
                            Fehler
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            OK
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Button */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleImport}
          disabled={!validationResult?.valid || isImporting || importData.length === 0}
          className="flex-1"
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importiere...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Importieren ({importData.length})
            </>
          )}
        </Button>
        {importData.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              setImportData([]);
              setValidationResult(null);
              setShowPreview(false);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

