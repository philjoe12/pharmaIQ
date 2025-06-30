const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function takeScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  
  // Set viewport for desktop screenshots
  await page.setViewport({ width: 1920, height: 1080 });

  const baseUrl = 'http://143.198.73.227:3000';
  
  const pages = [
    { name: 'homepage', url: '/', description: 'Homepage with hero section and features' },
    { name: 'search-empty', url: '/search', description: 'Search page without query' },
    { name: 'search-with-query', url: '/search?q=aspirin', description: 'Search page with aspirin query' },
  ];

  // Create screenshots directory if it doesn't exist
  const screenshotDir = './debug-screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }

  for (const pageInfo of pages) {
    try {
      console.log(`Taking screenshot of ${pageInfo.name}...`);
      
      // Navigate to page
      await page.goto(`${baseUrl}${pageInfo.url}`, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait a bit for any animations or async content
      await page.waitForTimeout(2000);

      // Take full page screenshot
      const screenshotPath = path.join(screenshotDir, `${pageInfo.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      console.log(`✓ Screenshot saved: ${screenshotPath}`);

    } catch (error) {
      console.error(`Error taking screenshot of ${pageInfo.name}:`, error.message);
    }
  }

  await browser.close();
  console.log('\n✅ All screenshots completed successfully!');
}

// Run the screenshot function
takeScreenshots().catch(console.error);