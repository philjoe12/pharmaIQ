interface RelatedDrug {
    id: string;
    name: string;
    genericName?: string;
    similarity: number;
    slug: string;
}
interface RelatedDrugsProps {
    drugs: RelatedDrug[];
}
export declare function RelatedDrugs({ drugs }: RelatedDrugsProps): import("react").JSX.Element;
export {};
