import React from 'react';
import { cn } from '../../lib/utils';

interface LandmarkProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

/**
 * Семантические ориентиры для улучшения навигации screen reader
 */

/**
 * Основная область содержимого
 */
export const MainLandmark: React.FC<LandmarkProps> = ({
  children,
  className,
  ariaLabel,
  ariaLabelledBy
}) => {
  return (
    <main
      className={cn('focus:outline-none', className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      tabIndex={-1}
      id="main-content"
    >
      {children}
    </main>
  );
};

/**
 * Область навигации
 */
export const NavigationLandmark: React.FC<LandmarkProps> = ({
  children,
  className,
  ariaLabel = 'Основная навигация',
  ariaLabelledBy
}) => {
  return (
    <nav
      className={cn('focus:outline-none', className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      role="navigation"
    >
      {children}
    </nav>
  );
};

/**
 * Дополнительная область навигации
 */
export const ComplementaryLandmark: React.FC<LandmarkProps> = ({
  children,
  className,
  ariaLabel,
  ariaLabelledBy
}) => {
  return (
    <aside
      className={cn('focus:outline-none', className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      role="complementary"
    >
      {children}
    </aside>
  );
};

/**
 * Область с информацией о сайте
 */
export const ContentInfoLandmark: React.FC<LandmarkProps> = ({
  children,
  className,
  ariaLabel = 'Информация о сайте',
  ariaLabelledBy
}) => {
  return (
    <footer
      className={cn('focus:outline-none', className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      role="contentinfo"
    >
      {children}
    </footer>
  );
};

/**
 * Область баннера/заголовка
 */
export const BannerLandmark: React.FC<LandmarkProps> = ({
  children,
  className,
  ariaLabel = 'Заголовок сайта',
  ariaLabelledBy
}) => {
  return (
    <header
      className={cn('focus:outline-none', className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      role="banner"
    >
      {children}
    </header>
  );
};

/**
 * Область поиска
 */
export const SearchLandmark: React.FC<LandmarkProps> = ({
  children,
  className,
  ariaLabel = 'Поиск',
  ariaLabelledBy
}) => {
  return (
    <section
      className={cn('focus:outline-none', className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      role="search"
    >
      {children}
    </section>
  );
};

/**
 * Общая область
 */
export const RegionLandmark: React.FC<LandmarkProps & {
  heading?: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}> = ({
  children,
  className,
  ariaLabel,
  ariaLabelledBy,
  heading,
  headingLevel = 2
}) => {
  const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;
  const headingId = heading ? `region-heading-${heading.toLowerCase().replace(/\s+/g, '-')}` : undefined;

  return (
    <section
      className={cn('focus:outline-none', className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy || headingId}
      role="region"
    >
      {heading && (
        <HeadingTag id={headingId} className="sr-only">
          {heading}
        </HeadingTag>
      )}
      {children}
    </section>
  );
};

/**
 * Хлебные крошки
 */
export const BreadcrumbNavigation: React.FC<{
  items: { label: string; href?: string; current?: boolean }[];
  className?: string;
}> = ({ items, className }) => {
  return (
    <nav aria-label="Навигационная цепочка" className={cn('', className)}>
      <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400" aria-hidden="true">
                /
              </span>
            )}
            {item.current ? (
              <span aria-current="page" className="font-medium text-gray-900 dark:text-white">
                {item.label}
              </span>
            ) : item.href ? (
              <a
                href={item.href}
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

/**
 * Компонент для структурирования заголовков
 */
export const HeadingStructure: React.FC<{
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ level, children, className, id }) => {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const baseStyles = {
    1: 'text-3xl font-bold text-gray-900 dark:text-white',
    2: 'text-2xl font-semibold text-gray-900 dark:text-white',
    3: 'text-xl font-semibold text-gray-900 dark:text-white',
    4: 'text-lg font-medium text-gray-900 dark:text-white',
    5: 'text-base font-medium text-gray-900 dark:text-white',
    6: 'text-sm font-medium text-gray-900 dark:text-white'
  };

  return (
    <HeadingTag
      id={id}
      className={cn(baseStyles[level], className)}
    >
      {children}
    </HeadingTag>
  );
};

export default {
  MainLandmark,
  NavigationLandmark,
  ComplementaryLandmark,
  ContentInfoLandmark,
  BannerLandmark,
  SearchLandmark,
  RegionLandmark,
  BreadcrumbNavigation,
  HeadingStructure
};