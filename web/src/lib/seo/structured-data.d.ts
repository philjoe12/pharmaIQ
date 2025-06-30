import { Drug } from '../api/drugs.api';
export interface StructuredDataBase {
    '@context': string;
    '@type': string;
}
export interface DrugStructuredData extends StructuredDataBase {
    '@type': 'Drug';
    name: string;
    alternateName?: string;
    manufacturer: {
        '@type': 'Organization';
        name: string;
    };
    description: string;
    activeIngredient?: string;
    drugClass?: string;
    url: string;
}
export interface OrganizationStructuredData extends StructuredDataBase {
    '@type': 'Organization';
    name: string;
    description: string;
    url: string;
    logo?: string;
}
export interface BreadcrumbStructuredData extends StructuredDataBase {
    '@type': 'BreadcrumbList';
    itemListElement: Array<{
        '@type': 'ListItem';
        position: number;
        name: string;
        item: string;
    }>;
}
export declare class StructuredDataGenerator {
    static generateDrugStructuredData(drug: Drug, baseUrl: string): DrugStructuredData;
    static generateOrganizationStructuredData(): OrganizationStructuredData;
    static generateBreadcrumbStructuredData(items: Array<{
        name: string;
        url: string;
    }>): BreadcrumbStructuredData;
    static jsonLd(data: any): string;
}
export declare const structuredDataGenerator: typeof StructuredDataGenerator;
