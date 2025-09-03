import React, { useState, useEffect, useRef } from 'react';
import { useLazyImage } from '../../hooks/useLazyLoad';
import { cn } from '../../lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: (error: string) => void;
  blur?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

/**
 * Lazy loading image component с прогрессивной загрузкой
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  className,
  width,
  height,
  onLoad,
  onError,
  blur = true,
  quality = 'medium'
}) => {
  const { ref, imageSrc, isLoading, error } = useLazyImage(src, placeholder);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading && !error && imageSrc === src) {
      setImageLoaded(true);
      onLoad?.();
    }
  }, [isLoading, error, imageSrc, src, onLoad]);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const getQualityClass = () => {
    switch (quality) {
      case 'low':
        return 'image-rendering-pixelated';
      case 'high':
        return 'image-rendering-crisp-edges';
      default:
        return 'image-rendering-auto';
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {isLoading && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse',
            blur && 'backdrop-blur-sm'
          )}
        />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 bg-gray-400 rounded mb-2 mx-auto" />
            <p className="text-xs text-gray-500">Ошибка загрузки</p>
          </div>
        </div>
      )}

      {/* Main image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            getQualityClass(),
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => onError?.('Failed to load image')}
        />
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

/**
 * Lazy loading avatar component
 */
export const LazyAvatar: React.FC<{
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}> = ({ src, alt, size = 'md', fallback, className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!src) {
    return (
      <div className={cn(
        'bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center',
        sizeClasses[size],
        className
      )}>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {fallback || getInitials(alt)}
        </span>
      </div>
    );
  }

  return (
    <LazyImage
      src={src}
      alt={alt}
      className={cn(
        'rounded-full',
        sizeClasses[size],
        className
      )}
    />
  );
};

/**
 * Lazy loading background image component
 */
export const LazyBackgroundImage: React.FC<{
  src: string;
  children: React.ReactNode;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}> = ({ src, children, className, overlay = false, overlayOpacity = 0.5 }) => {
  const { ref, imageSrc, isLoading } = useLazyImage(src);

  return (
    <div
      ref={ref}
      className={cn(
        'relative bg-gray-200 dark:bg-gray-700',
        className
      )}
      style={{
        backgroundImage: imageSrc ? `url(${imageSrc})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {overlay && imageSrc && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default LazyImage;