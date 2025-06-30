interface MetaTagsProps {
    title: string;
    description: string;
    keywords?: string[];
    canonical?: string;
    ogImage?: string;
    noIndex?: boolean;
}
export declare function MetaTags({ title, description, keywords, canonical, ogImage, noIndex }: MetaTagsProps): import("react").JSX.Element;
export {};
