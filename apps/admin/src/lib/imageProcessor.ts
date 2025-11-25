import { logger } from './logger';

export interface ImageVariant {
  id: string;
  name: string;
  width: number;
  height: number;
  quality: number;
  format: 'jpeg' | 'webp' | 'png';
  url: string;
  size: number;
}

export interface ProcessedImage {
  id: string;
  originalName: string;
  originalSize: number;
  originalFormat: string;
  variants: ImageVariant[];
  colorPalette: string[];
  metadata: {
    width: number;
    height: number;
    aspectRatio: number;
    dominantColor: string;
    isOptimized: boolean;
    processingTime: number;
  };
  cdnUrl: string;
  uploadedAt: string;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  generateVariants?: boolean;
  extractColors?: boolean;
  optimizeForWeb?: boolean;
  cdnUpload?: boolean;
}

class ImageProcessor {
  private readonly CDN_BASE_URL = process.env.VITE_CDN_URL || 'https://cdn.nebula.supply';
  private readonly API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';

  // 🎨 Default Variant Configurations
  private readonly VARIANT_CONFIGS = {
    thumbnail: { width: 150, height: 150, quality: 80, format: 'webp' as const },
    small: { width: 300, height: 300, quality: 85, format: 'webp' as const },
    medium: { width: 600, height: 600, quality: 90, format: 'webp' as const },
    large: { width: 1200, height: 1200, quality: 95, format: 'webp' as const },
    hero: { width: 1920, height: 1080, quality: 95, format: 'webp' as const },
    original: { width: 0, height: 0, quality: 100, format: 'jpeg' as const }
  };

  // 🔧 Process Image with Full Pipeline
  async processImage(
    file: File, 
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const startTime = performance.now();
    const id = this.generateId();
    
    try {
      logger.info('Starting image processing', { 
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type 
      });

      // 1. Validate file
      this.validateFile(file);

      // 2. Load image
      const imageData = await this.loadImage(file);
      
      // 3. Extract metadata
      const metadata = this.extractMetadata(imageData, file);
      
      // 4. Generate variants
      const variants = options.generateVariants !== false 
        ? await this.generateVariants(imageData, file, options)
        : [];

      // 5. Extract color palette
      const colorPalette = options.extractColors !== false 
        ? await this.extractColorPalette(imageData)
        : [];

      // 6. Upload to CDN
      const cdnUrl = options.cdnUpload !== false 
        ? await this.uploadToCDN(file, id)
        : URL.createObjectURL(file);

      // 7. Calculate processing time
      const processingTime = performance.now() - startTime;

      const processedImage: ProcessedImage = {
        id,
        originalName: file.name,
        originalSize: file.size,
        originalFormat: file.type,
        variants,
        colorPalette,
        metadata: {
          ...metadata,
          isOptimized: true,
          processingTime
        },
        cdnUrl,
        uploadedAt: new Date().toISOString()
      };

      logger.info('Image processing completed', {
        id,
        processingTime: `${processingTime.toFixed(2)}ms`,
        variantCount: variants.length,
        colorCount: colorPalette.length
      });

      return processedImage;
    } catch (error) {
      logger.error('Image processing failed', { id, error });
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🔍 Validate File
  private validateFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type. Allowed: ${allowedTypes.join(', ')}`);
    }
  }

  // 🖼️ Load Image Data
  private async loadImage(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // 📊 Extract Metadata
  private extractMetadata(imageData: ImageData, file: File) {
    const { width, height } = imageData;
    const aspectRatio = width / height;
    
    return {
      width,
      height,
      aspectRatio: Math.round(aspectRatio * 100) / 100
    };
  }

  // 🎨 Extract Color Palette
  private async extractColorPalette(imageData: ImageData): Promise<string[]> {
    const { data, width, height } = imageData;
    const colors = new Map<string, number>();
    
    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Skip transparent pixels
      if (a < 128) continue;
      
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      colors.set(hex, (colors.get(hex) || 0) + 1);
    }
    
    // Sort by frequency and return top 5
    return Array.from(colors.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([color]) => color);
  }

  // 🔄 Generate Image Variants
  private async generateVariants(
    imageData: ImageData, 
    file: File, 
    options: ImageProcessingOptions
  ): Promise<ImageVariant[]> {
    const variants: ImageVariant[] = [];
    
    for (const [variantName, config] of Object.entries(this.VARIANT_CONFIGS)) {
      if (variantName === 'original') continue;
      
      try {
        const variant = await this.createVariant(imageData, file, variantName, config, options);
        variants.push(variant);
      } catch (error) {
        logger.warn(`Failed to create variant ${variantName}`, { error });
      }
    }
    
    return variants;
  }

  // 🎯 Create Single Variant
  private async createVariant(
    imageData: ImageData,
    file: File,
    variantName: string,
    config: any,
    options: ImageProcessingOptions
  ): Promise<ImageVariant> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Calculate dimensions maintaining aspect ratio
    const { width: originalWidth, height: originalHeight } = imageData;
    const aspectRatio = originalWidth / originalHeight;
    
    let { width, height } = config;
    if (width === 0 || height === 0) {
      if (width === 0) width = height * aspectRatio;
      if (height === 0) height = width / aspectRatio;
    }
    
    // Ensure we don't upscale
    if (width > originalWidth) width = originalWidth;
    if (height > originalHeight) height = originalHeight;
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw resized image
    ctx.drawImage(
      await this.imageDataToImage(imageData),
      0, 0, originalWidth, originalHeight,
      0, 0, width, height
    );
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, `image/${config.format}`, config.quality / 100);
    });
    
    // Upload variant to CDN
    const variantId = this.generateId();
    const cdnUrl = await this.uploadVariantToCDN(blob, variantId, config.format);
    
    return {
      id: variantId,
      name: variantName,
      width: Math.round(width),
      height: Math.round(height),
      quality: config.quality,
      format: config.format,
      url: cdnUrl,
      size: blob.size
    };
  }

  // 🖼️ Convert ImageData to Image
  private async imageDataToImage(imageData: ImageData): Promise<HTMLImageElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = canvas.toDataURL();
    });
  }

  // ☁️ Upload to CDN
  private async uploadToCDN(file: File, id: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('id', id);
      formData.append('type', 'original');
      
      const response = await fetch(`${this.API_BASE_URL}/api/admin/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nebula_access_token') || 'dev-token'}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.url || `${this.CDN_BASE_URL}/images/${id}`;
    } catch (error) {
      logger.error('CDN upload failed', { error });
      // Fallback to object URL
      return URL.createObjectURL(file);
    }
  }

