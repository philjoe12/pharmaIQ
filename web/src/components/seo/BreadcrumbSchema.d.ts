interface BreadcrumbItem {
    name: string;
    url: string;
}
interface BreadcrumbSchemaProps {
    items: BreadcrumbItem[];
}
export declare function BreadcrumbSchema({ items }: BreadcrumbSchemaProps): import("react").JSX.Element;
interface BreadcrumbNavigationProps {
    items: BreadcrumbItem[];
}
export declare function BreadcrumbNavigation({ items }: BreadcrumbNavigationProps): import("react").JSX.Element;
export {};
