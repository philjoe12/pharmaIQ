import { PromptContext } from '../../providers/ai-provider.interface';

export interface SEOTitleContext extends PromptContext {
  drugName: string;
  genericName?: string;
  manufacturer: string;
  indication?: string;
  targetKeywords?: string[];
}

export class SEOTitlePrompt {
  static generate(drugData: any, context?: SEOTitleContext): string {
    const drugName = drugData.drugName || context?.drugName || 'Unknown Drug';
    const genericName = drugData.genericName || drugData.label?.genericName || context?.genericName;
    const manufacturer = drugData.manufacturer || drugData.labeler || context?.manufacturer || 'Unknown Manufacturer';
    const indication = drugData.label?.indicationsAndUsage || context?.indication;
    const keywords = context?.targetKeywords || [];

    let prompt = `Create an SEO-optimized title for the prescription drug "${drugName}"

DRUG INFORMATION:
- Brand Name: ${drugName}`;

    if (genericName && genericName !== drugName) {
      prompt += `\n- Generic Name: ${genericName}`;
    }

    prompt += `\n- Manufacturer: ${manufacturer}`;

    if (indication) {
      const shortIndication = indication.substring(0, 200);
      prompt += `\n- Primary Indication: ${shortIndication}`;
    }

    if (keywords.length > 0) {
      prompt += `\n- Target Keywords: ${keywords.join(', ')}`;
    }

    prompt += `

REQUIREMENTS:
- Maximum 60 characters (Google title limit)
- Include the drug name prominently
- Focus on medical information lookup, NOT treatment advice
- Appeal to healthcare professionals and patients seeking information
- Use natural, readable language
- Avoid medical advice or prescribing language
- Include generic name if different from brand name
- Consider search intent for drug information

EXAMPLES OF GOOD TITLES:
- "Humira (Adalimumab) - Prescribing Information & Drug Facts"
- "Aspirin 81mg - Uses, Dosage & Safety Information"
- "Metformin HCl - Diabetes Medication Information Guide"

Generate a single, optimized title that follows these guidelines:`;

    return prompt;
  }

  static validate(title: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!title || title.trim().length === 0) {
      errors.push('Title cannot be empty');
    }

    if (title.length > 60) {
      errors.push(`Title too long: ${title.length} characters (max 60)`);
    }

    if (title.length < 10) {
      errors.push(`Title too short: ${title.length} characters (min 10)`);
    }

    // Check for problematic medical advice language
    const medicalAdvicePatterns = [
      /\b(treat|cure|diagnose|prescribe)\b/i,
      /\b(best|recommended|should take)\b/i,
      /\b(medical advice|consult)\b/i,
    ];

    for (const pattern of medicalAdvicePatterns) {
      if (pattern.test(title)) {
        errors.push('Title contains medical advice language');
        break;
      }
    }

    // Check for good SEO patterns
    if (!/\b(information|facts|guide|prescribing)\b/i.test(title)) {
      errors.push('Consider including informational keywords like "information", "facts", or "guide"');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static optimize(title: string, drugName: string): string {
    // Basic optimization suggestions
    let optimized = title.trim();

    // Ensure drug name is prominent
    if (!optimized.toLowerCase().includes(drugName.toLowerCase())) {
      optimized = `${drugName} - ${optimized}`;
    }

    // Add informational context if missing
    if (!/\b(information|facts|guide|prescribing|drug)\b/i.test(optimized)) {
      if (optimized.length < 45) {
        optimized += ' - Drug Information';
      }
    }

    // Truncate if too long
    if (optimized.length > 60) {
      optimized = optimized.substring(0, 57) + '...';
    }

    return optimized;
  }
}