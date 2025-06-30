interface DosageInfo {
    condition: string;
    dosage: string;
    frequency: string;
    route: string;
}
interface DosageTableProps {
    dosages: DosageInfo[];
}
export declare function DosageTable({ dosages }: DosageTableProps): import("react").JSX.Element;
export {};
