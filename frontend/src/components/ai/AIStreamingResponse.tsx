/**
 * AI Streaming Response - Component for real-time AI responses
 * Согласно ТЗ DevAssist Pro
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Brain,
  Pause,
  Play,
  Square,
  RotateCcw,
  Copy,
  Download,
  MessageSquare,
  Clock,
  Zap,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { TaskRequest } from '../../services/ai/aiService';
import { AIProvider } from '../../types/aiConfig';

interface StreamChunk {
  id: string;
  taskType: string;
  delta: string;
  isComplete: boolean;
  model: string;
  provider: AIProvider;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  processingTime?: number;
}

interface AIStreamingResponseProps {
  request: TaskRequest;
  onStream: (request: TaskRequest) => AsyncGenerator<StreamChunk, void, unknown>;
  onComplete?: (content: string, metadata: any) => void;
  onError?: (error: Error) => void;
  autoStart?: boolean;
  showMetadata?: boolean;
  showControls?: boolean;
  className?: string;
}

const AIStreamingResponse: React.FC<AIStreamingResponseProps> = ({
  request,
  onStream,
  onComplete,
  onError,
  autoStart = false,
  showMetadata = true,
  showControls = true,
  className = ''
}) => {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{
    model?: string;
    provider?: AIProvider;
    usage?: StreamChunk['usage'];
    cost?: number;
    processingTime?: number;
    wordsPerSecond?: number;
  }>({});

  const streamGeneratorRef = useRef<AsyncGenerator<StreamChunk, void, unknown> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const wordCountRef = useRef(0);
  const pauseTimeRef = useRef<number | null>(null);
  const totalPauseTimeRef = useRef(0);

  // Автозапуск при монтировании
  useEffect(() => {
    if (autoStart) {
      startStreaming();
    }
    
    return () => {
      stopStreaming();
    };
  }, [autoStart]);

  // Подсчет слов
  const countWords = useCallback((text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  // Запуск стриминга
  const startStreaming = useCallback(async () => {
    if (isStreaming || isComplete) return;

    setIsStreaming(true);
    setIsPaused(false);
    setError(null);
    setContent('');
    setMetadata({});
    startTimeRef.current = Date.now();
    wordCountRef.current = 0;
    totalPauseTimeRef.current = 0;

    try {
      abortControllerRef.current = new AbortController();
      streamGeneratorRef.current = onStream(request);

      for await (const chunk of streamGeneratorRef.current) {
        // Проверяем, не была ли задача отменена
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        // Обновляем контент
        if (chunk.delta) {
          setContent(prev => {
            const newContent = prev + chunk.delta;
            wordCountRef.current = countWords(newContent);
            return newContent;
          });
        }

        // Обновляем метаданные
        setMetadata(prev => ({
          ...prev,
          model: chunk.model,
          provider: chunk.provider,
          usage: chunk.usage || prev.usage,
          cost: chunk.cost || prev.cost,
          processingTime: chunk.processingTime || prev.processingTime
        }));

        // Проверяем завершение
        if (chunk.isComplete) {
          setIsComplete(true);
          setIsStreaming(false);
          
          // Вычисляем финальную скорость
          if (startTimeRef.current && chunk.processingTime) {
            const effectiveTime = chunk.processingTime - totalPauseTimeRef.current;
            const wordsPerSecond = effectiveTime > 0 ? (wordCountRef.current / effectiveTime) * 1000 : 0;
            
            setMetadata(prev => ({ ...prev, wordsPerSecond }));
          }

          // Вызываем callback завершения
          if (onComplete) {
            onComplete(content + chunk.delta, {
              model: chunk.model,
              provider: chunk.provider,
              usage: chunk.usage,
              cost: chunk.cost,
              processingTime: chunk.processingTime,
              wordsPerSecond: metadata.wordsPerSecond
            });
          }
          break;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Streaming failed';
      setError(errorMessage);
      setIsStreaming(false);
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    }
  }, [request, onStream, onComplete, onError, content, metadata.wordsPerSecond, countWords, isStreaming, isComplete]);

  // Остановка стриминга
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setIsPaused(false);
  }, []);

  // Пауза/возобновление стриминга
  const togglePause = useCallback(() => {
    if (isPaused) {
      // Возобновляем
      if (pauseTimeRef.current) {
        totalPauseTimeRef.current += Date.now() - pauseTimeRef.current;
        pauseTimeRef.current = null;
      }
      setIsPaused(false);
    } else {
      // Ставим на паузу
      pauseTimeRef.current = Date.now();
      setIsPaused(true);
    }
  }, [isPaused]);

  // Перезапуск стриминга
  const restartStreaming = useCallback(() => {
    stopStreaming();
    setIsComplete(false);
    setTimeout(() => startStreaming(), 100);
  }, [stopStreaming, startStreaming]);

  // Копирование контента
  const copyContent = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.warn('Failed to copy content:', err);
    }
  }, [content]);

  // Скачивание контента
  const downloadContent = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-response-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content]);

  // Получение иконки провайдера
  const getProviderIcon = (provider?: AIProvider) => {
    switch (provider) {
      case 'openai': return '🤖';
      case 'anthropic': return '🎭';
      case 'google': return '🔍';
      default: return '🤖';
    }
  };

  // Форматирование времени
  const formatTime = (ms?: number) => {
    if (!ms) return '0s';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Форматирование стоимости
  const formatCost = (cost?: number) => {
    if (!cost) return '$0.000';
    return `$${cost.toFixed(4)}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Response</h3>
            <p className="text-sm text-gray-400">
              {metadata.provider && `${getProviderIcon(metadata.provider)} ${metadata.model || metadata.provider}`}
            </p>
          </div>
        </div>

        {/* Controls */}
        {showControls && (
          <div className="flex items-center space-x-2">
            {!isComplete && (
              <>
                {!isStreaming ? (
                  <Button onClick={startStreaming} size="sm" variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button onClick={togglePause} size="sm" variant="outline">
                    {isPaused ? (
                      <Play className="h-4 w-4 mr-2" />
                    ) : (
                      <Pause className="h-4 w-4 mr-2" />
                    )}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                )}
                
                <Button onClick={stopStreaming} size="sm" variant="outline">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
            
            <Button onClick={restartStreaming} size="sm" variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart
            </Button>
            
            {content && (
              <>
                <Button onClick={copyContent} size="sm" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                
                <Button onClick={downloadContent} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isStreaming && !isPaused ? 'bg-green-500 animate-pulse' :
            isPaused ? 'bg-yellow-500' :
            isComplete ? 'bg-blue-500' :
            error ? 'bg-red-500' : 'bg-gray-500'
          }`} />
          <span className="text-gray-400">
            {isStreaming && !isPaused ? 'Streaming...' :
             isPaused ? 'Paused' :
             isComplete ? 'Complete' :
             error ? 'Error' : 'Ready'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-400">
          <MessageSquare className="h-4 w-4" />
          <span>{wordCountRef.current} words</span>
        </div>
        
        {metadata.processingTime && (
          <div className="flex items-center space-x-2 text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{formatTime(metadata.processingTime)}</span>
          </div>
        )}
        
        {metadata.wordsPerSecond && (
          <div className="flex items-center space-x-2 text-gray-400">
            <Zap className="h-4 w-4" />
            <span>{metadata.wordsPerSecond.toFixed(1)} w/s</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <div className="p-4 min-h-[200px] max-h-[600px] overflow-y-auto">
          {error ? (
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : content ? (
            <div className="text-white whitespace-pre-wrap leading-relaxed">
              {content}
              {isStreaming && !isPaused && (
                <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1" />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <div className="text-center">
                <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Click Start to begin AI response streaming</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      {showMetadata && (metadata.usage || metadata.cost) && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metadata.usage && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-300">Tokens</span>
                </div>
                <div className="text-white">
                  <div className="text-lg font-bold">{metadata.usage.totalTokens.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">
                    {metadata.usage.promptTokens} + {metadata.usage.completionTokens}
                  </div>
                </div>
              </div>
            )}
            
            {metadata.cost && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-300">Cost</span>
                </div>
                <div className="text-white">
                  <div className="text-lg font-bold">{formatCost(metadata.cost)}</div>
                  <div className="text-xs text-gray-400">USD</div>
                </div>
              </div>
            )}
            
            {metadata.model && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-300">Model</span>
                </div>
                <div className="text-white">
                  <div className="text-sm font-bold">{metadata.model}</div>
                  <div className="text-xs text-gray-400">{metadata.provider}</div>
                </div>
              </div>
            )}
            
            {isComplete && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-300">Status</span>
                </div>
                <div className="text-white">
                  <div className="text-sm font-bold">Complete</div>
                  <div className="text-xs text-gray-400">
                    {formatTime(metadata.processingTime)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIStreamingResponse;