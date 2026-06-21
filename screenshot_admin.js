const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="text"]');
  await page.type('input[type="text"]', 'admin');
  await page.type('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 3000));

  await page.screenshot({ path: 'admin_page.png' });
  await browser.close();
})();
