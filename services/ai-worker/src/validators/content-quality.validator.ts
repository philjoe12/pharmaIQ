import { Injectable, Logger } from '@nestjs/common';

export interface ContentQualityResult {
  valid: boolean;
  score: number; // 0-100
  metrics: QualityMetrics;
  issues: QualityIssue[];
  suggestions: string[];
  readabilityAnalysis: ReadabilityAnalysis;
}

export interface QualityMetrics {
  clarity: number; // 0-100
  completeness: number; // 0-100
  consistency: number; // 0-100
  accuracy: number; // 0-100
  seoOptimization: number; // 0-100
  userEngagement: number; // 0-100
}

export interface QualityIssue {
  type: 'clarity' | 'grammar' | 'structure' | 'completeness' | 'seo' | 'engagement';
  severity: 'low' | 'medium' | 'high';
  message: string;
  location?: string;
  suggestion: string;
}

export interface ReadabilityAnalysis {
  fleschKincaidGrade: number;
  averageSentenceLength: number;
  averageWordsPerSentence: number;
  syllableCount: number;
  readingLevel: 'elementary' | 'middle_school' | 'high_school' | 'college' | 'graduate';
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
}

export interface ContentQualityContext {
  contentType: 'seo-title' | 'meta-description' | 'faq' | 'provider-explanation' | 'related-drugs';
  targetAudience: 'healthcare_provider' | 'patient' | 'general';
  expectedLength?: { min: number; max: number };
  keywords?: string[];
  drugName?: string;
}

@Injectable()
export class ContentQualityValidator {
  private readonly logger = new Logger(ContentQualityValidator.name);

  // Common grammar and clarity issues
  private readonly clarityPatterns = [
    { pattern: /\b(very|really|quite|rather|pretty|fairly)\b/gi, message: 'Avoid weak modifiers', severity: 'low' as const },
    { pattern: /\b(thing|stuff|things|lot of)\b/gi, message: 'Use specific terms instead of vague language', severity: 'medium' as const },
    { pattern: /\b(it is|there are|there is)\s+(?:important|necessary|essential)/gi, message: 'Use active voice for clarity', severity: 'low' as const },
    { pattern: /\b(in order to|for the purpose of)\b/gi, message: 'Use "to" instead for conciseness', severity: 'low' as const },
    { pattern: /\b(due to the fact that|in light of the fact that)\b/gi, message: 'Use "because" for clarity', severity: 'medium' as const },
  ];

  // SEO optimization patterns
  private readonly seoPatterns = {
    title: {
      optimalLength: { min: 30, max: 60 },
      mustInclude: ['drug name'],
      shouldAvoid: ['excessive capitals', 'special characters'],
    },
    metaDescription: {
      optimalLength: { min: 120, max: 160 },
      mustInclude: ['drug name', 'action word'],
      shouldInclude: ['value proposition'],
    },
  };

  async validateContentQuality(
    content: string,
    context: ContentQualityContext
  ): Promise<ContentQualityResult> {
    this.logger.debug(`Validating content quality for ${context.contentType} (${context.targetAudience})`);

    const issues: QualityIssue[] = [];

    // Analyze readability
    const readabilityAnalysis = this.analyzeReadability(content);

    // Check content structure and clarity
    const clarityIssues = this.checkClarity(content, context);
    issues.push(...clarityIssues);

    // Check grammar and style
    const grammarIssues = this.checkGrammar(content);
    issues.push(...grammarIssues);

    // Check completeness
    const completenessIssues = this.checkCompleteness(content, context);
    issues.push(...completenessIssues);

    // Check SEO optimization
    const seoIssues = this.checkSEOOptimization(content, context);
    issues.push(...seoIssues);

    // Check engagement factors
    const engagementIssues = this.checkEngagement(content, context);
    issues.push(...engagementIssues);

    // Calculate quality metrics
    const metrics = this.calculateQualityMetrics(content, issues, readabilityAnalysis, context);

    // Generate improvement suggestions
    const suggestions = this.generateSuggestions(issues, metrics, context);

    // Calculate overall score
    const score = this.calculateOverallScore(metrics);

    const result: ContentQualityResult = {
      valid: score >= 70 && issues.filter(i => i.severity === 'high').length === 0,
      score,
      metrics,
      issues,
      suggestions,
      readabilityAnalysis,
    };

    this.logger.debug(`Quality validation complete: score ${score}/100 (${result.valid ? 'PASS' : 'FAIL'})`);

    return result;
  }

