'use client';
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '../../lib/utils';
export default function OptimizedImage({ src, alt, width, height, className, fill = false, priority = false, sizes, quality = 85, placeholder = 'empty', blurDataURL, onLoad, onError, }) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const handleLoad = () => {
        setIsLoading(false);
        onLoad?.();
    };
    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
        onError?.();
    };
    // Generate blur placeholder for better LCP
    const generateBlurDataURL = (width, height) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#f3f4f6'; // Gray placeholder
            ctx.fillRect(0, 0, width, height);
        }
        return canvas.toDataURL();
    };
    if (hasError) {
        return (<div className={cn('bg-gray-100 flex items-center justify-center text-gray-400', className)} style={{ width, height }}>
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>);
    }
    return (<div className="relative">
      {/* Loading placeholder */}
      {isLoading && (<div className={cn('absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center', className)} style={{ width, height }}>
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
        </div>)}

      <Image src={src} alt={alt} width={fill ? undefined : width} height={fill ? undefined : height} fill={fill} priority={priority} sizes={sizes || '100vw'} quality={quality} placeholder={placeholder} blurDataURL={blurDataURL ||
            (placeholder === 'blur' && width && height
                ? generateBlurDataURL(width, height)
                : undefined)} className={cn('transition-opacity duration-300', isLoading ? 'opacity-0' : 'opacity-100', className)} onLoad={handleLoad} onError={handleError} loading={priority ? 'eager' : 'lazy'} decoding="async"/>
    </div>);
}
// Preset components for common use cases
export function DrugImage({ src, alt, className, priority = false, }) {
    return (<OptimizedImage src={src} alt={alt} width={400} height={300} className={cn('rounded-lg object-cover', className)} priority={priority} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" placeholder="blur"/>);
}
export function HeroImage({ src, alt, className, }) {
    return (<OptimizedImage src={src} alt={alt} fill priority className={cn('object-cover', className)} sizes="100vw" placeholder="blur"/>);
}
export function ThumbnailImage({ src, alt, className, }) {
    return (<OptimizedImage src={src} alt={alt} width={150} height={150} className={cn('rounded-md object-cover', className)} sizes="150px"/>);
}
