# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flow.spec.ts >> E-commerce User Flow >> Order summary shows subtotal, GST, and grand total
- Location: e2e_tests/flow.spec.ts:84:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.shop-card') to be visible

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - navigation [ref=e5]:
    - link "navbar-logo" [ref=e6] [cursor=pointer]:
      - /url: /
      - img "navbar-logo" [ref=e7]
    - link "FIND STORES" [ref=e9] [cursor=pointer]:
      - /url: "#"
  - generic [ref=e11] [cursor=pointer]: 
  - generic [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]: EXPLORE FULL COLLECTION
      - generic [ref=e15]: EXPLORE FULL COLLECTION
      - generic [ref=e16]: EXPLORE FULL COLLECTION
      - generic [ref=e17]: EXPLORE FULL COLLECTION
      - generic [ref=e18]: EXPLORE FULL COLLECTION
      - generic [ref=e19]: EXPLORE FULL COLLECTION
    - paragraph [ref=e20]: Browse all our bold and delicious flavors, ready to fuel your next adventure. Discover your favorite today!
  - generic [ref=e24]:
    - generic [ref=e26]:
      - heading "What's" [level=1] [ref=e27]
      - heading "Everyone" [level=1] [ref=e28]
      - heading "Talking" [level=1] [ref=e29]
    - link "Explore All" [ref=e46] [cursor=pointer]:
      - /url: /shop
  - generic [ref=e48]:
    - heading "#CHUGRESPONSIBLY" [level=1] [ref=e51]:
      - generic [ref=e52]: "#"
      - generic [ref=e53]: C
      - generic [ref=e54]: H
      - generic [ref=e55]: U
      - generic [ref=e56]: G
      - generic [ref=e57]: R
      - generic [ref=e58]: E
      - generic [ref=e59]: S
      - generic [ref=e60]: P
      - generic [ref=e61]: O
      - generic [ref=e62]: "N"
      - generic [ref=e63]: S
      - generic [ref=e64]: I
      - generic [ref=e65]: B
      - generic [ref=e66]: L
      - generic [ref=e67]: "Y"
    - generic [ref=e69]:
      - img "yt" [ref=e71] [cursor=pointer]
      - img "yt" [ref=e73] [cursor=pointer]
      - img "yt" [ref=e75] [cursor=pointer]
    - generic [ref=e76]:
      - generic [ref=e77]:
        - paragraph [ref=e79]: SPYLT Flavors
        - generic [ref=e80]:
          - paragraph [ref=e81]: Chug Club
          - paragraph [ref=e82]: Student Marketing
          - paragraph [ref=e83]: Dairy Dealers
        - generic [ref=e84]:
          - paragraph [ref=e85]: Company
          - paragraph [ref=e86]: Contacts
          - paragraph [ref=e87]: Tasty Talk
      - generic [ref=e88]:
        - paragraph [ref=e89]: Get Exclusive Early Access and Stay Informed About Product Updates, Events, and More!
        - generic [ref=e90]:
          - textbox "Enter your email" [ref=e91]
          - img "arrow" [ref=e92]
    - generic [ref=e93]:
      - paragraph [ref=e94]: Copyright © 2025 Spylt - All Rights Reserved
      - generic [ref=e95]:
        - paragraph [ref=e96]: Privacy Policy
        - paragraph [ref=e97]: Terms of Service
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   |
  3   | test.describe('E-commerce User Flow', () => {
  4   |   test('Product listing loads correctly', async ({ page }) => {
  5   |     await page.goto('http://localhost:5173/shop');
  6   |
  7   |     // Wait for network request to complete and elements to be rendered
  8   |     await page.waitForSelector('.shop-card');
  9   |
  10  |     const productCards = await page.locator('.shop-card').count();
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
> 86  |     await page.waitForSelector('.shop-card');
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
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
  111 |     await expect(page.getByText('Admin Panel')).toBeVisible({ timeout: 10000 });
  112 |     await expect(page.locator('h2', { hasText: 'Recent Orders' })).toBeVisible();
  113 |   });
  114 | });
  115 |
```