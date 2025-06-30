interface FAQ {
    question: string;
    answer: string;
}
interface FAQSectionProps {
    faqs: FAQ[];
}
export declare function FAQSection({ faqs }: FAQSectionProps): import("react").JSX.Element;
export {};
