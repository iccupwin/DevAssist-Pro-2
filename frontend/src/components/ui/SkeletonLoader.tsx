import React from 'react';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  animate = true 
}) => {
  return (
    <div 
      className={`bg-gray-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
    />
  );
};

// Скелетон для карточки модуля
export const ModuleCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  );
};

// Скелетон для таблицы
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex space-x-4">
          {Array(cols).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y">
        {Array(rows).fill(0).map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex space-x-4">
              {Array(cols).fill(0).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Скелетон для графика
export const ChartSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      
      <div className="space-y-3">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton 
              className="h-3 rounded-full" 
              style={{ width: `${Math.random() * 60 + 20}%` }}
            />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Скелетон для списка файлов
export const FileListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-2">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-4 h-4" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="w-4 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Скелетон для дашборда
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border p-4 space-y-3">
            <div className="flex justify-between items-start">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <ModuleCardSkeleton key={i} />
            ))}
          </div>
        </div>
        
        <div className="space-y-6">
          <ChartSkeleton />
          <div className="bg-white rounded-xl border p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <FileListSkeleton count={5} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;