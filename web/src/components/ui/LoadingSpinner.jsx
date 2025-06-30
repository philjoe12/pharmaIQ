import { cn } from '@/lib/utils';
export function LoadingSpinner({ className, size = 'md' }) {
    return (<div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-blue-600', {
            'h-4 w-4': size === 'sm',
            'h-8 w-8': size === 'md',
            'h-12 w-12': size === 'lg',
        }, className)}/>);
}
