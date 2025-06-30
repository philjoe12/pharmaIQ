interface DrugComparison {
    id: string;
    name: string;
    genericName?: string;
    manufacturer: string;
    drugClass: string;
    indications: string[];
    commonSideEffects: string[];
    dosageForm: string;
}
interface ComparisonTableProps {
    drugs: DrugComparison[];
}
export declare function ComparisonTable({ drugs }: ComparisonTableProps): import("react").JSX.Element;
export {};
