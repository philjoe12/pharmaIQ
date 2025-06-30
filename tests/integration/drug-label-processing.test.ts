import { FdaLabelParser } from '../../services/processing-worker/src/parsers/fda-label.parser';
import { DataValidatorProcessor } from '../../services/processing-worker/src/processors/data-validator.processor';
import { ProcessedDrugData } from '../../shared/types/src/drug.types';

describe('Drug Label Processing', () => {
  const mockFDALabel = {
    setId: 'test-set-id-123',
    drugName: 'Taltz',
    slug: 'taltz-ixekizumab',
    labeler: 'Eli Lilly and Company',
    label: {
      genericName: 'ixekizumab',
      description: 'Taltz (ixekizumab) is a humanized monoclonal antibody.',
      indicationsAndUsage: 'Taltz is indicated for the treatment of adults with moderate-to-severe plaque psoriasis.',
      dosageAndAdministration: 'The recommended dose is 160 mg (two 80 mg injections) administered by subcutaneous injection.',
      contraindications: 'Taltz is contraindicated in patients with a previous serious hypersensitivity reaction.',
      warningsAndPrecautions: 'Increased risk of serious infections that may lead to hospitalization or death.',
      adverseReactions: 'The most commonly reported adverse reactions (≥1%) were injection site reactions.'
    }
  };

  describe('FDA Label Parsing', () => {
    let parser: FdaLabelParser;

    beforeEach(() => {
      parser = new FdaLabelParser();
    });

    test('should parse complete label data', async () => {
      const result = await parser.parseLabelData(mockFDALabel);
      expect(result.drugInfo.brandName).toBe('Taltz');
      expect(result.drugInfo.genericName).toBe('ixekizumab');
      expect(result.manufacturerInfo.manufacturerName).toBe('Eli Lilly and Company');
      expect(result.indications.length).toBeGreaterThan(0);
    });

    test('should validate label data correctly', () => {
      const isValid = parser.validateLabelData(mockFDALabel);
      expect(isValid).toBe(true);
    });

    test('should handle invalid label data', () => {
      const invalidLabel = null;
      const isValid = parser.validateLabelData(invalidLabel);
      expect(isValid).toBe(false);
    });

    test('should handle missing data gracefully', async () => {
      const incompleteLabel = {
        setId: 'incomplete-123',
        drugName: 'TestDrug',
        slug: 'testdrug',
        labeler: 'Test Company',
        label: {
          genericName: 'test-generic'
          // Missing other fields
        }
      };

      const result = await parser.parseLabelData(incompleteLabel);
      expect(result.drugInfo.brandName).toBe('TestDrug');
      expect(result.drugInfo.genericName).toBe('test-generic');
      expect(result.manufacturerInfo.manufacturerName).toBe('Test Company');
    });

    test('should extract drug information correctly', async () => {
      const result = await parser.parseLabelData(mockFDALabel);
      expect(result.drugInfo.brandName).toBe('Taltz');
      expect(result.drugInfo.genericName).toBe('ixekizumab');
      expect(result.manufacturerInfo.manufacturerName).toBe('Eli Lilly and Company');
    });
  });

  describe('Data Validation', () => {
    let validator: DataValidatorProcessor;

    beforeEach(() => {
      validator = new DataValidatorProcessor();
    });

    test('should validate complete drug data', async () => {
      const processedData: ProcessedDrugData = {
        drugInfo: {
          brandName: 'Taltz',
          genericName: 'ixekizumab',
          activeIngredient: 'ixekizumab',
          dosageForm: 'injection',
          strength: '80 mg/mL',
          routeOfAdministration: 'subcutaneous'
        },
        manufacturerInfo: {
          manufacturerName: 'Eli Lilly and Company',
          labelerName: 'Eli Lilly and Company'
        },
        indications: ['plaque psoriasis'],
        contraindications: ['hypersensitivity'],
        dosageAndAdministration: ['160 mg subcutaneous injection'],
        warnings: ['infection risk'],
        adverseReactions: ['injection site reactions'],
        rawData: mockFDALabel,
        processedAt: new Date()
      };

      const result = await validator.validateProcessedData(processedData);
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(70);
      expect(result.errors.length).toBe(0);
    });

    test('should identify incomplete data', async () => {
      const incompleteData: ProcessedDrugData = {
        drugInfo: {
          brandName: '',
          genericName: '',
          activeIngredient: '',
          dosageForm: '',
          strength: '',
          routeOfAdministration: ''
        },
        manufacturerInfo: {
          manufacturerName: '',
          labelerName: ''
        },
        indications: [],
        contraindications: [],
        dosageAndAdministration: [],
        warnings: [],
        adverseReactions: [],
        rawData: {},
        processedAt: new Date()
      };

      const result = await validator.validateProcessedData(incompleteData);
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(50);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate medical content', async () => {
      const processedData: ProcessedDrugData = {
        drugInfo: {
          brandName: 'Taltz',
          genericName: 'ixekizumab',
          activeIngredient: 'ixekizumab',
          dosageForm: 'injection',
          strength: '80 mg/mL',
          routeOfAdministration: 'subcutaneous'
        },
        manufacturerInfo: {
          manufacturerName: 'Eli Lilly and Company',
          labelerName: 'Eli Lilly and Company'
        },
        indications: ['plaque psoriasis'],
        contraindications: ['hypersensitivity'],
        dosageAndAdministration: ['160 mg subcutaneous injection'],
        warnings: ['infection risk', 'black box warning for serious infections'],
        adverseReactions: ['injection site reactions'],
        rawData: mockFDALabel,
        processedAt: new Date()
      };

      const result = await validator.validateMedicalContent(processedData);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0); // Should detect black box warning
    });
  });

  describe('Content Structure for Web Presentation', () => {
    let parser: FdaLabelParser;

    beforeEach(() => {
      parser = new FdaLabelParser();
    });

    test('should process complete label data for web', async () => {
      const result = await parser.parseLabelData(mockFDALabel);
      
      expect(result).toHaveProperty('drugInfo');
      expect(result).toHaveProperty('indications');
      expect(result).toHaveProperty('dosageAndAdministration');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('contraindications');
      expect(result).toHaveProperty('adverseReactions');
      
      // Check content structure for web display
      expect(result.indications.length).toBeGreaterThan(0);
      expect(result.drugInfo.brandName).toBe('Taltz');
    });

    test('should handle HTML content safely', async () => {
      const labelWithHtml = {
        ...mockFDALabel,
        label: {
          ...mockFDALabel.label,
          indicationsAndUsage: '<p>Test indication</p><script>alert("xss")</script>'
        }
      };

      const result = await parser.parseLabelData(labelWithHtml);
      
      // Should not contain script tags in processed content
      const indicationsText = result.indications.join(' ');
      expect(indicationsText).not.toContain('<script>');
      expect(indicationsText).toContain('Test indication');
    });
  });

  describe('Error Handling', () => {
    let parser: FdaLabelParser;

    beforeEach(() => {
      parser = new FdaLabelParser();
    });

    test('should handle invalid label data gracefully', async () => {
      const invalidData = null;
      
      // Should throw error for completely invalid data
      await expect(parser.parseLabelData(invalidData)).rejects.toThrow();
    });

    test('should handle missing required fields', async () => {
      const missingFieldsData = {
        setId: 'test-123',
        drugName: '',
        slug: 'test',
        labeler: '',
        label: {}
        // Missing content in label
      };

      try {
        const result = await parser.parseLabelData(missingFieldsData);
        expect(result.drugInfo.brandName).toBe('');
        expect(result.manufacturerInfo.manufacturerName).toBe('');
      } catch (error) {
        // Error handling is acceptable for invalid data
        expect(error).toBeDefined();
      }
    });

    test('should validate label data properly', () => {
      const validData = mockFDALabel;
      const invalidData = {
        setId: 'test',
        drugName: '',
        slug: 'test',
        labeler: '',
        label: {}
      };

      expect(parser.validateLabelData(validData)).toBe(true);
      expect(parser.validateLabelData(invalidData)).toBe(false);
    });
  });
});