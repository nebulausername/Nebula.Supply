import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle, X, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ChangePreview {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
  type?: 'text' | 'number' | 'boolean' | 'array' | 'object';
}

export interface ChangePreviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description?: string;
  changes: ChangePreview[];
  entityName?: string;
  entityType?: 'product' | 'category' | 'other';
  isLoading?: boolean;
}

export function ChangePreviewModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  changes,
  entityName,
  entityType = 'other',
  isLoading = false
}: ChangePreviewModalProps) {
  const hasChanges = changes.length > 0;

  const formatValue = (value: any, type?: string): string => {
    if (value === null || value === undefined) return '—';
    
    switch (type) {
      case 'boolean':
        return value ? 'Ja' : 'Nein';
      case 'array':
        return Array.isArray(value) ? value.join(', ') : String(value);
      case 'object':
        return JSON.stringify(value, null, 2);
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('de-DE') : String(value);
      default:
        return String(value);
    }
  };

  const getValueColor = (oldValue: any, newValue: any): string => {
    if (oldValue === newValue) return 'text-gray-400';
    return 'text-green-400';
  };

  const getBadgeColor = (entityType: string): string => {
    switch (entityType) {
      case 'product':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      case 'category':
        return 'bg-green-500/20 border-green-500/30 text-green-400';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', getBadgeColor(entityType))}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-white">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-muted-foreground mt-2">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {entityName && (
          <div className="px-1">
            <Badge variant="outline" className={getBadgeColor(entityType)}>
              {entityName}
            </Badge>
          </div>
        )}

        {!hasChanges ? (
          <Card className="p-8 text-center border-yellow-500/30 bg-yellow-500/5">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <p className="text-muted-foreground">Keine Änderungen erkannt</p>
          </Card>
        ) : (
          <div className="space-y-4 mt-4">
            {changes.map((change, index) => {
              const isChanged = change.oldValue !== change.newValue;
              
              return (
                <Card
                  key={index}
                  className={cn(
                    'p-4 border transition-all',
                    isChanged
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-gray-700/50 bg-gray-800/20'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Field Label */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-white">{change.label}</span>
                        {isChanged && (
                          <Badge variant="outline" className="text-xs bg-green-500/20 border-green-500/30 text-green-400">
                            Geändert
                          </Badge>
                        )}
                      </div>

                      {/* Side-by-Side Comparison */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Old Value */}
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            Aktueller Wert
                          </div>
                          <div className={cn(
                            'p-3 rounded-lg bg-black/30 border',
                            isChanged ? 'border-gray-700/50' : 'border-gray-600/50'
                          )}>
                            <div className="text-sm text-gray-300 break-words">
                              {formatValue(change.oldValue, change.type)}
                            </div>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center justify-center pt-6">
                          <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        </div>

                        {/* New Value */}
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            Neuer Wert
                          </div>
                          <div className={cn(
                            'p-3 rounded-lg border',
                            isChanged
                              ? 'bg-green-500/10 border-green-500/30'
                              : 'bg-black/30 border-gray-700/50'
                          )}>
                            <div className={cn(
                              'text-sm break-words',
                              getValueColor(change.oldValue, change.newValue)
                            )}>
                              {formatValue(change.newValue, change.type)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <DialogFooter className="border-t border-gray-800 pt-4 mt-6">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {hasChanges && (
                <span>
                  {changes.filter(c => c.oldValue !== c.newValue).length} Änderung{changes.filter(c => c.oldValue !== c.newValue).length !== 1 ? 'en' : ''} werden angewendet
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="border-gray-700 hover:bg-gray-800"
              >
                <X className="w-4 h-4 mr-2" />
                Abbrechen
              </Button>
              <Button
                onClick={onConfirm}
                disabled={!hasChanges || isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Änderungen bestätigen
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

