import re

with open('e2e_tests/flow.spec.ts', 'r') as f:
    content = f.read()

content = content.replace("// await page.fill('input[type=\"text\"]', 'admin');", "await page.fill('input[type=\"text\"]', 'admin');")
content = content.replace("// await page.fill('input[type=\"password\"]', 'admin123');", "await page.fill('input[type=\"password\"]', 'admin123');")
content = content.replace("// await page.click('button[type=\"submit\"]');", "await page.click('button[type=\"submit\"]');")
content = content.replace("// Login skipped for test stability.", "await expect(page.locator('h2', { hasText: 'Recent Orders' })).toBeVisible({ timeout: 10000 });")

with open('e2e_tests/flow.spec.ts', 'w') as f:
    f.write(content)
