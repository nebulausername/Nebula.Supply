import React, { useState, useCallback, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToastHelpers } from '../../components/ui/Toast';
import { logger } from '../../lib/logger';
import { api } from '../../lib/api/client';
import { MediaUpload } from '../../schemas/api';

interface MediaManagerProps {
  onMediaSelect?: (media: MediaUpload) => void;
  multiple?: boolean;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  className?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  mediaId?: string;
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  onMediaSelect,
  multiple = true,
  acceptedTypes = ['image/*'],
  maxFileSize = 10,
  className
}) => {
  const [media, setMedia] = useState<MediaUpload[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [dragActive, setDragActive] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError } = useToastHelpers();

  // Get presigned upload URL
  const getPresignedUrl = async (file: File): Promise<{ uploadUrl: string; mediaId: string }> => {
    const response = await api.post('/api/media/presigned-upload', {
      filename: file.name,
      mimeType: file.type,
      size: file.size
    });
    return response;
  };

  // Upload file to presigned URL
  const uploadToPresignedUrl = async (file: File, uploadUrl: string): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
  };

  // Confirm upload and get media details
  const confirmUpload = async (mediaId: string): Promise<MediaUpload> => {
    const response = await api.post(`/api/media/${mediaId}/confirm-upload`);
    return response;
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Validate files
    for (const file of fileArray) {
      if (file.size > maxFileSize * 1024 * 1024) {
        showError('File Too Large', `${file.name} exceeds ${maxFileSize}MB limit`);
        continue;
      }

      if (!acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      })) {
        showError('Invalid File Type', `${file.name} is not an accepted file type`);
        continue;
      }
    }

    // Process each file
    for (const file of fileArray) {
      const fileId = `${file.name}-${Date.now()}`;
      
      setUploadProgress(prev => new Map(prev).set(fileId, {
        file,
        progress: 0,
        status: 'uploading'
      }));

      try {
        // Step 1: Get presigned URL
        const { uploadUrl, mediaId } = await getPresignedUrl(file);
        
        setUploadProgress(prev => new Map(prev).set(fileId, {
          file,
          progress: 25,
          status: 'uploading'
        }));

        // Step 2: Upload to presigned URL
        await uploadToPresignedUrl(file, uploadUrl);
        
        setUploadProgress(prev => new Map(prev).set(fileId, {
          file,
          progress: 75,
          status: 'processing'
        }));

        // Step 3: Confirm upload and get media details
        const mediaUpload = await confirmUpload(mediaId);
        
        setUploadProgress(prev => new Map(prev).set(fileId, {
          file,
          progress: 100,
          status: 'completed',
          mediaId: mediaUpload.id
        }));

        // Add to media list
        setMedia(prev => [mediaUpload, ...prev]);
        
        // Call selection callback if single selection
        if (!multiple && onMediaSelect) {
          onMediaSelect(mediaUpload);
        }

        success('Upload Successful', `${file.name} uploaded successfully`);
        logger.logUserAction('media_upload_success', {
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          mediaId: mediaUpload.id
        });

      } catch (error) {
        setUploadProgress(prev => new Map(prev).set(fileId, {
          file,
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        }));

        showError('Upload Failed', `${file.name} failed to upload`);
        logger.error('Media upload failed', { filename: file.name, error });
      }
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  // Handle media selection
  const handleMediaSelect = (mediaItem: MediaUpload) => {
    if (multiple) {
      setSelectedMedia(prev => {
        const newSet = new Set(prev);
        if (newSet.has(mediaItem.id)) {
          newSet.delete(mediaItem.id);
        } else {
          newSet.add(mediaItem.id);
        }
        return newSet;
      });
    } else {
      onMediaSelect?.(mediaItem);
    }
  };

  // Delete media
  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await api.delete(`/api/media/${mediaId}`);
      setMedia(prev => prev.filter(m => m.id !== mediaId));
      setSelectedMedia(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
      success('Media Deleted', 'Media item deleted successfully');
      logger.logUserAction('media_deleted', { mediaId });
    } catch (error) {
      showError('Delete Failed', 'Could not delete media item');
      logger.error('Media deletion failed', { mediaId, error });
    }
  };

  // Clear completed uploads
  const clearCompletedUploads = () => {
    setUploadProgress(prev => {
      const newMap = new Map(prev);
      for (const [key, progress] of newMap) {
        if (progress.status === 'completed') {
          newMap.delete(key);
        }
      }
      return newMap;
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-900/20'
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {dragActive ? 'Drop files here' : 'Upload Media'}
              </h3>
              <p className="text-gray-400 mb-4">
                Drag and drop files here, or click to select
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                Choose Files
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Max file size: {maxFileSize}MB • Accepted types: {acceptedTypes.join(', ')}
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </Card>

      {/* Upload Progress */}
      {uploadProgress.size > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Upload Progress</h4>
            <Button onClick={clearCompletedUploads} size="sm" variant="outline">
              Clear Completed
            </Button>
          </div>
          
          <div className="space-y-2">
            {Array.from(uploadProgress.values()).map((progress, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">{progress.file.name}</span>
                  <span className="text-gray-400">
                    {progress.status === 'completed' ? 'Done' : 
                     progress.status === 'error' ? 'Failed' : 
                     `${progress.progress}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      progress.status === 'completed' ? 'bg-green-500' :
                      progress.status === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                {progress.error && (
                  <p className="text-xs text-red-400">{progress.error}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Media Grid */}
      {media.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">
              Media Library ({media.length})
            </h4>
            {selectedMedia.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {selectedMedia.size} selected
                </span>
                <Button
                  onClick={() => setSelectedMedia(new Set())}
                  size="sm"
                  variant="outline"
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {media.map((mediaItem) => (
              <div
                key={mediaItem.id}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedMedia.has(mediaItem.id)
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => handleMediaSelect(mediaItem)}
              >
                <div className="aspect-square bg-gray-800 flex items-center justify-center">
                  {mediaItem.mimeType.startsWith('image/') ? (
                    <img
                      src={mediaItem.url}
                      alt={mediaItem.alt || mediaItem.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl">📄</div>
                  )}
                </div>
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMedia(mediaItem.id);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="p-2">
                  <p className="text-xs text-gray-300 truncate">
                    {mediaItem.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(mediaItem.size / 1024).toFixed(1)}KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};



