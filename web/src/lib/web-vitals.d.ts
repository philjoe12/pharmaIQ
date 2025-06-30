export declare function reportWebVitals(): void;
export declare class PerformanceMonitor {
    private static instance;
    private observers;
    static getInstance(): PerformanceMonitor;
    startMonitoring(): void;
    private observeLongTasks;
    private observeLayoutShifts;
    private observeResources;
    private reportLongTask;
    private reportLayoutShift;
    private analyzeResourceTiming;
    stopMonitoring(): void;
}
export declare function usePerformanceTracking(componentName: string): {
    markStart: () => void;
    markEnd: () => void;
};
