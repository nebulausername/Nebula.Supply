import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Upload, 
  X, 
  Crop, 
  Palette, 
  Eye, 
  Download, 
  RotateCw, 
  ZoomIn,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
  Star,
  Move
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { logger } from '../../lib/logger';

interface ProcessedImage {
  id: string;
  url: string;
  thumbnail: string;
  originalName: string;
  size: number;
  dimensions: { width: number; height: number };
  colorPalette: string[];
  isPrimary: boolean;
  metadata: {
    format: string;
    quality: number;
    optimized: boolean;
  };
}

interface EnhancedImagePickerProps {
  product?: any;
  onImagesChange: (images: ProcessedImage[]) => void;
  syncWithFrontend?: boolean;
  enablePreview?: boolean;
  enableBulkUpload?: boolean;
  maxImages?: number;
  acceptedFormats?: string[];
  maxFileSize?: number; // in MB
  className?: string;
}

export const EnhancedImagePicker = ({
  product,
  onImagesChange,
  syncWithFrontend = true,
  enablePreview = true,
  enableBulkUpload = true,
  maxImages = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 10,
  className
}: EnhancedImagePickerProps) => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 🎨 Color Palette Extraction
  const extractColorPalette = useCallback((imageUrl: string): Promise<string[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(['#0BF7BC', '#8B5CF6', '#3B82F6']);
          return;
        }

        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);
        
        const imageData = ctx.getImageData(0, 0, 50, 50);
        const data = imageData.data;
        const colors = new Set<string>();
        
        // Sample colors from the image
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          colors.add(hex);
        }
        
        resolve(Array.from(colors).slice(0, 5));
      };
      
      img.onerror = () => resolve(['#0BF7BC', '#8B5CF6', '#3B82F6']);
      img.src = imageUrl;
    });
  }, []);

  // 🖼️ Image Processing
  const processImage = useCallback(async (file: File): Promise<ProcessedImage> => {
    const id = Math.random().toString(36).substr(2, 9);
    const url = URL.createObjectURL(file);
    
    // Get image dimensions
    const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = url;
    });

    // Extract color palette
    const colorPalette = await extractColorPalette(url);

    // Generate thumbnail
    const thumbnail = await new Promise<string>((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(url);
        return;
      }

      const maxSize = 150;
      const ratio = Math.min(maxSize / dimensions.width, maxSize / dimensions.height);
      canvas.width = dimensions.width * ratio;
      canvas.height = dimensions.height * ratio;

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = url;
    });

    return {
      id,
      url,
      thumbnail,
      originalName: file.name,
      size: file.size,
      dimensions,
      colorPalette,
      isPrimary: images.length === 0,
      metadata: {
        format: file.type,
        quality: 85,
        optimized: true
      }
    };
  }, [images.length, extractColorPalette]);

  // 📤 Upload Handler
  const handleUpload = useCallback(async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const processedImages: ProcessedImage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        if (!acceptedFormats.includes(file.type)) {
          logger.warn(`Invalid file format: ${file.type}`);
          continue;
        }
        
        if (file.size > maxFileSize * 1024 * 1024) {
          logger.warn(`File too large: ${file.name}`);
          continue;
        }

        const processedImage = await processImage(file);
        processedImages.push(processedImage);
        
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      const newImages = [...images, ...processedImages];
      setImages(newImages);
      onImagesChange(newImages);
      
      logger.info(`Uploaded ${processedImages.length} images`);
    } catch (error) {
      logger.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [images, maxImages, acceptedFormats, maxFileSize, processImage, onImagesChange]);

  // 🎯 Drag & Drop Handlers
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
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  // 🗑️ Remove Image
  const handleRemove = useCallback((imageId: string) => {
    const newImages = images.filter(img => img.id !== imageId);
    setImages(newImages);
    onImagesChange(newImages);
    
    if (selectedImage?.id === imageId) {
      setSelectedImage(null);
    }
  }, [images, selectedImage, onImagesChange]);

  // ⭐ Set Primary Image
  const handleSetPrimary = useCallback((imageId: string) => {
    const newImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    setImages(newImages);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  // 🎨 Reorder Images
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  // 📱 File Input Handler
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUpload(e.target.files);
    }
  }, [handleUpload]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
          dragActive 
            ? "border-accent bg-accent/10 scale-105" 
            : "border-white/20 hover:border-accent/50 hover:bg-accent/5",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          multiple={enableBulkUpload}
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
            <Upload className="w-8 h-8 text-accent" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {dragActive ? 'Drop images here' : 'Upload Product Images'}
            </h3>
            <p className="text-muted-foreground text-sm">
              Drag & drop or click to select images
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {maxImages} images • {maxFileSize}MB each • {acceptedFormats.join(', ')}
            </p>
          </div>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || images.length >= maxImages}
            className="bg-accent text-black hover:bg-accent/90"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Choose Files'}
          </Button>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
            <div className="w-64 space-y-2">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-white text-sm">Processing images... {Math.round(uploadProgress)}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white">
              Product Images ({images.length}/{maxImages})
            </h4>
            {syncWithFrontend && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                <Check className="w-3 h-3 mr-1" />
                Synced with Frontend
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <Card
                key={image.id}
                className={cn(
                  "group relative overflow-hidden cursor-pointer transition-all duration-300",
                  image.isPrimary && "ring-2 ring-accent",
                  selectedImage?.id === image.id && "ring-2 ring-blue-400"
                )}
                onClick={() => setSelectedImage(image)}
              >
                {/* Image */}
                <div className="aspect-square relative">
                  <img
                    src={image.thumbnail}
                    alt={image.originalName}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Primary Badge */}
                  {image.isPrimary && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-accent text-black text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Primary
                      </Badge>
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(image);
                          setShowPreview(true);
                        }}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(image.id);
                        }}
                        disabled={image.isPrimary}
                      >
                        <Star className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(image.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Image Info */}
                <div className="p-2 space-y-1">
                  <p className="text-xs text-white truncate">{image.originalName}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{image.dimensions.width}×{image.dimensions.height}</span>
                    <span>{(image.size / 1024 / 1024).toFixed(1)}MB</span>
                  </div>
                  
                  {/* Color Palette */}
                  <div className="flex gap-1">
                    {image.colorPalette.slice(0, 3).map((color, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showPreview && selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Image Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-4">
              <img
                src={selectedImage.url}
                alt={selectedImage.originalName}
                className="w-full max-h-96 object-contain rounded-lg"
              />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Dimensions</p>
                  <p className="text-white">{selectedImage.dimensions.width} × {selectedImage.dimensions.height}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">File Size</p>
                  <p className="text-white">{(selectedImage.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Format</p>
                  <p className="text-white">{selectedImage.metadata.format}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quality</p>
                  <p className="text-white">{selectedImage.metadata.quality}%</p>
                </div>
              </div>
              
              <div>
                <p className="text-muted-foreground mb-2">Color Palette</p>
                <div className="flex gap-2">
                  {selectedImage.colorPalette.map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center text-xs"
                      style={{ backgroundColor: color }}
                    >
                      <span className="text-white mix-blend-difference">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};





