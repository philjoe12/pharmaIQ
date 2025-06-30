import { PromptContext } from '../../providers/ai-provider.interface';

export interface FAQContext extends PromptContext {
  drugName: string;
  genericName?: string;
  manufacturer: string;
  indication?: string;
  numberOfQuestions?: number;
}

export class FAQGenerationPrompt {
  static generate(drugData: any, context?: FAQContext): string {
    const drugName = drugData.drugName || context?.drugName || 'Unknown Drug';
    const genericName = drugData.genericName || drugData.label?.genericName || context?.genericName;
    const manufacturer = drugData.manufacturer || drugData.labeler || context?.manufacturer;
    const indication = drugData.label?.indicationsAndUsage || context?.indication;
    const dosage = drugData.label?.dosageAndAdministration;
    const warnings = drugData.label?.warningsAndPrecautions;
    const contraindications = drugData.label?.contraindications;
    const adverseReactions = drugData.label?.adverseReactions;
    const numberOfQuestions = context?.numberOfQuestions || 5;

    let prompt = `Generate ${numberOfQuestions} frequently asked questions (FAQs) about the prescription drug "${drugName}" that healthcare professionals and patients commonly ask.

DRUG INFORMATION:
- Brand Name: ${drugName}`;

    if (genericName && genericName !== drugName) {
      prompt += `\n- Generic Name: ${genericName}`;
    }

    if (manufacturer) {
      prompt += `\n- Manufacturer: ${manufacturer}`;
    }

    if (indication) {
      const shortIndication = indication.substring(0, 400);
      prompt += `\n- Primary Uses: ${shortIndication}`;
    }

    if (dosage) {
      const shortDosage = dosage.substring(0, 300);
      prompt += `\n- Dosage Information: ${shortDosage}`;
    }

    if (warnings) {
      const shortWarnings = warnings.substring(0, 300);
      prompt += `\n- Important Warnings: ${shortWarnings}`;
    }

    if (contraindications) {
      const shortContraindications = contraindications.substring(0, 200);
      prompt += `\n- Contraindications: ${shortContraindications}`;
    }

    if (adverseReactions) {
      const shortReactions = adverseReactions.substring(0, 200);
      prompt += `\n- Common Side Effects: ${shortReactions}`;
    }

    prompt += `

CRITICAL GUIDELINES:
- NEVER provide medical advice, diagnosis, or treatment recommendations
- Always direct users to consult healthcare professionals for medical decisions
- Focus on factual, educational information from FDA-approved labeling
- Include appropriate medical disclaimers
- Use clear, accessible language for both professionals and patients
- Cover common information needs without being prescriptive

FAQ CATEGORIES TO CONSIDER:
1. Basic drug information (what it is, generic name, manufacturer)
2. FDA-approved uses and indications
3. How the medication works (mechanism of action)
4. Dosage forms and strengths available
5. Important safety information and warnings
6. Common side effects from clinical trials
7. Contraindications and who should not take it
8. Drug interactions to be aware of
9. Storage and handling requirements
10. Monitoring requirements during treatment

ANSWER REQUIREMENTS:
- Each answer should be 2-4 sentences
- Include "Consult your healthcare provider" disclaimers where appropriate
- Reference FDA-approved labeling as the source
- Avoid definitive medical statements
- Use phrases like "According to the prescribing information" or "The FDA label states"

FORMAT:
Return the FAQs in this exact format:

Q: [Question here]
A: [Answer here with appropriate disclaimers]

Q: [Next question]
A: [Next answer with disclaimers]

EXAMPLE FAQ STRUCTURE:
Q: What is ${drugName} used for?
A: According to FDA prescribing information, ${drugName} is approved for [indication]. The specific conditions it treats and dosing should be determined by a healthcare provider based on individual patient needs.

Generate ${numberOfQuestions} relevant FAQs following these guidelines:`;

    return prompt;
  }

  static validate(faqContent: string): { valid: boolean; errors: string[]; questions: number } {
    const errors: string[] = [];
    
    if (!faqContent || faqContent.trim().length === 0) {
      errors.push('FAQ content cannot be empty');
      return { valid: false, errors, questions: 0 };
    }

    // Count Q: patterns to determine number of questions
    const questionMatches = faqContent.match(/Q:/g);
    const answerMatches = faqContent.match(/A:/g);
    const questionCount = questionMatches?.length || 0;
    const answerCount = answerMatches?.length || 0;

    if (questionCount === 0) {
      errors.push('No questions found (must use "Q:" format)');
    }

    if (answerCount === 0) {
      errors.push('No answers found (must use "A:" format)');
    }

    if (questionCount !== answerCount) {
      errors.push(`Mismatched questions (${questionCount}) and answers (${answerCount})`);
    }

    // Check for medical advice language
    const medicalAdvicePatterns = [
      /\b(you should take|recommended dose|medical advice)\b/i,
      /\b(diagnose|treat|cure|prescribe)\b/i,
      /\b(best treatment|consult me)\b/i,
    ];

    for (const pattern of medicalAdvicePatterns) {
      if (pattern.test(faqContent)) {
        errors.push('FAQ contains medical advice language');
        break;
      }
    }

    // Check for appropriate disclaimers
    if (!/\b(healthcare provider|doctor|physician|prescribing information)\b/i.test(faqContent)) {
      errors.push('FAQ should include references to healthcare providers or prescribing information');
    }

    // Check minimum content length
    if (faqContent.length < 200) {
      errors.push('FAQ content too short for meaningful information');
    }

    return {
      valid: errors.length === 0,
      errors,
      questions: questionCount,
    };
  }

  static extractQAPairs(faqContent: string): Array<{ question: string; answer: string }> {
    const pairs: Array<{ question: string; answer: string }> = [];
    
    // Split by Q: to get individual Q&A blocks
    const blocks = faqContent.split(/Q:\s*/);
    
    for (let i = 1; i < blocks.length; i++) { // Skip first empty element
      const block = blocks[i].trim();
      const answerIndex = block.indexOf('A:');
      
      if (answerIndex > 0) {
        const question = block.substring(0, answerIndex).trim();
        const answer = block.substring(answerIndex + 2).trim();
        
        if (question && answer) {
          pairs.push({
            question: question.replace(/\n/g, ' ').trim(),
            answer: answer.replace(/\n/g, ' ').trim(),
          });
        }
      }
    }
    
    return pairs;
  }

  static formatForSEO(qaPairs: Array<{ question: string; answer: string }>): any {
    // Format for FAQ schema markup
    return {
      "@type": "FAQPage",
      "mainEntity": qaPairs.map(pair => ({
        "@type": "Question",
        "name": pair.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": pair.answer
        }
      }))
    };
  }
}