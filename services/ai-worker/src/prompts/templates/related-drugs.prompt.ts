import { PromptContext } from '../../providers/ai-provider.interface';

export interface RelatedDrugsContext extends PromptContext {
  drugName: string;
  genericName?: string;
  therapeuticClass?: string;
  indication?: string;
  mechanism?: string;
  excludeDrugs?: string[];
  maxSuggestions?: number;
}

export class RelatedDrugsPrompt {
  static generate(drugData: any, context?: RelatedDrugsContext): string {
    const drugName = drugData.drugName || context?.drugName || 'Unknown Drug';
    const genericName = drugData.genericName || drugData.label?.genericName || context?.genericName;
    const indication = drugData.label?.indicationsAndUsage || context?.indication;
    const mechanism = drugData.label?.clinicalPharmacology || context?.mechanism;
    const excludeDrugs = context?.excludeDrugs || [];
    const maxSuggestions = context?.maxSuggestions || 5;

    let prompt = `Suggest ${maxSuggestions} related prescription drugs to ${drugName} based on therapeutic similarities.

CURRENT DRUG INFORMATION:
- Brand Name: ${drugName}`;

    if (genericName && genericName !== drugName) {
      prompt += `\n- Generic Name: ${genericName}`;
    }

    if (indication) {
      const shortIndication = indication.substring(0, 400);
      prompt += `\n- Primary Indications: ${shortIndication}`;
    }

    if (mechanism) {
      const shortMechanism = mechanism.substring(0, 300);
      prompt += `\n- Mechanism of Action: ${shortMechanism}`;
    }

    if (excludeDrugs.length > 0) {
      prompt += `\n- Exclude from suggestions: ${excludeDrugs.join(', ')}`;
    }

    prompt += `

RELATIONSHIP CRITERIA (prioritize in this order):
1. Same therapeutic class or mechanism of action
2. Same primary indication or treatment area
3. Alternative treatments for the same condition
4. Drugs commonly compared by healthcare providers
5. Different formulations or dosing options for similar conditions

REQUIREMENTS FOR EACH SUGGESTION:
- Must be FDA-approved prescription medications
- Include both brand name and generic name if different
- Briefly explain the relationship (same class, alternative treatment, etc.)
- Mention key differentiating factors (dosing, mechanism, patient population)
- Focus on clinical relationships, not marketing comparisons
- Avoid suggesting inappropriate alternatives

CRITICAL GUIDELINES:
- Never suggest drugs as "better" or "worse" than the current drug
- Avoid making treatment recommendations
- Focus on factual, clinical relationships
- Include appropriate disclaimers about consulting healthcare providers
- Do not suggest over-the-counter alternatives unless specifically relevant

FORMAT FOR EACH SUGGESTION:
[Brand Name] ([Generic Name]) - [Relationship explanation]. [Key differentiating factor]. Consult healthcare provider for appropriate treatment decisions.

EXAMPLE FORMAT:
"Adalimumab (Humira) - Same therapeutic class as TNF inhibitor for autoimmune conditions. Administered via injection with different dosing schedule. Healthcare providers can determine the most appropriate TNF inhibitor based on patient factors."

Generate ${maxSuggestions} clinically relevant drug suggestions following these guidelines:`;

    return prompt;
  }

  static validate(suggestions: string, context?: RelatedDrugsContext): { valid: boolean; errors: string[]; drugCount: number } {
    const errors: string[] = [];
    
    if (!suggestions || suggestions.trim().length === 0) {
      errors.push('Related drugs suggestions cannot be empty');
      return { valid: false, errors, drugCount: 0 };
    }

    // Count suggested drugs (look for parentheses pattern indicating generic names)
    const drugMatches = suggestions.match(/\([^)]+\)/g);
    const drugCount = drugMatches?.length || 0;

    const expectedCount = context?.maxSuggestions || 5;
    if (drugCount < expectedCount - 1) {
      errors.push(`Too few drug suggestions: found ${drugCount}, expected around ${expectedCount}`);
    }

    // Check for problematic recommendation language
    const recommendationPatterns = [
      /\b(better than|worse than|superior to|inferior to)\b/i,
      /\b(best choice|recommended over|should use)\b/i,
      /\b(more effective|less effective|safer than)\b/i,
      /\b(try this instead|switch to|replace with)\b/i,
    ];

    for (const pattern of recommendationPatterns) {
      if (pattern.test(suggestions)) {
        errors.push('Contains inappropriate treatment recommendations');
        break;
      }
    }

    // Check for appropriate disclaimers
    if (!/\b(healthcare provider|physician|doctor|consult)\b/i.test(suggestions)) {
      errors.push('Should include references to consulting healthcare providers');
    }

    // Check for generic name inclusion
    if (drugCount > 0 && !suggestions.includes('(')) {
      errors.push('Drug suggestions should include generic names in parentheses');
    }

    // Check minimum content length
    if (suggestions.length < 200) {
      errors.push('Suggestions too brief for meaningful clinical context');
    }

    return {
      valid: errors.length === 0,
      errors,
      drugCount,
    };
  }

  static extractDrugSuggestions(suggestions: string): Array<{
    brandName: string;
    genericName: string;
    relationship: string;
    differentiator: string;
  }> {
    const drugs: Array<{
      brandName: string;
      genericName: string;
      relationship: string;
      differentiator: string;
    }> = [];

    // Split by lines or sentences to get individual suggestions
    const lines = suggestions.split(/[.\n]/).filter(line => line.trim().length > 10);

    for (const line of lines) {
      // Look for pattern: Brand Name (Generic Name) - relationship
      const match = line.match(/([A-Za-z\s]+?)\s*\(([^)]+)\)\s*-\s*(.+)/);
      
      if (match) {
        const [, brandName, genericName, description] = match;
        
        // Split description into relationship and differentiator
        const descParts = description.split(/[.!]/).filter(p => p.trim());
        const relationship = descParts[0]?.trim() || description.trim();
        const differentiator = descParts[1]?.trim() || '';

        drugs.push({
          brandName: brandName.trim(),
          genericName: genericName.trim(),
          relationship,
          differentiator,
        });
      }
    }

    return drugs;
  }

  static categorizeRelationships(drugs: Array<{ relationship: string }>): Record<string, number> {
    const categories: Record<string, number> = {
      'same_class': 0,
      'same_indication': 0,
      'alternative_treatment': 0,
      'different_mechanism': 0,
      'different_formulation': 0,
      'other': 0,
    };

    for (const drug of drugs) {
      const relationship = drug.relationship.toLowerCase();
      
      if (relationship.includes('same class') || relationship.includes('same therapeutic')) {
        categories.same_class++;
      } else if (relationship.includes('same indication') || relationship.includes('treats same')) {
        categories.same_indication++;
      } else if (relationship.includes('alternative') || relationship.includes('different option')) {
        categories.alternative_treatment++;
      } else if (relationship.includes('different mechanism') || relationship.includes('works differently')) {
        categories.different_mechanism++;
      } else if (relationship.includes('formulation') || relationship.includes('dosing')) {
        categories.different_formulation++;
      } else {
        categories.other++;
      }
    }

    return categories;
  }
}