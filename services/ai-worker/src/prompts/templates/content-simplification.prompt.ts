import { PromptContext } from '../../providers/ai-provider.interface';

export interface ContentSimplificationContext extends PromptContext {
  drugName: string;
  targetAudience: 'healthcare_provider' | 'patient' | 'general';
  readingLevel?: 'high_school' | 'college' | 'graduate';
  maxLength?: number;
}

export class ContentSimplificationPrompt {
  static generate(drugData: any, context?: ContentSimplificationContext): string {
    const drugName = drugData.drugName || context?.drugName || 'Unknown Drug';
    const targetAudience = context?.targetAudience || 'general';
    const readingLevel = context?.readingLevel || 'high_school';
    const maxLength = context?.maxLength || 500;
    
    const originalContent = drugData.label?.indicationsAndUsage || 
                           drugData.label?.description || 
                           drugData.label?.clinicalPharmacology;

    if (!originalContent) {
      return `Create a simplified explanation of ${drugName} for ${targetAudience} audience.

Since no specific content was provided, create a general explanation focusing on:
- What ${drugName} is (generic name if different)
- What conditions it's FDA-approved to treat
- How it works in simple terms
- Important safety considerations
- That patients should consult healthcare providers

Keep the language appropriate for ${readingLevel} reading level and under ${maxLength} characters.`;
    }

    let prompt = `Simplify the following medical content about ${drugName} for a ${targetAudience} audience.

ORIGINAL CONTENT:
"${originalContent.substring(0, 1000)}"

SIMPLIFICATION REQUIREMENTS:
- Target Audience: ${targetAudience}
- Reading Level: ${readingLevel}
- Maximum Length: ${maxLength} characters
- Use plain language and avoid medical jargon
- Explain technical terms when necessary
- Maintain medical accuracy while improving readability
- Include appropriate disclaimers for patient-facing content
- Focus on key information that matters to the target audience

GUIDELINES BY AUDIENCE:

Healthcare Providers:
- Maintain clinical terminology but add context
- Focus on prescribing considerations
- Include mechanism of action in simplified terms
- Emphasize monitoring and safety considerations

Patients:
- Use everyday language
- Explain medical terms in parentheses
- Focus on practical information
- Include "talk to your doctor" statements
- Avoid complex medical concepts

General Public:
- Balance between professional and accessible
- Define key medical terms
- Focus on educational value
- Include appropriate medical disclaimers

CONTENT STRUCTURE:
1. What it is (drug name and category)
2. What it's used for (main indications)
3. How it works (simplified mechanism)
4. Important considerations (key safety info)
5. Next steps (consulting healthcare providers)

Generate simplified content that maintains accuracy while being accessible to the ${targetAudience} audience:`;

    return prompt;
  }

  static validate(content: string, context?: ContentSimplificationContext): { valid: boolean; errors: string[]; readabilityScore?: number } {
    const errors: string[] = [];
    
    if (!content || content.trim().length === 0) {
      errors.push('Simplified content cannot be empty');
      return { valid: false, errors };
    }

    const maxLength = context?.maxLength || 500;
    if (content.length > maxLength) {
      errors.push(`Content too long: ${content.length} characters (max ${maxLength})`);
    }

    // Check for overly complex medical jargon
    const complexTerms = [
      'pharmacokinetics', 'bioavailability', 'hepatic metabolism',
      'cytochrome P450', 'renal clearance', 'half-life elimination',
      'therapeutic index', 'bioequivalence'
    ];

    const foundComplexTerms = complexTerms.filter(term => 
      content.toLowerCase().includes(term.toLowerCase())
    );

    if (foundComplexTerms.length > 0 && context?.targetAudience === 'patient') {
      errors.push(`Contains complex medical terms for patient audience: ${foundComplexTerms.join(', ')}`);
    }

    // Check for appropriate disclaimers for patient content
    if (context?.targetAudience === 'patient' || context?.targetAudience === 'general') {
      if (!/\b(healthcare provider|doctor|physician|medical professional)\b/i.test(content)) {
        errors.push('Patient-facing content should include references to healthcare providers');
      }
    }

    // Basic readability check (simplified)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = words.length / sentences.length;

    let readabilityScore = 0;
    
    // Simple readability scoring
    if (avgWordsPerSentence <= 15) readabilityScore += 3;
    else if (avgWordsPerSentence <= 20) readabilityScore += 2;
    else readabilityScore += 1;

    // Check for simple word usage
    const simpleWords = words.filter(word => word.length <= 6).length;
    const simpleWordRatio = simpleWords / words.length;
    
    if (simpleWordRatio >= 0.7) readabilityScore += 2;
    else if (simpleWordRatio >= 0.5) readabilityScore += 1;

    return {
      valid: errors.length === 0,
      errors,
      readabilityScore,
    };
  }

  static getReadingLevelGuidelines(level: string): string {
    switch (level) {
      case 'high_school':
        return 'Use sentences under 15 words, common vocabulary, explain medical terms';
      case 'college':
        return 'Use sentences under 20 words, some technical terms acceptable with explanations';
      case 'graduate':
        return 'Professional language acceptable, maintain clarity and precision';
      default:
        return 'Use clear, accessible language appropriate for general audience';
    }
  }

  static getAudienceGuidelines(audience: string): string {
    switch (audience) {
      case 'healthcare_provider':
        return 'Clinical accuracy, prescribing considerations, professional terminology with context';
      case 'patient':
        return 'Practical information, everyday language, safety focus, healthcare provider references';
      case 'general':
        return 'Educational balance, defined terms, broad accessibility, medical disclaimers';
      default:
        return 'Clear, informative content suitable for general readership';
    }
  }
}