import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  try {
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
    console.log("Waiting 2 seconds for animations...");
    await new Promise(r => setTimeout(r, 2000));
    const html = await page.evaluate(() => document.body.innerHTML);
    console.log("BODY HTML SNAPSHOT:", html.substring(0, 500) + "...");
  } catch (e) {
    console.log("Error loading page:", e);
  }

  await browser.close();
})();
