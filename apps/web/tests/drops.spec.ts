import { test, expect } from "@playwright/test";

test("displays drops with call to action", async ({ page }) => {
  await page.goto("/");
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check for drops section heading (might be "Hot Drops" or similar)
  const dropsHeading = page.locator('h2, h3').filter({ hasText: /drops/i }).first();
  await expect(dropsHeading).toBeVisible({ timeout: 10000 });
  
  // Check for "Drops entdecken" button which is the main CTA
  const dropsCTA = page.locator('text=Drops entdecken').first();
  await expect(dropsCTA).toBeVisible({ timeout: 10000 });
});
