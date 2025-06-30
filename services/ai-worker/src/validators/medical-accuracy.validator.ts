import { Injectable, Logger } from '@nestjs/common';

export interface MedicalValidationResult {
  valid: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  errors: MedicalValidationError[];
  warnings: MedicalValidationWarning[];
  recommendations: string[];
  confidence: number; // 0-100
}

export interface MedicalValidationError {
  type: 'medical_advice' | 'contraindication_conflict' | 'dosage_instruction' | 'diagnosis_claim' | 'treatment_recommendation';
  message: string;
  severity: 'critical' | 'high' | 'medium';
  location?: string;
  suggestedFix?: string;
}

export interface MedicalValidationWarning {
  type: 'terminology' | 'disclaimer_missing' | 'source_reference' | 'audience_mismatch';
  message: string;
  suggestion: string;
}

export interface MedicalValidationContext {
  contentType: string;
  targetAudience: 'healthcare_provider' | 'patient' | 'general';
  drugData: any;
  originalSource?: string;
}

@Injectable()
export class MedicalAccuracyValidator {
  private readonly logger = new Logger(MedicalAccuracyValidator.name);

  // Critical patterns that should never appear in patient-facing content
  private readonly criticalMedicalAdvicePatterns = [
    /\b(you should take|recommended dose|take this medication)\b/i,
    /\b(start taking|stop taking|increase.*dose|decrease.*dose)\b/i,
    /\b(this will cure|this treats|this prevents)\b/i,
    /\b(safe for you|right for you|best option for you)\b/i,
    /\b(don't need to consult|no need to see|skip.*appointment)\b/i,
  ];

  // Diagnosis and treatment patterns that require medical professional input
  private readonly diagnosisTreatmentPatterns = [
    /\b(you have|you are diagnosed|you suffer from)\b/i,
    /\b(your condition|your disease|your symptoms)\b/i,
    /\b(treatment plan|therapy regimen|medical intervention)\b/i,
    /\b(cure.*condition|treat.*disease|eliminate.*symptoms)\b/i,
  ];

  // Dosage instruction patterns that should only come from healthcare providers
  private readonly dosageInstructionPatterns = [
    /\b(\d+\s*mg.*daily|take.*times.*day|every.*hours)\b/i,
    /\b(morning dose|evening dose|with meals|empty stomach)\b/i,
    /\b(if you miss.*dose|double.*dose|skip.*dose)\b/i,
    /\b(increase to|decrease to|titrate|adjust.*dose)\b/i,
  ];

  // Required disclaimers for different content types
  private readonly requiredDisclaimers = {
    patient: [
      'healthcare provider',
      'doctor',
      'physician',
      'medical professional',
      'prescribing information'
    ],
    general: [
      'healthcare provider',
      'prescribing information'
    ]
  };

  async validateMedicalAccuracy(
    content: string,
    context: MedicalValidationContext
  ): Promise<MedicalValidationResult> {
    this.logger.debug(`Validating medical accuracy for ${context.contentType} (${context.targetAudience})`);

    const errors: MedicalValidationError[] = [];
    const warnings: MedicalValidationWarning[] = [];
    const recommendations: string[] = [];

    // Check for critical medical advice patterns
    const medicalAdviceErrors = this.checkMedicalAdvicePatterns(content, context);
    errors.push(...medicalAdviceErrors);

    // Check for diagnosis and treatment claims
    const diagnosisErrors = this.checkDiagnosisTreatmentClaims(content, context);
    errors.push(...diagnosisErrors);

    // Check for dosage instructions
    const dosageErrors = this.checkDosageInstructions(content, context);
    errors.push(...dosageErrors);

    // Check for required disclaimers
    const disclaimerWarnings = this.checkRequiredDisclaimers(content, context);
    warnings.push(...disclaimerWarnings);

    // Check medical terminology appropriateness
    const terminologyWarnings = this.checkMedicalTerminology(content, context);
    warnings.push(...terminologyWarnings);

    // Check for contraindication conflicts
    const contradictionErrors = this.checkContradictions(content, context);
    errors.push(...contradictionErrors);

    // Check source references
    const sourceWarnings = this.checkSourceReferences(content, context);
    warnings.push(...sourceWarnings);

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(errors, warnings, context));

    // Calculate risk level and confidence
    const riskLevel = this.calculateRiskLevel(errors);
    const confidence = this.calculateConfidence(content, errors, warnings);

    const result: MedicalValidationResult = {
      valid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
      riskLevel,
      errors,
      warnings,
      recommendations,
      confidence,
    };

    this.logger.debug(`Validation complete: ${result.valid ? 'PASS' : 'FAIL'} (risk: ${riskLevel}, confidence: ${confidence}%)`);

    return result;
  }

