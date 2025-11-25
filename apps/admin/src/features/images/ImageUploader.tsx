import React, { useState, useCallback, useRef } from 'react';
import { ImageSpace } from '@nebula/shared';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface ImageUploaderProps {
  space: ImageSpace;
  onUpload: (files: File[], alt?: string) => void;
  onClose: () => void;
  isUploading: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  space,
  onUpload,
  onClose,
  isUploading
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [alt, setAlt] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(file => 
      file.type.startsWith('image/')
    );

    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(() => {
    if (files.length === 0) return;
    onUpload(files, alt || undefined);
  }, [files, alt, onUpload]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageFiles = items
      .filter(item => item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(Boolean) as File[];

    if (imageFiles.length > 0) {
      setFiles(prev => [...prev, ...imageFiles]);
    }
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={`Upload Images to ${space === 'shop' ? 'Shop' : 'Drops'}`}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50/10'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onPaste={handlePaste}
        >
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            <div>
              <p className="text-lg font-medium text-white">
                Drop images here or click to browse
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Supports JPG, PNG, WebP, AVIF, GIF (max 15MB each)
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Alt Text */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Alt Text (optional)
          </label>
          <Input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Describe the images for accessibility..."
            disabled={isUploading}
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-300">
              Selected Files ({files.length})
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                      🖼️
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-xs">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    disabled={isUploading}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Uploading...
              </>
            ) : (
              `Upload ${files.length} Image${files.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};




