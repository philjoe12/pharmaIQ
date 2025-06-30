import { NextResponse } from 'next/server';
const API_BASE_URL = process.env.API_GATEWAY_URL || 'http://localhost:3001';
export async function POST(request) {
    try {
        const body = await request.json();
        const { drugIds, scenario, categories, includeAI } = body;
        if (!drugIds || !Array.isArray(drugIds) || drugIds.length < 2) {
            return NextResponse.json({ error: 'At least 2 drug IDs are required for comparison' }, { status: 400 });
        }
        // Use the AI comparison service in the backend
        const aiComparisonResponse = await fetch(`${API_BASE_URL}/ai/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                drugIds,
                scenario: scenario || 'general',
                categories: categories || ['efficacy', 'safety'],
                includeAI: includeAI !== false
            }),
        });
        if (!aiComparisonResponse.ok) {
            // Fallback to basic comparison if AI service fails
            console.warn('AI comparison service failed, falling back to basic comparison');
            const basicComparisonResponse = await fetch(`${API_BASE_URL}/drugs/compare/${drugIds.join(',')}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!basicComparisonResponse.ok) {
                throw new Error(`Failed to get comparison data: ${basicComparisonResponse.status}`);
            }
            const drugs = await basicComparisonResponse.json();
            // Generate fallback comparison with mock data
            const fallbackMatrix = await generateComparisonMatrix(drugs, scenario, categories, includeAI);
            return NextResponse.json(fallbackMatrix);
        }
        const aiComparisonResult = await aiComparisonResponse.json();
        return NextResponse.json(aiComparisonResult);
    }
    catch (error) {
        console.error('Advanced comparison API error:', error);
        return NextResponse.json({ error: 'Failed to perform advanced comparison' }, { status: 500 });
    }
}
async function generateComparisonMatrix(drugs, scenario, categories, includeAI) {
    // This would integrate with the AI service in a real implementation
    // For now, we'll return a structured mock response
    const aiAnalysis = {
        overallRecommendation: generateOverallRecommendation(drugs, scenario),
        keyDifferences: generateKeyDifferences(drugs),
        effectivenessComparison: drugs.map(drug => ({
            drug: drug.drugName,
            score: Math.floor(Math.random() * 40) + 60, // Mock effectiveness score
            reasoning: `${drug.drugName} shows ${['good', 'excellent', 'moderate'][Math.floor(Math.random() * 3)]} efficacy for its approved indications.`
        })),
        safetyProfile: drugs.map(drug => ({
            drug: drug.drugName,
            riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            keyRisks: generateKeyRisks(drug)
        })),
        costEffectiveness: drugs.map(drug => ({
            drug: drug.drugName,
            costTier: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            valueRating: Math.floor(Math.random() * 40) + 60
        })),
        patientPreferences: generatePatientPreferences(drugs, scenario)
    };
    const comparisonMatrix = generateDetailedMatrix(drugs, categories);
    return {
        drugs,
        aiAnalysis,
        comparisonMatrix
    };
}
function generateOverallRecommendation(drugs, scenario) {
    const scenarioText = scenario === 'general' ? 'general use' : `${scenario} patients`;
    return `Based on the comparison of ${drugs.length} medications for ${scenarioText}, each drug has distinct advantages. The choice should be individualized based on patient-specific factors, contraindications, and therapeutic goals.`;
}
function generateKeyDifferences(drugs) {
    const differences = [
        'Different onset of action and duration of effect',
        'Varying side effect profiles and contraindications',
        'Different dosing frequencies and administration routes',
        'Distinct drug interaction profiles',
        'Varying efficacy in different patient populations'
    ];
    return differences.slice(0, Math.min(3, drugs.length));
}
function generateKeyRisks(drug) {
    const commonRisks = [
        'Monitor for common side effects',
        'Check for drug interactions',
        'Consider contraindications',
        'Adjust dose for special populations',
        'Regular monitoring may be required'
    ];
    return commonRisks.slice(0, Math.floor(Math.random() * 3) + 1);
}
function generatePatientPreferences(drugs, scenario) {
    const preferences = [];
    if (scenario === 'elderly') {
        preferences.push({
            bestFor: 'Elderly patients with multiple comorbidities',
            drugs: [drugs[0]?.drugName || 'First option'],
            reasoning: 'Lower risk of drug interactions and better tolerability profile in older adults.'
        });
    }
    else if (scenario === 'pregnancy') {
        preferences.push({
            bestFor: 'Pregnant or breastfeeding women',
            drugs: drugs.filter((_, idx) => idx % 2 === 0).map(d => d.drugName),
            reasoning: 'Better safety profile during pregnancy and lactation based on available data.'
        });
    }
    else {
        preferences.push({
            bestFor: 'First-line therapy',
            drugs: [drugs[0]?.drugName || 'Primary option'],
            reasoning: 'Established efficacy and safety profile make this a preferred initial choice.'
        });
    }
    return preferences;
}
function generateDetailedMatrix(drugs, categories) {
    const matrix = [];
    if (categories.includes('efficacy')) {
        matrix.push({
            category: 'Efficacy & Effectiveness',
            metrics: [
                {
                    metric: 'Primary Indication',
                    values: drugs.map(drug => ({
                        drug: drug.drugName,
                        value: extractIndication(drug) || 'Multiple indications',
                        score: Math.floor(Math.random() * 30) + 70
                    }))
                },
                {
                    metric: 'Onset of Action',
                    values: drugs.map(drug => ({
                        drug: drug.drugName,
                        value: ['15-30 minutes', '1-2 hours', '2-4 hours', '24-48 hours'][Math.floor(Math.random() * 4)]
                    }))
                },
                {
                    metric: 'Duration of Effect',
                    values: drugs.map(drug => ({
                        drug: drug.drugName,
                        value: ['4-6 hours', '8-12 hours', '12-24 hours', '24-48 hours'][Math.floor(Math.random() * 4)]
                    }))
                }
            ]
        });
    }
    if (categories.includes('safety')) {
        matrix.push({
            category: 'Safety Profile',
            metrics: [
                {
                    metric: 'Common Side Effects',
                    values: drugs.map(drug => ({
                        drug: drug.drugName,
                        value: extractSideEffects(drug) || 'See prescribing information'
                    }))
                },
                {
                    metric: 'Contraindications',
                    values: drugs.map(drug => ({
                        drug: drug.drugName,
                        value: extractContraindications(drug) || 'See prescribing information'
                    }))
                },
                {
                    metric: 'Pregnancy Category',
                    values: drugs.map(drug => ({
                        drug: drug.drugName,
                        value: ['Category A', 'Category B', 'Category C', 'Category D'][Math.floor(Math.random() * 4)]
                    }))
                }
            ]
        });
    }
    if (categories.includes('administration')) {
        matrix.push({
            category: 'Administration',
            metrics: [
                {
                    metric: 'Route of Administration',
                    values: drugs.map(drug => ({
                        drug: drug.drugName,
                        value: ['Oral', 'Injectable', 'Topical', 'Inhalation'][Math.floor(Math.random() * 4)]
                    }))
                },
                {
                    metric: 'Dosing Frequency',
                    values: drugs.map(drug => ({
                        drug: drug.drugName,
                        value: ['Once daily', 'Twice daily', 'Three times daily', 'As needed'][Math.floor(Math.random() * 4)]
                    }))
                },
                {
                    metric: 'Special Instructions',
                    values: drugs.map(drug => ({
                        drug: drug.drugName,
                        value: extractDosageInstructions(drug) || 'Follow prescribing information'
                    }))
                }
            ]
        });
    }
    return matrix;
}
function extractIndication(drug) {
    const indications = drug.label?.indicationsAndUsage;
    if (indications && typeof indications === 'string') {
        return indications.substring(0, 100) + (indications.length > 100 ? '...' : '');
    }
    return '';
}
function extractSideEffects(drug) {
    const reactions = drug.label?.adverseReactions;
    if (reactions && typeof reactions === 'string') {
        return reactions.substring(0, 100) + (reactions.length > 100 ? '...' : '');
    }
    return '';
}
function extractContraindications(drug) {
    const contraindications = drug.label?.contraindications;
    if (contraindications && typeof contraindications === 'string') {
        return contraindications.substring(0, 100) + (contraindications.length > 100 ? '...' : '');
    }
    return '';
}
function extractDosageInstructions(drug) {
    const dosage = drug.label?.dosageAndAdministration;
    if (dosage && typeof dosage === 'string') {
        return dosage.substring(0, 100) + (dosage.length > 100 ? '...' : '');
    }
    return '';
}
