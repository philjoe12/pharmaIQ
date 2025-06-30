import { Metadata } from 'next';
export declare const metadata: Metadata;
interface SearchPageProps {
    searchParams: {
        q?: string;
        category?: string;
        page?: string;
    };
}
export default function SearchPage({ searchParams }: SearchPageProps): Promise<import("react").JSX.Element>;
export {};
