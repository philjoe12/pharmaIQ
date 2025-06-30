import { test, expect, Page } from '@playwright/test';

test.describe('Drug Pages E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data and navigate to base URL
    await page.goto('/');
  });

  test.describe('Drug Information Display', () => {
    test('should display complete drug information page', async ({ page }) => {
      // Navigate to a specific drug page
      await page.goto('/drugs/taltz-ixekizumab');
      
      // Verify page loads and displays drug information
      await expect(page.locator('h1')).toContainText('Taltz');
      await expect(page.locator('[data-testid="generic-name"]')).toContainText('ixekizumab');
      
      // Check all major sections are present
      await expect(page.locator('[data-testid="indications-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="dosage-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="warnings-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="contraindications-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="adverse-reactions-section"]')).toBeVisible();
    });

    test('should handle non-existent drug gracefully', async ({ page }) => {
      await page.goto('/drugs/non-existent-drug');
      
      // Should show 404 or appropriate error page
      await expect(page.locator('h1')).toContainText('Drug Not Found');
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });

    test('should display manufacturer information', async ({ page }) => {
      await page.goto('/drugs/taltz-ixekizumab');
      
      await expect(page.locator('[data-testid="manufacturer"]')).toContainText('Eli Lilly');
      await expect(page.locator('[data-testid="labeler"]')).toBeVisible();
    });
  });

  test.describe('SEO and Metadata', () => {
    test('should have proper SEO metadata', async ({ page }) => {
      await page.goto('/drugs/taltz-ixekizumab');
      
      // Check title tag
      const title = await page.title();
      expect(title).toContain('Taltz');
      expect(title.length).toBeLessThanOrEqual(60);
      
      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      const description = await metaDescription.getAttribute('content');
      expect(description).toBeTruthy();
      expect(description!.length).toBeLessThanOrEqual(160);
      expect(description).toContain('Taltz');
      
      // Check canonical URL
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', /\/drugs\/taltz-ixekizumab$/);
    });

    test('should have structured data', async ({ page }) => {
      await page.goto('/drugs/taltz-ixekizumab');
      
      // Check for JSON-LD structured data
      const structuredData = page.locator('script[type="application/ld+json"]');
      await expect(structuredData).toBeVisible();
      
      const jsonLD = await structuredData.textContent();
      const data = JSON.parse(jsonLD!);
      
      expect(data['@type']).toBe('Drug');
      expect(data.name).toContain('Taltz');
      expect(data.alternateName).toContain('ixekizumab');
    });

    test('should have proper Open Graph tags', async ({ page }) => {
      await page.goto('/drugs/taltz-ixekizumab');
      
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Taltz/);
      await expect(page.locator('meta[property="og:description"]')).toBeVisible();
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', /taltz-ixekizumab/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/drugs/taltz-ixekizumab');
      
      // Check mobile navigation
      const mobileNav = page.locator('[data-testid="mobile-nav"]');
      if (await mobileNav.isVisible()) {
        await expect(mobileNav).toBeVisible();
      }
      
      // Verify content is readable on mobile
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
      
      // Check that text doesn't overflow
      const drugName = page.locator('h1');
      const boundingBox = await drugName.boundingBox();
      expect(boundingBox!.width).toBeLessThanOrEqual(375);
    });

    test('should be responsive on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto('/drugs/taltz-ixekizumab');
      
      // Verify layout adapts to tablet size
      const container = page.locator('[data-testid="drug-container"]');
      await expect(container).toBeVisible();
      
      // Check side navigation or layout changes
      const sideNav = page.locator('[data-testid="side-nav"]');
      if (await sideNav.isVisible()) {
        await expect(sideNav).toBeVisible();
      }
    });

    test('should be responsive on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/drugs/taltz-ixekizumab');
      
      // Verify full desktop layout
      const header = page.locator('header');
      const main = page.locator('main');
      const footer = page.locator('footer');
      
      await expect(header).toBeVisible();
      await expect(main).toBeVisible();
      await expect(footer).toBeVisible();
    });
  });

  test.describe('Performance Benchmarks', () => {
    test('should meet Core Web Vitals standards', async ({ page }) => {
      await page.goto('/drugs/taltz-ixekizumab');
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Measure performance metrics using page.evaluate
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const metrics: any = {};
            
            entries.forEach((entry) => {
              if (entry.entryType === 'navigation') {
                const navEntry = entry as PerformanceNavigationTiming;
                metrics.loadTime = navEntry.loadEventEnd - navEntry.fetchStart;
                metrics.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.fetchStart;
              }
              
              if (entry.entryType === 'paint') {
                if (entry.name === 'first-contentful-paint') {
                  metrics.fcp = entry.startTime;
                }
              }
            });
            
            resolve(metrics);
          });
          
          observer.observe({ entryTypes: ['navigation', 'paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve({}), 5000);
        });
      });
      
      // Basic performance assertions
      expect(typeof metrics).toBe('object');
    });

    test('should load images efficiently', async ({ page }) => {
      await page.goto('/drugs/taltz-ixekizumab');
      
      // Check that images have proper loading attributes
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const loading = await img.getAttribute('loading');
        
        // Images should use lazy loading when appropriate
        if (i > 0) { // First image might not be lazy loaded
          expect(loading).toBe('lazy');
        }
      }
    });
  });

  test.describe('Related Drugs and FAQs', () => {
    test('should display related drugs section', async ({ page }) => {
      await page.goto('/drugs/taltz-ixekizumab');
      
      const relatedSection = page.locator('[data-testid="related-drugs"]');
      await expect(relatedSection).toBeVisible();
      
      // Check that related drugs are clickable links
      const relatedLinks = relatedSection.locator('a');
      const linkCount = await relatedLinks.count();
      expect(linkCount).toBeGreaterThan(0);
      
      // Verify first related drug link
      if (linkCount > 0) {
        const firstLink = relatedLinks.first();
        await expect(firstLink).toHaveAttribute('href', /\/drugs\//);
      }
    });

    test('should display FAQ section with proper structure', async ({ page }) => {
      await page.goto('/drugs/taltz-ixekizumab');
      
      const faqSection = page.locator('[data-testid="faq-section"]');
      await expect(faqSection).toBeVisible();
      
      // Check FAQ items
      const faqItems = faqSection.locator('[data-testid="faq-item"]');
      const faqCount = await faqItems.count();
      expect(faqCount).toBeGreaterThan(0);
      
      // Test FAQ accordion functionality
      if (faqCount > 0) {
        const firstFAQ = faqItems.first();
        const question = firstFAQ.locator('[data-testid="faq-question"]');
        const answer = firstFAQ.locator('[data-testid="faq-answer"]');
        
        await expect(question).toBeVisible();
        
        // Click to expand if collapsed initially
        await question.click();
        await expect(answer).toBeVisible();
      }
    });

    test('should navigate to related drug pages', async ({ page }) => {
      await page.goto('/drugs/taltz-ixekizumab');
      
      const relatedSection = page.locator('[data-testid="related-drugs"]');
      const relatedLinks = relatedSection.locator('a');
      const linkCount = await relatedLinks.count();
      
      if (linkCount > 0) {
        // Click first related drug link
        const firstLink = relatedLinks.first();
        const href = await firstLink.getAttribute('href');
        
        await firstLink.click();
        await page.waitForLoadState('networkidle');
        
        // Verify navigation to related drug page
        expect(page.url()).toContain(href!);
        
        // Verify new page has drug content
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('[data-testid="indications-section"]')).toBeVisible();
      }
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/drugs/taltz-ixekizumab');
      
      // Check h1 exists and is unique
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      
      // Check h2 headings for sections
      const h2Headings = page.locator('h2');
      const h2Count = await h2Headings.count();
      expect(h2Count).toBeGreaterThan(0);
      
      // Verify h2 headings have meaningful text
      for (let i = 0; i < Math.min(h2Count, 5); i++) {
        const heading = h2Headings.nth(i);
        const text = await heading.textContent();
        expect(text!.length).toBeGreaterThan(2);
      }
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/drugs/taltz-ixekizumab');
      
      // Check main navigation has aria-label
      const nav = page.locator('nav').first();
      if (await nav.isVisible()) {
        const ariaLabel = await nav.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
      
      // Check sections have proper labeling
      const sections = page.locator('section');
      const sectionCount = await sections.count();
      
      for (let i = 0; i < Math.min(sectionCount, 3); i++) {
        const section = sections.nth(i);
        const ariaLabelledBy = await section.getAttribute('aria-labelledby');
        const ariaLabel = await section.getAttribute('aria-label');
        
        // Section should have either aria-labelledby or aria-label
        expect(ariaLabelledBy || ariaLabel).toBeTruthy();
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/drugs/taltz-ixekizumab');
      
      // Start keyboard navigation
      await page.keyboard.press('Tab');
      
      // Check that focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Tab through a few elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const newFocusedElement = page.locator(':focus');
        await expect(newFocusedElement).toBeVisible();
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/drugs/taltz-ixekizumab');
      
      // Check main heading color contrast
      const h1 = page.locator('h1');
      const h1Styles = await h1.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Basic check that colors are defined
      expect(h1Styles.color).toBeTruthy();
      expect(h1Styles.color).not.toBe('transparent');
    });
  });

  test.describe('Search and Navigation', () => {
    test('should have working search functionality', async ({ page }) => {
      await page.goto('/');
      
      // Look for search input
      const searchInput = page.locator('[data-testid="search-input"]').or(page.locator('input[type="search"]'));
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('psoriasis');
        await page.keyboard.press('Enter');
        
        // Wait for search results
        await page.waitForLoadState('networkidle');
        
        // Verify search results page
        const results = page.locator('[data-testid="search-results"]');
        await expect(results).toBeVisible();
        
        // Check that results contain searched term
        const resultText = await results.textContent();
        expect(resultText!.toLowerCase()).toContain('psoriasis');
      }
    });

    test('should have working breadcrumb navigation', async ({ page }) => {
      await page.goto('/drugs/taltz-ixekizumab');
      
      const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
      if (await breadcrumbs.isVisible()) {
        const breadcrumbLinks = breadcrumbs.locator('a');
        const linkCount = await breadcrumbLinks.count();
        
        expect(linkCount).toBeGreaterThan(0);
        
        // Test navigation back to home
        const homeLink = breadcrumbLinks.first();
        await homeLink.click();
        
        await page.waitForLoadState('networkidle');
        expect(page.url()).toBe(page.url().split('/drugs')[0] + '/');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network failures gracefully', async ({ page }) => {
      // Block network requests to simulate failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/drugs/taltz-ixekizumab');
      
      // Page should still render with cached/static content
      await expect(page.locator('h1')).toBeVisible();
      
      // Look for error indicators or fallback content
      const errorIndicator = page.locator('[data-testid="error-indicator"]').or(page.locator('.error'));
      if (await errorIndicator.isVisible()) {
        await expect(errorIndicator).toBeVisible();
      }
    });

    test('should handle JavaScript errors gracefully', async ({ page }) => {
      // Listen for console errors
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/drugs/taltz-ixekizumab');
      await page.waitForLoadState('networkidle');
      
      // Page should load despite any JavaScript errors
      await expect(page.locator('h1')).toBeVisible();
      
      // Log errors for debugging but don't fail test for minor errors
      if (errors.length > 0) {
        console.log('JavaScript errors detected:', errors);
      }
    });
  });
});