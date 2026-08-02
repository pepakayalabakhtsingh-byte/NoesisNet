const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  page.on('response', response => {
    if (!response.ok()) {
      console.log('BROWSER_HTTP_ERROR:', response.url(), response.status());
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
