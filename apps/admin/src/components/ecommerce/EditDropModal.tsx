import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { useUpdateDrop } from '../../lib/api/hooks';
import {
  Edit,
  Save,
  X,
  Package,
  Crown,
  Lock,
  Globe
} from 'lucide-react';

interface EditDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  drop: any;
  onSuccess?: () => void;
}

export function EditDropModal({ isOpen, onClose, drop, onSuccess }: EditDropModalProps) {
  const updateDropMutation = useUpdateDrop();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    badge: '',
    status: 'active' as 'active' | 'inactive' | 'sold_out' | 'scheduled',
    access: 'standard' as 'free' | 'limited' | 'vip' | 'standard',
    variants: [] as any[]
  });

  // Initialize form data when drop changes
  useEffect(() => {
    if (drop) {
      setFormData({
        name: drop.name || '',
        description: drop.description || '',
        badge: drop.badge || '',
        status: drop.status || 'active',
        access: drop.access || 'standard',
        variants: Array.isArray(drop.variants) ? [...drop.variants] : []
      });
    }
  }, [drop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drop) return;

    setIsSubmitting(true);
    try {
      await updateDropMutation.mutateAsync({
        id: drop.id,
        data: {
          name: formData.name,
          description: formData.description,
          badge: formData.badge,
          status: formData.status,
          access: formData.access,
          variants: formData.variants
        }
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Drops:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value
    };
    setFormData({ ...formData, variants: updatedVariants });
  };

  if (!drop) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Edit className="w-6 h-6 text-purple-400" />
            Drop bearbeiten: {drop.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Grundinformationen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Beschreibung</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Badge</label>
                <Input
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="z.B. Limited, VIP, Neu"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </Card>

          {/* Status and Access */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-black/25 border border-white/20 rounded-md text-sm"
                disabled={isSubmitting}
              >
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
                <option value="scheduled">Geplant</option>
                <option value="sold_out">Ausverkauft</option>
              </select>
            </Card>

            <Card className="p-4">
              <label className="block text-sm font-medium mb-2">Zugriff</label>
              <select
                value={formData.access}
                onChange={(e) => setFormData({ ...formData, access: e.target.value as any })}
                className="w-full px-3 py-2 bg-black/25 border border-white/20 rounded-md text-sm"
                disabled={isSubmitting}
              >
                <option value="free">Kostenlos</option>
                <option value="limited">Limitiert</option>
                <option value="vip">VIP</option>
                <option value="standard">Standard</option>
              </select>
            </Card>
          </div>

          {/* Variants */}
          {formData.variants.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Varianten</h3>
              <div className="space-y-4">
                {formData.variants.map((variant: any, index: number) => (
                  <div key={variant.id || index} className="p-4 bg-black/25 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Name</label>
                        <Input
                          value={variant.label || ''}
                          onChange={(e) => handleVariantChange(index, 'label', e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Preis (€)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.basePrice || 0}
                          onChange={(e) => handleVariantChange(index, 'basePrice', parseFloat(e.target.value) || 0)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Bestand</label>
                        <Input
                          type="number"
                          value={variant.stock || 0}
                          onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value) || 0)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

