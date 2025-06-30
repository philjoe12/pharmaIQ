import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
// Performance utilities
export function measurePerformance(name, fn) {
    return async () => {
        const startTime = performance.now();
        try {
            await fn();
        }
        finally {
            const endTime = performance.now();
            const duration = endTime - startTime;
            if (process.env.NODE_ENV === 'development') {
                console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
            }
            // Mark performance in browser devtools
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);
        }
    };
}
// Debounce utility for search and other inputs
export function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
}
// Throttle utility for scroll events
export function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func.apply(null, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
// Format file sizes
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