  // ☁️ Upload Variant to CDN
  private async uploadVariantToCDN(blob: Blob, id: string, format: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', blob, `variant.${format}`);
      formData.append('id', id);
      formData.append('type', 'variant');
      
      const response = await fetch(`${this.API_BASE_URL}/api/admin/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nebula_access_token') || 'dev-token'}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Variant upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.url || `${this.CDN_BASE_URL}/variants/${id}`;
    } catch (error) {
      logger.error('Variant CDN upload failed', { error });
      // Fallback to blob URL
      return URL.createObjectURL(blob);
    }
  }

  // 🆔 Generate Unique ID
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // 🔄 Batch Process Images
  async processBatch(
    files: File[], 
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    const errors: Error[] = [];
    
    logger.info('Starting batch image processing', { fileCount: files.length });
    
    for (const file of files) {
      try {
        const processed = await this.processImage(file, options);
        results.push(processed);
      } catch (error) {
        errors.push(error as Error);
        logger.error('Batch processing error', { fileName: file.name, error });
      }
    }
    
    logger.info('Batch processing completed', { 
      success: results.length, 
      errors: errors.length 
    });
    
    return results;
  }

  // 🎯 Get Optimal Variant
  getOptimalVariant(variants: ImageVariant[], targetWidth: number, targetHeight: number): ImageVariant | null {
    if (variants.length === 0) return null;
    
    // Find variant closest to target size
    let bestVariant = variants[0];
    let bestScore = Infinity;
    
    for (const variant of variants) {
      const widthDiff = Math.abs(variant.width - targetWidth);
      const heightDiff = Math.abs(variant.height - targetHeight);
      const score = widthDiff + heightDiff;
      
      if (score < bestScore) {
        bestScore = score;
        bestVariant = variant;
      }
    }
    
    return bestVariant;
  }

  // 📊 Get Processing Statistics
  getProcessingStats(processedImages: ProcessedImage[]) {
    const totalOriginalSize = processedImages.reduce((sum, img) => sum + img.originalSize, 0);
    const totalOptimizedSize = processedImages.reduce((sum, img) => 
      sum + img.variants.reduce((variantSum, variant) => variantSum + variant.size, 0), 0
    );
    
    return {
      imageCount: processedImages.length,
      totalOriginalSize,
      totalOptimizedSize,
      compressionRatio: totalOriginalSize > 0 ? (1 - totalOptimizedSize / totalOriginalSize) * 100 : 0,
      averageProcessingTime: processedImages.reduce((sum, img) => sum + img.metadata.processingTime, 0) / processedImages.length
    };
  }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();

// 🎯 React Hook for Image Processing
export const useImageProcessor = () => {
  const processImage = useCallback(async (
    file: File, 
    options?: ImageProcessingOptions
  ) => {
    return await imageProcessor.processImage(file, options);
  }, []);

  const processBatch = useCallback(async (
    files: File[], 
    options?: ImageProcessingOptions
  ) => {
    return await imageProcessor.processBatch(files, options);
  }, []);

  const getOptimalVariant = useCallback((
    variants: ImageVariant[], 
    targetWidth: number, 
    targetHeight: number
  ) => {
    return imageProcessor.getOptimalVariant(variants, targetWidth, targetHeight);
  }, []);

  return {
    processImage,
    processBatch,
    getOptimalVariant,
    getProcessingStats: imageProcessor.getProcessingStats.bind(imageProcessor)
  };
};





