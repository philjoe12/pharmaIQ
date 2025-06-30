import { Injectable, Logger } from '@nestjs/common';
import { FDALabel, ProcessedDrugData } from '@pharmaiq/types';

export interface PromptTemplate {
  name: string;
  version: string;
  template: string;
  variables: string[];
  maxTokens?: number;
  temperature?: number;
}

export interface PromptContext {
  drugData: ProcessedDrugData | FDALabel;
  enhancementType: string;
  targetAudience?: 'healthcare_professional' | 'patient' | 'general';
  additionalContext?: Record<string, any>;
}

@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  private readonly templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Build a prompt from template and context
   */
  buildPrompt(templateName: string, context: PromptContext): {
    prompt: string;
    metadata: {
      template: string;
      version: string;
      variables: Record<string, any>;
    };
  } {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const variables = this.extractVariables(context);
    const prompt = this.interpolateTemplate(template.template, variables);

    this.logger.debug(`Built prompt for template '${templateName}'`, {
      templateVersion: template.version,
      promptLength: prompt.length,
      variableCount: Object.keys(variables).length,
    });

    return {
      prompt,
      metadata: {
        template: templateName,
        version: template.version,
        variables,
      },
    };
  }

  /**
   * Get template configuration for AI provider settings
   */
  getTemplateConfig(templateName: string): {
    maxTokens?: number;
    temperature?: number;
  } {
    const template = this.templates.get(templateName);
    if (!template) {
      return {};
    }

    return {
      maxTokens: template.maxTokens,
      temperature: template.temperature,
    };
  }

  /**
   * Initialize all prompt templates
   */
  private initializeTemplates(): void {
    // SEO Title Generation
    this.templates.set('seo-title', {
      name: 'seo-title',
      version: '1.0',
      maxTokens: 50,
      temperature: 0.7,
      variables: ['drugName', 'genericName', 'primaryIndication'],
      template: `Generate an SEO-optimized title for a drug information page.

Drug: {{drugName}} ({{genericName}})
Primary Use: {{primaryIndication}}

Requirements:
- Maximum 60 characters
- Include both brand and generic names when possible
- Focus on primary medical use
- Professional and trustworthy tone
- Optimized for healthcare professional searches

Title:`,
    });

    // Meta Description Generation
    this.templates.set('meta-description', {
      name: 'meta-description',
      version: '1.0',
      maxTokens: 120,
      temperature: 0.6,
      variables: ['drugName', 'genericName', 'primaryIndication', 'manufacturer'],
      template: `Create a meta description for a prescription drug information page.

Drug Information:
- Brand Name: {{drugName}}
- Generic Name: {{genericName}}
- Primary Indication: {{primaryIndication}}
- Manufacturer: {{manufacturer}}

Requirements:
- Maximum 155 characters
- Include key medical information
- Professional tone for healthcare providers
- Mention both brand and generic names
- Include primary indication

Meta Description:`,
    });

    // FAQ Generation
    this.templates.set('faq-generation', {
      name: 'faq-generation',
      version: '1.0',
      maxTokens: 800,
      temperature: 0.5,
      variables: ['drugName', 'indications', 'dosageInfo', 'warnings', 'targetAudience'],
      template: `Generate frequently asked questions and answers for {{drugName}}.

Drug Information:
Indications: {{indications}}
Dosage: {{dosageInfo}}
Key Warnings: {{warnings}}
Target Audience: {{targetAudience}}

Generate 5-7 relevant questions with concise, accurate answers. Format as JSON array:
[{"question": "...", "answer": "...", "category": "dosage|indication|safety|administration"}]

Focus on:
- Common dosing questions
- Indication-specific queries  
- Safety and contraindication concerns
- Administration guidelines
- When appropriate for {{targetAudience}}

Questions and Answers:`,
    });

    // Content Simplification
    this.templates.set('content-simplification', {
      name: 'content-simplification',
      version: '1.0',
      maxTokens: 600,
      temperature: 0.4,
      variables: ['originalContent', 'targetAudience', 'drugName'],
      template: `Simplify the following medical content for {{targetAudience}} while maintaining accuracy.

Original Content:
{{originalContent}}

Drug: {{drugName}}
Target Audience: {{targetAudience}}

Requirements:
- Maintain medical accuracy
- Use appropriate terminology for {{targetAudience}}
- Keep essential safety information
- Make content more accessible
- Preserve all critical warnings

Simplified Content:`,
    });

    // Related Drugs
    this.templates.set('related-drugs', {
      name: 'related-drugs',
      version: '1.0',
      maxTokens: 300,
      temperature: 0.3,
      variables: ['drugName', 'genericName', 'indications', 'drugClass'],
      template: `Identify drugs related to {{drugName}} ({{genericName}}).

Current Drug Information:
- Indications: {{indications}}
- Drug Class: {{drugClass}}

Find related drugs based on:
1. Same therapeutic class
2. Similar indications
3. Alternative treatments
4. Combination therapies

Return as JSON array with reasoning:
[{"drugName": "...", "genericName": "...", "relationship": "same_class|similar_indication|alternative", "relevanceScore": 0.0-1.0}]

Related Drugs:`,
    });

    // Patient-Friendly Explanation
    this.templates.set('patient-explanation', {
      name: 'patient-explanation',
      version: '1.0',
      maxTokens: 400,
      temperature: 0.5,
      variables: ['drugName', 'primaryIndication', 'howItWorks', 'commonSideEffects'],
      template: `Create a patient-friendly explanation for {{drugName}}.

Medical Information:
- What it treats: {{primaryIndication}}
- How it works: {{howItWorks}}
- Common side effects: {{commonSideEffects}}

Requirements:
- Use simple, clear language
- Avoid medical jargon
- Include what patients should know
- Emphasize consulting healthcare providers
- Be encouraging but realistic

Patient Explanation:`,
    });

    this.logger.log(`Initialized ${this.templates.size} prompt templates`);
  }

  /**
   * Extract variables from context based on drug data
   */
  private extractVariables(context: PromptContext): Record<string, any> {
    const variables: Record<string, any> = {};

    // Handle ProcessedDrugData
    if ('drugInfo' in context.drugData) {
      const processed = context.drugData as ProcessedDrugData;
      variables.drugName = processed.drugInfo.brandName || 'Unknown';
      variables.genericName = processed.drugInfo.genericName || '';
      variables.manufacturer = processed.manufacturerInfo.manufacturerName || '';
      variables.primaryIndication = processed.indications[0] || 'Not specified';
      variables.indications = processed.indications.join(', ');
      variables.dosageInfo = processed.dosageAndAdministration.slice(0, 2).join(' ');
      variables.warnings = processed.warnings.slice(0, 3).join(' ');
    } 
    // Handle raw FDALabel
    else {
      const label = context.drugData as FDALabel;
      variables.drugName = label.drugName || 'Unknown';
      variables.genericName = label.label.genericName || '';
      variables.manufacturer = label.labeler || '';
      
      // Extract from HTML content
      variables.primaryIndication = this.extractFromHTML(label.label.indicationsAndUsage) || 'Not specified';
      variables.indications = this.extractFromHTML(label.label.indicationsAndUsage) || '';
      variables.dosageInfo = this.extractFromHTML(label.label.dosageAndAdministration) || '';
      variables.warnings = this.extractFromHTML(label.label.warningsAndPrecautions) || '';
    }

    // Add context variables
    variables.targetAudience = context.targetAudience || 'healthcare_professional';
    variables.enhancementType = context.enhancementType;

    // Add any additional context
    if (context.additionalContext) {
      Object.assign(variables, context.additionalContext);
    }

    return variables;
  }

  /**
   * Simple HTML text extraction
   */
  private extractFromHTML(html?: string): string {
    if (!html) return '';
    
    return html
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 200); // Limit length
  }

  /**
   * Interpolate template with variables
   */
  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, String(value || ''));
    }
    
    return result;
  }

  /**
   * Get all available template names
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Add or update a template
   */
  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.name, template);
    this.logger.log(`Registered template '${template.name}' version ${template.version}`);
  }
}