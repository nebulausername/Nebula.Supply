import { Pool } from 'pg';
import sharp from 'sharp';
import { databaseService } from './database';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter';
import { StorageProvider } from '../storage/StorageProvider';
import { Image, ImageSpace, ProductImage, DropImage } from '@nebula/shared';
import { logger } from '../utils/logger';

export class ImageService {
  private storage: StorageProvider;

  constructor() {
    this.storage = new LocalStorageAdapter();
  }

  async createImage(params: {
    space: ImageSpace;
    file: Buffer;
    mime: string;
    alt?: string;
    preferredName?: string;
  }): Promise<Image> {
    const { space, file, mime, alt = '', preferredName } = params;

    // Validate mime type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (!allowedMimes.includes(mime)) {
      throw new Error(`Unsupported mime type: ${mime}`);
    }

    // Validate file size (15MB max)
    const maxSize = 15 * 1024 * 1024;
    if (file.length > maxSize) {
      throw new Error('File too large. Maximum size is 15MB');
    }

    // Get image metadata
    const metadata = await sharp(file).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image dimensions');
    }

    // Upload to storage
    const { fileKey } = await this.storage.upload({
      space,
      file,
      mime,
      preferredName
    });

    // Get dominant color
    const dominantColor = await this.getDominantColor(file);

    // Save to database
    const pool = databaseService.getPool();
    if (!pool) {
      throw new Error('Database not available');
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO images (space, file_key, mime, width, height, size_bytes, alt, dominant_color)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, created_at`,
        [space, fileKey, mime, metadata.width, metadata.height, file.length, alt, dominantColor]
      );

      const image: Image = {
        id: result.rows[0].id.toString(),
        space,
        fileKey,
        mime,
        width: metadata.width,
        height: metadata.height,
        sizeBytes: file.length,
        alt,
        dominantColor,
        createdAt: result.rows[0].created_at.toISOString()
      };

      logger.info('Image created successfully', { imageId: image.id, space });
      return image;
    } finally {
      client.release();
    }
  }

  async getImages(params: {
    space: ImageSpace;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ images: Image[]; total: number; totalPages: number }> {
    const { space, search, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const pool = databaseService.getPool();
    if (!pool) {
      throw new Error('Database not available');
    }

    const client = await pool.connect();
    try {
      let whereClause = 'WHERE space = $1';
      const queryParams: any[] = [space];
      let paramIndex = 2;

      if (search) {
        whereClause += ` AND (alt ILIKE $${paramIndex} OR file_key ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*) FROM images ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].count);

      // Get images
      const result = await client.query(
        `SELECT id, space, file_key, mime, width, height, size_bytes, alt, dominant_color, created_at, updated_at
         FROM images ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      const images: Image[] = result.rows.map(row => ({
        id: row.id.toString(),
        space: row.space,
        fileKey: row.file_key,
        mime: row.mime,
        width: row.width,
        height: row.height,
        sizeBytes: row.size_bytes,
        alt: row.alt,
        dominantColor: row.dominant_color,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at?.toISOString()
      }));

      return {
        images,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } finally {
      client.release();
    }
  }

  async getImageById(id: string): Promise<Image | null> {
    const pool = databaseService.getPool();
    if (!pool) {
      throw new Error('Database not available');
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, space, file_key, mime, width, height, size_bytes, alt, dominant_color, created_at, updated_at
         FROM images WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        space: row.space,
        fileKey: row.file_key,
        mime: row.mime,
        width: row.width,
        height: row.height,
        sizeBytes: row.size_bytes,
        alt: row.alt,
        dominantColor: row.dominant_color,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at?.toISOString()
      };
    } finally {
      client.release();
    }
  }

  async updateImage(id: string, updates: { alt?: string; replaceFile?: { file: Buffer; mime: string } }): Promise<Image> {
    const pool = databaseService.getPool();
    if (!pool) {
      throw new Error('Database not available');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current image
      const currentResult = await client.query('SELECT * FROM images WHERE id = $1', [id]);
      if (currentResult.rows.length === 0) {
        throw new Error('Image not found');
      }

      const currentImage = currentResult.rows[0];
      let fileKey = currentImage.file_key;
      let mime = currentImage.mime;
      let width = currentImage.width;
      let height = currentImage.height;
      let sizeBytes = currentImage.size_bytes;

      // Replace file if provided
      if (updates.replaceFile) {
        // Delete old file
        await this.storage.delete(fileKey);

        // Upload new file
        const { fileKey: newFileKey } = await this.storage.upload({
          space: currentImage.space,
          file: updates.replaceFile.file,
          mime: updates.replaceFile.mime
        });

        // Get new metadata
        const metadata = await sharp(updates.replaceFile.file).metadata();
        
        fileKey = newFileKey;
        mime = updates.replaceFile.mime;
        width = metadata.width!;
        height = metadata.height!;
        sizeBytes = updates.replaceFile.file.length;
      }

      // Update database
      const result = await client.query(
        `UPDATE images 
         SET file_key = $1, mime = $2, width = $3, height = $4, size_bytes = $5, alt = $6, updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [fileKey, mime, width, height, sizeBytes, updates.alt || currentImage.alt, id]
      );

      await client.query('COMMIT');

      const row = result.rows[0];
      return {
        id: row.id.toString(),
        space: row.space,
        fileKey: row.file_key,
        mime: row.mime,
        width: row.width,
        height: row.height,
        sizeBytes: row.size_bytes,
        alt: row.alt,
        dominantColor: row.dominant_color,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at?.toISOString()
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteImage(id: string): Promise<void> {
    const pool = databaseService.getPool();
    if (!pool) {
      throw new Error('Database not available');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get image to delete file
      const result = await client.query('SELECT file_key FROM images WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        throw new Error('Image not found');
      }

      const fileKey = result.rows[0].file_key;

      // Delete from database (cascade will handle junction tables)
      await client.query('DELETE FROM images WHERE id = $1', [id]);

      // Delete file from storage
      await this.storage.delete(fileKey);

      await client.query('COMMIT');
      logger.info('Image deleted successfully', { imageId: id });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async linkProductImages(productId: string, imageIds: string[], insertAt?: number): Promise<void> {
    const pool = databaseService.getPool();
    if (!pool) {
      throw new Error('Database not available');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current max position
      const positionResult = await client.query(
        'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM product_images WHERE product_id = $1',
        [productId]
      );
      let nextPosition = positionResult.rows[0].next_position;

      if (insertAt !== undefined) {
        // Shift existing images
        await client.query(
          'UPDATE product_images SET position = position + $1 WHERE product_id = $2 AND position >= $3',
          [imageIds.length, productId, insertAt]
        );
        nextPosition = insertAt;
      }

      // Insert new links
      for (let i = 0; i < imageIds.length; i++) {
        await client.query(
          'INSERT INTO product_images (product_id, image_id, position) VALUES ($1, $2, $3)',
          [productId, imageIds[i], nextPosition + i]
        );
      }

      await client.query('COMMIT');
      logger.info('Product images linked successfully', { productId, imageIds });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async reorderProductImages(productId: string, orderedImageIds: string[], coverId?: string): Promise<void> {
    const pool = databaseService.getPool();
    if (!pool) {
      throw new Error('Database not available');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clear existing cover
      await client.query(
        'UPDATE product_images SET is_cover = FALSE WHERE product_id = $1',
        [productId]
      );

      // Update positions and cover
      for (let i = 0; i < orderedImageIds.length; i++) {
        await client.query(
          'UPDATE product_images SET position = $1, is_cover = $2 WHERE product_id = $3 AND image_id = $4',
          [i, coverId === orderedImageIds[i], productId, orderedImageIds[i]]
        );
      }

      await client.query('COMMIT');
      logger.info('Product images reordered successfully', { productId, orderedImageIds, coverId });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async linkDropImages(dropId: string, imageIds: string[]): Promise<void> {
    const pool = databaseService.getPool();
    if (!pool) {
      throw new Error('Database not available');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current max position
      const positionResult = await client.query(
        'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM drop_images WHERE drop_id = $1',
        [dropId]
      );
      const nextPosition = positionResult.rows[0].next_position;

      // Insert new links
      for (let i = 0; i < imageIds.length; i++) {
        await client.query(
          'INSERT INTO drop_images (drop_id, image_id, position) VALUES ($1, $2, $3)',
          [dropId, imageIds[i], nextPosition + i]
        );
      }

      await client.query('COMMIT');
      logger.info('Drop images linked successfully', { dropId, imageIds });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async reorderDropImages(dropId: string, orderedImageIds: string[]): Promise<void> {
    const pool = databaseService.getPool();
    if (!pool) {
      throw new Error('Database not available');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update positions
      for (let i = 0; i < orderedImageIds.length; i++) {
        await client.query(
          'UPDATE drop_images SET position = $1 WHERE drop_id = $2 AND image_id = $3',
          [i, dropId, orderedImageIds[i]]
        );
      }

      await client.query('COMMIT');
      logger.info('Drop images reordered successfully', { dropId, orderedImageIds });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  getPublicUrl(fileKey: string): string {
    return this.storage.getPublicUrl(fileKey);
  }

  private async getDominantColor(buffer: Buffer): Promise<string | undefined> {
    try {
      const { data, info } = await sharp(buffer)
        .resize(1, 1)
        .raw()
        .toBuffer({ resolveWithObject: true });

      if (info.channels >= 3) {
        const r = data[0];
        const g = data[1];
        const b = data[2];
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      }
    } catch (error) {
      logger.warn('Failed to extract dominant color', { error });
    }
    return undefined;
  }
}

export const imageService = new ImageService();

