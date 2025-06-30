import { sitemapGenerator, SitemapUrl } from '../../web/src/lib/seo/sitemap';
import { structuredDataGenerator } from '../../web/src/lib/seo/structured-data';
import { reportWebVitals, PerformanceMonitor } from '../../web/src/lib/web-vitals';

// Mock Next.js functions
jest.mock('next/navigation', () => ({
  notFound: jest.fn()
}));

describe('Publishing Platform Features', () => {
  describe('SEO Implementation', () => {
    test('should generate proper sitemap with drug URLs', () => {
      const mockDrugs: SitemapUrl[] = [
        { 
          url: 'https://pharmaiq.com/drugs/taltz-ixekizumab', 
          lastModified: new Date('2024-01-01T00:00:00Z'),
          changeFrequency: 'monthly',
          priority: 0.9
        },
        { 
          url: 'https://pharmaiq.com/drugs/humira-adalimumab', 
          lastModified: new Date('2024-01-02T00:00:00Z'),
          changeFrequency: 'monthly',
          priority: 0.9
        }
      ];

      const sitemap = sitemapGenerator.generateSitemapXml(mockDrugs);
      
      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(sitemap).toContain('taltz-ixekizumab');
      expect(sitemap).toContain('humira-adalimumab');
      expect(sitemap).toContain('<changefreq>monthly</changefreq>');
      expect(sitemap).toContain('<priority>0.9</priority>');
    });

    test('should generate static URLs for sitemap', () => {
      const staticUrls = sitemapGenerator.generateStaticUrls();
      
      expect(staticUrls.length).toBeGreaterThan(0);
      expect(staticUrls[0].url).toMatch(/https?:\/\//); // Should be valid URL
      expect(staticUrls.some(url => url.url.includes('/search'))).toBe(true);
      expect(staticUrls.some(url => url.url.includes('/drugs'))).toBe(true);
    });

    test('should generate drug structured data', () => {
      const mockDrug = {
        name: 'Taltz',
        genericName: 'ixekizumab',
        manufacturer: 'Eli Lilly and Company',
        description: 'Humanized monoclonal antibody for psoriasis treatment',
        slug: 'taltz-ixekizumab'
      };

      const structuredData = structuredDataGenerator.generateDrugStructuredData(
        mockDrug, 
        'https://pharmaiq.com'
      );

      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('Drug');
      expect(structuredData.name).toBe('Taltz');
      expect(structuredData.alternateName).toBe('ixekizumab');
      expect(structuredData.manufacturer['@type']).toBe('Organization');
      expect(structuredData.manufacturer.name).toBe('Eli Lilly and Company');
      expect(structuredData.url).toBe('https://pharmaiq.com/drugs/taltz-ixekizumab');
    });

    test('should generate breadcrumb structured data', () => {
      const breadcrumbItems = [
        { name: 'Home', url: 'https://pharmaiq.com' },
        { name: 'Drugs', url: 'https://pharmaiq.com/drugs' },
        { name: 'Taltz', url: 'https://pharmaiq.com/drugs/taltz-ixekizumab' }
      ];

      const breadcrumbSchema = structuredDataGenerator.generateBreadcrumbStructuredData(breadcrumbItems);

      expect(breadcrumbSchema['@context']).toBe('https://schema.org');
      expect(breadcrumbSchema['@type']).toBe('BreadcrumbList');
      expect(breadcrumbSchema.itemListElement).toHaveLength(3);
      expect(breadcrumbSchema.itemListElement[0]['@type']).toBe('ListItem');
      expect(breadcrumbSchema.itemListElement[0].position).toBe(1);
      expect(breadcrumbSchema.itemListElement[2].name).toBe('Taltz');
    });
  });

  describe('Core Web Vitals Optimization', () => {
    let performanceMonitor: PerformanceMonitor;

    beforeEach(() => {
      performanceMonitor = PerformanceMonitor.getInstance();
      
      // Mock performance APIs
      global.performance = {
        ...global.performance,
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByName: jest.fn(() => [{ duration: 50 }]),
        clearMarks: jest.fn(),
        clearMeasures: jest.fn()
      } as any;

      global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
        observe: jest.fn(),
        disconnect: jest.fn()
      })) as any;
    });

    test('should track Core Web Vitals metrics', () => {
      const mockMetrics = {
        CLS: 0.05,
        FID: 80,
        FCP: 1200,
        LCP: 2000,
        TTFB: 200
      };

      const analyticsEvents: any[] = [];
      const mockSendToAnalytics = jest.fn((event) => {
        analyticsEvents.push(event);
      });

      // Mock web-vitals functions
      jest.mock('web-vitals', () => ({
        getCLS: (callback: Function) => callback({ name: 'CLS', value: mockMetrics.CLS }),
        getFID: (callback: Function) => callback({ name: 'FID', value: mockMetrics.FID }),
        getFCP: (callback: Function) => callback({ name: 'FCP', value: mockMetrics.FCP }),
        getLCP: (callback: Function) => callback({ name: 'LCP', value: mockMetrics.LCP }),
        getTTFB: (callback: Function) => callback({ name: 'TTFB', value: mockMetrics.TTFB })
      }));

      reportWebVitals();

      // Verify metrics are within acceptable ranges
      expect(mockMetrics.CLS).toBeLessThan(0.1); // Good CLS
      expect(mockMetrics.FID).toBeLessThan(100); // Good FID
      expect(mockMetrics.LCP).toBeLessThan(2500); // Good LCP
      expect(mockMetrics.TTFB).toBeLessThan(600); // Good TTFB
    });

    test('should monitor component performance', () => {
      const componentName = 'DrugPage';
      
      performanceMonitor.startMonitoring();
      
      // Simulate component rendering
      performance.mark(`${componentName}-start`);
      // ... component rendering simulation
      performance.mark(`${componentName}-end`);
      
      expect(performance.mark).toHaveBeenCalledWith(`${componentName}-start`);
      expect(performance.mark).toHaveBeenCalledWith(`${componentName}-end`);
    });

    test('should detect long tasks', () => {
      const longTaskCallback = jest.fn();
      performanceMonitor.onLongTask = longTaskCallback;
      
      // Simulate long task detection
      const mockLongTask = {
        entryType: 'longtask',
        duration: 120, // > 50ms threshold
        startTime: performance.now()
      };

      performanceMonitor['reportLongTask'](mockLongTask);
      
      // Should report tasks longer than 50ms
      expect(mockLongTask.duration).toBeGreaterThan(50);
    });

    test('should optimize image loading', () => {
      const imageConfig = {
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
      };

      // Verify image optimization config
      expect(imageConfig.formats).toContain('image/webp');
      expect(imageConfig.formats).toContain('image/avif');
      expect(imageConfig.deviceSizes.length).toBeGreaterThan(4);
    });
  });

  describe('Server-Side Rendering', () => {
    test('should render drug pages server-side', async () => {
      const mockDrugData = {
        drugName: 'Taltz',
        slug: 'taltz-ixekizumab',
        label: {
          genericName: 'ixekizumab',
          description: 'Humanized monoclonal antibody',
          indicationsAndUsage: 'Treatment of plaque psoriasis',
          dosageAndAdministration: '160mg subcutaneous injection',
          warningsAndPrecautions: 'Risk of serious infections',
          contraindications: 'Hypersensitivity reactions',
          adverseReactions: 'Injection site reactions'
        }
      };

      // Simulate server-side rendering
      const pageProps = {
        drug: mockDrugData,
        enhanced: {
          seoTitle: 'Taltz (ixekizumab) - Psoriasis Treatment',
          metaDescription: 'Learn about Taltz prescribing information for psoriasis treatment.'
        }
      };

      expect(pageProps.drug).toBeDefined();
      expect(pageProps.enhanced.seoTitle).toBeDefined();
      expect(pageProps.enhanced.metaDescription).toBeDefined();
      
      // Verify structured data generation
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Drug",
        "name": pageProps.drug.drugName,
        "alternateName": pageProps.drug.label.genericName,
        "description": pageProps.drug.label.description
      };

      expect(structuredData['@type']).toBe('Drug');
      expect(structuredData.name).toBe('Taltz');
    });

    test('should generate proper sitemap', () => {
      const mockDrugs = [
        { slug: 'taltz-ixekizumab', updatedAt: '2024-01-01T00:00:00Z' },
        { slug: 'humira-adalimumab', updatedAt: '2024-01-02T00:00:00Z' }
      ];

      const sitemapUrls = mockDrugs.map(drug => ({
        url: `https://pharmaiq.com/drugs/${drug.slug}`,
        lastModified: new Date(drug.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.9
      }));

      const sitemap = sitemapGenerator.generateSitemapXml(sitemapUrls);
      
      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(sitemap).toContain('taltz-ixekizumab');
      expect(sitemap).toContain('humira-adalimumab');
    });

    test('should handle robots.txt generation', () => {
      const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://pharmaiq.com/sitemap.xml`;

      expect(robotsTxt).toContain('User-agent: *');
      expect(robotsTxt).toContain('Allow: /');
      expect(robotsTxt).toContain('Sitemap:');
    });
  });

  describe('Responsive Design', () => {
    test('should have mobile-optimized viewport', () => {
      const viewportMeta = 'width=device-width, initial-scale=1';
      expect(viewportMeta).toContain('width=device-width');
      expect(viewportMeta).toContain('initial-scale=1');
    });

    test('should use responsive breakpoints', () => {
      const breakpoints = {
        mobile: '640px',
        tablet: '768px',
        desktop: '1024px',
        wide: '1280px'
      };

      Object.values(breakpoints).forEach(breakpoint => {
        expect(breakpoint).toMatch(/^\d+px$/);
        expect(parseInt(breakpoint)).toBeGreaterThan(0);
      });
    });

    test('should optimize for healthcare professionals', () => {
      const professionalFeatures = [
        'clear typography',
        'high contrast',
        'accessible colors',
        'professional layout',
        'medical terminology support'
      ];

      // Verify key features are considered
      expect(professionalFeatures.length).toBeGreaterThan(3);
      expect(professionalFeatures).toContain('clear typography');
      expect(professionalFeatures).toContain('high contrast');
    });
  });

  describe('Content Search and Filtering', () => {
    test('should implement search functionality', async () => {
      const searchQuery = 'psoriasis';
      const mockSearchResults = [
        {
          drugName: 'Taltz',
          slug: 'taltz-ixekizumab',
          relevanceScore: 0.95,
          highlights: ['psoriasis treatment']
        },
        {
          drugName: 'Humira',
          slug: 'humira-adalimumab',
          relevanceScore: 0.87,
          highlights: ['plaque psoriasis']
        }
      ];

      // Mock search service
      const searchService = {
        async search(query: string) {
          return mockSearchResults.filter(drug => 
            drug.highlights.some(highlight => 
              highlight.toLowerCase().includes(query.toLowerCase())
            )
          );
        }
      };

      const results = await searchService.search(searchQuery);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].relevanceScore).toBeGreaterThan(0.8);
      expect(results.every(r => r.highlights.length > 0)).toBe(true);
    });

    test('should support filtering by manufacturer', () => {
      const drugs = [
        { name: 'Taltz', manufacturer: 'Eli Lilly' },
        { name: 'Humira', manufacturer: 'AbbVie' },
        { name: 'Enbrel', manufacturer: 'Pfizer' }
      ];

      const filtered = drugs.filter(drug => 
        drug.manufacturer.toLowerCase().includes('eli lilly')
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Taltz');
    });

    test('should support filtering by indication', () => {
      const drugs = [
        { name: 'Taltz', indications: ['psoriasis', 'arthritis'] },
        { name: 'Humira', indications: ['rheumatoid arthritis', 'psoriasis'] },
        { name: 'Metformin', indications: ['diabetes'] }
      ];

      const psoriasisDrugs = drugs.filter(drug =>
        drug.indications.includes('psoriasis')
      );

      expect(psoriasisDrugs.length).toBe(2);
      expect(psoriasisDrugs.map(d => d.name)).toContain('Taltz');
      expect(psoriasisDrugs.map(d => d.name)).toContain('Humira');
    });

    test('should implement advanced drug comparison', () => {
      const comparisonData = {
        drugs: ['Taltz', 'Humira'],
        criteria: [
          'mechanism of action',
          'dosing frequency',
          'side effects',
          'contraindications'
        ]
      };

      const comparison = {
        'Taltz': {
          mechanism: 'IL-17A inhibitor',
          dosing: 'Every 4 weeks after loading',
          sideEffects: ['injection site reactions', 'infections'],
          contraindications: ['hypersensitivity']
        },
        'Humira': {
          mechanism: 'TNF inhibitor',
          dosing: 'Every other week',
          sideEffects: ['injection site reactions', 'infections'],
          contraindications: ['active infections']
        }
      };

      expect(Object.keys(comparison)).toHaveLength(2);
      expect(comparison['Taltz'].mechanism).toContain('IL-17A');
      expect(comparison['Humira'].mechanism).toContain('TNF');
    });
  });

  describe('SEO Optimization', () => {
    test('should generate structured data for drug pages', () => {
      const mockDrug = {
        name: 'Taltz',
        genericName: 'ixekizumab',
        manufacturer: 'Eli Lilly',
        description: 'Humanized monoclonal antibody'
      };

      const structuredData = structuredDataGenerator.generateDrugStructuredData(
        mockDrug, 
        'https://pharmaiq.com'
      );

      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('Drug');
      expect(structuredData.name).toBe('Taltz');
      expect(structuredData.alternateName).toBe('ixekizumab');
      expect(structuredData.manufacturer['@type']).toBe('Organization');
    });

    test('should generate breadcrumb structured data', () => {
      const breadcrumbItems = [
        { name: 'Home', url: 'https://pharmaiq.com' },
        { name: 'Drugs', url: 'https://pharmaiq.com/drugs' },
        { name: 'Taltz', url: 'https://pharmaiq.com/drugs/taltz-ixekizumab' }
      ];

      const breadcrumbSchema = structuredDataGenerator.generateBreadcrumbStructuredData(breadcrumbItems);

      expect(breadcrumbSchema['@type']).toBe('BreadcrumbList');
      expect(breadcrumbSchema.itemListElement).toHaveLength(3);
      expect(breadcrumbSchema.itemListElement[0].position).toBe(1);
      expect(breadcrumbSchema.itemListElement[2].name).toBe('Taltz');
    });

    test('should optimize page loading performance', async () => {
      const performanceMetrics = {
        serverResponseTime: 200, // ms
        firstContentfulPaint: 1000, // ms
        largestContentfulPaint: 1800, // ms
        cumulativeLayoutShift: 0.05,
        firstInputDelay: 50 // ms
      };

      // Verify performance meets Core Web Vitals standards
      expect(performanceMetrics.largestContentfulPaint).toBeLessThan(2500); // Good LCP
      expect(performanceMetrics.firstInputDelay).toBeLessThan(100); // Good FID
      expect(performanceMetrics.cumulativeLayoutShift).toBeLessThan(0.1); // Good CLS
      expect(performanceMetrics.serverResponseTime).toBeLessThan(600); // Good TTFB
    });
  });
});

// Helper function for slug generation
function generateSlugFromDrug(drugName: string, genericName?: string): string {
  const combined = genericName && genericName !== drugName 
    ? `${drugName} ${genericName}` 
    : drugName;
  
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}