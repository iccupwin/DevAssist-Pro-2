import type { Meta, StoryObj } from '@storybook/react';
import { designTokens } from '../design-tokens';

const meta: Meta = {
  title: 'Design System/Design Tokens',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Design Tokens

Система дизайн-токенов DevAssist Pro обеспечивает консистентность и масштабируемость дизайна.

## Что такое дизайн-токены?

Дизайн-токены - это именованные сущности, которые хранят значения визуальных атрибутов дизайна. Они представляют собой единственный источник истины для цветов, типографики, интервалов и других визуальных свойств.

## Преимущества

- **Консистентность**: Единые значения во всем приложении
- **Масштабируемость**: Легкое добавление новых компонентов
- **Темизация**: Поддержка светлой и темной темы
- **Типизация**: TypeScript поддержка для безопасности
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Компонент для отображения цветовых токенов
const ColorTokenGrid = ({ palette, title }: { palette: any; title: string }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
      {Object.entries(palette).map(([key, token]: [string, any]) => (
        <div key={key} className="text-center">
          <div
            className="w-full h-16 rounded-lg border-2 border-gray-200 mb-2"
            style={{ backgroundColor: token.value }}
          />
          <div className="text-xs">
            <div className="font-medium">{key}</div>
            <div className="text-gray-500">{token.value}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Компонент для отображения типографических токенов
const TypographyTokenGrid = () => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-4">Типографика</h3>
    <div className="space-y-4">
      {Object.entries(designTokens.typography.fontSize).map(([key, token]) => (
        <div key={key} className="flex items-center space-x-4 p-4 border rounded-lg">
          <div className="w-16 text-sm text-gray-500">{key}</div>
          <div 
            style={{ 
              fontSize: token.fontSize, 
              lineHeight: token.lineHeight,
              fontWeight: token.fontWeight
            }}
          >
            Пример текста {token.fontSize}
          </div>
          <div className="text-xs text-gray-500 ml-auto">
            {token.fontSize} / {token.lineHeight} / {token.fontWeight}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Компонент для отображения токенов интервалов
const SpacingTokenGrid = () => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-4">Интервалы</h3>
    <div className="space-y-2">
      {Object.entries(designTokens.spacing).map(([key, token]) => (
        <div key={key} className="flex items-center space-x-4 p-2 border rounded">
          <div className="w-8 text-sm">{key}</div>
          <div className="w-16 text-sm text-gray-500">{token.value}</div>
          <div className="flex-1">
            <div 
              className="bg-blue-500 h-4 rounded"
              style={{ width: token.value }}
            />
          </div>
          <div className="text-xs text-gray-500">{token.px}px</div>
        </div>
      ))}
    </div>
  </div>
);

// Компонент для отображения теней
const ShadowTokenGrid = () => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-4">Тени</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Object.entries(designTokens.shadows).map(([key, token]) => (
        <div key={key} className="text-center">
          <div
            className="w-full h-20 bg-white rounded-lg mb-2"
            style={{ boxShadow: token.value }}
          />
          <div className="text-sm font-medium">{key}</div>
          <div className="text-xs text-gray-500">{token.description}</div>
        </div>
      ))}
    </div>
  </div>
);

// Компонент для отображения радиусов границ
const BorderRadiusTokenGrid = () => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-4">Радиусы границ</h3>
    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
      {Object.entries(designTokens.borderRadius).map(([key, token]) => (
        <div key={key} className="text-center">
          <div
            className="w-16 h-16 bg-blue-500 mx-auto mb-2"
            style={{ borderRadius: token.value }}
          />
          <div className="text-sm font-medium">{key}</div>
          <div className="text-xs text-gray-500">{token.value}</div>
        </div>
      ))}
    </div>
  </div>
);

export const Colors: Story = {
  render: () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Цветовые токены</h2>
      
      <ColorTokenGrid 
        palette={designTokens.colors.brand.primary} 
        title="Основной бренд (Primary)" 
      />
      
      <ColorTokenGrid 
        palette={designTokens.colors.brand.secondary} 
        title="Вторичный бренд (Secondary)" 
      />
      
      <ColorTokenGrid 
        palette={designTokens.colors.brand.accent} 
        title="Акцентный цвет (Accent)" 
      />
      
      <ColorTokenGrid 
        palette={designTokens.colors.semantic.success} 
        title="Успех (Success)" 
      />
      
      <ColorTokenGrid 
        palette={designTokens.colors.semantic.warning} 
        title="Предупреждение (Warning)" 
      />
      
      <ColorTokenGrid 
        palette={designTokens.colors.semantic.error} 
        title="Ошибка (Error)" 
      />
      
      <ColorTokenGrid 
        palette={designTokens.colors.semantic.info} 
        title="Информация (Info)" 
      />
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">ИИ провайдеры</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(designTokens.colors.ai).map(([key, token]) => (
            <div key={key} className="text-center">
              <div
                className="w-full h-16 rounded-lg border-2 border-gray-200 mb-2"
                style={{ backgroundColor: token.value }}
              />
              <div className="text-sm font-medium">{key}</div>
              <div className="text-xs text-gray-500">{token.value}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Модули</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(designTokens.colors.modules).map(([key, token]) => (
            <div key={key} className="text-center">
              <div
                className="w-full h-16 rounded-lg border-2 border-gray-200 mb-2"
                style={{ backgroundColor: token.value }}
              />
              <div className="text-sm font-medium">{key}</div>
              <div className="text-xs text-gray-500">{token.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Типографические токены</h2>
      <TypographyTokenGrid />
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Семейства шрифтов</h3>
        <div className="space-y-4">
          {Object.entries(designTokens.typography.fontFamily).map(([key, token]) => (
            <div key={key} className="p-4 border rounded-lg">
              <div className="text-sm text-gray-500 mb-2">{key}</div>
              <div style={{ fontFamily: token.value }} className="text-lg">
                Пример текста в шрифте {key}
              </div>
              <div className="text-xs text-gray-400 mt-2">{token.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const Spacing: Story = {
  render: () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Токены интервалов</h2>
      <SpacingTokenGrid />
    </div>
  ),
};

export const Shadows: Story = {
  render: () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Токены теней</h2>
      <ShadowTokenGrid />
    </div>
  ),
};

export const BorderRadius: Story = {
  render: () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Токены радиусов границ</h2>
      <BorderRadiusTokenGrid />
    </div>
  ),
};

export const ComponentTokens: Story = {
  render: () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Компонентные токены</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Кнопки</h3>
        <div className="space-y-4">
          {Object.entries(designTokens.components.button.padding).map(([size, token]) => (
            <div key={size} className="flex items-center space-x-4">
              <div className="w-12 text-sm">{size}</div>
              <button 
                className="bg-blue-500 text-white rounded"
                style={{ 
                  padding: token.value,
                  height: designTokens.components.button.height[size as keyof typeof designTokens.components.button.height].value,
                  fontSize: designTokens.components.button.fontSize[size as keyof typeof designTokens.components.button.fontSize].value
                }}
              >
                Кнопка {size}
              </button>
              <div className="text-xs text-gray-500">
                padding: {token.value}, 
                height: {designTokens.components.button.height[size as keyof typeof designTokens.components.button.height].value},
                fontSize: {designTokens.components.button.fontSize[size as keyof typeof designTokens.components.button.fontSize].value}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Поля ввода</h3>
        <div className="space-y-4">
          <input 
            className="border rounded"
            style={{
              padding: designTokens.components.input.padding.value,
              height: designTokens.components.input.height.value,
              fontSize: designTokens.components.input.fontSize.value,
              borderRadius: designTokens.components.input.borderRadius.value,
              borderWidth: designTokens.components.input.borderWidth.value
            }}
            placeholder="Пример поля ввода"
          />
          <div className="text-xs text-gray-500">
            padding: {designTokens.components.input.padding.value}, 
            height: {designTokens.components.input.height.value},
            fontSize: {designTokens.components.input.fontSize.value}
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Карточки</h3>
        <div 
          className="border bg-white rounded"
          style={{
            padding: designTokens.components.card.padding.value,
            borderRadius: designTokens.components.card.borderRadius.value,
            borderWidth: designTokens.components.card.borderWidth.value
          }}
        >
          <h4 className="font-semibold mb-2">Пример карточки</h4>
          <p className="text-gray-600">
            Контент карточки с применением компонентных токенов.
          </p>
          <div className="text-xs text-gray-500 mt-4">
            padding: {designTokens.components.card.padding.value}, 
            borderRadius: {designTokens.components.card.borderRadius.value}
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Usage: Story = {
  render: () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Использование токенов</h2>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">CSS переменные</h3>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`:root {
  --color-primary: ${designTokens.colors.brand.primary[500].value};
  --color-secondary: ${designTokens.colors.brand.secondary[500].value};
  --spacing-md: ${designTokens.spacing[4].value};
  --radius-lg: ${designTokens.borderRadius.lg.value};
}

.button {
  background-color: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
}`}
          </pre>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">TypeScript</h3>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { getColorToken, getSpacingToken } from '@/design-tokens';

// Получение цветового токена
const primaryColor = getColorToken('brand', 'primary', 500);
// Результат: "${designTokens.colors.brand.primary[500].value}"

// Получение токена интервала
const mediumSpacing = getSpacingToken(4);
// Результат: "${designTokens.spacing[4].value}"

// Использование в компоненте
const Button = styled.button\`
  background-color: \${primaryColor};
  padding: \${mediumSpacing};
\`;`}
          </pre>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Tailwind CSS</h3>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// Конфигурация автоматически генерируется из токенов
import { generateTailwindConfig } from '@/design-tokens';

module.exports = generateTailwindConfig();

// Использование в JSX
<button className="bg-brand-primary-500 text-white p-spacing-4 rounded-lg">
  Кнопка
</button>`}
          </pre>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">React компоненты</h3>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { getButtonTokens, getSemanticColor } from '@/design-tokens';

const Button = ({ size = 'md', variant = 'primary' }) => {
  const tokens = getButtonTokens(size);
  const color = variant === 'danger' 
    ? getSemanticColor('error') 
    : getColorToken('brand', 'primary');
    
  return (
    <button 
      style={{
        padding: tokens.padding,
        height: tokens.height,
        fontSize: tokens.fontSize,
        backgroundColor: color
      }}
    >
      Кнопка
    </button>
  );
};`}
          </pre>
        </div>
      </div>
    </div>
  ),
};