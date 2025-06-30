interface AdverseReaction {
    name: string;
    frequency: string;
    severity: 'mild' | 'moderate' | 'severe';
}
interface AdverseReactionsProps {
    reactions: AdverseReaction[];
}
export declare function AdverseReactions({ reactions }: AdverseReactionsProps): import("react").JSX.Element;
export {};