  private analyzeReadability(content: string): ReadabilityAnalysis {
    const sentences = this.splitIntoSentences(content);
    const words = this.splitIntoWords(content);
    const syllables = this.countSyllables(content);

    const averageSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    const averageWordsPerSentence = averageSentenceLength;
    const averageSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;

    // Flesch-Kincaid Grade Level formula
    const fleschKincaidGrade = 0.39 * averageSentenceLength + 11.8 * averageSyllablesPerWord - 15.59;

    let readingLevel: ReadabilityAnalysis['readingLevel'];
    let complexity: ReadabilityAnalysis['complexity'];

    if (fleschKincaidGrade <= 6) {
      readingLevel = 'elementary';
      complexity = 'simple';
    } else if (fleschKincaidGrade <= 8) {
      readingLevel = 'middle_school';
      complexity = 'simple';
    } else if (fleschKincaidGrade <= 12) {
      readingLevel = 'high_school';
      complexity = 'moderate';
    } else if (fleschKincaidGrade <= 16) {
      readingLevel = 'college';
      complexity = 'complex';
    } else {
      readingLevel = 'graduate';
      complexity = 'very_complex';
    }

    return {
      fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
      averageSentenceLength,
      averageWordsPerSentence,
      syllableCount: syllables,
      readingLevel,
      complexity,
    };
  }

  private checkClarity(content: string, context: ContentQualityContext): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for clarity patterns
    for (const pattern of this.clarityPatterns) {
      const matches = content.match(pattern.pattern);
      if (matches && matches.length > 0) {
        issues.push({
          type: 'clarity',
          severity: pattern.severity,
          message: pattern.message,
          location: `Found ${matches.length} instance(s): "${matches[0]}"`,
          suggestion: `Review and replace with more specific language`,
        });
      }
    }

    // Check sentence length for target audience
    const sentences = this.splitIntoSentences(content);
    const longSentences = sentences.filter(s => this.splitIntoWords(s).length > 25);
    
    if (longSentences.length > 0 && context.targetAudience === 'patient') {
      issues.push({
        type: 'clarity',
        severity: 'medium',
        message: `${longSentences.length} sentences are too long for patient audience`,
        suggestion: 'Break long sentences into shorter, clearer statements',
      });
    }

    // Check for jargon appropriateness
    const medicalJargon = [
      'contraindication', 'pharmacokinetics', 'bioavailability', 'cytochrome',
      'metabolism', 'clearance', 'half-life', 'bioequivalence'
    ];

    if (context.targetAudience === 'patient') {
      const foundJargon = medicalJargon.filter(term => 
        content.toLowerCase().includes(term.toLowerCase())
      );

      if (foundJargon.length > 0) {
        issues.push({
          type: 'clarity',
          severity: 'medium',
          message: `Medical jargon may be unclear for patients: ${foundJargon.join(', ')}`,
          suggestion: 'Define technical terms or use simpler alternatives',
        });
      }
    }

