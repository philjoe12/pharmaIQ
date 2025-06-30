'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '../ui/LoadingSpinner';

// Loading component for dynamic imports
const LoadingComponent = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex items-center justify-center p-8 min-h-[200px]">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-2 text-sm text-gray-600">{message}</p>
    </div>
  </div>
);

// Heavy components that should be lazy loaded
export const AdvancedDrugComparison = dynamic(
  () => import('../comparison/AdvancedDrugComparison'),
  {
    loading: () => <LoadingComponent message="Loading drug comparison tool..." />,
    ssr: false, // Disable SSR for this component as it's interactive
  }
);

export const SmartDrugDiscovery = dynamic(
  () => import('../discovery/SmartDrugDiscovery'),
  {
    loading: () => <LoadingComponent message="Loading drug discovery interface..." />,
    ssr: true, // Keep SSR for better SEO
  }
);

export const DrugComparisonTable = dynamic(
  () => import('../comparison/ComparisonTable'),
  {
    loading: () => <LoadingComponent message="Loading comparison table..." />,
    ssr: true,
  }
);

// Analytics components (loaded on demand)
export const WebVitalsReporter = dynamic(
  () => import('../analytics/WebVitals'),
  {
    ssr: false, // Client-side only
  }
);

// Chart components (typically heavy with dependencies)
export const DrugEffectivenessChart = dynamic(
  () => import('../charts/EffectivenessChart').catch(() => ({
    default: () => <div className="p-4 text-center text-gray-500">Chart unavailable</div>
  })),
  {
    loading: () => <LoadingComponent message="Loading chart..." />,
    ssr: false,
  }
);

// User interface components that are not immediately visible
export const UserTypeSelector = dynamic(
  () => import('../user-type/UserTypeSelector'),
  {
    loading: () => <LoadingComponent message="Loading user preferences..." />,
    ssr: false,
  }
);

// Export individual component loaders for specific use cases
export const loadAdvancedComparison = () => import('../comparison/AdvancedDrugComparison');
export const loadSmartDiscovery = () => import('../discovery/SmartDrugDiscovery');
export const loadDrugCharts = () => import('../charts/EffectivenessChart');

// Utility function to preload components when needed
export const preloadComponent = (componentLoader: () => Promise<any>) => {
  if (typeof window !== 'undefined') {
    // Preload on mouse enter or focus events
    componentLoader();
  }
};

// Hook for intelligent component loading
export const useIntelligentLoading = () => {
  const preloadOnHover = (componentLoader: () => Promise<any>) => {
    return {
      onMouseEnter: () => preloadComponent(componentLoader),
      onFocus: () => preloadComponent(componentLoader),
    };
  };

  const preloadOnViewport = (componentLoader: () => Promise<any>) => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              preloadComponent(componentLoader);
              observer.disconnect();
            }
          });
        },
        { rootMargin: '100px' }
      );

      return (element: HTMLElement | null) => {
        if (element) observer.observe(element);
      };
    }
    return () => {};
  };

  return { preloadOnHover, preloadOnViewport };
};