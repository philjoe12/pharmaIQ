import { PromptContext } from '../../providers/ai-provider.interface';

export interface MetaDescriptionContext extends PromptContext {
  drugName: string;
  genericName?: string;
  manufacturer: string;
  indication?: string;
  targetKeywords?: string[];
}

export class MetaDescriptionPrompt {
  static generate(drugData: any, context?: MetaDescriptionContext): string {
    const drugName = drugData.drugName || context?.drugName || 'Unknown Drug';
    const genericName = drugData.genericName || drugData.label?.genericName || context?.genericName;
    const manufacturer = drugData.manufacturer || drugData.labeler || context?.manufacturer || 'Unknown Manufacturer';
    const indication = drugData.label?.indicationsAndUsage || context?.indication;
    const dosage = drugData.label?.dosageAndAdministration;
    const warnings = drugData.label?.warningsAndPrecautions;

    let prompt = `Create an SEO-optimized meta description for the prescription drug "${drugName}"

DRUG INFORMATION:
- Brand Name: ${drugName}`;

    if (genericName && genericName !== drugName) {
      prompt += `\n- Generic Name: ${genericName}`;
    }

    prompt += `\n- Manufacturer: ${manufacturer}`;

    if (indication) {
      const shortIndication = indication.substring(0, 300);
      prompt += `\n- Primary Uses: ${shortIndication}`;
    }

    if (dosage) {
      const shortDosage = dosage.substring(0, 200);
      prompt += `\n- Dosage Information: ${shortDosage}`;
    }

    if (warnings) {
      const shortWarnings = warnings.substring(0, 200);
      prompt += `\n- Key Warnings: ${shortWarnings}`;
    }

    prompt += `

REQUIREMENTS:
- 150-160 characters maximum (Google meta description limit)
- Minimum 120 characters for good SEO
- Include the drug name and generic name if different
- Mention primary indication/use case
- Include "prescribing information" or "drug facts"
- Appeal to both healthcare providers and patients
- Use action words like "Learn", "Find", "Discover"
- NO medical advice or treatment recommendations
- Focus on information availability, not medical guidance
- Include manufacturer name if space allows

EXAMPLES OF GOOD META DESCRIPTIONS:
- "Learn about Humira (adalimumab) prescribing information, dosage, side effects, and safety data. Complete drug facts from AbbVie for healthcare professionals."
- "Comprehensive Metformin HCl drug information including uses for diabetes, dosage guidelines, side effects, and prescribing details for medical professionals."
- "Aspirin 81mg drug facts: uses, dosage, contraindications, and safety information. Essential prescribing data for healthcare providers and patients."

Generate a single, compelling meta description that follows these guidelines:`;

    return prompt;
  }

  static validate(description: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!description || description.trim().length === 0) {
      errors.push('Meta description cannot be empty');
    }

    if (description.length > 160) {
      errors.push(`Meta description too long: ${description.length} characters (max 160)`);
    }

    if (description.length < 120) {
      errors.push(`Meta description too short: ${description.length} characters (min 120 for good SEO)`);
    }

    // Check for problematic medical advice language
    const medicalAdvicePatterns = [
      /\b(treat your|cure your|diagnose|prescribe for you)\b/i,
      /\b(should take|recommended dose|medical advice)\b/i,
      /\b(best treatment|consult.*doctor)\b/i,
    ];

    for (const pattern of medicalAdvicePatterns) {
      if (pattern.test(description)) {
        errors.push('Meta description contains medical advice language');
        break;
      }
    }

    // Check for good informational patterns
    if (!/\b(information|facts|prescribing|learn|find|discover)\b/i.test(description)) {
      errors.push('Consider including action words like "learn", "find", or "information"');
    }

    // Check for drug name mention
    if (!/\b(drug|medication|prescribing|pharmaceutical)\b/i.test(description)) {
      errors.push('Consider mentioning that this is about drug/medication information');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static optimize(description: string, drugName: string, genericName?: string): string {
    let optimized = description.trim();

    // Ensure drug name is mentioned
    if (!optimized.toLowerCase().includes(drugName.toLowerCase())) {
      optimized = `${drugName} drug information: ${optimized}`;
    }

    // Add generic name if not mentioned but available
    if (genericName && 
        genericName !== drugName && 
        !optimized.toLowerCase().includes(genericName.toLowerCase()) &&
        optimized.length < 130) {
      optimized = optimized.replace(drugName, `${drugName} (${genericName})`);
    }

    // Add informational context if missing and space allows
    if (!/\b(information|facts|prescribing)\b/i.test(optimized) && optimized.length < 140) {
      optimized += ' - prescribing information.';
    }

    // Truncate if too long
    if (optimized.length > 160) {
      // Try to truncate at a word boundary
      const truncated = optimized.substring(0, 157);
      const lastSpace = truncated.lastIndexOf(' ');
      optimized = truncated.substring(0, lastSpace) + '...';
    }

    return optimized;
  }
}