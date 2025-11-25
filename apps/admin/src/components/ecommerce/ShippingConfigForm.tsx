import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { Truck, Calendar, Eye, Save, X } from 'lucide-react';
import type { DropShippingOption, ShippingOption } from '@nebula/shared';

interface ShippingConfigFormProps {
  shippingOptions: (DropShippingOption | ShippingOption)[];
  onSave: (updatedOptions: (DropShippingOption | ShippingOption)[]) => void;
  onCancel?: () => void;
  type?: 'drop' | 'shop';
}

export function ShippingConfigForm({
  shippingOptions,
  onSave,
  onCancel,
  type = 'drop'
}: ShippingConfigFormProps) {
  const [options, setOptions] = useState<(DropShippingOption | ShippingOption)[]>(shippingOptions);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    setOptions(shippingOptions);
  }, [shippingOptions]);

  const updateOption = (index: number, field: string, value: any) => {
    const updated = [...options];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setOptions(updated);
  };

  const handleSave = () => {
    onSave(options);
  };

  const formatDateRange = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) return '';
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const formatter = new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'short'
      });
      return `${formatter.format(start)}-${formatter.format(end)}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-xl font-semibold text-white">Versand-Konfiguration</h3>
            <p className="text-sm text-muted-foreground">
              Konfiguriere Landweg-Versand und Lieferzeiten für {type === 'drop' ? 'Drops' : 'Produkte'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Bearbeiten' : 'Vorschau'}
          </Button>
        </div>
      </div>

      {/* Preview Mode */}
      {previewMode && (
        <Card className="p-6 bg-blue-900/20 border border-blue-500/30">
          <h4 className="text-lg font-semibold text-white mb-4">Vorschau</h4>
          <div className="space-y-4">
            {options.map((option, index) => {
              if (!option.landShipping) return null;
              return (
                <div
                  key={option.id || index}
                  className="p-4 rounded-lg border border-white/10 bg-black/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold text-white">Versand auf dem Landweg</span>
                  </div>
                  {option.landShippingDeliveryRange && (
                    <div className="text-sm text-muted-foreground mb-2">
                      Lieferung: {option.landShippingDeliveryRange}
                    </div>
                  )}
                  {option.landShippingMessage && (
                    <div className="text-sm text-text mt-2">
                      {option.landShippingMessage}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Configuration Form */}
      {!previewMode && (
        <div className="space-y-4">
          {options.map((option, index) => (
            <Card
              key={option.id || index}
              className="p-6 bg-gray-900/20 border border-white/10"
            >
              <div className="space-y-4">
                {/* Option Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white">{option.label}</h4>
                    <p className="text-sm text-muted-foreground">
                      {option.region || 'Standard Versand'}
                    </p>
                  </div>
                  {option.landShipping && (
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      <Truck className="w-3 h-3 mr-1" />
                      Landweg
                    </Badge>
                  )}
                </div>

                {/* Landweg-Versand Toggle */}
                <div className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-black/20">
                  <Checkbox
                    checked={option.landShipping || false}
                    onCheckedChange={(checked) =>
                      updateOption(index, 'landShipping', checked)
                    }
                  />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-white cursor-pointer">
                      Landweg-Versand aktivieren
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dieser Artikel wird auf dem Landweg versandt
                    </p>
                  </div>
                </div>

                {/* Configuration Fields (only shown if landShipping is enabled) */}
                {option.landShipping && (
                  <div className="space-y-4 pl-8 border-l-2 border-blue-500/30">
                    {/* Delivery Range */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Lieferzeit-Range
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Input
                            type="date"
                            placeholder="Startdatum"
                            value={
                              option.landShippingDeliveryRange
                                ? option.landShippingDeliveryRange.split('-')[0]?.trim()
                                : ''
                            }
                            onChange={(e) => {
                              const start = e.target.value;
                              const end = option.landShippingDeliveryRange
                                ?.split('-')[1]?.trim() || '';
                              const formatted = formatDateRange(start, end);
                              updateOption(index, 'landShippingDeliveryRange', formatted);
                            }}
                            className="bg-black/25 border-white/20"
                          />
                        </div>
                        <div>
                          <Input
                            type="date"
                            placeholder="Enddatum"
                            value={
                              option.landShippingDeliveryRange
                                ? option.landShippingDeliveryRange.split('-')[1]?.trim()
                                : ''
                            }
                            onChange={(e) => {
                              const start = option.landShippingDeliveryRange
                                ?.split('-')[0]?.trim() || '';
                              const end = e.target.value;
                              const formatted = formatDateRange(start, end);
                              updateOption(index, 'landShippingDeliveryRange', formatted);
                            }}
                            className="bg-black/25 border-white/20"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: "19. Dez.-15. Jan."
                      </p>
                    </div>

                    {/* Custom Message */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Custom Nachricht (optional)
                      </label>
                      <Textarea
                        placeholder="Aufgrund von Größe, Gewicht oder anderen Gründen wird dieser Artikel auf dem Landweg versandt..."
                        value={option.landShippingMessage || ''}
                        onChange={(e) =>
                          updateOption(index, 'landShippingMessage', e.target.value)
                        }
                        rows={3}
                        className="bg-black/25 border-white/20"
                      />
                    </div>

                    {/* Show Badge Toggle */}
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={option.showLandShippingBadge !== false}
                        onCheckedChange={(checked) =>
                          updateOption(index, 'showLandShippingBadge', checked)
                        }
                      />
                      <label className="text-sm text-white cursor-pointer">
                        Badge anzeigen
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Actions */}
      {!previewMode && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Abbrechen
            </Button>
          )}
          <Button variant="default" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Speichern
          </Button>
        </div>
      )}
    </div>
  );
}

