import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, ProductImageLinkRequest, ProductImageReorderRequest } from '@nebula/shared';
import { ImageGrid } from '../images/ImageGrid';
import { ImageUploader } from '../images/ImageUploader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { apiClient } from '../../lib/api/client';

interface ProductImagesTabProps {
  productId: string;
  productName: string;
  className?: string;
}

export const ProductImagesTab: React.FC<ProductImagesTabProps> = ({
  productId,
  productName,
  className
}) => {
  const [showUploader, setShowUploader] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const { handleError } = useErrorHandler('ProductImagesTab');
  const queryClient = useQueryClient();

  // Fetch product images
  const { data: productImages, isLoading: isLoadingProductImages } = useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      // This would be a separate endpoint to get images for a specific product
      // For now, we'll simulate it
      return { images: [] as Image[] };
    }
  });

  // Fetch available images from library
  const { data: libraryImages, isLoading: isLoadingLibrary } = useQuery({
    queryKey: ['images', 'shop', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        space: 'shop',
        page: '1',
        limit: '50'
      });
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await apiClient.get(`/admin/images?${params}`);
      return response.data;
    },
    enabled: showLibrary
  });

  // Link images mutation
  const linkImagesMutation = useMutation({
    mutationFn: async (data: ProductImageLinkRequest) => {
      await apiClient.post(`/admin/images/products/${productId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      setSelectedImages(new Set());
      setShowLibrary(false);
    },
    onError: handleError
  });

  // Reorder images mutation
  const reorderImagesMutation = useMutation({
    mutationFn: async (data: ProductImageReorderRequest) => {
      await apiClient.patch(`/admin/images/products/${productId}/reorder`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
    },
    onError: handleError
  });

  // Upload images mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      formData.append('space', 'shop');
      files.forEach(file => formData.append('files', file));

      const res = await apiClient.postForm('/admin/images', formData);
      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['images', 'shop'] });
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      setShowUploader(false);
    },
    onError: handleError
  });

  const handleImageSelect = useCallback((imageId: string, selected: boolean) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(imageId);
      } else {
        newSet.delete(imageId);
      }
      return newSet;
    });
  }, []);

  const handleAttachImages = useCallback(() => {
    if (selectedImages.size === 0) return;
    
    linkImagesMutation.mutate({
      imageIds: Array.from(selectedImages)
    });
  }, [selectedImages, linkImagesMutation]);

  const handleUploadImages = useCallback((files: File[]) => {
    uploadMutation.mutate(files);
  }, [uploadMutation]);

  const handleReorderImages = useCallback((orderedImageIds: string[], coverId?: string) => {
    reorderImagesMutation.mutate({
      orderedImageIds,
      coverId
    });
  }, [reorderImagesMutation]);

  const handleImageDelete = useCallback((imageId: string) => {
    // This would unlink the image from the product
    // For now, we'll just show a message
    console.log('Delete image from product:', imageId);
  }, []);

  const handleImageClick = useCallback((image: Image) => {
    // This would open the image details modal
    console.log('Open image details:', image);
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!libraryImages?.data.images) return;
    const allImageIds = libraryImages.data.images.map(img => img.id);
    setSelectedImages(new Set(allImageIds));
  }, [libraryImages]);

  const handleClearSelection = useCallback(() => {
    setSelectedImages(new Set());
  }, []);

  const filteredLibraryImages = useMemo(() => {
    if (!libraryImages?.data.images) return [];
    
    // Filter out images that are already linked to this product
    const linkedImageIds = new Set(productImages?.images.map(img => img.id) || []);
    return libraryImages.data.images.filter(img => !linkedImageIds.has(img.id));
  }, [libraryImages, productImages]);

  if (isLoadingProductImages) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Product Images</h3>
          <p className="text-sm text-gray-400">
            Manage images for {productName}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowLibrary(true)}
          >
            From Library
          </Button>
          <Button
            onClick={() => setShowUploader(true)}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? <LoadingSpinner size="sm" /> : 'Upload New'}
          </Button>
        </div>
      </div>

      {/* Current Images */}
      {productImages?.images && productImages.images.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Current Images ({productImages.images.length})
          </h4>
          <ImageGrid
            images={productImages.images}
            selectedImages={new Set()}
            onImageSelect={() => {}}
            onImageClick={handleImageClick}
            onImageDelete={handleImageDelete}
            onSelectAll={() => {}}
            onClearSelection={() => {}}
            hasSelection={false}
            onReorder={handleReorderImages}
            showReorderControls={true}
          />
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
          <div className="text-4xl mb-4">📷</div>
          <h4 className="text-lg font-medium text-white mb-2">No images yet</h4>
          <p className="text-gray-400 mb-4">
            Upload images or select from your library
          </p>
          <div className="flex items-center justify-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowLibrary(true)}
            >
              From Library
            </Button>
            <Button
              onClick={() => setShowUploader(true)}
            >
              Upload New
            </Button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploader && (
        <ImageUploader
          space="shop"
          onUpload={handleUploadImages}
          onClose={() => setShowUploader(false)}
          isUploading={uploadMutation.isPending}
        />
      )}

      {/* Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">
                  Select Images from Library
                </h3>
                <Button
                  variant="outline"
                  onClick={() => setShowLibrary(false)}
                >
                  Close
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <Input
                  placeholder="Search images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              
              {isLoadingLibrary ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner size="large" />
                </div>
              ) : (
                <div className="space-y-4">
                  <ImageGrid
                    images={filteredLibraryImages}
                    selectedImages={selectedImages}
                    onImageSelect={handleImageSelect}
                    onImageClick={handleImageClick}
                    onImageDelete={() => {}}
                    onSelectAll={handleSelectAll}
                    onClearSelection={handleClearSelection}
                    hasSelection={selectedImages.size > 0}
                  />
                  
                  {selectedImages.size > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <span className="text-sm text-gray-400">
                        {selectedImages.size} image(s) selected
                      </span>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          onClick={handleClearSelection}
                        >
                          Clear
                        </Button>
                        <Button
                          onClick={handleAttachImages}
                          disabled={linkImagesMutation.isPending}
                        >
                          {linkImagesMutation.isPending ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            `Attach ${selectedImages.size} Image${selectedImages.size !== 1 ? 's' : ''}`
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

