interface SearchFiltersProps {
    onFilterChange: (filters: SearchFilters) => void;
}
interface SearchFilters {
    category?: string;
    manufacturer?: string;
    prescription?: boolean;
}
export declare function SearchFilters({ onFilterChange }: SearchFiltersProps): import("react").JSX.Element;
export {};
