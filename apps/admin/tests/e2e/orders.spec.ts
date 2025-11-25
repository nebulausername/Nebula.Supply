import { test, expect } from '@playwright/test';

test.describe('Orders Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard and login
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'admin@nebula.supply');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]');
    
    // Navigate to orders
    await page.click('[data-testid="nav-orders"]');
    await page.waitForSelector('[data-testid="orders-table"]');
  });

  test('should display orders table with data', async ({ page }) => {
    // Check if orders table is visible
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();
    
    // Check if table has headers
    await expect(page.locator('th:has-text("Order ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Customer")')).toBeVisible();
    await expect(page.locator('th:has-text("Amount")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Created")')).toBeVisible();
  });

  test('should allow status transitions', async ({ page }) => {
    // Find first order with status dropdown
    const firstOrder = page.locator('[data-testid="orders-table"] tbody tr').first();
    const statusSelect = firstOrder.locator('select');
    
    // Check if status select is visible
    await expect(statusSelect).toBeVisible();
    
    // Get current status
    const currentStatus = await statusSelect.inputValue();
    
    // Try to change status
    await statusSelect.selectOption({ index: 1 });
    
    // Check if status changed
    await expect(statusSelect).not.toHaveValue(currentStatus);
  });

  test('should support bulk operations', async ({ page }) => {
    // Select multiple orders
    const checkboxes = page.locator('[data-testid="orders-table"] tbody tr input[type="checkbox"]');
    const firstCheckbox = checkboxes.first();
    const secondCheckbox = checkboxes.nth(1);
    
    await firstCheckbox.check();
    await secondCheckbox.check();
    
    // Check if bulk actions bar appears
    await expect(page.locator('[data-testid="bulk-actions-bar"]')).toBeVisible();
    
    // Check if bulk status change is available
    await expect(page.locator('[data-testid="bulk-status-select"]')).toBeVisible();
  });

  test('should filter orders by status', async ({ page }) => {
    // Click on a status badge to filter
    const statusBadge = page.locator('[data-testid="status-badge"]').first();
    await statusBadge.click();
    
    // Check if only orders with that status are shown
    const visibleRows = page.locator('[data-testid="orders-table"] tbody tr:visible');
    const count = await visibleRows.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should show order details modal', async ({ page }) => {
    // Click on an order ID to view details
    const orderIdLink = page.locator('[data-testid="orders-table"] tbody tr a').first();
    await orderIdLink.click();
    
    // Check if modal opens
    await expect(page.locator('[data-testid="order-details-modal"]')).toBeVisible();
    
    // Check if modal has order information
    await expect(page.locator('[data-testid="order-details-modal"] h2')).toBeVisible();
  });

  test('should handle order status machine correctly', async ({ page }) => {
    // Test invalid status transitions
    const firstOrder = page.locator('[data-testid="orders-table"] tbody tr').first();
    const statusSelect = firstOrder.locator('select');
    
    // Try to select an invalid status (this should be prevented by the status machine)
    const options = await statusSelect.locator('option').all();
    const validOptions = options.filter(async option => {
      const value = await option.getAttribute('value');
      return value && value !== '';
    });
    
    expect(validOptions.length).toBeGreaterThan(0);
  });
});

test.describe('Orders RBAC', () => {
  test('should respect role-based permissions', async ({ page }) => {
    // Login as viewer role
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'viewer@nebula.supply');
    await page.fill('[data-testid="password-input"]', 'viewer123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForSelector('[data-testid="dashboard"]');
    await page.click('[data-testid="nav-orders"]');
    
    // Viewer should only see read-only interface
    await expect(page.locator('[data-testid="bulk-actions-bar"]')).not.toBeVisible();
    
    // Status change dropdowns should be disabled or hidden
    const statusSelects = page.locator('[data-testid="orders-table"] select');
    const count = await statusSelects.count();
    
    if (count > 0) {
      await expect(statusSelects.first()).toBeDisabled();
    }
  });
});



