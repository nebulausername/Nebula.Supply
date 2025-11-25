import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageSpace, Image } from '@nebula/shared';
import { ImageUploader } from './ImageUploader';
import { ImageGrid } from './ImageGrid';
import { ImageDetailsModal } from './ImageDetailsModal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { apiClient } from '../../lib/api/client';

interface ImageLibraryPageProps {
  className?: string;
}

export const ImageLibraryPage: React.FC<ImageLibraryPageProps> = ({ className }) => {
  const [activeSpace, setActiveSpace] = useState<ImageSpace>('shop');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showUploader, setShowUploader] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [page, setPage] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { handleError } = useErrorHandler('ImageLibraryPage');
  const queryClient = useQueryClient();

  // Fetch images
  const { data: imagesData, isLoading, error } = useQuery<{ images: Image[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>({
    queryKey: ['images', activeSpace, searchTerm, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        space: activeSpace,
        page: page.toString(),
        limit: '20'
      });
      if (searchTerm) params.append('search', searchTerm);
      
      const data = await apiClient.get(`/admin/images?${params}`);
      return data;
    },
    keepPreviousData: true
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { space: ImageSpace; files: File[]; alt?: string }) => {
      const formData = new FormData();
      formData.append('space', data.space);
      if (data.alt) formData.append('alt', data.alt);
      data.files.forEach(file => formData.append('files', file));

      const res = await apiClient.postForm('/admin/images', formData);
      return res as { images: Image[]; errors?: Array<{ file: string; error: string }> };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['images', activeSpace] });
      setShowUploader(false);
      if (data.errors && data.errors.length > 0) {
        handleError(new Error(`Upload completed with ${data.errors.length} errors`));
      }
    },
    onError: handleError
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await apiClient.delete(`/admin/images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images', activeSpace] });
      setSelectedImages(new Set());
    },
    onError: handleError
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (imageIds: string[]) => {
      await Promise.all(imageIds.map(id => apiClient.delete(`/admin/images/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images', activeSpace] });
      setSelectedImages(new Set());
    },
    onError: handleError
  });

  // Update image mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { alt?: string; file?: File } }) => {
      const formData = new FormData();
      if (updates.alt) formData.append('alt', updates.alt);
      if (updates.file) formData.append('file', updates.file);

      const res = await apiClient.patchForm(`/admin/images/${id}`, formData);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images', activeSpace] });
      setShowDetailsModal(false);
    },
    onError: handleError
  });

  const handleSpaceChange = useCallback((space: ImageSpace) => {
    setActiveSpace(space);
    setPage(1);
    setSelectedImages(new Set());
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

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

  const handleSelectAll = useCallback(() => {
    if (!imagesData?.data.images) return;
    
    const allImageIds = imagesData.data.images.map(img => img.id);
    setSelectedImages(new Set(allImageIds));
  }, [imagesData]);

  const handleClearSelection = useCallback(() => {
    setSelectedImages(new Set());
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedImages.size === 0) return;
    
    if (confirm(`${selectedImages.size} Bild(er) löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      bulkDeleteMutation.mutate(Array.from(selectedImages));
    }
  }, [selectedImages, bulkDeleteMutation]);

  const handleImageClick = useCallback((image: Image) => {
    setSelectedImage(image);
    setShowDetailsModal(true);
  }, []);

  const handleImageUpdate = useCallback((updates: { alt?: string; file?: File }) => {
    if (!selectedImage) return;
    updateMutation.mutate({ id: selectedImage.id, updates });
  }, [selectedImage, updateMutation]);

  const handleImageDelete = useCallback((imageId: string) => {
    if (confirm('Dieses Bild löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      deleteMutation.mutate(imageId);
    }
  }, [deleteMutation]);

  const handleUpload = useCallback((files: File[], alt?: string) => {
    uploadMutation.mutate({
      space: activeSpace,
      files,
      alt
    });
  }, [activeSpace, uploadMutation]);

  const tabs = useMemo(() => [
    {
      id: 'shop',
      label: 'Shop-Bilder',
      count: activeSpace === 'shop' ? imagesData?.data.pagination.total : undefined
    },
    {
      id: 'drops',
      label: 'Drop-Bilder',
      count: activeSpace === 'drops' ? imagesData?.data.pagination.total : undefined
    }
  ], [activeSpace, imagesData]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">Fehler beim Laden der Bilder</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['images'] })}>
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bildverwaltung</h1>
          <p className="text-gray-400 mt-1">Verwalte deine Produkt- und Drop-Bilder</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowUploader(true)}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? <LoadingSpinner size="sm" /> : 'Bilder hochladen'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeSpace}
        onTabChange={handleSpaceChange}
      />

      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Bilder suchen..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-64"
          />
        </div>
        
        {selectedImages.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {selectedImages.size} ausgewählt
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSelection}
            >
              Auswahl aufheben
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? <LoadingSpinner size="sm" /> : 'Löschen'}
            </Button>
          </div>
        )}
      </div>

      {/* Image Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <ImageGrid
          images={imagesData?.data.images || []}
          selectedImages={selectedImages}
          onImageSelect={handleImageSelect}
          onImageClick={handleImageClick}
          onImageDelete={handleImageDelete}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          hasSelection={selectedImages.size > 0}
          pagination={imagesData?.data.pagination}
          onPageChange={setPage}
        />
      )}

      {/* Upload Modal */}
      {showUploader && (
        <ImageUploader
          space={activeSpace}
          onUpload={handleUpload}
          onClose={() => setShowUploader(false)}
          isUploading={uploadMutation.isPending}
        />
      )}

      {/* Image Details Modal */}
      {showDetailsModal && selectedImage && (
        <ImageDetailsModal
          image={selectedImage}
          onUpdate={handleImageUpdate}
          onDelete={() => handleImageDelete(selectedImage.id)}
          onClose={() => setShowDetailsModal(false)}
          isUpdating={updateMutation.isPending}
        />
      )}
    </div>
  );
};

