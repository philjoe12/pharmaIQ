export function generatePageMetadata({ title, description, keywords = [], canonical, noIndex = false }) {
    const fullTitle = title.includes('PharmaIQ') ? title : `${title} | PharmaIQ`;
    return {
        title: fullTitle,
        description,
        keywords: keywords.join(', '),
        ...(canonical && { alternates: { canonical } }),
        ...(noIndex && { robots: { index: false, follow: false } }),
        openGraph: {
            title: fullTitle,
            description,
            type: 'website',
            siteName: 'PharmaIQ'
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description
        }
    };
}
export function generateDrugMetadata(drug) {
    const title = `${drug.name} - Drug Information`;
    const description = `Comprehensive information about ${drug.name}${drug.genericName ? ` (${drug.genericName})` : ''}. Find dosage, indications, warnings, and more.`;
    const keywords = [
        drug.name.toLowerCase(),
        ...(drug.genericName ? [drug.genericName.toLowerCase()] : []),
        drug.manufacturer.toLowerCase(),
        'drug information',
        'medication',
        'prescription',
        'pharmaceutical'
    ];
    return generatePageMetadata({
        title,
        description,
        keywords
    });
}
export function generateSearchMetadata(query) {
    const title = `Search Results for "${query}"`;
    const description = `Find drugs and medications related to "${query}". Browse comprehensive drug information on PharmaIQ.`;
    return generatePageMetadata({
        title,
        description,
        keywords: [query.toLowerCase(), 'drug search', 'medication search']
    });
}
