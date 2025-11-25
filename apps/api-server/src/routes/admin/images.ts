import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { adminOnly } from '../../middleware/auth';
import { imageService } from '../../services/imageService';
import { logger } from '../../utils/logger';

const router = Router();

// Rate limiting for admin operations
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for admin
  message: {
    error: 'Too many admin requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost in development
    return process.env.NODE_ENV === 'development' && 
           (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1');
  }
});

// Apply rate limiting to all admin routes
router.use(adminRateLimit);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
    files: 10 // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

// POST /api/admin/images - Upload images
router.post('/', [
  body('space').isIn(['shop', 'drops']),
  body('alt').optional().isString()
], adminOnly, upload.array('files', 10), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: errors.array() 
      });
    }

    const { space, alt = '' } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const images = [];
    const uploadErrors: Array<{ file: string; error: string }> = [];

    // Process each file
    for (const file of files) {
      try {
        const image = await imageService.createImage({
          space,
          file: file.buffer,
          mime: file.mimetype,
          alt,
          preferredName: file.originalname
        });
        images.push(image);
      } catch (error) {
        logger.error('Failed to process image', { 
          filename: file.originalname, 
          error: error instanceof Error ? error.message : String(error) 
        } as any);
        uploadErrors.push({
          file: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        images,
        errors: uploadErrors.length > 0 ? uploadErrors : undefined
      },
      message: `Successfully uploaded ${images.length} image(s)`
    });
  } catch (error) {
    logger.error('Error uploading images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/images - List images
router.get('/', [
  query('space').isIn(['shop', 'drops']),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], adminOnly, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid query parameters', 
        details: errors.array() 
      });
    }

    const { space, search, page = 1, limit = 20 } = req.query;

    const result = await imageService.getImages({
      space: space as 'shop' | 'drops',
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: {
        images: result.images.map(image => ({
          ...image,
          publicUrl: imageService.getPublicUrl(image.fileKey),
          variants: [
            {
              size: 'original' as const,
              format: 'original' as const,
              url: imageService.getPublicUrl(image.fileKey),
              width: image.width,
              height: image.height
            },
            {
              size: 'xl' as const,
              format: 'webp' as const,
              url: imageService.getPublicUrl(image.fileKey.replace(/\.[^.]+$/, '_xl.webp')),
              width: Math.min(image.width, 1600),
              height: Math.min(image.height, 1600)
            }
          ]
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          totalPages: result.totalPages
        }
      }
    });
  } catch (error) {
    logger.error('Error listing images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/images/:id - Get single image
router.get('/:id', [
  param('id').isString().notEmpty()
], adminOnly, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid image ID', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const image = await imageService.getImageById(id);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({
      success: true,
      data: {
        ...image,
        publicUrl: imageService.getPublicUrl(image.fileKey),
        variants: [
          {
            size: 'original' as const,
            format: 'original' as const,
            url: imageService.getPublicUrl(image.fileKey),
            width: image.width,
            height: image.height
          },
          {
            size: 'xl' as const,
            format: 'webp' as const,
            url: imageService.getPublicUrl(image.fileKey.replace(/\.[^.]+$/, '_xl.webp')),
            width: Math.min(image.width, 1600),
            height: Math.min(image.height, 1600)
          }
        ]
      }
    });
  } catch (error) {
    logger.error('Error getting image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/images/:id - Update image
router.patch('/:id', [
  param('id').isString().notEmpty(),
  body('alt').optional().isString()
], adminOnly as any, upload.single('file'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { alt } = req.body;
    const file = req.file;

    const updates: { alt?: string; replaceFile?: { file: Buffer; mime: string } } = {};
    
    if (alt !== undefined) {
      updates.alt = alt;
    }
    
    if (file) {
      updates.replaceFile = {
        file: file.buffer,
        mime: file.mimetype
      };
    }

    const image = await imageService.updateImage(id, updates);

    res.json({
      success: true,
      data: {
        ...image,
        publicUrl: imageService.getPublicUrl(image.fileKey),
        variants: [
          {
            size: 'original' as const,
            format: 'original' as const,
            url: imageService.getPublicUrl(image.fileKey),
            width: image.width,
            height: image.height
          },
          {
            size: 'xl' as const,
            format: 'webp' as const,
            url: imageService.getPublicUrl(image.fileKey.replace(/\.[^.]+$/, '_xl.webp')),
            width: Math.min(image.width, 1600),
            height: Math.min(image.height, 1600)
          }
        ]
      },
      message: 'Image updated successfully'
    });
  } catch (error) {
    logger.error('Error updating image:', error);
    if (error instanceof Error && error.message === 'Image not found') {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/images/:id - Delete image
router.delete('/:id', [
  param('id').isString().notEmpty()
], adminOnly, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid image ID', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    await imageService.deleteImage(id);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting image:', error);
    if (error instanceof Error && error.message === 'Image not found') {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/products/:id/images - Link images to product
router.post('/products/:id', [
  param('id').isString().notEmpty(),
  body('imageIds').isArray({ min: 1 }),
  body('imageIds.*').isString().notEmpty(),
  body('insertAt').optional().isInt({ min: 0 })
], adminOnly, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: errors.array() 
      });
    }

    const { id: productId } = req.params;
    const { imageIds, insertAt } = req.body;

    await imageService.linkProductImages(productId, imageIds, insertAt);

    res.json({
      success: true,
      message: 'Images linked to product successfully'
    });
  } catch (error) {
    logger.error('Error linking product images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/products/:id/images/reorder - Reorder product images
router.patch('/products/:id/reorder', [
  param('id').isString().notEmpty(),
  body('orderedImageIds').isArray({ min: 1 }),
  body('orderedImageIds.*').isString().notEmpty(),
  body('coverId').optional().isString()
], adminOnly, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: errors.array() 
      });
    }

    const { id: productId } = req.params;
    const { orderedImageIds, coverId } = req.body;

    await imageService.reorderProductImages(productId, orderedImageIds, coverId);

    res.json({
      success: true,
      message: 'Product images reordered successfully'
    });
  } catch (error) {
    logger.error('Error reordering product images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/drops/:id/images - Link images to drop
router.post('/drops/:id', [
  param('id').isString().notEmpty(),
  body('imageIds').isArray({ min: 1 }),
  body('imageIds.*').isString().notEmpty()
], adminOnly, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: errors.array() 
      });
    }

    const { id: dropId } = req.params;
    const { imageIds } = req.body;

    await imageService.linkDropImages(dropId, imageIds);

    res.json({
      success: true,
      message: 'Images linked to drop successfully'
    });
  } catch (error) {
    logger.error('Error linking drop images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/drops/:id/images/reorder - Reorder drop images
router.patch('/drops/:id/reorder', [
  param('id').isString().notEmpty(),
  body('orderedImageIds').isArray({ min: 1 }),
  body('orderedImageIds.*').isString().notEmpty()
], adminOnly, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: errors.array() 
      });
    }

    const { id: dropId } = req.params;
    const { orderedImageIds } = req.body;

    await imageService.reorderDropImages(dropId, orderedImageIds);

    res.json({
      success: true,
      message: 'Drop images reordered successfully'
    });
  } catch (error) {
    logger.error('Error reordering drop images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

