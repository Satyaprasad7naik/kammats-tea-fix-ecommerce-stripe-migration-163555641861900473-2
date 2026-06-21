const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173/shop', { waitUntil: 'networkidle0' });

  try {
    await page.waitForSelector('.shop-card', { timeout: 10000 });
    console.log("Shop card found!");
  } catch (e) {
    console.log("Shop card NOT found within timeout.", e.message);
  }

  await page.screenshot({ path: 'shop_page.png' });
  await browser.close();
})();
