import React, { useState, useRef, useCallback } from 'react';
import { Play, Pause, VolumeX, Volume2, Maximize2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AccessibleImageProps {
  src: string;
  alt: string;
  caption?: string;
  longDescription?: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

interface AccessibleVideoProps {
  src: string;
  poster?: string;
  alt: string;
  caption?: string;
  transcript?: string;
  className?: string;
  width?: number;
  height?: number;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

interface AccessibleAudioProps {
  src: string;
  alt: string;
  transcript?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

/**
 * Доступное изображение с подписями и альтернативным текстом
 */
export const AccessibleImage: React.FC<AccessibleImageProps> = ({
  src,
  alt,
  caption,
  longDescription,
  className,
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const imageId = `image-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = longDescription ? `${imageId}-description` : undefined;

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setImageError(true);
    onError?.();
  }, [onError]);

  if (imageError) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4', className)}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Изображение не загружено: {alt}
          </p>
        </div>
      </div>
    );
  }

  return (
    <figure className={cn('', className)}>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
        )}
        <img
          id={imageId}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'rounded-lg shadow-sm',
            isLoading && 'opacity-0',
            !isLoading && 'opacity-100 transition-opacity'
          )}
          aria-describedby={descriptionId}
        />
      </div>
      
      {caption && (
        <figcaption className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
          {caption}
        </figcaption>
      )}
      
      {longDescription && (
        <div id={descriptionId} className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <details>
            <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-white">
              Подробное описание
            </summary>
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
              {longDescription}
            </div>
          </details>
        </div>
      )}
    </figure>
  );
};

/**
 * Доступное видео с субтитрами и транскрипцией
 */
export const AccessibleVideo: React.FC<AccessibleVideoProps> = ({
  src,
  poster,
  alt,
  caption,
  transcript,
  className,
  width,
  height,
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showTranscript, setShowTranscript] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoId = `video-${Math.random().toString(36).substr(2, 9)}`;

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleFullscreen = useCallback(() => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  }, []);

  return (
    <figure className={cn('', className)}>
      <div className="relative group">
        <video
          ref={videoRef}
          id={videoId}
          src={src}
          poster={poster}
          width={width}
          height={height}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          className="w-full rounded-lg shadow-sm"
          aria-label={alt}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <track kind="captions" srcLang="ru" label="Русские субтитры" />
          <p>Ваш браузер не поддерживает видео. {alt}</p>
        </video>

        {/* Кастомные элементы управления */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black bg-opacity-50 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
              aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </button>
            
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
              aria-label={isMuted ? 'Включить звук' : 'Отключить звук'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          
          <button
            onClick={handleFullscreen}
            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
            aria-label="Полный экран"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {caption && (
        <figcaption className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
          {caption}
        </figcaption>
      )}

      {transcript && (
        <div className="mt-4">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            aria-expanded={showTranscript}
            aria-controls={`${videoId}-transcript`}
          >
            {showTranscript ? 'Скрыть' : 'Показать'} транскрипцию
          </button>
          
          {showTranscript && (
            <div
              id={`${videoId}-transcript`}
              className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-600 dark:text-gray-400"
              role="region"
              aria-label="Транскрипция видео"
            >
              <h4 className="font-medium mb-2">Транскрипция:</h4>
              <p>{transcript}</p>
            </div>
          )}
        </div>
      )}
    </figure>
  );
};

/**
 * Доступное аудио с транскрипцией
 */
export const AccessibleAudio: React.FC<AccessibleAudioProps> = ({
  src,
  alt,
  transcript,
  className,
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false
}) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const audioId = `audio-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <figure className={cn('', className)}>
      <audio
        id={audioId}
        src={src}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        className="w-full"
        aria-label={alt}
      >
        <p>Ваш браузер не поддерживает аудио. {alt}</p>
      </audio>

      {transcript && (
        <div className="mt-4">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            aria-expanded={showTranscript}
            aria-controls={`${audioId}-transcript`}
          >
            {showTranscript ? 'Скрыть' : 'Показать'} транскрипцию
          </button>
          
          {showTranscript && (
            <div
              id={`${audioId}-transcript`}
              className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-600 dark:text-gray-400"
              role="region"
              aria-label="Транскрипция аудио"
            >
              <h4 className="font-medium mb-2">Транскрипция:</h4>
              <p>{transcript}</p>
            </div>
          )}
        </div>
      )}
    </figure>
  );
};

/**
 * Декоративное изображение (без alt текста)
 */
export const DecorativeImage: React.FC<{
  src: string;
  className?: string;
  width?: number;
  height?: number;
}> = ({ src, className, width, height }) => {
  return (
    <img
      src={src}
      alt=""
      width={width}
      height={height}
      className={cn('rounded-lg', className)}
      aria-hidden="true"
      role="presentation"
    />
  );
};

export default {
  AccessibleImage,
  AccessibleVideo,
  AccessibleAudio,
  DecorativeImage
};