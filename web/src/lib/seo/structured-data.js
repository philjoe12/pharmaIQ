export class StructuredDataGenerator {
    static generateDrugStructuredData(drug, baseUrl) {
        return {
            '@context': 'https://schema.org',
            '@type': 'Drug',
            name: drug.name,
            alternateName: drug.genericName,
            manufacturer: {
                '@type': 'Organization',
                name: drug.manufacturer
            },
            description: drug.description,
            url: `${baseUrl}/drugs/${drug.slug}`
        };
    }
    static generateOrganizationStructuredData() {
        return {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'PharmaIQ',
            description: 'Your trusted source for comprehensive drug information powered by AI',
            url: process.env.NEXT_PUBLIC_BASE_URL || 'https://pharmaiq.com'
        };
    }
    static generateBreadcrumbStructuredData(items) {
        return {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: items.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                item: item.url
            }))
        };
    }
    static jsonLd(data) {
        return JSON.stringify(data, null, 2);
    }
}
export const structuredDataGenerator = StructuredDataGenerator;
