import { DrugLabel } from '../../../shared-types';

export function generateSEOTitlePrompt(drug: DrugLabel): string {
  const cleanIndications = drug.label.indicationsAndUsage?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  return `Create an SEO-optimized title for a medical drug information page. The title should be under 60 characters and include the brand name, generic name, and primary use.

Drug Information:
- Brand Name: ${drug.drugName}
- Generic Name: ${drug.label.genericName}
- Manufacturer: ${drug.labeler}
- Primary Uses: ${cleanIndications?.substring(0, 200)}

Requirements:
- Maximum 60 characters
- Include both brand and generic names
- Mention primary use/condition
- Professional medical tone
- SEO-friendly format

Generate only the title, no quotes or additional text.`;
}

export function generateMetaDescriptionPrompt(drug: DrugLabel): string {
  const cleanIndications = drug.label.indicationsAndUsage?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanDosage = drug.label.dosageAndAdministration?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  return `Create an SEO-optimized meta description for a healthcare provider drug information page. The description should be under 155 characters and summarize key information.

Drug Information:
- Brand Name: ${drug.drugName}
- Generic Name: ${drug.label.genericName}
- Uses: ${cleanIndications?.substring(0, 150)}
- Dosing: ${cleanDosage?.substring(0, 100)}

Requirements:
- Maximum 155 characters
- Include brand name and generic name
- Mention primary uses
- Target healthcare providers
- Include call-to-action like "prescribing information"
- Professional medical tone

Generate only the meta description, no quotes or additional text.`;
}

export function generateProviderExplanationPrompt(drug: DrugLabel): string {
  const cleanIndications = drug.label.indicationsAndUsage?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanMechanism = drug.label.clinicalPharmacology?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  return `Create a clear, professional explanation of this medication for healthcare providers. Focus on mechanism of action, primary indications, and clinical context.

Drug Information:
- Brand Name: ${drug.drugName}
- Generic Name: ${drug.label.genericName}
- Indications: ${cleanIndications?.substring(0, 300)}
- Clinical Pharmacology: ${cleanMechanism?.substring(0, 300)}

Requirements:
- 150-250 words
- Professional medical language but accessible
- Focus on mechanism of action and clinical uses
- Include specific patient populations if mentioned
- Mention key therapeutic benefits
- Do not include dosing or adverse effects (covered elsewhere)
- Maintain medical accuracy - only use information provided

Generate a clear explanation paragraph.`;
}

export function generateFAQPrompt(drug: DrugLabel): string {
  const cleanIndications = drug.label.indicationsAndUsage?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanDosage = drug.label.dosageAndAdministration?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanWarnings = drug.label.warningsAndPrecautions?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  return `Generate 5 frequently asked questions and answers about this medication for healthcare providers. Focus on practical clinical questions.

Drug Information:
- Brand Name: ${drug.drugName}
- Generic Name: ${drug.label.genericName}
- Indications: ${cleanIndications?.substring(0, 200)}
- Dosing: ${cleanDosage?.substring(0, 200)}
- Warnings: ${cleanWarnings?.substring(0, 200)}

Requirements:
- Generate exactly 5 Q&A pairs
- Questions should be practical and commonly asked by providers
- Answers should be concise (1-2 sentences)
- Focus on: indications, administration, patient selection, monitoring, contraindications
- Use only information provided - do not invent details
- Format as "Q: [question]" and "A: [answer]"

Example format:
Q: What conditions is this medication indicated for?
A: [Answer based on indications provided]

Generate the FAQ section:`;
}

export function generateRelatedContentPrompt(drug: DrugLabel): string {
  const cleanIndications = drug.label.indicationsAndUsage?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  return `Based on this drug's indications and mechanism, suggest related content. Return as JSON format.

Drug Information:
- Brand Name: ${drug.drugName}
- Generic Name: ${drug.label.genericName}
- Indications: ${cleanIndications?.substring(0, 300)}

Generate related content in this exact JSON format:
{
  "conditions": ["condition1", "condition2", "condition3"],
  "drugs": ["drug class or specific alternatives"],
  "benefits": ["key therapeutic benefit 1", "key therapeutic benefit 2"]
}

Requirements:
- Conditions: 3-5 related medical conditions mentioned in indications
- Drugs: 2-3 drug classes or alternative medications in same therapeutic area
- Benefits: 2-3 key therapeutic benefits from the indication text
- Use only information that can be inferred from the provided data
- Keep items concise (2-4 words each)

Return only the JSON object:`;
}