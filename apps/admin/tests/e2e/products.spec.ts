import { test, expect } from '@playwright/test';

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'admin@nebula.supply');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForSelector('[data-testid="dashboard"]');
    await page.click('[data-testid="nav-products"]');
    await page.waitForSelector('[data-testid="products-table"]');
  });

  test('should display products table', async ({ page }) => {
    await expect(page.locator('[data-testid="products-table"]')).toBeVisible();
    await expect(page.locator('th:has-text("Product ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("SKU")')).toBeVisible();
    await expect(page.locator('th:has-text("Price")')).toBeVisible();
    await expect(page.locator('th:has-text("Inventory")')).toBeVisible();
  });

  test('should create new product', async ({ page }) => {
    await page.click('[data-testid="create-product-button"]');
    await page.waitForSelector('[data-testid="product-form"]');
    
    // Fill product form
    await page.fill('[data-testid="product-name"]', 'Test Product');
    await page.fill('[data-testid="product-sku"]', 'TEST-001');
    await page.fill('[data-testid="product-price"]', '29.99');
    await page.fill('[data-testid="product-description"]', 'Test product description');
    await page.fill('[data-testid="product-inventory"]', '100');
    
    // Submit form
    await page.click('[data-testid="save-product-button"]');
    
    // Check if product was created
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('text=Test Product')).toBeVisible();
  });

  test('should edit product variants', async ({ page }) => {
    // Click on a product to edit
    const firstProduct = page.locator('[data-testid="products-table"] tbody tr').first();
    await firstProduct.click();
    
    await page.waitForSelector('[data-testid="product-edit-form"]');
    
    // Navigate to variants tab
    await page.click('[data-testid="variants-tab"]');
    await page.waitForSelector('[data-testid="variants-matrix"]');
    
    // Add a new variant
    await page.click('[data-testid="add-variant-button"]');
    
    // Fill variant details
    await page.fill('[data-testid="variant-name"]', 'Color');
    await page.selectOption('[data-testid="variant-type"]', 'color');
    
    // Add variant options
    await page.click('[data-testid="add-option-button"]');
    await page.fill('[data-testid="option-label-0"]', 'Red');
    await page.fill('[data-testid="option-value-0"]', 'red');
    await page.fill('[data-testid="option-swatch-0"]', '#FF0000');
    
    // Save variant
    await page.click('[data-testid="save-variant-button"]');
    
    // Check if variant was saved
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });

  test('should update inventory optimistically', async ({ page }) => {
    // Find a product with inventory
    const inventoryInput = page.locator('[data-testid="inventory-input"]').first();
    await inventoryInput.click();
    
    const currentValue = await inventoryInput.inputValue();
    const newValue = (parseInt(currentValue) + 10).toString();
    
    // Update inventory
    await inventoryInput.fill(newValue);
    await inventoryInput.press('Enter');
    
    // Check if UI updates immediately (optimistic update)
    await expect(inventoryInput).toHaveValue(newValue);
    
    // Check for success toast
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });

  test('should handle inventory conflicts', async ({ page }) => {
    // Simulate a conflict by updating inventory in two tabs
    const inventoryInput = page.locator('[data-testid="inventory-input"]').first();
    await inventoryInput.click();
    
    // Update inventory
    await inventoryInput.fill('50');
    await inventoryInput.press('Enter');
    
    // Simulate conflict by updating the same field again quickly
    await inventoryInput.fill('60');
    await inventoryInput.press('Enter');
    
    // Check for conflict error
    await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
    await expect(page.locator('text=Concurrency Conflict')).toBeVisible();
  });

  test('should import products from CSV', async ({ page }) => {
    await page.click('[data-testid="import-products-button"]');
    await page.waitForSelector('[data-testid="import-modal"]');
    
    // Upload CSV file
    const fileInput = page.locator('[data-testid="csv-file-input"]');
    await fileInput.setInputFiles('tests/fixtures/products.csv');
    
    // Start import
    await page.click('[data-testid="start-import-button"]');
    
    // Check for import progress
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible();
    
    // Wait for completion
    await expect(page.locator('[data-testid="import-complete"]')).toBeVisible();
  });

  test('should export products to CSV', async ({ page }) => {
    await page.click('[data-testid="export-products-button"]');
    
    // Check if download starts
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('products');
  });
});

test.describe('Product Media Management', () => {
  test('should upload product images', async ({ page }) => {
    // Navigate to product media tab
    const firstProduct = page.locator('[data-testid="products-table"] tbody tr').first();
    await firstProduct.click();
    
    await page.waitForSelector('[data-testid="product-edit-form"]');
    await page.click('[data-testid="media-tab"]');
    await page.waitForSelector('[data-testid="media-manager"]');
    
    // Upload image
    const fileInput = page.locator('[data-testid="media-file-input"]');
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
    
    // Check upload progress
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    
    // Wait for completion
    await expect(page.locator('[data-testid="upload-complete"]')).toBeVisible();
    
    // Check if image appears in media grid
    await expect(page.locator('[data-testid="media-grid"] img')).toBeVisible();
  });

  test('should handle multiple file uploads', async ({ page }) => {
    await page.click('[data-testid="nav-products"]');
    const firstProduct = page.locator('[data-testid="products-table"] tbody tr').first();
    await firstProduct.click();
    
    await page.waitForSelector('[data-testid="product-edit-form"]');
    await page.click('[data-testid="media-tab"]');
    
    // Upload multiple files
    const fileInput = page.locator('[data-testid="media-file-input"]');
    await fileInput.setInputFiles([
      'tests/fixtures/test-image-1.jpg',
      'tests/fixtures/test-image-2.jpg',
      'tests/fixtures/test-image-3.jpg'
    ]);
    
    // Check that all uploads start
    await expect(page.locator('[data-testid="upload-progress"]')).toHaveCount(3);
    
    // Wait for all to complete
    await expect(page.locator('[data-testid="upload-complete"]')).toHaveCount(3);
  });

  test('should delete media files', async ({ page }) => {
    // Navigate to media tab
    const firstProduct = page.locator('[data-testid="products-table"] tbody tr').first();
    await firstProduct.click();
    
    await page.waitForSelector('[data-testid="product-edit-form"]');
    await page.click('[data-testid="media-tab"]');
    
    // Upload a file first
    const fileInput = page.locator('[data-testid="media-file-input"]');
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
    await expect(page.locator('[data-testid="upload-complete"]')).toBeVisible();
    
    // Delete the file
    const mediaItem = page.locator('[data-testid="media-grid"] > div').first();
    await mediaItem.hover();
    await page.click('[data-testid="delete-media-button"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Check if file is removed
    await expect(page.locator('[data-testid="media-grid"] img')).toHaveCount(0);
  });
});



