import { imageService } from '../services/imageService';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

/**
 * Test script to verify the image system is working correctly
 */
async function testImageSystem() {
  try {
    logger.info('Testing image system...');

    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // bit depth, color type, etc.
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // image data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
    ]);

    // Test 1: Create image
    logger.info('Test 1: Creating test image...');
    const image = await imageService.createImage({
      space: 'shop',
      file: testImageBuffer,
      mime: 'image/png',
      alt: 'Test image'
    });
    logger.info('✓ Image created successfully:', { id: image.id, fileKey: image.fileKey });

    // Test 2: Get image by ID
    logger.info('Test 2: Retrieving image by ID...');
    const retrievedImage = await imageService.getImageById(image.id);
    if (!retrievedImage) {
      throw new Error('Failed to retrieve image');
    }
    logger.info('✓ Image retrieved successfully');

    // Test 3: List images
    logger.info('Test 3: Listing images...');
    const imagesList = await imageService.getImages({
      space: 'shop',
      page: 1,
      limit: 10
    });
    logger.info('✓ Images listed successfully:', { count: imagesList.images.length });

    // Test 4: Update image
    logger.info('Test 4: Updating image...');
    const updatedImage = await imageService.updateImage(image.id, {
      alt: 'Updated test image'
    });
    if (updatedImage.alt !== 'Updated test image') {
      throw new Error('Image update failed');
    }
    logger.info('✓ Image updated successfully');

    // Test 5: Get public URL
    logger.info('Test 5: Getting public URL...');
    const publicUrl = imageService.getPublicUrl(image.fileKey);
    logger.info('✓ Public URL generated:', { url: publicUrl });

    // Test 6: Delete image
    logger.info('Test 6: Deleting image...');
    await imageService.deleteImage(image.id);
    logger.info('✓ Image deleted successfully');

    // Test 7: Verify deletion
    logger.info('Test 7: Verifying deletion...');
    const deletedImage = await imageService.getImageById(image.id);
    if (deletedImage) {
      throw new Error('Image was not deleted properly');
    }
    logger.info('✓ Image deletion verified');

    logger.info('🎉 All image system tests passed!');

  } catch (error) {
    logger.error('❌ Image system test failed:', error);
    throw error;
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testImageSystem()
    .then(() => {
      logger.info('Image system test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Image system test failed:', error);
      process.exit(1);
    });
}

export { testImageSystem };




