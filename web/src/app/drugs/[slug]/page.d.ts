import { Metadata } from 'next';
interface PageProps {
    params: {
        slug: string;
    };
}
export declare function generateMetadata({ params }: PageProps): Promise<Metadata>;
export default function DrugPage({ params }: PageProps): Promise<import("react").JSX.Element>;
export {};
