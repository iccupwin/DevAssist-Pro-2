"use client";

import React, { ReactNode } from 'react';
import { classNames } from '../../lib/utils';

export interface BentoItem {
  title: string;
  description: string;
  icon: ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  rowSpan?: number;
  hasPersistentHover?: boolean;
  onClick?: () => void;
}

interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

const BentoGrid: React.FC<BentoGridProps> = ({ items, className = "" }) => {
  return (
    <div className={classNames(
      "grid grid-cols-1 md:grid-cols-3 gap-4 p-4 max-w-7xl mx-auto",
      className
    )}>
      {items.map((item, index) => (
        <div
          key={index}
          onClick={item.onClick}
          className={classNames(
            "group relative p-6 rounded-2xl overflow-hidden transition-all duration-300",
            "border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-white/[0.02] backdrop-blur-md",
            "hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_32px_rgba(255,255,255,0.08)]",
            "hover:-translate-y-1 hover:scale-[1.02] will-change-transform",
            item.colSpan === 2 ? "md:col-span-2" : "col-span-1",
            item.rowSpan === 2 ? "row-span-2" : "row-span-1",
            item.onClick ? "cursor-pointer" : "",
            item.hasPersistentHover ? "shadow-lg -translate-y-0.5" : ""
          )}
        >
          {/* Background pattern overlay */}
          <div className={`absolute inset-0 ${
            item.hasPersistentHover
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          } transition-opacity duration-300`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:4px_4px]" />
          </div>

          {/* Main gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex flex-col space-y-4 h-full">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-white/10 group-hover:bg-gradient-to-br group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-300">
                {item.icon}
              </div>
              {item.status && (
                <span className={classNames(
                  "text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm",
                  item.status === "Активен" || item.status === "Live" || item.status === "Online"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : item.status === "Скоро" || item.status === "Beta"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                )}>
                  {item.status}
                </span>
              )}
            </div>
            
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 tracking-tight">
                {item.title}
                {item.meta && (
                  <span className="ml-2 text-xs text-gray-600 dark:text-gray-400 font-normal">
                    {item.meta}
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-auto">
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="text-xs px-2 py-1 rounded-md bg-gray-200 dark:bg-white/10 backdrop-blur-sm text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-gray-300 dark:hover:bg-white/20"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              {item.onClick && (
                <span className="text-xs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                  {item.cta || "Открыть →"}
                </span>
              )}
            </div>
          </div>
          
          {/* Enhanced border gradient */}
          <div className={`absolute inset-0 -z-10 rounded-2xl p-px bg-gradient-to-br from-transparent via-gray-100/50 to-transparent dark:via-white/10 ${
            item.hasPersistentHover
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          } transition-opacity duration-300`} />
          
          {/* Bottom gradient indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl" />
        </div>
      ))}
    </div>
  );
};

export { BentoGrid };
export default BentoGrid;