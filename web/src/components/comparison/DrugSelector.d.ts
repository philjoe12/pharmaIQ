interface Drug {
    id: string;
    name: string;
    genericName?: string;
}
interface DrugSelectorProps {
    availableDrugs: Drug[];
    onDrugsSelected: (drugs: Drug[]) => void;
    maxSelection?: number;
}
export declare function DrugSelector({ availableDrugs, onDrugsSelected, maxSelection }: DrugSelectorProps): import("react").JSX.Element;
export {};
