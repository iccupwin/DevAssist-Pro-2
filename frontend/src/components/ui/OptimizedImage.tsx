import React, { useState, useEffect } from 'react';
import { generateOptimizedImageUrl, generatePlaceholder } from '../../utils/assetOptimizer';
import { useLazyImage } from '../../hooks/useLazyLoad';
import { cn } from '../../lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  blur?: number;
  placeholder?: boolean;
  progressive?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

/**
 * Компонент оптимизированного изображения с поддержкой современных форматов
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  quality = 85,
  format = 'auto',
  blur,
  placeholder = true,
  progressive = true,
  onLoad,
  onError
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [placeholderUrl, setPlaceholderUrl] = useState<string>('');
  
  // Генерируем оптимизированный URL
  const optimizedSrc = generateOptimizedImageUrl(src, {
    width,
    height,
    quality,
    format,
    blur,
    progressive
  });

  // Используем lazy loading
  const { ref, imageSrc, isLoading, error } = useLazyImage(optimizedSrc);

  // Генерируем placeholder при необходимости
  useEffect(() => {
    if (placeholder && width && height) {
      const placeholder = generatePlaceholder(width, height, '#f3f4f6');
      setPlaceholderUrl(placeholder);
    }
  }, [placeholder, width, height]);

  // Обработчики событий
  useEffect(() => {
    if (!isLoading && !error && imageSrc === optimizedSrc) {
      setImageLoaded(true);
      onLoad?.();
    }
  }, [isLoading, error, imageSrc, optimizedSrc, onLoad]);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden bg-gray-100 dark:bg-gray-800',
        className
      )}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {placeholder && placeholderUrl && !imageLoaded && (
        <img
          src={placeholderUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          style={{ filter: 'blur(8px)' }}
        />
      )}

      {/* Скелетон загрузки */}
      {isLoading && !placeholderUrl && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Основное изображение */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => onError?.('Failed to load image')}
        />
      )}

      {/* Состояние ошибки */}
      {error && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 bg-gray-400 rounded mb-2 mx-auto opacity-50" />
            <p className="text-xs text-gray-500">Ошибка загрузки</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Компонент для отзывчивых изображений
 */
export const ResponsiveImage: React.FC<OptimizedImageProps & {
  sizes?: {
    mobile: { width: number; height: number };
    tablet: { width: number; height: number };
    desktop: { width: number; height: number };
  };
}> = ({ sizes, ...props }) => {
  const [currentSize, setCurrentSize] = useState<{ width: number; height: number }>({
    width: sizes?.desktop.width || props.width || 300,
    height: sizes?.desktop.height || props.height || 200
  });

  useEffect(() => {
    if (!sizes) return;

    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setCurrentSize(sizes.mobile);
      } else if (width < 1024) {
        setCurrentSize(sizes.tablet);
      } else {
        setCurrentSize(sizes.desktop);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sizes]);

  return (
    <OptimizedImage
      {...props}
      width={currentSize.width}
      height={currentSize.height}
    />
  );
};

/**
 * Компонент галереи оптимизированных изображений
 */
export const ImageGallery: React.FC<{
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  columns?: number;
  gap?: number;
  quality?: number;
  className?: string;
}> = ({ images, columns = 3, gap = 16, quality = 80, className }) => {
  return (
    <div
      className={cn(
        'grid auto-rows-auto',
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`
      }}
    >
      {images.map((image, index) => (
        <OptimizedImage
          key={index}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          quality={quality}
          className="rounded-lg"
        />
      ))}
    </div>
  );
};

export default OptimizedImage;