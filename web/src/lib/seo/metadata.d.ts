import { Metadata } from 'next';
import { Drug } from '../api/drugs.api';
interface GenerateMetadataProps {
    title: string;
    description: string;
    keywords?: string[];
    canonical?: string;
    noIndex?: boolean;
}
export declare function generatePageMetadata({ title, description, keywords, canonical, noIndex }: GenerateMetadataProps): Metadata;
export declare function generateDrugMetadata(drug: Drug): Metadata;
export declare function generateSearchMetadata(query: string): Metadata;
export {};
