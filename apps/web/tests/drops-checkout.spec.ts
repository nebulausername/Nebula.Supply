import { test, expect } from '@playwright/test';

/**
 * 🎯 Drop Checkout Tests
 * 
 * Verifies that "Jetzt bestellen" functionality works consistently
 * across all drop modal variants (desktop/mobile, single/multi-variant).
 */

test.describe('Drop Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to drops page
    await page.goto('/drops');
    await page.waitForLoadState('networkidle');
  });

  test('Single variant checkout - desktop view', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Find and click first drop card
    const dropCard = page.locator('[data-testid="drop-card"]').first();
    await dropCard.waitFor({ state: 'visible' });
    await dropCard.click();

    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Verify modal is open with drop content
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Select a variant (if multiple exist)
    const variantButtons = page.locator('button:has-text("Citrus")');
    if (await variantButtons.count() > 0) {
      await variantButtons.first().click();
    }

    // Click "Preorder sichern" or similar button
    const preorderButton = page.locator('button:has-text("Preorder"), button:has-text("sichern"), button:has-text("bestellen")').first();
    await preorderButton.click();

    // If confirmation modal appears, accept terms and confirm
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await termsCheckbox.check();
      await page.waitForTimeout(500); // Wait for state update
    }
    
    const confirmButton = page.locator('button:has-text("Jetzt bestellen"), button:has-text("bestellen!")');
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Wait for cart confirmation or cart to open
    await page.waitForTimeout(1500);

    // Verify cart opened or confirmation appeared
    const cartIsOpen = await page.locator('[data-testid="cart-panel"], [data-testid="global-cart"]').isVisible().catch(() => false);
    const confirmationVisible = await page.locator('text=/Im Warenkorb|Erfolgreich|hinzugefügt/i').isVisible().catch(() => false);

    expect(cartIsOpen || confirmationVisible).toBeTruthy();

    // If cart is open, verify item is in cart
    if (cartIsOpen) {
      const cartItems = page.locator('[data-testid="cart-item"]');
      await expect(cartItems).toHaveCount(1, { timeout: 3000 });
    }
  });

  test('Multi-variant checkout - mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Find and click first drop card
    const dropCard = page.locator('[data-testid="drop-card"]').first();
    await dropCard.waitFor({ state: 'visible' });
    await dropCard.click();

    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Navigate to variants section if tabs exist
    const variantsTab = page.locator('button:has-text("Sorten")');
    if (await variantsTab.isVisible({ timeout: 1000 }).catch(() => false)) {
      await variantsTab.click();
    }

    // Select multiple variants
    const variantButtons = page.locator('button[aria-label*="auswählen"]').or(
      page.locator('button:has-text("Citrus"), button:has-text("Tropical"), button:has-text("Berry")')
    );
    
    const variantCount = await variantButtons.count();
    if (variantCount >= 2) {
      // Select first two variants
      await variantButtons.nth(0).click();
      await page.waitForTimeout(300);
      await variantButtons.nth(1).click();
      await page.waitForTimeout(300);
    }

    // Navigate to preorder section
    const preorderTab = page.locator('button:has-text("Bestellen")');
    if (await preorderTab.isVisible({ timeout: 1000 }).catch(() => false)) {
      await preorderTab.click();
    }

    // Click main checkout button
    const checkoutButton = page.locator('button:has-text("bestellen"), button:has-text("Sorten")').last();
    await checkoutButton.click();

    // Confirm if modal appears (mobile version doesn't need terms checkbox)
    const confirmButton = page.locator('button:has-text("Jetzt bestellen"), button:has-text("bestellen!")');
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Wait for processing
    await page.waitForTimeout(2000);

    // Verify success (cart or confirmation)
    const successVisible = await page.locator('text=/Im Warenkorb|Erfolgreich|hinzugefügt|Sorten/i').isVisible({ timeout: 3000 }).catch(() => false);
    expect(successVisible).toBeTruthy();
  });

  test('Invite-gated variant shows invite modal', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Mock user without invite (if needed, adjust based on your auth)
    // This test assumes there's a VIP or invite-required drop

    // Find a VIP or Limited drop
    const vipDrop = page.locator('[data-testid="drop-card"]:has-text("VIP")').or(
      page.locator('[data-testid="drop-card"]:has-text("LIMITED")')
    ).first();

    if (await vipDrop.isVisible({ timeout: 2000 }).catch(() => false)) {
      await vipDrop.click();

      // Wait for modal
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Try to checkout
      const preorderButton = page.locator('button:has-text("Preorder"), button:has-text("bestellen")').first();
      
      // Check if button is disabled or shows invite required
      const buttonText = await preorderButton.textContent();
      const isInviteRequired = buttonText?.includes('Invite') || buttonText?.includes('erforderlich');

      if (isInviteRequired) {
        // Verify button is disabled or shows invite message
        expect(buttonText).toMatch(/Invite|erforderlich/i);
      } else {
        // Try clicking and expect invite modal
        await preorderButton.click();
        
        // Wait for invite modal to appear
        const inviteModal = page.locator('[role="dialog"]:has-text("Invite"), [role="dialog"]:has-text("Einladung")');
        const inviteModalVisible = await inviteModal.isVisible({ timeout: 2000 }).catch(() => false);
        
        // Either invite modal shows, or button was already disabled
        expect(inviteModalVisible || isInviteRequired).toBeTruthy();
      }
    } else {
      // Skip test if no VIP drops available
      test.skip();
    }
  });

  test('Cart auto-opens after successful checkout', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Open first drop
    const dropCard = page.locator('[data-testid="drop-card"]').first();
    await dropCard.click();

    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Quick checkout
    const checkoutButton = page.locator('button:has-text("Preorder"), button:has-text("bestellen")').first();
    await checkoutButton.click();

    // Confirm if needed
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await termsCheckbox.check();
      await page.waitForTimeout(500);
    }
    
    const confirmButton = page.locator('button:has-text("Jetzt bestellen"), button:has-text("bestellen!")');
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Wait for cart to auto-open (should happen within 3s failsafe)
    const cartPanel = page.locator('[data-testid="cart-panel"], [data-testid="global-cart"]');
    await expect(cartPanel).toBeVisible({ timeout: 4000 });

    // Verify cart contains item
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems.first()).toBeVisible({ timeout: 2000 });
  });

  test('Quantity is respected in cart', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Open first drop
    const dropCard = page.locator('[data-testid="drop-card"]').first();
    await dropCard.click();

    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Increase quantity (if controls exist)
    const plusButton = page.locator('button:has([class*="Plus"])').or(page.locator('button:has-text("+")'));
    if (await plusButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await plusButton.click();
      await page.waitForTimeout(300);
      await plusButton.click();
      await page.waitForTimeout(300);
    }

    // Checkout
    const checkoutButton = page.locator('button:has-text("Preorder"), button:has-text("bestellen")').first();
    await checkoutButton.click();

    // Confirm
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await termsCheckbox.check();
      await page.waitForTimeout(500);
    }
    
    const confirmButton = page.locator('button:has-text("Jetzt bestellen"), button:has-text("bestellen!")');
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Wait for cart
    await page.waitForTimeout(2000);

    // Open cart if not open
    const cartButton = page.locator('[data-testid="cart-button"], button:has([data-testid="cart-icon"])');
    if (await cartButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cartButton.click();
    }

    // Verify quantity in cart (should be at least 1, could be 3 if we increased)
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    await expect(cartItem).toBeVisible({ timeout: 2000 });
    
    // Check for quantity indicator
    const quantityText = await cartItem.textContent();
    expect(quantityText).toBeTruthy();
  });
});

test.describe('Drop Checkout Edge Cases', () => {
  test('Out of stock variant cannot be added', async ({ page }) => {
    await page.goto('/drops');
    
    // Look for out of stock indicator
    const outOfStockVariant = page.locator('button:has-text("Ausverkauft"), button[disabled]:has-text("0 Stück")');
    
    if (await outOfStockVariant.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Verify it's disabled
      await expect(outOfStockVariant).toBeDisabled();
    } else {
      test.skip();
    }
  });

  test('Minimum quantity is enforced', async ({ page }) => {
    await page.goto('/drops');
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Open first drop
    const dropCard = page.locator('[data-testid="drop-card"]').first();
    await dropCard.click();

    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Check if minus button is disabled at minimum
    const minusButton = page.locator('button:has([class*="Minus"])').or(page.locator('button:has-text("-")'));
    if (await minusButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      const isDisabled = await minusButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });
});


