import { test, expect } from '@playwright/test';

test.describe('Business OS Flow', () => {
  test('Product listing loads correctly from PostgreSQL', async ({ page }) => {
    await page.goto('http://localhost:5173/shop');

    // Wait for network request to complete and elements to be rendered
    await page.waitForSelector('.shop-card');

    const productCards = await page.locator('.shop-card').count();
    expect(productCards).toBe(6); // We know there are exactly 6 seeded products
  });

  test('Checkout form uses Business OS smart order', async ({ page }) => {
    await page.goto('http://localhost:5173/shop');
    await page.waitForSelector('.shop-card');

    // Add to cart and proceed to checkout
    await page.locator('.shop-card').first().locator('button', { hasText: 'Add to Cart' }).click();
    await page.locator('button:has-text("Checkout")').click();

    await expect(page).toHaveURL(/.*\/checkout/);

    // Business type UI should be present
    await expect(page.locator('text=Order Type')).toBeVisible();
    await expect(page.locator('text=Personal (B2C)')).toBeVisible();
    await expect(page.locator('text=Business (B2B)')).toBeVisible();

    // Verify smart order button is present, instead of Pay Now
    await expect(page.locator('button', { hasText: 'Generate Smart UPI Payment' })).toBeVisible();
  });

});

test.describe('Admin Flow', () => {
  test('Admin login works', async ({ page }) => {
    await page.goto('http://localhost:5173/admin');

    await expect(page.locator('h1', { hasText: 'Admin Login' })).toBeVisible();

    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Should see admin dashboard Business OS styling
    await expect(page.getByText('Spylt Admin')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Business OS')).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Recent Orders' })).toBeVisible();
  });
});
