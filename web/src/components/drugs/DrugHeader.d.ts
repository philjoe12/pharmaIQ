interface DrugHeaderProps {
    name: string;
    genericName?: string;
    manufacturer: string;
    drugClass?: string;
}
export declare function DrugHeader({ name, genericName, manufacturer, drugClass }: DrugHeaderProps): import("react").JSX.Element;
export {};
