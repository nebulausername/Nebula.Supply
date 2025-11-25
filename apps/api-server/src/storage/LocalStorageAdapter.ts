import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { StorageProvider, ImageVariants, ImageMetadata } from './StorageProvider';
import { logger } from '../utils/logger';

export class LocalStorageAdapter implements StorageProvider {
  private baseDir: string;
  private publicUrl: string;

  constructor(baseDir: string = 'storage/images', publicUrl: string = '/files') {
    this.baseDir = baseDir;
    this.publicUrl = publicUrl;
  }

  async upload(params: { 
    space: 'shop' | 'drops'; 
    file: Buffer; 
    mime: string; 
    preferredName?: string 
  }): Promise<{ fileKey: string }> {
    const { space, file, mime, preferredName } = params;
    
    // Generate file key with date structure
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uuid = this.generateUUID();
    const ext = this.getExtensionFromMime(mime);
    
    const fileKey = `${space}/${year}/${month}/${uuid}${ext}`;
    const fullPath = path.resolve(this.baseDir, fileKey);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    // Process image variants
    const variants = await this.processImageVariants(file, mime);
    
    // Save original
    await fs.writeFile(fullPath, variants.original);
    
    // Save variants
    const variantDir = path.dirname(fullPath);
    const baseName = path.basename(fullPath, ext);
    
    await Promise.all([
      fs.writeFile(path.join(variantDir, `${baseName}_xl${ext}`), variants.xl),
      fs.writeFile(path.join(variantDir, `${baseName}_md${ext}`), variants.md),
      fs.writeFile(path.join(variantDir, `${baseName}_sm${ext}`), variants.sm),
      fs.writeFile(path.join(variantDir, `${baseName}_xl.webp`), variants.webp),
      variants.avif && fs.writeFile(path.join(variantDir, `${baseName}_xl.avif`), variants.avif)
    ].filter(Boolean));
    
    logger.info('Image uploaded successfully', { fileKey, space });
    
    return { fileKey };
  }

  async delete(fileKey: string): Promise<void> {
    const fullPath = path.resolve(this.baseDir, fileKey);
    const variantDir = path.dirname(fullPath);
    const baseName = path.basename(fullPath, path.extname(fullPath));
    const ext = path.extname(fullPath);
    
    // Delete original and all variants
    const filesToDelete = [
      fullPath,
      path.join(variantDir, `${baseName}_xl${ext}`),
      path.join(variantDir, `${baseName}_md${ext}`),
      path.join(variantDir, `${baseName}_sm${ext}`),
      path.join(variantDir, `${baseName}_xl.webp`),
      path.join(variantDir, `${baseName}_xl.avif`)
    ];
    
    await Promise.allSettled(
      filesToDelete.map(file => fs.unlink(file).catch(() => {}))
    );
    
    logger.info('Image deleted successfully', { fileKey });
  }

  getPublicUrl(fileKey: string): string {
    return `${this.publicUrl}/${fileKey}`;
  }

  private async processImageVariants(buffer: Buffer, mime: string): Promise<ImageVariants> {
    const sharpInstance = sharp(buffer);
    const metadata = await sharpInstance.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image dimensions');
    }

    // Generate variants
    const [original, xl, md, sm, webp, avif] = await Promise.all([
      sharpInstance.clone().toBuffer(),
      sharpInstance.clone().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).toBuffer(),
      sharpInstance.clone().resize(800, 800, { fit: 'inside', withoutEnlargement: true }).toBuffer(),
      sharpInstance.clone().resize(400, 400, { fit: 'inside', withoutEnlargement: true }).toBuffer(),
      sharpInstance.clone().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(),
      this.supportsAVIF() ? sharpInstance.clone().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).avif({ quality: 80 }).toBuffer() : undefined
    ]);

    return {
      original,
      xl,
      md,
      sm,
      webp,
      avif
    };
  }

  private getExtensionFromMime(mime: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/avif': '.avif',
      'image/gif': '.gif'
    };
    return mimeMap[mime] || '.jpg';
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private supportsAVIF(): boolean {
    try {
      sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } }).avif();
      return true;
    } catch {
      return false;
    }
  }
}




