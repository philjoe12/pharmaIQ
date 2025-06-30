interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
    quality?: number;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    onLoad?: () => void;
    onError?: () => void;
}
export default function OptimizedImage({ src, alt, width, height, className, fill, priority, sizes, quality, placeholder, blurDataURL, onLoad, onError, }: OptimizedImageProps): import("react").JSX.Element;
export declare function DrugImage({ src, alt, className, priority, }: {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
}): import("react").JSX.Element;
export declare function HeroImage({ src, alt, className, }: {
    src: string;
    alt: string;
    className?: string;
}): import("react").JSX.Element;
export declare function ThumbnailImage({ src, alt, className, }: {
    src: string;
    alt: string;
    className?: string;
}): import("react").JSX.Element;
export {};
