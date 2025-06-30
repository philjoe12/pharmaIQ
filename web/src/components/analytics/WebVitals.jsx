'use client';
import { useEffect } from 'react';
import { reportWebVitals, PerformanceMonitor } from '../../lib/web-vitals';
export default function WebVitals() {
    useEffect(() => {
        // Initialize Web Vitals reporting
        reportWebVitals();
        // Start performance monitoring
        const monitor = PerformanceMonitor.getInstance();
        monitor.startMonitoring();
        // Cleanup on unmount
        return () => {
            monitor.stopMonitoring();
        };
    }, []);
    // This component doesn't render anything
    return null;
}
// Hook for component-level performance tracking
export function useComponentPerformance(componentName) {
    useEffect(() => {
        const startTime = performance.now();
        performance.mark(`${componentName}-mount-start`);
        return () => {
            const endTime = performance.now();
            const mountTime = endTime - startTime;
            performance.mark(`${componentName}-mount-end`);
            performance.measure(`${componentName}-mount-time`, `${componentName}-mount-start`, `${componentName}-mount-end`);
            if (process.env.NODE_ENV === 'development' && mountTime > 100) {
                console.warn(`Slow component mount: ${componentName} took ${mountTime.toFixed(2)}ms`);
            }
            // Clean up
            performance.clearMarks(`${componentName}-mount-start`);
            performance.clearMarks(`${componentName}-mount-end`);
            performance.clearMeasures(`${componentName}-mount-time`);
        };
    }, [componentName]);
}
