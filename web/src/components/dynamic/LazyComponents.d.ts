export declare const AdvancedDrugComparison: import("react").ComponentType<{}>;
export declare const SmartDrugDiscovery: import("react").ComponentType<{}>;
export declare const DrugComparisonTable: import("react").ComponentType<{}>;
export declare const WebVitalsReporter: import("react").ComponentType<{}>;
export declare const DrugEffectivenessChart: import("react").ComponentType<{}>;
export declare const UserTypeSelector: import("react").ComponentType<{}>;
export declare const loadAdvancedComparison: () => Promise<typeof import("../comparison/AdvancedDrugComparison")>;
export declare const loadSmartDiscovery: () => Promise<typeof import("../discovery/SmartDrugDiscovery")>;
export declare const loadDrugCharts: () => Promise<any>;
export declare const preloadComponent: (componentLoader: () => Promise<any>) => void;
export declare const useIntelligentLoading: () => {
    preloadOnHover: (componentLoader: () => Promise<any>) => {
        onMouseEnter: () => void;
        onFocus: () => void;
    };
    preloadOnViewport: (componentLoader: () => Promise<any>) => (element: HTMLElement | null) => void;
};
