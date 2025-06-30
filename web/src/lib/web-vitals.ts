import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface AnalyticsEvent {
  name: string;
  value: number;
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
}

// Send analytics data to your preferred service
function sendToAnalytics({ name, value, id, delta, rating, navigationType }: AnalyticsEvent) {
  // Example: Send to Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      custom_parameter_1: delta,
      custom_parameter_2: rating,
      custom_parameter_3: navigationType,
    });
  }

  // Example: Send to custom analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        value,
        id,
        delta,
        rating,
        navigationType,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      }),
    }).catch((error) => {
      console.error('Failed to send web vitals data:', error);
    });
  }

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', { name, value, id, delta, rating, navigationType });
  }
}

export function reportWebVitals() {
  try {
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  } catch (error) {
    console.error('Error reporting web vitals:', error);
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Monitor long tasks (blocking main thread)
    this.observeLongTasks();
    
    // Monitor layout shifts
    this.observeLayoutShifts();
    
    // Monitor resource loading
    this.observeResources();
  }

  private observeLongTasks() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.reportLongTask(entry);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Long task monitoring not supported');
    }
  }

  private observeLayoutShifts() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            this.reportLayoutShift(entry);
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Layout shift monitoring not supported');
    }
  }

  private observeResources() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.analyzeResourceTiming(entry as PerformanceResourceTiming);
        }
      });
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Resource timing monitoring not supported');
    }
  }

  private reportLongTask(entry: PerformanceEntry) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Long task detected:', {
        duration: entry.duration,
        startTime: entry.startTime,
        name: entry.name,
      });
    }

    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'long_task', {
        event_category: 'Performance',
        value: Math.round(entry.duration),
        custom_parameter_1: entry.name,
      });
    }
  }

  private reportLayoutShift(entry: PerformanceEntry) {
    const layoutShift = entry as any;
    if (layoutShift.value > 0.1) { // Significant layout shift
      if (process.env.NODE_ENV === 'development') {
        console.warn('Large layout shift detected:', {
          value: layoutShift.value,
          sources: layoutShift.sources,
        });
      }
    }
  }

  private analyzeResourceTiming(entry: PerformanceResourceTiming) {
    const loadTime = entry.responseEnd - entry.requestStart;
    
    // Flag slow resources
    if (loadTime > 2000) { // Slower than 2 seconds
      if (process.env.NODE_ENV === 'development') {
        console.warn('Slow resource detected:', {
          name: entry.name,
          loadTime,
          size: entry.transferSize,
        });
      }
    }
  }

  stopMonitoring() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Custom hook for component-level performance monitoring
export function usePerformanceTracking(componentName: string) {
  if (typeof window === 'undefined') return { markStart: () => {}, markEnd: () => {} };

  const markStart = () => {
    performance.mark(`${componentName}-start`);
  };

  const markEnd = () => {
    performance.mark(`${componentName}-end`);
    performance.measure(
      `${componentName}-render`,
      `${componentName}-start`,
      `${componentName}-end`
    );

    // Get the measurement
    const measures = performance.getEntriesByName(`${componentName}-render`);
    if (measures.length > 0) {
      const renderTime = measures[measures.length - 1].duration;
      
      if (process.env.NODE_ENV === 'development' && renderTime > 100) {
        console.warn(`Slow component render: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }

      // Clean up marks and measures
      performance.clearMarks(`${componentName}-start`);
      performance.clearMarks(`${componentName}-end`);
      performance.clearMeasures(`${componentName}-render`);
    }
  };

  return { markStart, markEnd };
}