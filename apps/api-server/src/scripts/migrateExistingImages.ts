import { databaseService } from '../services/database';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/**
 * Migration script to backfill existing images from the old media system
 * This script should be run once after deploying the new image system
 */
async function migrateExistingImages() {
  try {
    logger.info('Starting image migration...');
    
    const pool = databaseService.getPool();
    if (!pool) {
      throw new Error('Database not available');
    }

    const client = await pool.connect();
    try {
      // Check if migration has already been run
      const migrationCheck = await client.query(
        'SELECT COUNT(*) FROM images WHERE file_key LIKE \'uploads/%\''
      );
      
      if (parseInt(migrationCheck.rows[0].count) > 0) {
        logger.info('Image migration already completed, skipping...');
        return;
      }

      // Get all existing uploads from the old system
      const uploadsDir = path.resolve(process.cwd(), 'storage', 'uploads');
      
      try {
        const files = await fs.readdir(uploadsDir);
        const imageFiles = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
        });

        logger.info(`Found ${imageFiles.length} existing image files to migrate`);

        let migratedCount = 0;
        let errorCount = 0;

        for (const file of imageFiles) {
          try {
            const filePath = path.join(uploadsDir, file);
            const stats = await fs.stat(filePath);
            const fileBuffer = await fs.readFile(filePath);
            
            // Determine mime type from extension
            const ext = path.extname(file).toLowerCase();
            const mimeMap: Record<string, string> = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.webp': 'image/webp',
              '.gif': 'image/gif'
            };
            const mime = mimeMap[ext] || 'image/jpeg';

            // Get image dimensions using sharp
            const metadata = await sharp(fileBuffer).metadata();
            
            if (!metadata.width || !metadata.height) {
              logger.warn(`Skipping ${file}: invalid image dimensions`);
              continue;
            }

            // Create new file key in the new format
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const uuid = generateUUID();
            const newFileKey = `shop/${year}/${month}/${uuid}${ext}`;

            // Create new directory structure
            const newDir = path.resolve(process.cwd(), 'storage', 'images', 'shop', year.toString(), month);
            await fs.mkdir(newDir, { recursive: true });

            // Copy file to new location
            const newFilePath = path.join(newDir, `${uuid}${ext}`);
            await fs.copyFile(filePath, newFilePath);

            // Generate variants (simplified for migration)
            try {
              const variants = await generateImageVariants(fileBuffer, mime, newFilePath);
              await Promise.all(variants);
            } catch (variantError) {
              logger.warn(`Failed to generate variants for ${file}:`, variantError);
            }

            // Insert into database
            await client.query(
              `INSERT INTO images (space, file_key, mime, width, height, size_bytes, alt, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                'shop', // Default to shop space
                newFileKey,
                mime,
                metadata.width,
                metadata.height,
                stats.size,
                '', // No alt text for migrated images
                new Date().toISOString()
              ]
            );

            migratedCount++;
            logger.info(`Migrated ${file} -> ${newFileKey}`);

          } catch (error) {
            errorCount++;
            logger.error(`Failed to migrate ${file}:`, error);
          }
        }

        logger.info(`Migration completed: ${migratedCount} images migrated, ${errorCount} errors`);

      } catch (dirError) {
        logger.info('No existing uploads directory found, skipping migration');
      }

    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Image migration failed:', error);
    throw error;
  }
}

async function generateImageVariants(originalBuffer: Buffer, mime: string, basePath: string): Promise<Promise<void>[]> {
  const ext = path.extname(basePath);
  const baseName = basePath.replace(ext, '');

  const variants = [
    // XL variant
    sharp(originalBuffer)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .toFile(`${baseName}_xl${ext}`),
    
    // MD variant
    sharp(originalBuffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .toFile(`${baseName}_md${ext}`),
    
    // SM variant
    sharp(originalBuffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .toFile(`${baseName}_sm${ext}`),
    
    // WebP variant
    sharp(originalBuffer)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(`${baseName}_xl.webp`)
  ];

  return variants;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateExistingImages()
    .then(() => {
      logger.info('Image migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Image migration failed:', error);
      process.exit(1);
    });
}

export { migrateExistingImages };