  private checkMedicalAdvicePatterns(content: string, context: MedicalValidationContext): MedicalValidationError[] {
    const errors: MedicalValidationError[] = [];

    for (const pattern of this.criticalMedicalAdvicePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        errors.push({
          type: 'medical_advice',
          severity: 'critical',
          message: `Content contains medical advice: "${matches[0]}"`,
          location: this.findPatternLocation(content, matches[0]),
          suggestedFix: 'Remove direct medical instructions and refer to healthcare provider',
        });
      }
    }

    // Special check for patient-facing content
    if (context.targetAudience === 'patient') {
      const patientAdvicePatterns = [
        /\b(take this|use this|apply this)\b/i,
        /\b(stop if|continue if|increase if)\b/i,
      ];

      for (const pattern of patientAdvicePatterns) {
        if (pattern.test(content)) {
          errors.push({
            type: 'medical_advice',
            severity: 'high',
            message: 'Patient-facing content contains direct medication instructions',
            suggestedFix: 'Rephrase to indicate this information should be discussed with healthcare provider',
          });
        }
      }
    }

    return errors;
  }

  private checkDiagnosisTreatmentClaims(content: string, context: MedicalValidationContext): MedicalValidationError[] {
    const errors: MedicalValidationError[] = [];

    for (const pattern of this.diagnosisTreatmentPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        errors.push({
          type: 'diagnosis_claim',
          severity: 'high',
          message: `Content makes diagnosis/treatment claims: "${matches[0]}"`,
          location: this.findPatternLocation(content, matches[0]),
          suggestedFix: 'Replace with general information about the condition and refer to healthcare provider for diagnosis',
        });
      }
    }

    return errors;
  }

  private checkDosageInstructions(content: string, context: MedicalValidationContext): MedicalValidationError[] {
    const errors: MedicalValidationError[] = [];

    for (const pattern of this.dosageInstructionPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        const severity = context.targetAudience === 'healthcare_provider' ? 'medium' : 'high';
        errors.push({
          type: 'dosage_instruction',
          severity,
          message: `Content contains specific dosage instructions: "${matches[0]}"`,
          location: this.findPatternLocation(content, matches[0]),
          suggestedFix: context.targetAudience === 'patient' ? 
            'Remove specific dosing and refer to prescribing information' :
            'Ensure dosing information is clearly marked as general guidance',
        });
      }
    }

    return errors;
  }

  private checkRequiredDisclaimers(content: string, context: MedicalValidationContext): MedicalValidationWarning[] {
    const warnings: MedicalValidationWarning[] = [];
    const requiredTerms = this.requiredDisclaimers[context.targetAudience] || 
                         this.requiredDisclaimers.general;

    const hasDisclaimer = requiredTerms.some(term => 
      content.toLowerCase().includes(term.toLowerCase())
    );

    if (!hasDisclaimer) {
      warnings.push({
        type: 'disclaimer_missing',
        message: 'Content lacks appropriate medical disclaimers',
        suggestion: `Add reference to ${requiredTerms[0]} for medical decisions`,
      });
    }

    return warnings;
  }

  private checkMedicalTerminology(content: string, context: MedicalValidationContext): MedicalValidationWarning[] {
    const warnings: MedicalValidationWarning[] = [];

    // Complex medical terms that may need explanation for patients
    const complexTerms = [
      'pharmacokinetics', 'bioavailability', 'contraindication',
      'cytochrome', 'metabolism', 'clearance', 'half-life',
      'therapeutic index', 'bioequivalence', 'hepatic', 'renal'
    ];

    if (context.targetAudience === 'patient') {
      const foundComplexTerms = complexTerms.filter(term => 
        content.toLowerCase().includes(term.toLowerCase())
      );

      if (foundComplexTerms.length > 0) {
        warnings.push({
          type: 'terminology',
          message: `Content contains complex medical terms: ${foundComplexTerms.join(', ')}`,
          suggestion: 'Consider explaining technical terms or using simpler language for patient audience',
        });
      }
    }

    return warnings;
  }

  private checkContradictions(content: string, context: MedicalValidationContext): MedicalValidationError[] {
    const errors: MedicalValidationError[] = [];

    // Check for contradictions with known drug information
    if (context.drugData) {
      const contraindications = context.drugData.label?.contraindications?.toLowerCase() || '';
      const warnings = context.drugData.label?.warningsAndPrecautions?.toLowerCase() || '';

      // Simple contradiction detection (can be enhanced with NLP)
      const conflictPatterns = [
        { pattern: /safe.*all.*patients/i, check: contraindications, message: 'Claims safety for all patients despite contraindications' },
        { pattern: /no.*side.*effects/i, check: warnings, message: 'Claims no side effects despite known warnings' },
        { pattern: /always.*effective/i, check: '', message: 'Makes absolute efficacy claims' },
      ];

      for (const conflict of conflictPatterns) {
        if (conflict.pattern.test(content) && (conflict.check || conflict.message.includes('absolute'))) {
          errors.push({
            type: 'contraindication_conflict',
            severity: 'high',
            message: conflict.message,
            suggestedFix: 'Remove absolute claims and reference prescribing information for complete safety details',
          });
        }
      }
    }

    return errors;
  }

  private checkSourceReferences(content: string, context: MedicalValidationContext): MedicalValidationWarning[] {
    const warnings: MedicalValidationWarning[] = [];

    const hasSourceReference = /\b(FDA|prescribing information|clinical trial|study|research)\b/i.test(content);

    if (!hasSourceReference && context.contentType !== 'seo-title') {
      warnings.push({
        type: 'source_reference',
        message: 'Content lacks source references',
        suggestion: 'Consider adding reference to FDA prescribing information or clinical studies',
      });
    }

    return warnings;
  }

  private generateRecommendations(
    errors: MedicalValidationError[],
    warnings: MedicalValidationWarning[],
    context: MedicalValidationContext
  ): string[] {
    const recommendations: string[] = [];

    if (errors.length > 0) {
      recommendations.push('Review and revise content to remove medical advice and direct instructions');
    }

    if (warnings.some(w => w.type === 'disclaimer_missing')) {
      recommendations.push('Add appropriate medical disclaimers encouraging consultation with healthcare providers');
    }

    if (context.targetAudience === 'patient' && warnings.some(w => w.type === 'terminology')) {
      recommendations.push('Simplify medical terminology or provide explanations for patient understanding');
    }

    if (errors.some(e => e.type === 'contraindication_conflict')) {
      recommendations.push('Verify all claims against official prescribing information');
    }

    return recommendations;
  }

  private calculateRiskLevel(errors: MedicalValidationError[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalErrors = errors.filter(e => e.severity === 'critical');
    const highErrors = errors.filter(e => e.severity === 'high');
    const mediumErrors = errors.filter(e => e.severity === 'medium');

    if (criticalErrors.length > 0) return 'critical';
    if (highErrors.length > 2) return 'high';
    if (highErrors.length > 0 || mediumErrors.length > 3) return 'medium';
    return 'low';
  }

  private calculateConfidence(content: string, errors: MedicalValidationError[], warnings: MedicalValidationWarning[]): number {
    let confidence = 100;

    // Reduce confidence for each error/warning
    confidence -= errors.length * 15;
    confidence -= warnings.length * 5;

    // Adjust for content length (shorter content harder to validate accurately)
    if (content.length < 100) confidence -= 10;
    if (content.length < 50) confidence -= 10;

    // Adjust for medical complexity
    const medicalTermCount = (content.match(/\b(medication|dosage|treatment|therapy|condition)\b/gi) || []).length;
    if (medicalTermCount > 10) confidence -= 5;

    return Math.max(confidence, 10); // Minimum 10% confidence
  }

  private findPatternLocation(content: string, pattern: string): string {
    const index = content.toLowerCase().indexOf(pattern.toLowerCase());
    if (index === -1) return 'Unknown';
    
    const start = Math.max(0, index - 20);
    const end = Math.min(content.length, index + pattern.length + 20);
    return `"...${content.substring(start, end)}..."`;
  }

  // Utility method for batch validation
  async validateMultipleContents(
    contents: Array<{ content: string; context: MedicalValidationContext }>
  ): Promise<MedicalValidationResult[]> {
    const results = await Promise.all(
      contents.map(({ content, context }) => this.validateMedicalAccuracy(content, context))
    );

    this.logger.log(`Batch validation complete: ${contents.length} items processed`);
    return results;
  }
}