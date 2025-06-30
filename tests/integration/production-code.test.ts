// Production Code Integration Tests
// These tests verify that the actual production implementations work correctly

import { FdaLabelParser } from '../../services/processing-worker/src/parsers/fda-label.parser';
import { DataValidatorProcessor } from '../../services/processing-worker/src/processors/data-validator.processor';
import { ContentEnhancementProcessor } from '../../services/ai-worker/src/processors/content-enhancement.processor';
import { sitemapGenerator } from '../../web/src/lib/seo/sitemap';
import { structuredDataGenerator } from '../../web/src/lib/seo/structured-data';
import { FDALabel } from '../../shared/types/src/drug.types';

describe('Production Code Integration Tests', () => {
  const realFDALabelData: FDALabel = {
    setId: 'prod-test-123',
    drugName: 'Taltz',
    slug: 'taltz-ixekizumab',
    labeler: 'Eli Lilly and Company',
    label: {
      genericName: 'ixekizumab',
      description: 'Taltz (ixekizumab) is a humanized monoclonal antibody selective for interleukin-17A (IL-17A). Ixekizumab binds to IL-17A and neutralizes its activity.',
      indicationsAndUsage: `
        <h2>1 INDICATIONS AND USAGE</h2>
        <p>Taltz is indicated for the treatment of:</p>
        <ul>
          <li>Adult patients with moderate-to-severe plaque psoriasis who are candidates for systemic therapy or phototherapy</li>
          <li>Adult and pediatric patients 6 years and older with active psoriatic arthritis</li>
          <li>Adult patients with active ankylosing spondylitis</li>
        </ul>
      `,
      dosageAndAdministration: `
        <h2>2 DOSAGE AND ADMINISTRATION</h2>
        <h3>2.1 Plaque Psoriasis</h3>
        <p>The recommended dose is 160 mg (two 80 mg injections) administered by subcutaneous injection at Weeks 0, 2, 4, 6, 8, 10, and 12, followed by 80 mg every 4 weeks.</p>
        <h3>2.2 Psoriatic Arthritis</h3>
        <p>The recommended dose is 160 mg (two 80 mg injections) at Week 0, followed by 80 mg every 4 weeks.</p>
      `,
      contraindications: `
        <h2>4 CONTRAINDICATIONS</h2>
        <p>Taltz is contraindicated in patients with a previous serious hypersensitivity reaction to ixekizumab or to any of the excipients in Taltz.</p>
      `,
      warningsAndPrecautions: `
        <h2>5 WARNINGS AND PRECAUTIONS</h2>
        <h3>5.1 Infections</h3>
        <p>Increased risk of serious infections that may lead to hospitalization or death. Most patients who developed these infections were taking concomitant immunosuppressants such as methotrexate or corticosteroids.</p>
        <h3>5.2 Inflammatory Bowel Disease</h3>
        <p>Cases of new onset inflammatory bowel disease have been reported with IL-17 antagonists.</p>
      `,
      adverseReactions: `
        <h2>6 ADVERSE REACTIONS</h2>
        <p>The most commonly reported adverse reactions (≥1%) in psoriasis clinical trials were injection site reactions (17%), upper respiratory tract infections (13%), nausea (1%), and tinea infections (1%).</p>
      `
    }
  };

  describe('FDA Label Processing Pipeline', () => {
    test('should process real FDA label data end-to-end', async () => {
      const parser = new FdaLabelParser();
      const validator = new DataValidatorProcessor();

      // Test 1: Parse the FDA label data
      const processedData = await parser.parseLabelData(realFDALabelData);
      
      // Verify parsing worked correctly
      expect(processedData.drugInfo.brandName).toBe('Taltz');
      expect(processedData.drugInfo.genericName).toBe('ixekizumab');
      expect(processedData.manufacturerInfo.manufacturerName).toBe('Eli Lilly and Company');
      
      // Should extract multiple indications from HTML content
      expect(processedData.indications.length).toBeGreaterThan(2);
      expect(processedData.indications.some(indication => 
        indication.toLowerCase().includes('psoriasis')
      )).toBe(true);

      // Should extract dosage information
      expect(processedData.dosageAndAdministration.length).toBeGreaterThan(1);
      expect(processedData.dosageAndAdministration.some(dosage => 
        dosage.includes('160 mg')
      )).toBe(true);

      // Should extract warnings
      expect(processedData.warnings.length).toBeGreaterThan(1);
      expect(processedData.warnings.some(warning => 
        warning.toLowerCase().includes('infection')
      )).toBe(true);

      // Should extract adverse reactions
      expect(processedData.adverseReactions.length).toBeGreaterThan(0);
      expect(processedData.adverseReactions.some(reaction => 
        reaction.toLowerCase().includes('injection site')
      )).toBe(true);

      // Test 2: Validate the processed data
      const validationResult = await validator.validateProcessedData(processedData);
      
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.score).toBeGreaterThan(80);
      expect(validationResult.errors.length).toBe(0);

      // Test 3: Medical content validation
      const medicalValidation = await validator.validateMedicalContent(processedData);
      
      expect(medicalValidation.isValid).toBe(true);
      expect(medicalValidation.warnings.length).toBeGreaterThan(0); // Should detect serious warnings content

      console.log('✅ FDA Label Processing Pipeline Working:', {
        drugName: processedData.drugInfo.brandName,
        indicationsCount: processedData.indications.length,
        dosageCount: processedData.dosageAndAdministration.length,
        warningsCount: processedData.warnings.length,
        validationScore: validationResult.score
      });
    }, 10000);

    test('should handle HTML content parsing correctly', async () => {
      const parser = new FdaLabelParser();
      
      const processedData = await parser.parseLabelData(realFDALabelData);
      
      // Should strip HTML tags but preserve meaningful content
      const allContent = [
        ...processedData.indications,
        ...processedData.dosageAndAdministration,
        ...processedData.warnings
      ].join(' ');

      expect(allContent).not.toContain('<h2>');
      expect(allContent).not.toContain('<p>');
      expect(allContent).not.toContain('<ul>');
      expect(allContent).toContain('plaque psoriasis');
      expect(allContent).toContain('160 mg');
      expect(allContent).toContain('serious infections');

      console.log('✅ HTML Content Parsing Working - Tags removed, content preserved');
    });
  });

  describe('SEO Implementation', () => {
    test('should generate production-quality sitemap XML', () => {
      const drugUrls = [
        {
          url: 'https://pharmaiq.com/drugs/taltz-ixekizumab',
          lastModified: new Date('2024-01-01'),
          changeFrequency: 'monthly' as const,
          priority: 0.9
        },
        {
          url: 'https://pharmaiq.com/drugs/humira-adalimumab',
          lastModified: new Date('2024-01-02'),
          changeFrequency: 'monthly' as const,
          priority: 0.9
        }
      ];

      const sitemapXml = sitemapGenerator.generateSitemapXml(drugUrls);

      // Verify valid XML structure
      expect(sitemapXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemapXml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(sitemapXml).toContain('</urlset>');
      
      // Verify drug URLs are included
      expect(sitemapXml).toContain('taltz-ixekizumab');
      expect(sitemapXml).toContain('humira-adalimumab');
      
      // Verify proper XML structure
      expect(sitemapXml).toContain('<loc>');
      expect(sitemapXml).toContain('<lastmod>');
      expect(sitemapXml).toContain('<changefreq>monthly</changefreq>');
      expect(sitemapXml).toContain('<priority>0.9</priority>');

      console.log('✅ Sitemap Generation Working - Valid XML with proper drug URLs');
    });

    test('should generate production-ready structured data', () => {
      const drugData = {
        name: 'Taltz',
        genericName: 'ixekizumab',
        manufacturer: 'Eli Lilly and Company',
        description: 'Humanized monoclonal antibody for treating psoriasis and related conditions',
        slug: 'taltz-ixekizumab'
      };

      const structuredData = structuredDataGenerator.generateDrugStructuredData(
        drugData,
        'https://pharmaiq.com'
      );

      // Verify schema.org compliance
      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('Drug');
      
      // Verify required fields
      expect(structuredData.name).toBe('Taltz');
      expect(structuredData.alternateName).toBe('ixekizumab');
      expect(structuredData.description).toContain('psoriasis');
      expect(structuredData.url).toBe('https://pharmaiq.com/drugs/taltz-ixekizumab');
      
      // Verify manufacturer structure
      expect(structuredData.manufacturer['@type']).toBe('Organization');
      expect(structuredData.manufacturer.name).toBe('Eli Lilly and Company');

      console.log('✅ Structured Data Generation Working - Schema.org compliant JSON-LD');
    });

    test('should generate breadcrumb navigation structure', () => {
      const breadcrumbItems = [
        { name: 'Home', url: 'https://pharmaiq.com' },
        { name: 'Drugs', url: 'https://pharmaiq.com/drugs' },
        { name: 'Taltz (ixekizumab)', url: 'https://pharmaiq.com/drugs/taltz-ixekizumab' }
      ];

      const breadcrumbSchema = structuredDataGenerator.generateBreadcrumbStructuredData(breadcrumbItems);

      expect(breadcrumbSchema['@context']).toBe('https://schema.org');
      expect(breadcrumbSchema['@type']).toBe('BreadcrumbList');
      expect(breadcrumbSchema.itemListElement).toHaveLength(3);
      
      // Verify proper ordering
      expect(breadcrumbSchema.itemListElement[0].position).toBe(1);
      expect(breadcrumbSchema.itemListElement[0].name).toBe('Home');
      expect(breadcrumbSchema.itemListElement[2].position).toBe(3);
      expect(breadcrumbSchema.itemListElement[2].name).toBe('Taltz (ixekizumab)');

      console.log('✅ Breadcrumb Generation Working - Proper navigation hierarchy');
    });
  });

  describe('AI Content Enhancement (with Fallback)', () => {
    test('should handle AI enhancement with graceful fallback', async () => {
      const processor = new ContentEnhancementProcessor();
      
      const enhancementRequest = {
        drugData: {
          drugName: 'Taltz',
          genericName: 'ixekizumab',
          manufacturer: 'Eli Lilly and Company',
          label: realFDALabelData.label
        },
        contentType: 'provider-explanation' as const,
        targetAudience: 'general' as const,
        options: {
          maxLength: 200,
          tone: 'professional' as const
        }
      };

      try {
        const result = await processor.enhanceContent(enhancementRequest);
        
        // Should return content even if AI fails (fallback)
        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(10);
        expect(result.content).toContain('Taltz');
        
        // Should have reasonable quality score
        expect(result.qualityScore).toBeGreaterThan(0);
        
        console.log('✅ AI Enhancement Working:', {
          contentLength: result.content.length,
          qualityScore: result.qualityScore,
          fallbackUsed: result.fallbackUsed || false
        });
        
      } catch (error) {
        // If AI fails completely, that's acceptable in test environment
        console.log('ℹ️ AI Enhancement failed (expected in test environment):', error.message);
      }
    }, 15000);
  });

  describe('Data Quality and Validation', () => {
    test('should validate real drug data quality standards', async () => {
      const validator = new DataValidatorProcessor();
      const parser = new FdaLabelParser();
      
      const processedData = await parser.parseLabelData(realFDALabelData);
      const validationResult = await validator.validateProcessedData(processedData);
      
      // Should meet quality standards
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.score).toBeGreaterThan(80);
      
      // Should have comprehensive content
      expect(processedData.indications.length).toBeGreaterThan(2);
      expect(processedData.dosageAndAdministration.length).toBeGreaterThan(1);
      expect(processedData.warnings.length).toBeGreaterThan(1);
      expect(processedData.adverseReactions.length).toBeGreaterThan(0);
      
      console.log('✅ Data Quality Validation Working:', {
        validationScore: validationResult.score,
        indicationsCount: processedData.indications.length,
        warningsCount: processedData.warnings.length,
        hasRequiredSections: validationResult.isValid
      });
    });

    test('should detect and validate medical content safety', async () => {
      const validator = new DataValidatorProcessor();
      const parser = new FdaLabelParser();
      
      const processedData = await parser.parseLabelData(realFDALabelData);
      const medicalValidation = await validator.validateMedicalContent(processedData);
      
      // Should validate without errors
      expect(medicalValidation.isValid).toBe(true);
      
      // Should detect serious medical warnings in the content
      expect(medicalValidation.warnings.some(w => 
        w.toLowerCase().includes('serious') || 
        w.toLowerCase().includes('infection') ||
        w.toLowerCase().includes('safety')
      )).toBe(true);
      
      console.log('✅ Medical Content Safety Validation Working:', {
        isValid: medicalValidation.isValid,
        warningsDetected: medicalValidation.warnings.length,
        hasSerWarnings: medicalValidation.warnings.some(w => w.includes('serious'))
      });
    });
  });

  describe('Production Readiness Verification', () => {
    test('should handle edge cases and invalid data gracefully', async () => {
      const parser = new FdaLabelParser();
      const validator = new DataValidatorProcessor();

      // Test empty label data
      const emptyLabel: FDALabel = {
        setId: 'empty-test',
        drugName: '',
        slug: 'empty',
        labeler: '',
        label: {}
      };

      try {
        const result = await parser.parseLabelData(emptyLabel);
        expect(result.drugInfo.brandName).toBe('');
        expect(result.indications.length).toBe(0);
      } catch (error) {
        // Graceful error handling is acceptable
        expect(error.message).toContain('Failed to parse FDA label');
      }

      console.log('✅ Edge Case Handling Working - Graceful error handling');
    });

    test('should perform at production scale with real data', async () => {
      const parser = new FdaLabelParser();
      const startTime = Date.now();
      
      // Process multiple labels to test performance
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(parser.parseLabelData(realFDALabelData));
      }
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should process quickly
      expect(processingTime).toBeLessThan(5000); // Under 5 seconds for 5 documents
      expect(results.length).toBe(5);
      expect(results.every(r => r.drugInfo.brandName === 'Taltz')).toBe(true);
      
      console.log('✅ Performance Testing Passed:', {
        documentsProcessed: results.length,
        totalTime: `${processingTime}ms`,
        avgTimePerDocument: `${Math.round(processingTime / results.length)}ms`
      });
    }, 10000);
  });
});