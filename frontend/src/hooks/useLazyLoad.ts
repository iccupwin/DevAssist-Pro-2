import { useState, useEffect, useRef } from 'react';

/**
 * Hook for lazy loading components when they enter the viewport
 */
export const useLazyLoad = (threshold = 0.1) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsIntersecting(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, hasLoaded]);

  return { ref: elementRef, isIntersecting, hasLoaded };
};

/**
 * Hook for preloading components based on user interaction
 */
export const usePreload = () => {
  const [preloadedComponents, setPreloadedComponents] = useState<Set<string>>(new Set());

  const preload = (componentName: string, loader: () => Promise<any>) => {
    if (preloadedComponents.has(componentName)) return;

    loader().then(() => {
      setPreloadedComponents(prev => new Set(prev).add(componentName));
    });
  };

  return { preload, preloadedComponents };
};

/**
 * Hook for progressive image loading
 */
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { ref, isIntersecting } = useLazyLoad();

  useEffect(() => {
    if (!isIntersecting) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    img.onerror = () => {
      setError('Failed to load image');
      setIsLoading(false);
    };
    img.src = src;
  }, [isIntersecting, src]);

  return { ref, imageSrc, isLoading, error };
};

/**
 * Hook for lazy loading data with caching
 */
export const useLazyData = <T>(
  key: string,
  fetcher: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const cache = useRef<Map<string, T>>(new Map());

  const load = async () => {
    if (hasLoaded || isLoading) return;

    // Check cache first
    const cached = cache.current.get(key);
    if (cached) {
      setData(cached);
      setHasLoaded(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cache.current.set(key, result);
      setData(result);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoaded) {
      setHasLoaded(false);
      setData(null);
    }
  }, dependencies);

  return { data, isLoading, error, load, hasLoaded };
};

export default useLazyLoad;