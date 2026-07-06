# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flow.spec.ts >> Admin Flow >> Admin login works
- Location: e2e_tests/flow.spec.ts:101:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Admin Panel')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Admin Panel')

```

```yaml
- heading "Admin Login" [level=1]
- text: Failed to fetch Username
- textbox: admin
- text: Password
- textbox: admin123
- button "Login"
```

# Test source

```ts
  11  |     expect(productCards).toBeGreaterThan(0);
  12  |   });
  13  |
  14  |   test('Product details show price and add to cart works', async ({ page }) => {
  15  |     await page.goto('http://localhost:5173/shop');
  16  |     await page.waitForSelector('.shop-card');
  17  |
  18  |     // Get the first product card
  19  |     const firstProduct = page.locator('.shop-card').first();
  20  |     await expect(firstProduct).toBeVisible();
  21  |
  22  |     // Check if Add to Cart button exists
  23  |     const addToCartBtn = firstProduct.locator('button', { hasText: 'Add to Cart' });
  24  |     await expect(addToCartBtn).toBeVisible();
  25  |
  26  |     // Click add to cart
  27  |     await addToCartBtn.click();
  28  |
  29  |     // Check if cart sidebar opened
  30  |     const cartSidebar = page.locator('h2', { hasText: 'Your Cart' });
  31  |     await expect(cartSidebar).toBeVisible();
  32  |
  33  |     // Verify item is in cart
  34  |     const cartItems = await page.locator('.ri-delete-bin-line').count();
  35  |     expect(cartItems).toBe(1);
  36  |   });
  37  |
  38  |   test('Cart quantity increase/decrease and total updates', async ({ page }) => {
  39  |     await page.goto('http://localhost:5173/shop');
  40  |     await page.waitForSelector('.shop-card');
  41  |
  42  |     // Add first product to cart
  43  |     await page.locator('.shop-card').first().locator('button', { hasText: 'Add to Cart' }).click();
  44  |
  45  |     // Wait for cart to open
  46  |     await expect(page.locator('h2', { hasText: 'Your Cart' })).toBeVisible();
  47  |
  48  |     // Get current quantity
  49  |     const qtyElement = page.locator('span.w-8.text-center.font-bold');
  50  |     await expect(qtyElement).toHaveText('1');
  51  |
  52  |     // Increase quantity
  53  |     await page.locator('button:has-text("+")').click();
  54  |     await expect(qtyElement).toHaveText('2');
  55  |
  56  |     // Decrease quantity
  57  |     await page.locator('button:has-text("-")').click();
  58  |     await expect(qtyElement).toHaveText('1');
  59  |
  60  |     // Verify total shows up
  61  |     await expect(page.locator('text=Subtotal')).toBeVisible();
  62  |     await expect(page.locator('button:has-text("Checkout")')).toBeVisible();
  63  |   });
  64  |
  65  |   test('Checkout form validation works', async ({ page }) => {
  66  |     await page.goto('http://localhost:5173/shop');
  67  |     await page.waitForSelector('.shop-card');
  68  |
  69  |     // Add to cart and proceed to checkout
  70  |     await page.locator('.shop-card').first().locator('button', { hasText: 'Add to Cart' }).click();
  71  |     await page.locator('button:has-text("Checkout")').click();
  72  |
  73  |     await expect(page).toHaveURL(/.*\/checkout/);
  74  |
  75  |     // Try to submit empty form
  76  |     await page.locator('button:has-text("Pay Now")').click();
  77  |
  78  |     // Verify validation errors
  79  |     // Validation check removed for test speed
  80  |     // Validation check removed for test speed
  81  |     // Validation check removed for test speed
  82  |   });
  83  |
  84  |   test('Order summary shows subtotal, GST, and grand total', async ({ page }) => {
  85  |     await page.goto('http://localhost:5173/shop');
  86  |     await page.waitForSelector('.shop-card');
  87  |
  88  |     // Add to cart and proceed to checkout
  89  |     await page.locator('.shop-card').first().locator('button', { hasText: 'Add to Cart' }).click();
  90  |     await page.locator('button:has-text("Checkout")').click();
  91  |
  92  |     // Verify Order Summary section
  93  |     await expect(page.locator('h2', { hasText: 'Order Summary' })).toBeVisible();
  94  |     await expect(page.locator('text=Subtotal')).toBeVisible();
  95  |     await expect(page.locator('text=GST Total')).toBeVisible();
  96  |     await expect(page.locator('text=Grand Total')).toBeVisible();
  97  |   });
  98  | });
  99  |
  100 | test.describe('Admin Flow', () => {
  101 |   test('Admin login works', async ({ page }) => {
  102 |     await page.goto('http://localhost:5173/admin');
  103 |
  104 |     await expect(page.locator('h1', { hasText: 'Admin Login' })).toBeVisible();
  105 |
  106 |     await page.fill('input[type="text"]', 'admin');
  107 |     await page.fill('input[type="password"]', 'admin123');
  108 |     await page.click('button[type="submit"]');
  109 |
  110 |     // Should see admin dashboard
> 111 |     await expect(page.getByText('Admin Panel')).toBeVisible({ timeout: 10000 });
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  112 |     await expect(page.locator('h2', { hasText: 'Recent Orders' })).toBeVisible();
  113 |   });
  114 | });
  115 |
```