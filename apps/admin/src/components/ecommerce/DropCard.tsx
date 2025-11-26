import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { InlineEdit } from '../ui/InlineEdit';
import { ImagePicker } from '../media/ImagePicker';
import {
  MoreHorizontal,
  Edit,
  Package,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
  Crown,
  Globe,
  GripVertical,
  Zap,
  Calendar,
  Timer,
  Sparkles,
  TrendingUp,
  Flame
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface DropCardProps {
  drop: any;
  isSelected: boolean;
  index: number;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDetails: () => void;
  onStockUpdate: () => void;
  onUpdate: (field: string, value: any) => Promise<void>;
  onDragStart: (e: React.DragEvent, dropId: string) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  getStatusBadge: (drop: any) => React.ReactNode;
  getAccessBadge: (access: string) => React.ReactNode;
  getPriorityBadge: (drop: any) => React.ReactNode;
}

export const DropCard = memo(({
  drop,
  isSelected,
  index,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onDetails,
  onStockUpdate,
  onUpdate,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging = false,
  isDragOver = false,
  getStatusBadge,
  getAccessBadge,
  getPriorityBadge
}: DropCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [highlightField, setHighlightField] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imageRef.current || !drop.heroImageUrl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(imageRef.current);

    return () => {
      observer.disconnect();
    };
  }, [drop.heroImageUrl]);

  // Clear update feedback after timeout
  useEffect(() => {
    if (updateSuccess || updateError) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        setUpdateSuccess(false);
        setUpdateError(null);
        setHighlightField(null);
      }, 2000);
    }
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [updateSuccess, updateError]);

  const handleUpdate = useCallback(async (field: string, value: any) => {
    setIsUpdating(true);
    setUpdateError(null);
    setHighlightField(field);
    
    try {
      await onUpdate(field, value);
      setUpdateSuccess(true);
      setIsUpdating(false);
      
      setTimeout(() => {
        setHighlightField(null);
      }, 500);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Update fehlgeschlagen');
      setIsUpdating(false);
      setHighlightField(null);
    }
  }, [onUpdate]);

  // Calculate price range
  const priceRange = React.useMemo(() => {
    if (!Array.isArray(drop.variants) || drop.variants.length === 0) {
      return { min: 0, max: 0, display: '€0' };
    }
    const prices = drop.variants.map((v: any) => v.basePrice || 0).filter((p: number) => p > 0);
    if (prices.length === 0) return { min: 0, max: 0, display: '€0' };
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return {
      min,
      max,
      display: min === max ? `€${min}` : `€${min} - €${max}`
    };
  }, [drop.variants]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative h-full touch-manipulation"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
    >
      <Card
        className={cn(
          "group relative p-5 h-full flex flex-col",
          "hover:bg-gradient-to-br hover:from-purple-500/10 hover:via-purple-500/5 hover:to-transparent",
          "transition-all duration-300",
          "hover:shadow-2xl hover:shadow-purple-500/20",
          "hover:border-purple-500/40",
          "border border-white/10 rounded-xl backdrop-blur-sm",
          "touch-manipulation", // Better touch support
          isDragging && "opacity-30 scale-95 cursor-grabbing z-50",
          isDragOver && "ring-4 ring-purple-500/80 bg-purple-500/30 scale-[1.03] border-purple-400 shadow-2xl shadow-purple-500/50 animate-pulse",
          isUpdating && "ring-2 ring-yellow-500/50 bg-yellow-500/5",
          updateSuccess && "ring-2 ring-green-500/50 bg-green-500/5",
          updateError && "ring-2 ring-red-500/50 bg-red-500/5",
          isSelected && "ring-2 ring-blue-500/50 bg-blue-500/10"
        )}
        draggable
        onDragStart={(e) => onDragStart(e, drop.id)}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver(e, index);
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, index)}
        onTouchStart={(e) => {
          // Touch support for mobile drag
          const touch = e.touches[0];
          const element = e.currentTarget;
          const startX = touch.clientX;
          const startY = touch.clientY;
          
          const handleTouchMove = (moveEvent: TouchEvent) => {
            const moveTouch = moveEvent.touches[0];
            const deltaX = moveTouch.clientX - startX;
            const deltaY = moveTouch.clientY - startY;
            
            // If moved significantly, start drag
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
              onDragStart(e as any, drop.id);
              element.removeEventListener('touchmove', handleTouchMove);
              element.removeEventListener('touchend', handleTouchEnd);
            }
          };
          
          const handleTouchEnd = () => {
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
          };
          
          element.addEventListener('touchmove', handleTouchMove, { passive: true });
          element.addEventListener('touchend', handleTouchEnd);
        }}
      >
        {/* Update Status Indicators */}
        <AnimatePresence>
          {updateSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-3 right-3 z-20 bg-green-500/90 text-white rounded-full p-1.5 shadow-lg"
            >
              <CheckCircle className="w-4 h-4" />
            </motion.div>
          )}
          {updateError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-3 right-3 z-20 bg-red-500/90 text-white rounded-full p-1.5 shadow-lg"
            >
              <XCircle className="w-4 h-4" />
            </motion.div>
          )}
          {isUpdating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 right-3 z-20 bg-yellow-500/90 text-white rounded-full p-1.5 shadow-lg"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions Overlay */}
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : -10,
            scale: isHovered ? 1 : 0.9
          }}
          transition={{ duration: 0.2 }}
          className="absolute top-2 right-2 z-10 flex gap-1.5"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDetails();
              }}
              className="h-8 w-8 p-0 bg-black/90 hover:bg-blue-600/90 border border-blue-500/30 backdrop-blur-sm shadow-lg"
              title="Details anzeigen"
            >
              <Eye className="w-4 h-4 text-blue-400" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-8 w-8 p-0 bg-black/90 hover:bg-blue-600/90 border border-blue-500/30 backdrop-blur-sm shadow-lg"
              title="Bearbeiten"
            >
              <Edit className="w-4 h-4 text-blue-400" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="h-8 w-8 p-0 bg-black/90 hover:bg-purple-600/90 border border-purple-500/30 backdrop-blur-sm shadow-lg"
              title="Duplizieren"
            >
              <Copy className="w-4 h-4 text-purple-400" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onStockUpdate();
              }}
              className="h-8 w-8 p-0 bg-black/90 hover:bg-orange-600/90 border border-orange-500/30 backdrop-blur-sm shadow-lg"
              title="Bestand aktualisieren"
            >
              <Package className="w-4 h-4 text-orange-400" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-8 w-8 p-0 bg-black/90 hover:bg-red-600/90 border border-red-500/30 backdrop-blur-sm shadow-lg"
              title="Löschen"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Header with Drag Handle, Checkbox, and Menu */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-1">
            <div
              className="cursor-move text-muted-foreground hover:text-purple-400 transition-colors"
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                onDragStart(e, drop.id);
              }}
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect(e.target.checked);
              }}
              className="rounded border-white/20 bg-black/25 w-4 h-4 cursor-pointer hover:border-purple-400 transition-colors focus:ring-2 focus:ring-purple-500"
              onClick={(e) => e.stopPropagation()}
            />
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onDetails}>
                <Eye className="w-4 h-4 mr-2" />
                Details anzeigen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Drop bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplizieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdate('status', drop.status === 'active' ? 'inactive' : 'active')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Status umschalten
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const newAccess = drop.access === 'free' ? 'limited' : drop.access === 'limited' ? 'vip' : drop.access === 'vip' ? 'standard' : 'free';
                handleUpdate('access', newAccess);
              }}>
                <Lock className="w-4 h-4 mr-2" />
                Zugriff ändern
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onStockUpdate}>
                <Package className="w-4 h-4 mr-2" />
                Bestand aktualisieren
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-400"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Badge */}
        {drop.badge && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="outline" className="text-xs bg-purple-900/50 border-purple-400 text-purple-300 backdrop-blur-sm">
              {drop.badge}
            </Badge>
          </div>
        )}

        <div className="space-y-3 flex-1">
          {/* Drop Hero Image with Enhanced Preview */}
          <div className="relative group/image-container">
            {drop.heroImageUrl ? (
              <motion.div
                className="w-full aspect-video bg-gradient-to-br from-gray-800/20 to-gray-900/20 rounded-lg overflow-hidden relative mb-2 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  // Open image in modal or fullscreen view
                  const img = new Image();
                  img.src = drop.heroImageUrl;
                  const w = window.open('', '_blank');
                  if (w) {
                    w.document.write(`<img src="${drop.heroImageUrl}" style="max-width: 100%; height: auto;" />`);
                  }
                }}
              >
                {isInView && (
                  <img
                    ref={imageRef}
                    src={drop.heroImageUrl}
                    alt={drop.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/image-container:scale-110"
                    loading="lazy"
                    onLoad={() => setImageLoaded(true)}
                    style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
                  />
                )}
                {!imageLoaded && isInView && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </motion.div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/image-container:opacity-100 transition-opacity" />
                <div className="absolute top-2 right-2 opacity-0 group-hover/image-container:opacity-100 transition-opacity">
                  <Badge variant="outline" className="bg-black/80 text-white text-xs">
                    Klicken zum Vergrößern
                  </Badge>
                </div>
              </motion.div>
            ) : (
              <div className="w-full aspect-video bg-gradient-to-br from-gray-800/20 to-gray-900/20 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center mb-2">
                <div className="text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Kein Bild</p>
                </div>
              </div>
            )}

            {/* Enhanced Image Picker */}
            <div className="pt-2">
              <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                <span>Drop-Bild:</span>
                {drop.heroImageUrl && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleUpdate('heroImageUrl', null)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Entfernen
                  </motion.button>
                )}
              </div>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <ImagePicker
                  multiple={false}
                  showPreview={true}
                  maxImages={1}
                  value={drop.heroImageUrl ? [drop.heroImageUrl] : []}
                  onChange={(urls) => {
                    handleUpdate('heroImageUrl', urls[0] || null);
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* Name and Description */}
          <div>
            <InlineEdit
              value={drop.name}
              onSave={(newName) => handleUpdate('name', newName)}
              className={cn(
                "font-semibold text-lg mb-1",
                highlightField === 'name' && "ring-2 ring-yellow-500/50 rounded px-1"
              )}
              validate={(val) => val.length < 2 ? 'Name muss mindestens 2 Zeichen lang sein' : null}
            />
            <div className="text-sm text-muted-foreground mb-1">
              <InlineEdit
                value={drop.description || ''}
                onSave={(newDesc) => handleUpdate('description', newDesc)}
                type="textarea"
                rows={2}
                className="text-sm text-muted-foreground"
                placeholder="Beschreibung hinzufügen..."
              />
            </div>
            {drop.badge && (
              <div className="mt-1">
                <InlineEdit
                  value={drop.badge}
                  onSave={(newBadge) => handleUpdate('badge', newBadge)}
                  type="text"
                  className="text-xs"
                  placeholder="Badge..."
                />
              </div>
            )}
          </div>

          {/* Price and Access Badge */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-purple-400">
              {priceRange.display}
            </span>
            {getAccessBadge(drop.access)}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-black/25 rounded-lg p-2.5 hover:bg-black/35 transition-colors">
              <div className="text-muted-foreground text-xs">Bestand</div>
              <div className="font-semibold text-purple-400 text-base">{drop.totalStock || 0}</div>
            </div>
            <div className="bg-black/25 rounded-lg p-2.5 hover:bg-black/35 transition-colors">
              <div className="text-muted-foreground text-xs">Verkauft</div>
              <div className="font-semibold text-green-400 text-base">{drop.soldCount || 0}</div>
            </div>
            <div className="bg-black/25 rounded-lg p-2.5 hover:bg-black/35 transition-colors">
              <div className="text-muted-foreground text-xs">Interesse</div>
              <div className="font-semibold text-blue-400 text-base">{drop.interestCount || 0}</div>
            </div>
            <div className="bg-black/25 rounded-lg p-2.5 hover:bg-black/35 transition-colors">
              <div className="text-muted-foreground text-xs">Umsatz</div>
              <div className="font-semibold text-green-400 text-base">€{(drop.revenue || 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Status and Access Selectors */}
          <div className="flex items-center justify-between gap-2">
            <InlineEdit
              value={drop.status || 'active'}
              onSave={(newStatus) => handleUpdate('status', newStatus)}
              type="select"
              options={[
                { value: 'active', label: 'Aktiv' },
                { value: 'inactive', label: 'Inaktiv' },
                { value: 'scheduled', label: 'Geplant' },
                { value: 'sold_out', label: 'Ausverkauft' }
              ]}
              className="text-xs flex-1"
            />
            <InlineEdit
              value={drop.access || 'standard'}
              onSave={(newAccess) => handleUpdate('access', newAccess)}
              type="select"
              options={[
                { value: 'free', label: 'Kostenlos' },
                { value: 'limited', label: 'Limitiert' },
                { value: 'vip', label: 'VIP' },
                { value: 'standard', label: 'Standard' }
              ]}
              className="text-xs flex-1"
            />
          </div>

          {/* Priority Badge */}
          {getPriorityBadge(drop)}

          {/* Days Until Drop / Live Indicator */}
          {drop.daysUntilDrop !== null && (
            <div className="flex items-center gap-1 text-yellow-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>Drops in {drop.daysUntilDrop} Tagen</span>
            </div>
          )}

          {drop.isLive && (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live Now</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
});

DropCard.displayName = 'DropCard';

