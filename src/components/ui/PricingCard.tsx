import React from 'react';
import { Check } from 'lucide-react';
import { classNames } from '../../lib/utils';

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  highlight?: boolean;
  highlightLabel?: string;
  buttonVariant?: "default" | "outline";
  isDarkMode?: boolean;
}

export function PricingCard({
  title,
  price,
  description,
  features,
  highlight = false,
  highlightLabel,
  buttonVariant = "outline",
  isDarkMode = true,
}: PricingCardProps) {
  return (
    <div
      className={classNames(
        "flex flex-col justify-between p-6 space-y-4 transition-all duration-300 border rounded-xl",
        highlight 
          ? `bg-gradient-to-br ${isDarkMode ? 'from-blue-900/20 to-purple-900/20 border-blue-500/30' : 'from-blue-50 to-purple-50 border-blue-300/50'} relative overflow-hidden` 
          : `${isDarkMode ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]' : 'bg-black/[0.02] border-gray-200 hover:bg-black/[0.05]'}`,
        "hover:scale-105 hover:shadow-xl"
      )}
    >
      {highlight && (
        <div className={classNames(
          "absolute top-0 left-0 right-0 text-center py-2 text-xs font-medium",
          isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
        )}>
          {highlightLabel || "Рекомендуемый"}
        </div>
      )}
      
      <div className={highlight ? "mt-6" : ""}>
        <div className="space-y-4">
          <div>
            <h2 className={classNames(
              "font-medium text-lg",
              isDarkMode ? 'text-white' : 'text-gray-900'
            )}>
              {title}
            </h2>
            <span className={classNames(
              "my-3 block text-3xl font-bold",
              highlight 
                ? (isDarkMode ? 'text-blue-300' : 'text-blue-600')
                : (isDarkMode ? 'text-white' : 'text-gray-900')
            )}>
              {price}
            </span>
            <p className={classNames(
              "text-sm",
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            )}>
              {description}
            </p>
          </div>

          <button 
            className={classNames(
              "w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200",
              highlight
                ? (isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white')
                : (buttonVariant === "outline"
                    ? (isDarkMode 
                        ? 'border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white' 
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50')
                    : (isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'))
            )}
          >
            Начать работу
          </button>
        </div>
      </div>

      <ul className={classNames(
        "list-outside space-y-3 text-sm border-t pt-4",
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      )}>
        {features.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className={classNames(
              "w-4 h-4",
              highlight 
                ? (isDarkMode ? 'text-blue-400' : 'text-blue-500')
                : (isDarkMode ? 'text-green-400' : 'text-green-500')
            )} />
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PricingProps {
  isDarkMode?: boolean;
}

export default function Pricing({ isDarkMode = true }: PricingProps) {
  const pricingPlans = [
    {
      title: "Стартовый",
      price: "Бесплатно",
      description: "Для небольших проектов и тестирования",
      features: [
        "До 10 КП в месяц",
        "Базовый анализ документов",
        "Экспорт в PDF",
        "Email поддержка",
        "Доступ к 1 AI модели"
      ],
      buttonVariant: "outline" as const,
    },
    {
      title: "Профессиональный",
      price: "₽29,990/мес",
      description: "Для средних девелоперских компаний",
      features: [
        "До 100 КП в месяц",
        "Расширенный AI анализ",
        "Сравнительные отчеты",
        "Интеграция с CRM",
        "Доступ ко всем AI моделям",
        "Приоритетная поддержка",
        "Командная работа до 5 пользователей"
      ],
      highlight: true,
      highlightLabel: "Популярный выбор",
      buttonVariant: "default" as const,
    },
    {
      title: "Корпоративный",
      price: "₽99,990/мес",
      description: "Для крупных девелоперских холдингов",
      features: [
        "Неограниченное количество КП",
        "Кастомизация AI моделей",
        "API интеграция",
        "Белая маркировка",
        "Безлимитные пользователи",
        "SLA 99.9%",
        "Персональный менеджер",
        "Обучение команды"
      ],
      buttonVariant: "outline" as const,
    }
  ];

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className={classNames(
            "text-3xl md:text-4xl font-bold mb-4",
            isDarkMode ? 'text-white' : 'text-gray-900'
          )}>
            Выберите подходящий тариф
          </h2>
          <p className={classNames(
            "text-lg max-w-2xl mx-auto",
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          )}>
            Масштабируемые решения для компаний любого размера. Начните бесплатно и растите вместе с нами.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <PricingCard
              key={index}
              title={plan.title}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              highlight={plan.highlight}
              highlightLabel={plan.highlightLabel}
              buttonVariant={plan.buttonVariant}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>

        <div className={classNames(
          "text-center mt-12 p-6 rounded-xl border",
          isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'
        )}>
          <p className={classNames(
            "text-sm mb-4",
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          )}>
            Нужно больше возможностей? Свяжитесь с нами для индивидуального предложения
          </p>
          <button 
            className={classNames(
              "px-6 py-2 rounded-lg font-medium transition-colors",
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600' 
                : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
            )}
          >
            Связаться с отделом продаж
          </button>
        </div>
      </div>
    </div>
  );
}