    return issues;
  }

  private checkGrammar(content: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Basic grammar checks
    const grammarPatterns = [
      { pattern: /\b(it's|its)\b/gi, check: this.checkItsUsage, message: "Check it's vs its usage" },
      { pattern: /\b(affect|effect)\b/gi, check: this.checkAffectEffect, message: "Verify affect vs effect usage" },
      { pattern: /\s{2,}/g, check: null, message: "Multiple spaces found" },
      { pattern: /[.!?]\s*[a-z]/g, check: null, message: "Sentences should start with capital letters" },
    ];

    for (const grammarPattern of grammarPatterns) {
      const matches = content.match(grammarPattern.pattern);
      if (matches && matches.length > 0) {
        issues.push({
          type: 'grammar',
          severity: 'low',
          message: grammarPattern.message,
          location: `Found ${matches.length} instance(s)`,
          suggestion: 'Review and correct grammar issues',
        });
      }
    }

    return issues;
  }

  private checkCompleteness(content: string, context: ContentQualityContext): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check content length appropriateness
    const expectedLength = context.expectedLength || this.getExpectedLength(context.contentType);
    
    if (content.length < expectedLength.min) {
      issues.push({
        type: 'completeness',
        severity: 'high',
        message: `Content too short: ${content.length} characters (min: ${expectedLength.min})`,
        suggestion: 'Add more relevant information to meet minimum length requirements',
      });
    }

    if (content.length > expectedLength.max) {
      issues.push({
        type: 'completeness',
        severity: 'medium',
        message: `Content too long: ${content.length} characters (max: ${expectedLength.max})`,
        suggestion: 'Condense content to stay within optimal length',
      });
    }

    // Check for required elements based on content type
    const requiredElements = this.getRequiredElements(context.contentType);
    for (const element of requiredElements) {
      if (!this.containsElement(content, element, context)) {
        issues.push({
          type: 'completeness',
          severity: 'medium',
          message: `Missing required element: ${element}`,
          suggestion: `Include ${element} in the content`,
        });
      }
    }

    return issues;
  }

  private checkSEOOptimization(content: string, context: ContentQualityContext): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // SEO checks based on content type
    if (context.contentType === 'seo-title') {
      if (context.drugName && !content.toLowerCase().includes(context.drugName.toLowerCase())) {
        issues.push({
          type: 'seo',
          severity: 'high',
          message: 'Title does not include drug name',
          suggestion: 'Include the drug name prominently in the title',
        });
      }

      // Check for power words
      const powerWords = ['complete', 'guide', 'information', 'facts', 'prescribing'];
      const hasPowerWord = powerWords.some(word => content.toLowerCase().includes(word));
      
      if (!hasPowerWord) {
        issues.push({
          type: 'seo',
          severity: 'low',
          message: 'Title lacks compelling power words',
          suggestion: 'Consider adding words like "guide", "complete", or "information"',
        });
      }
    }

    if (context.contentType === 'meta-description') {
      const hasActionWord = /\b(learn|discover|find|explore|get|understand)\b/i.test(content);
      if (!hasActionWord) {
        issues.push({
          type: 'seo',
          severity: 'medium',
          message: 'Meta description lacks action words',
          suggestion: 'Include action words like "learn", "discover", or "find"',
        });
      }
    }

    return issues;
  }

  private checkEngagement(content: string, context: ContentQualityContext): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for engagement factors
    const engagementFactors = {
      questions: /\?/g,
      personalPronouns: /\b(you|your|yours)\b/gi,
      activeVoice: /\b(provides|offers|helps|supports|enables)\b/gi,
      benefits: /\b(benefit|advantage|help|improve|enhance)\b/gi,
    };

    let engagementScore = 0;

    for (const [factor, pattern] of Object.entries(engagementFactors)) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        engagementScore += matches.length;
      }
    }

    if (engagementScore < 2 && context.contentType === 'faq') {
      issues.push({
        type: 'engagement',
        severity: 'medium',
        message: 'Content lacks engaging elements',
        suggestion: 'Add more questions, benefits, or direct address to increase engagement',
      });
    }

    return issues;
  }

  private calculateQualityMetrics(
    content: string,
    issues: QualityIssue[],
    readability: ReadabilityAnalysis,
    context: ContentQualityContext
  ): QualityMetrics {
    // Calculate individual metrics (0-100 scale)
    
    const clarity = this.calculateClarityScore(issues, readability, context);
    const completeness = this.calculateCompletenessScore(content, issues, context);
    const consistency = this.calculateConsistencyScore(content, issues);
    const accuracy = this.calculateAccuracyScore(issues);
    const seoOptimization = this.calculateSEOScore(content, issues, context);
    const userEngagement = this.calculateEngagementScore(content, issues, context);

    return {
      clarity,
      completeness,
      consistency,
      accuracy,
      seoOptimization,
      userEngagement,
    };
  }

  private calculateClarityScore(issues: QualityIssue[], readability: ReadabilityAnalysis, context: ContentQualityContext): number {
    let score = 100;
    
    // Deduct for clarity issues
    const clarityIssues = issues.filter(i => i.type === 'clarity');
    score -= clarityIssues.length * 10;

    // Adjust for readability level vs target audience
    if (context.targetAudience === 'patient' && readability.readingLevel === 'graduate') {
      score -= 20;
    } else if (context.targetAudience === 'general' && readability.readingLevel === 'graduate') {
      score -= 10;
    }

    return Math.max(score, 0);
  }

  private calculateCompletenessScore(content: string, issues: QualityIssue[], context: ContentQualityContext): number {
    let score = 100;
    
    const completenessIssues = issues.filter(i => i.type === 'completeness');
    score -= completenessIssues.length * 15;

    return Math.max(score, 0);
  }

  private calculateConsistencyScore(content: string, issues: QualityIssue[]): number {
    let score = 100;
    
    // Check for consistent terminology
    const grammarIssues = issues.filter(i => i.type === 'grammar');
    score -= grammarIssues.length * 5;

    return Math.max(score, 0);
  }

  private calculateAccuracyScore(issues: QualityIssue[]): number {
    let score = 100;
    
    // This would integrate with medical accuracy validator
    // For now, assume high accuracy if no major issues
    const highSeverityIssues = issues.filter(i => i.severity === 'high');
    score -= highSeverityIssues.length * 20;

    return Math.max(score, 0);
  }

  private calculateSEOScore(content: string, issues: QualityIssue[], context: ContentQualityContext): number {
    let score = 100;
    
    const seoIssues = issues.filter(i => i.type === 'seo');
    score -= seoIssues.length * 15;

    return Math.max(score, 0);
  }

  private calculateEngagementScore(content: string, issues: QualityIssue[], context: ContentQualityContext): number {
    let score = 100;
    
    const engagementIssues = issues.filter(i => i.type === 'engagement');
    score -= engagementIssues.length * 10;

    return Math.max(score, 0);
  }

  private calculateOverallScore(metrics: QualityMetrics): number {
    // Weighted average of all metrics
    const weights = {
      clarity: 0.25,
      completeness: 0.20,
      consistency: 0.15,
      accuracy: 0.20,
      seoOptimization: 0.10,
      userEngagement: 0.10,
    };

    return Math.round(
      metrics.clarity * weights.clarity +
      metrics.completeness * weights.completeness +
      metrics.consistency * weights.consistency +
      metrics.accuracy * weights.accuracy +
      metrics.seoOptimization * weights.seoOptimization +
      metrics.userEngagement * weights.userEngagement
    );
  }

  private generateSuggestions(issues: QualityIssue[], metrics: QualityMetrics, context: ContentQualityContext): string[] {
    const suggestions: string[] = [];

    if (metrics.clarity < 80) {
      suggestions.push('Improve clarity by using simpler sentence structures and avoiding vague language');
    }

    if (metrics.completeness < 80) {
      suggestions.push('Add more comprehensive information to meet content requirements');
    }

    if (metrics.seoOptimization < 80) {
      suggestions.push('Optimize for search engines by including target keywords and action words');
    }

    if (metrics.userEngagement < 80) {
      suggestions.push('Increase engagement with questions, benefits, and direct reader address');
    }

    // Add specific suggestions from issues
    const uniqueSuggestions = new Set(issues.map(i => i.suggestion));
    suggestions.push(...Array.from(uniqueSuggestions));

    return suggestions;
  }

  // Helper methods
  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private splitIntoWords(text: string): string[] {
    return text.toLowerCase().match(/\b\w+\b/g) || [];
  }

  private countSyllables(text: string): number {
    const words = this.splitIntoWords(text);
    return words.reduce((total, word) => total + this.countSyllablesInWord(word), 0);
  }

  private countSyllablesInWord(word: string): number {
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i].toLowerCase());
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    // Handle silent e
    if (word.endsWith('e') && count > 1) {
      count--;
    }

    return Math.max(count, 1);
  }

  private getExpectedLength(contentType: string): { min: number; max: number } {
    const lengths = {
      'seo-title': { min: 30, max: 60 },
      'meta-description': { min: 120, max: 160 },
      'faq': { min: 200, max: 2000 },
      'provider-explanation': { min: 100, max: 800 },
      'related-drugs': { min: 150, max: 600 },
    };

    return lengths[contentType] || { min: 50, max: 500 };
  }

  private getRequiredElements(contentType: string): string[] {
    const elements = {
      'seo-title': ['drug name'],
      'meta-description': ['drug name', 'action word'],
      'faq': ['question', 'answer'],
      'provider-explanation': ['drug information'],
      'related-drugs': ['drug suggestions'],
    };

    return elements[contentType] || [];
  }

  private containsElement(content: string, element: string, context: ContentQualityContext): boolean {
    switch (element) {
      case 'drug name':
        return context.drugName ? content.toLowerCase().includes(context.drugName.toLowerCase()) : true;
      case 'action word':
        return /\b(learn|discover|find|explore|get|understand)\b/i.test(content);
      case 'question':
        return content.includes('?');
      case 'answer':
        return content.includes('A:') || content.length > 50;
      default:
        return true;
    }
  }

  private checkItsUsage(context: string): boolean {
    // Simplified check - would need more sophisticated analysis
    return true;
  }

  private checkAffectEffect(context: string): boolean {
    // Simplified check - would need more sophisticated analysis
    return true;
  }
}