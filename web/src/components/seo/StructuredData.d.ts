interface DrugStructuredDataProps {
    name: string;
    genericName?: string;
    manufacturer: string;
    description: string;
    activeIngredient?: string;
    drugClass?: string;
    url: string;
}
export declare function DrugStructuredData({ name, genericName, manufacturer, description, activeIngredient, drugClass, url }: DrugStructuredDataProps): import("react").JSX.Element;
interface OrganizationStructuredDataProps {
    name: string;
    description: string;
    url: string;
    logo?: string;
}
export declare function OrganizationStructuredData({ name, description, url, logo }: OrganizationStructuredDataProps): import("react").JSX.Element;
export {};
