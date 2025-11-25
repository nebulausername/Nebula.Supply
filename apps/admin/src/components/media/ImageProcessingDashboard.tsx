import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  Settings, 
  BarChart3, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  HardDrive,
  Image as ImageIcon,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useImageProcessor } from '../../lib/imageProcessor';
import { logger } from '../../lib/logger';

interface ProcessedImage {
  id: string;
  originalName: string;
  originalSize: number;
  originalFormat: string;
  variants: Array<{
    id: string;
    name: string;
    width: number;
    height: number;
    quality: number;
    format: string;
    url: string;
    size: number;
  }>;
  colorPalette: string[];
  metadata: {
    width: number;
    height: number;
    aspectRatio: number;
    isOptimized: boolean;
    processingTime: number;
  };
  cdnUrl: string;
  uploadedAt: string;
}

interface ImageProcessingDashboardProps {
  className?: string;
}

export const ImageProcessingDashboard = ({ className }: ImageProcessingDashboardProps) => {
  const { processImage, processBatch, getProcessingStats } = useImageProcessor();
  
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 📊 Processing Statistics
  const stats = useMemo(() => {
    if (processedImages.length === 0) {
      return {
        imageCount: 0,
        totalOriginalSize: 0,
        totalOptimizedSize: 0,
        compressionRatio: 0,
        averageProcessingTime: 0
      };
    }
    return getProcessingStats(processedImages);
  }, [processedImages, getProcessingStats]);

  // 🎯 Process Single Image
  const handleProcessImage = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const processed = await processImage(file, {
        generateVariants: true,
        extractColors: true,
        optimizeForWeb: true,
        cdnUpload: true
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      setProcessedImages(prev => [processed, ...prev]);
      
      setTimeout(() => {
        setProcessingProgress(0);
        setIsProcessing(false);
      }, 500);
      
      logger.info('Image processed successfully', { id: processed.id });
    } catch (error) {
      logger.error('Image processing failed', { error });
      setProcessingProgress(0);
      setIsProcessing(false);
    }
  }, [processImage]);

  // 🎯 Process Multiple Images
  const handleProcessBatch = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      const results = await processBatch(files, {
        generateVariants: true,
        extractColors: true,
        optimizeForWeb: true,
        cdnUpload: true
      });
      
      setProcessedImages(prev => [...results, ...prev]);
      setProcessingProgress(100);
      
      setTimeout(() => {
        setProcessingProgress(0);
        setIsProcessing(false);
      }, 500);
      
      logger.info('Batch processing completed', { count: results.length });
    } catch (error) {
      logger.error('Batch processing failed', { error });
      setProcessingProgress(0);
      setIsProcessing(false);
    }
  }, [processBatch]);

  // 🗑️ Delete Image
  const handleDeleteImage = useCallback((imageId: string) => {
    setProcessedImages(prev => prev.filter(img => img.id !== imageId));
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
    logger.info('Image deleted', { imageId });
  }, []);

  // 🎯 Select Image
  const handleSelectImage = useCallback((imageId: string, selected: boolean) => {
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

  // 🎯 Select All
  const handleSelectAll = useCallback(() => {
    if (selectedImages.size === processedImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(processedImages.map(img => img.id)));
    }
  }, [selectedImages.size, processedImages]);

  // 🗑️ Bulk Delete
  const handleBulkDelete = useCallback(() => {
    setProcessedImages(prev => prev.filter(img => !selectedImages.has(img.id)));
    setSelectedImages(new Set());
    logger.info('Bulk delete completed', { count: selectedImages.size });
  }, [selectedImages]);

  // 📁 File Input Handler
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 1) {
      handleProcessImage(files[0]);
    } else if (files.length > 1) {
      handleProcessBatch(files);
    }
  }, [handleProcessImage, handleProcessBatch]);

  // 📊 Format File Size
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // 🎨 Format Processing Time
  const formatProcessingTime = useCallback((ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }, []);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Image Processing Dashboard</h2>
          <p className="text-muted-foreground">
            Advanced image optimization and CDN management
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistics
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.imageCount}</p>
                <p className="text-xs text-muted-foreground">Images Processed</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.compressionRatio.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Compression Ratio</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatFileSize(stats.totalOptimizedSize)}</p>
                <p className="text-xs text-muted-foreground">Optimized Size</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatProcessingTime(stats.averageProcessingTime)}</p>
                <p className="text-xs text-muted-foreground">Avg Processing Time</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Upload Area */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Upload Images</h3>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="image-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="image-upload"
                className={cn(
                  "px-4 py-2 rounded-lg border border-dashed border-white/20 text-center cursor-pointer transition-colors",
                  isProcessing ? "opacity-50 cursor-not-allowed" : "hover:border-accent/50 hover:bg-accent/5"
                )}
              >
                <Upload className="w-4 h-4 mr-2 inline" />
                Choose Images
              </label>
            </div>
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processing images...</span>
                <span className="text-white">{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} className="h-2" />
            </div>
          )}
        </div>
      </Card>

      {/* Processed Images */}
      {processedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-white">
                Processed Images ({processedImages.length})
              </h3>
              <input
                type="checkbox"
                checked={selectedImages.size === processedImages.length && processedImages.length > 0}
                onChange={handleSelectAll}
                className="rounded border-white/20"
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
            
            {selectedImages.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedImages.size})
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedImages.map((image) => (
              <Card
                key={image.id}
                className={cn(
                  "group relative overflow-hidden transition-all duration-300",
                  selectedImages.has(image.id) && "ring-2 ring-blue-400"
                )}
              >
                <div className="p-4 space-y-3">
                  {/* Image Preview */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                    <img
                      src={image.cdnUrl}
                      alt={image.originalName}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedImages.has(image.id)}
                      onChange={(e) => handleSelectImage(image.id, e.target.checked)}
                      className="absolute top-2 left-2 rounded border-white/20"
                    />
                    
                    {/* Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(image.cdnUrl, '_blank')}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteImage(image.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-white truncate">{image.originalName}</h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span>Original: </span>
                        <span>{formatFileSize(image.originalSize)}</span>
                      </div>
                      <div>
                        <span>Optimized: </span>
                        <span>{formatFileSize(image.variants.reduce((sum, v) => sum + v.size, 0))}</span>
                      </div>
                      <div>
                        <span>Dimensions: </span>
                        <span>{image.metadata.width}×{image.metadata.height}</span>
                      </div>
                      <div>
                        <span>Time: </span>
                        <span>{formatProcessingTime(image.metadata.processingTime)}</span>
                      </div>
                    </div>

                    {/* Color Palette */}
                    {image.colorPalette.length > 0 && (
                      <div className="flex gap-1">
                        {image.colorPalette.slice(0, 5).map((color, index) => (
                          <div
                            key={index}
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    )}

                    {/* Variants */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Variants ({image.variants.length}):</p>
                      <div className="flex flex-wrap gap-1">
                        {image.variants.map((variant) => (
                          <Badge
                            key={variant.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {variant.name} ({variant.width}×{variant.height})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {processedImages.length === 0 && !isProcessing && (
        <Card className="p-12 text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2 text-white">No images processed yet</h3>
          <p className="text-muted-foreground mb-4">
            Upload images to start the optimization process
          </p>
          <label
            htmlFor="image-upload"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-accent text-black hover:bg-accent/90 cursor-pointer"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Images
          </label>
        </Card>
      )}
    </div>
  );
};





