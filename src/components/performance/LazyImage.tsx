import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  fallback = '/placeholder.svg',
  aspectRatio = 'landscape',
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(img);

    return () => observer.disconnect();
  }, []);

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-muted',
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {!isIntersecting && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSkeleton variant="card" count={1} />
        </div>
      )}
      
      {isIntersecting && (
        <img
          ref={imgRef}
          src={hasError ? fallback : src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}
      
      {isIntersecting && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <LoadingSkeleton variant="card" count={1} />
        </div>
      )}
    </div>
  );
};

export { LazyImage };