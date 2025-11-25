import React, { useState, useCallback, useMemo } from 'react';
import { Image } from '@nebula/shared';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface ImageGridProps {
  images: Image[];
  selectedImages: Set<string>;
  onImageSelect: (imageId: string, selected: boolean) => void;
  onImageClick: (image: Image) => void;
  onImageDelete: (imageId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  hasSelection: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onReorder?: (orderedImageIds: string[], coverId?: string) => void;
  showReorderControls?: boolean;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  selectedImages,
  onImageSelect,
  onImageClick,
  onImageDelete,
  onSelectAll,
  onClearSelection,
  hasSelection,
  pagination,
  onPageChange,
  onReorder,
  showReorderControls = false
}) => {
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  const handleImageClick = useCallback((image: Image, e: React.MouseEvent) => {
    e.stopPropagation();
    onImageClick(image);
  }, [onImageClick]);

  const handleImageSelect = useCallback((imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onImageSelect(imageId, !selectedImages.has(imageId));
  }, [selectedImages, onImageSelect]);

  const handleImageDelete = useCallback((imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onImageDelete(imageId);
  }, [onImageDelete]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSelectAll();
    }
    if (e.key === 'Escape') {
      onClearSelection();
    }
  }, [onSelectAll, onClearSelection]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getImageUrl = (image: Image) => {
    // For now, use the public URL directly
    // In production, this would use the variants system
    return `/files/${image.fileKey}`;
  };

  const getThumbnailUrl = (image: Image) => {
    // Use the small variant if available, otherwise the original
    const baseUrl = `/files/${image.fileKey}`;
    const ext = image.fileKey.split('.').pop();
    const baseName = image.fileKey.replace(/\.[^.]+$/, '');
    return `${baseUrl.replace(/\.[^.]+$/, '')}_sm.${ext}`;
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📷</div>
        <h3 className="text-lg font-medium text-white mb-2">No images found</h3>
        <p className="text-gray-400">
          Upload some images to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {images.map((image) => {
          const isSelected = selectedImages.has(image.id);
          const isHovered = hoveredImage === image.id;

          return (
            <div
              key={image.id}
              className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                isSelected
                  ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900'
                  : 'hover:ring-2 hover:ring-gray-400 hover:ring-offset-2 hover:ring-offset-gray-900'
              }`}
              onMouseEnter={() => setHoveredImage(image.id)}
              onMouseLeave={() => setHoveredImage(null)}
              onClick={() => handleImageClick(image, {} as React.MouseEvent)}
            >
              {/* Image */}
              <div className="aspect-square bg-gray-800 relative">
                <img
                  src={getThumbnailUrl(image)}
                  alt={image.alt || 'Image'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to original if thumbnail fails
                    (e.target as HTMLImageElement).src = getImageUrl(image);
                  }}
                />
                
                {/* Overlay */}
                <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity ${
                  isSelected ? 'bg-opacity-50' : ''
                }`} />

                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2">
                  <button
                    onClick={(e) => handleImageSelect(image.id, e)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white/20 border-white/40 hover:bg-white/30'
                    }`}
                  >
                    {isSelected && '✓'}
                  </button>
                </div>

                {/* Actions */}
                {(isHovered || isSelected) && (
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={(e) => handleImageDelete(image.id, e)}
                      className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                      title="Delete image"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <div className="text-xs text-white space-y-1">
                    <div className="truncate">{image.alt || 'Untitled'}</div>
                    <div className="text-gray-300">
                      {image.width}×{image.height} • {formatFileSize(image.sizeBytes)}
                    </div>
                    <div className="text-gray-400">
                      {formatDate(image.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              const isActive = page === pagination.page;
              
              return (
                <Button
                  key={page}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {hasSelection && (
        <div className="text-center text-sm text-gray-400">
          Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+A</kbd> to select all,{' '}
          <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Esc</kbd> to clear selection
        </div>
      )}
    </div>
  );
};

