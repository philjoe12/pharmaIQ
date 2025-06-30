const puppeteer = require('puppeteer');
const fs = require('fs');

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/snap/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const baseUrl = 'http://143.198.73.227:3000';
  
  try {
    // Screenshot 1: Homepage
    console.log('Taking homepage screenshot...');
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({
      path: './homepage-current.png',
      fullPage: true
    });
    console.log('✓ Homepage screenshot saved to ./homepage-current.png');

    // Screenshot 2: Search page
    console.log('Taking search page screenshot...');
    await page.goto(`${baseUrl}/search`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({
      path: './search-current.png',
      fullPage: true
    });
    console.log('✓ Search page screenshot saved to ./search-current.png');

    // Screenshot 3: Search with query
    console.log('Taking search results screenshot...');
    await page.goto(`${baseUrl}/search?q=aspirin`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({
      path: './search-results.png',
      fullPage: true
    });
    console.log('✓ Search results screenshot saved to ./search-results.png');

  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();