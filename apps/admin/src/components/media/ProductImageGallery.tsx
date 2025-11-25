import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Star, 
  Eye, 
  Trash2, 
  Move, 
  Download, 
  RotateCw, 
  ZoomIn,
  X,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { logger } from '../../lib/logger';

interface ProductMedia {
  id: string;
  url: string;
  color?: string;
  alt?: string;
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
    quality: number;
  };
}

interface AdminImageGalleryProps {
  images: ProductMedia[];
  onReorder: (images: ProductMedia[]) => void;
  onAdd: (images: ProductMedia[]) => void;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
  enableDragDrop?: boolean;
  showMetadata?: boolean;
  maxImages?: number;
  className?: string;
}

export const ProductImageGallery = ({
  images,
  onReorder,
  onAdd,
  onRemove,
  onSetPrimary,
  enableDragDrop = true,
  showMetadata = true,
  maxImages = 10,
  className
}: AdminImageGalleryProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<ProductMedia | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 🎯 Drag & Drop Handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!enableDragDrop) return;
    
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  }, [enableDragDrop]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    onReorder(newImages);
    setDraggedIndex(null);
    
    logger.info(`Reordered image from position ${draggedIndex} to ${dropIndex}`);
  }, [draggedIndex, images, onReorder]);

  // 🖼️ Image Selection
  const handleImageSelect = useCallback((imageId: string, multiSelect: boolean = false) => {
    if (multiSelect) {
      setSelectedImages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(imageId)) {
          newSet.delete(imageId);
        } else {
          newSet.add(imageId);
        }
        return newSet;
      });
    } else {
      setSelectedImages(new Set([imageId]));
    }
  }, []);

  // 🗑️ Bulk Operations
  const handleBulkDelete = useCallback(() => {
    if (selectedImages.size === 0) return;
    
    const newImages = images.filter(img => !selectedImages.has(img.id));
    onReorder(newImages);
    setSelectedImages(new Set());
    
    logger.info(`Deleted ${selectedImages.size} images`);
  }, [selectedImages, images, onReorder]);

  // 📊 Image Quality Assessment
  const getImageQuality = useCallback((image: ProductMedia) => {
    if (!image.metadata) return 'unknown';
    
    const { width, height, size, quality } = image.metadata;
    const megapixels = (width * height) / 1000000;
    
    if (megapixels >= 2 && quality >= 80) return 'excellent';
    if (megapixels >= 1 && quality >= 70) return 'good';
    if (megapixels >= 0.5 && quality >= 60) return 'fair';
    return 'poor';
  }, []);

  const getQualityColor = useCallback((quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400 bg-green-500/20';
      case 'good': return 'text-blue-400 bg-blue-500/20';
      case 'fair': return 'text-yellow-400 bg-yellow-500/20';
      case 'poor': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  }, []);

  // 🎨 Color Palette Display
  const extractColors = useCallback((image: ProductMedia) => {
    // This would typically extract colors from the image
    // For now, return mock colors based on the image ID
    const colors = ['#0BF7BC', '#8B5CF6', '#3B82F6', '#EC4899', '#F59E0B'];
    return colors.slice(0, 3);
  }, []);

  const primaryImage = images.find(img => img.id === 'primary') || images[0];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Gallery Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-white">
            Image Gallery ({images.length}/{maxImages})
          </h3>
          {primaryImage && (
            <Badge className="bg-accent text-black">
              <Star className="w-3 h-3 mr-1" />
              Primary: {primaryImage.alt || 'Image'}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-white/20 p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              <Move className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Bulk Actions */}
          {selectedImages.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedImages.size} selected
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Image Grid/List */}
      <div className={cn(
        "space-y-2",
        viewMode === 'grid' 
          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          : "space-y-2"
      )}>
        {images.map((image, index) => {
          const isSelected = selectedImages.has(image.id);
          const isPrimary = image.id === primaryImage?.id;
          const quality = getImageQuality(image);
          const colors = extractColors(image);
          
          return (
            <Card
              key={image.id}
              className={cn(
                "group relative overflow-hidden transition-all duration-300 cursor-pointer",
                isSelected && "ring-2 ring-blue-400",
                isPrimary && "ring-2 ring-accent",
                enableDragDrop && "hover:scale-105"
              )}
              draggable={enableDragDrop}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => handleImageSelect(image.id, true)}
            >
              {/* Image */}
              <div className={cn(
                "relative overflow-hidden",
                viewMode === 'grid' ? "aspect-square" : "h-20 w-32"
              )}>
                <img
                  src={image.url}
                  alt={image.alt || 'Product image'}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(image);
                      }}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetPrimary(image.id);
                      }}
                      disabled={isPrimary}
                    >
                      <Star className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(image.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {isPrimary && (
                    <Badge className="bg-accent text-black text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Primary
                    </Badge>
                  )}
                  <Badge className={cn("text-xs", getQualityColor(quality))}>
                    {quality}
                  </Badge>
                </div>
                
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Image Info */}
              {showMetadata && (
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white truncate">
                      {image.alt || `Image ${index + 1}`}
                    </p>
                    {image.metadata && (
                      <span className="text-xs text-muted-foreground">
                        {image.metadata.width}×{image.metadata.height}
                      </span>
                    )}
                  </div>
                  
                  {/* Color Palette */}
                  <div className="flex gap-1">
                    {colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  
                  {/* Metadata */}
                  {image.metadata && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span>Size: </span>
                        <span>{(image.metadata.size / 1024 / 1024).toFixed(1)}MB</span>
                      </div>
                      <div>
                        <span>Quality: </span>
                        <span>{image.metadata.quality}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {images.length === 0 && (
        <Card className="p-12 text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2 text-white">No images uploaded</h3>
          <p className="text-muted-foreground mb-4">
            Upload images to see them in the gallery
          </p>
        </Card>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Image Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewImage(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-4">
              <img
                src={previewImage.url}
                alt={previewImage.alt || 'Product image'}
                className="w-full max-h-96 object-contain rounded-lg"
              />
              
              {previewImage.metadata && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Dimensions</p>
                    <p className="text-white">
                      {previewImage.metadata.width} × {previewImage.metadata.height}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">File Size</p>
                    <p className="text-white">
                      {(previewImage.metadata.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Format</p>
                    <p className="text-white">{previewImage.metadata.format}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quality</p>
                    <p className="text-white">{previewImage.metadata.quality}%</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};





