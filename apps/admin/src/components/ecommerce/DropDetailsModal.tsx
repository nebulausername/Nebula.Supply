import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import {
  X,
  Package,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Crown,
  Lock,
  Globe,
  Zap,
  BarChart3,
  Star
} from 'lucide-react';

interface DropDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drop: any;
}

export function DropDetailsModal({ isOpen, onClose, drop }: DropDetailsModalProps) {
  if (!drop) return null;

  const conversionRate = drop.interestCount > 0 
    ? ((drop.soldCount || 0) / drop.interestCount) * 100 
    : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="text-green-400">Live</Badge>;
      case 'scheduled':
        return <Badge variant="warning" className="text-yellow-400">Geplant</Badge>;
      case 'sold_out':
        return <Badge variant="destructive" className="text-red-400">Ausverkauft</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-gray-400">Inaktiv</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-400">Unbekannt</Badge>;
    }
  };

  const getAccessBadge = (access: string) => {
    switch (access) {
      case 'free':
        return <Badge variant="outline" className="text-green-400 border-green-400">Kostenlos</Badge>;
      case 'limited':
        return <Badge variant="outline" className="text-yellow-400 border-yellow-400">Limitiert</Badge>;
      case 'vip':
        return <Badge variant="outline" className="text-purple-400 border-purple-400"><Crown className="w-3 h-3 mr-1" />VIP</Badge>;
      case 'standard':
        return <Badge variant="outline" className="text-blue-400 border-blue-400">Standard</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-400">Unbekannt</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Zap className="w-6 h-6 text-purple-400" />
            {drop.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-purple-900/20 border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-muted-foreground">Status</span>
              </div>
              {getStatusBadge(drop.status)}
            </Card>

            <Card className="p-4 bg-blue-900/20 border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-muted-foreground">Zugriff</span>
              </div>
              {getAccessBadge(drop.access)}
            </Card>

            {drop.badge && (
              <Card className="p-4 bg-pink-900/20 border-pink-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-pink-400" />
                  <span className="text-sm font-medium text-muted-foreground">Badge</span>
                </div>
                <Badge variant="outline" className="text-pink-400 border-pink-400">
                  {drop.badge}
                </Badge>
              </Card>
            )}
          </div>

          {/* Description */}
          {drop.description && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Beschreibung</h3>
              <p className="text-muted-foreground">{drop.description}</p>
            </Card>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-green-900/20 border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-muted-foreground">Umsatz</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                €{(drop.revenue || 0).toLocaleString()}
              </p>
            </Card>

            <Card className="p-4 bg-blue-900/20 border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-muted-foreground">Interesse</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">
                {drop.interestCount || 0}
              </p>
            </Card>

            <Card className="p-4 bg-purple-900/20 border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-muted-foreground">Verkauft</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">
                {drop.soldCount || 0}
              </p>
            </Card>

            <Card className="p-4 bg-orange-900/20 border-orange-500/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-medium text-muted-foreground">Conversion</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">
                {conversionRate.toFixed(1)}%
              </p>
            </Card>
          </div>

          {/* Stock Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Lagerbestand
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Gesamtbestand</span>
                <p className="text-xl font-bold">{drop.totalStock || 0}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Verfügbar</span>
                <p className="text-xl font-bold text-green-400">
                  {(drop.totalStock || 0) - (drop.soldCount || 0)}
                </p>
              </div>
            </div>
          </Card>

          {/* Variants */}
          {Array.isArray(drop.variants) && drop.variants.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Varianten</h3>
              <div className="space-y-3">
                {drop.variants.map((variant: any, index: number) => (
                  <div key={variant.id || index} className="p-3 bg-black/25 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{variant.label}</span>
                      <span className="text-green-400 font-semibold">
                        €{variant.basePrice?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <span>Bestand: {variant.stock || 0}</span>
                      <span>Verkauft: {variant.sold || 0}</span>
                    </div>
                    {variant.description && (
                      <p className="text-sm text-muted-foreground mt-2">{variant.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drop.flavorTag && (
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Geschmack</h3>
                <Badge variant="outline">{drop.flavorTag}</Badge>
              </Card>
            )}

            {drop.createdAt && (
              <Card className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Erstellt am
                </h3>
                <p className="text-muted-foreground">
                  {new Date(drop.createdAt).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

