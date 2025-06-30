interface Warning {
    title: string;
    content: string;
    severity: 'high' | 'medium' | 'low';
}
interface WarningsAccordionProps {
    warnings: Warning[];
}
export declare function WarningsAccordion({ warnings }: WarningsAccordionProps): import("react").JSX.Element;
export {};
