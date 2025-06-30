interface Drug {
    id: string;
    name: string;
    genericName?: string;
    manufacturer: string;
    description: string;
    slug: string;
}
interface SearchResultsProps {
    results: Drug[];
    loading?: boolean;
    error?: string;
}
export declare function SearchResults({ results, loading, error }: SearchResultsProps): import("react").JSX.Element;
export {};
