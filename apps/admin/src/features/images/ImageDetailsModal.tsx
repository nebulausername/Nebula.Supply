import React, { useState, useCallback, useRef } from 'react';
import { Image } from '@nebula/shared';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog } from '../../components/ui/Dialog';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface ImageDetailsModalProps {
  image: Image;
  onUpdate: (updates: { alt?: string; file?: File }) => void;
  onDelete: () => void;
  onClose: () => void;
  isUpdating: boolean;
}

export const ImageDetailsModal: React.FC<ImageDetailsModalProps> = ({
  image,
  onUpdate,
  onDelete,
  onClose,
  isUpdating
}) => {
  const [alt, setAlt] = useState(image.alt);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(() => {
    if (alt !== image.alt) {
      onUpdate({ alt });
    }
    setIsEditing(false);
  }, [alt, image.alt, onUpdate]);

  const handleCancel = useCallback(() => {
    setAlt(image.alt);
    setIsEditing(false);
  }, [image.alt]);

  const handleFileReplace = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate({ file });
    }
  }, [onUpdate]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageUrl = (image: Image) => {
    return `/files/${image.fileKey}`;
  };

  const getThumbnailUrl = (image: Image) => {
    const baseUrl = `/files/${image.fileKey}`;
    const ext = image.fileKey.split('.').pop();
    const baseName = image.fileKey.replace(/\.[^.]+$/, '');
    return `${baseUrl.replace(/\.[^.]+$/, '')}_xl.webp`;
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Image Details"
      className="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Image Preview */}
        <div className="flex justify-center">
          <div className="relative max-w-2xl max-h-96">
            <img
              src={getThumbnailUrl(image)}
              alt={image.alt || 'Image'}
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                // Fallback to original if thumbnail fails
                (e.target as HTMLImageElement).src = getImageUrl(image);
              }}
            />
          </div>
        </div>

        {/* Image Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                File Name
              </label>
              <div className="text-sm text-gray-400 font-mono bg-gray-800 px-3 py-2 rounded">
                {image.fileKey.split('/').pop()}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Dimensions
              </label>
              <div className="text-sm text-gray-400">
                {image.width} × {image.height} pixels
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                File Size
              </label>
              <div className="text-sm text-gray-400">
                {formatFileSize(image.sizeBytes)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                MIME Type
              </label>
              <div className="text-sm text-gray-400 font-mono bg-gray-800 px-3 py-2 rounded">
                {image.mime}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Space
              </label>
              <div className="text-sm text-gray-400 capitalize">
                {image.space}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Metadata</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Created
              </label>
              <div className="text-sm text-gray-400">
                {formatDate(image.createdAt)}
              </div>
            </div>

            {image.updatedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Updated
                </label>
                <div className="text-sm text-gray-400">
                  {formatDate(image.updatedAt)}
                </div>
              </div>
            )}

            {image.dominantColor && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Dominant Color
                </label>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-6 h-6 rounded border border-gray-600"
                    style={{ backgroundColor: image.dominantColor }}
                  />
                  <span className="text-sm text-gray-400 font-mono">
                    {image.dominantColor}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alt Text */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">
              Alt Text
            </label>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isUpdating}
              >
                Edit
              </Button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe this image for accessibility..."
                rows={3}
                disabled={isUpdating}
              />
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isUpdating}
                >
                  {isUpdating ? <LoadingSpinner size="sm" /> : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 bg-gray-800 px-3 py-2 rounded min-h-[2.5rem] flex items-center">
              {image.alt || 'No alt text provided'}
            </div>
          )}
        </div>

        {/* File Replacement */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Replace File
          </label>
          <div className="flex items-center space-x-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileReplace}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUpdating}
            >
              Choose New File
            </Button>
            <span className="text-xs text-gray-400">
              This will replace the current image file
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isUpdating}
          >
            Delete Image
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};




