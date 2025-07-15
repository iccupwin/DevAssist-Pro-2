# DevAssist Pro Design Tokens

Comprehensive design token system for DevAssist Pro, providing consistent design language across all modules and components.

## 📋 Overview

This design token system implements a scalable, theme-aware design system that ensures consistency across the entire DevAssist Pro application. The tokens are organized into logical categories and support both light and dark themes.

## 🏗️ Architecture

```
src/design-tokens/
├── tokens.ts          # Core design tokens definition
├── theme.ts           # Theme configuration and mapping
├── css-variables.ts   # CSS custom properties generation
├── tailwind-config.ts # Tailwind CSS integration
├── index.ts           # Main export and utility functions
└── README.md          # This documentation
```

## 🎨 Token Categories

### Colors
- **Brand Colors**: Primary, secondary, and accent colors with full shade palettes (50-900)
- **Semantic Colors**: Success, warning, error, and info colors
- **Neutral Colors**: Grayscale palette and pure black/white
- **AI Provider Colors**: OpenAI, Anthropic, Google AI branding colors
- **Module Colors**: Specific colors for each DevAssist Pro module

### Typography
- **Font Families**: Sans-serif, serif, monospace, and display fonts
- **Font Sizes**: From xs (12px) to 9xl (128px) with corresponding line heights
- **Font Weights**: Thin (100) to black (900)
- **Letter Spacing**: Tight to widest spacing options

### Spacing
- **Consistent Scale**: 0px to 128px in logical increments
- **Semantic Names**: xs, sm, md, lg, xl, 2xl for common use cases

### Border Radius
- **Flexible Options**: From sharp corners to fully rounded (0px to 9999px)

### Shadows
- **Elevation System**: sm, md, lg, xl shadows for layering
- **Special Effects**: Glow and colored shadows for interactions

### Animations
- **Durations**: From instant (0ms) to slowest (1000ms)
- **Easing Functions**: Linear, ease, bounce, and smooth curves
- **Keyframes**: Pre-defined animations (fadeIn, slideUp, spin, etc.)

### Z-Index
- **Layering System**: Logical stacking order for UI elements
- **Named Levels**: dropdown, modal, tooltip, etc.

### Components
- **Button Variants**: Small, medium, large with appropriate padding and heights
- **Input Specifications**: Consistent sizing and spacing for form elements
- **Card Standards**: Default padding and border radius for containers
- **Modal Configuration**: Standard dimensions and spacing

## 🌗 Theme System

### Light Theme
- Clean, bright interface with high contrast
- Primary brand colors for interactive elements
- Subtle gray backgrounds and borders

### Dark Theme
- Dark backgrounds with light text
- Adjusted color contrasts for accessibility
- Consistent branding while maintaining readability

### Theme Switching
```typescript
import { applyCSSVariables } from '@/design-tokens'

// Apply light theme
applyCSSVariables('light')

// Apply dark theme
applyCSSVariables('dark')
```

## 🔧 Usage Examples

### Basic Token Access
```typescript
import { designTokens, getColorToken, getSpacingToken } from '@/design-tokens'

// Direct token access
const primaryColor = designTokens.colors.brand.primary[500].value
const mediumSpacing = designTokens.spacing[4].value

// Helper functions
const errorColor = getColorToken('semantic', 'error', 500)
const largeSpacing = getSpacingToken(6)
```

### Component Usage
```typescript
import { getButtonTokens, getSemanticColor } from '@/design-tokens'

const Button = ({ size = 'md', variant = 'primary' }) => {
  const tokens = getButtonTokens(size)
  const color = variant === 'danger' 
    ? getSemanticColor('error') 
    : getColorToken('brand', 'primary')
    
  return (
    <button 
      style={{
        padding: tokens.padding,
        height: tokens.height,
        fontSize: tokens.fontSize,
        backgroundColor: color
      }}
    >
      Click me
    </button>
  )
}
```

### CSS Variables
```css
/* Using generated CSS variables */
.custom-component {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

### Tailwind Integration
```typescript
// tailwind.config.js
import { generateTailwindConfig } from '@/design-tokens'

module.exports = generateTailwindConfig()
```

```jsx
// Using Tailwind classes with design tokens
<div className="bg-brand-primary-500 text-neutral-white p-spacing-4 rounded-lg shadow-md">
  Content with design tokens
</div>
```

## 🎯 Module-Specific Usage

### KP Analyzer Module
```typescript
import { getModuleColor } from '@/design-tokens'

const kpColor = getModuleColor('kpAnalyzer') // Returns #0ea5e9
```

### AI Provider Integration
```typescript
import { getAIProviderColor } from '@/design-tokens'

const openaiColor = getAIProviderColor('openai')     // #10a37f
const claudeColor = getAIProviderColor('anthropic')  // #d97706
const googleColor = getAIProviderColor('google')     // #4285f4
```

## 🌐 Russian Market Considerations

### Russian Brand Colors
```typescript
import { getRussianBrandColor } from '@/design-tokens'

const russianBlue = getRussianBrandColor('blue')   // #0066cc
const russianRed = getRussianBrandColor('red')     // #dc143c
const russianWhite = getRussianBrandColor('white') // #ffffff
```

## 🔄 Theme-Aware Components

### Automatic Theme Detection
```typescript
import { isDarkTheme, getCurrentTheme, getThemeColor } from '@/design-tokens'

const MyComponent = () => {
  const isDark = isDarkTheme()
  const theme = getCurrentTheme() // 'light' | 'dark'
  const backgroundColor = getThemeColor('bg-primary')
  
  return (
    <div style={{ backgroundColor }}>
      Current theme: {theme}
    </div>
  )
}
```

## 📱 Responsive Design

### Breakpoint Usage
```typescript
import { getBreakpoint, createMediaQuery } from '@/design-tokens'

const mobileBreakpoint = getBreakpoint('sm')        // '640px'
const desktopMediaQuery = createMediaQuery('lg')    // '@media (min-width: 1024px)'
```

## 🎨 Component Token Patterns

### Button Components
```typescript
import { getButtonTokens } from '@/design-tokens'

const SmallButton = () => {
  const tokens = getButtonTokens('sm')
  return <button style={tokens}>Small Button</button>
}

const LargeButton = () => {
  const tokens = getButtonTokens('lg')
  return <button style={tokens}>Large Button</button>
}
```

### Form Components
```typescript
import { getInputTokens } from '@/design-tokens'

const Input = () => {
  const tokens = getInputTokens()
  return <input style={tokens} />
}
```

## 🔍 Token Validation

### Development Helpers
```typescript
import { validateTokenPath, getTokenCategory } from '@/design-tokens'

// Validate token exists
if (validateTokenPath('colors.brand.primary.500')) {
  // Token exists and is valid
}

// Get all tokens in a category
const allColors = getTokenCategory('colors')
const allSpacing = getTokenCategory('spacing')
```

## 🎭 Animation System

### Pre-defined Animations
```typescript
import { getAnimationToken } from '@/design-tokens'

const fadeInAnimation = getAnimationToken('fadeIn')    // 'fadeIn 0.2s ease-out'
const slideUpAnimation = getAnimationToken('slideUp')  // 'slideUp 0.3s ease-out'
const spinAnimation = getAnimationToken('spin')        // 'spin 1s linear infinite'
```

### Custom Animation Classes
```css
.animate-fade-in { animation: var(--animation-fade-in); }
.animate-slide-up { animation: var(--animation-slide-up); }
.animate-spin { animation: var(--animation-spin); }
```

## 🚀 Performance Considerations

- **CSS Variables**: Efficient theme switching without re-rendering
- **Tree Shaking**: Import only needed tokens to reduce bundle size
- **Caching**: Token values are computed once and cached
- **TypeScript**: Full type safety prevents runtime errors

## 🔧 Development Workflow

### Adding New Tokens
1. Define tokens in `tokens.ts`
2. Update theme mappings in `theme.ts`
3. Add CSS variables in `css-variables.ts`
4. Extend Tailwind config in `tailwind-config.ts`
5. Export utilities in `index.ts`

### Token Naming Convention
- Use descriptive, semantic names
- Follow BEM-like structure: `category-subcategory-variant`
- Include usage documentation for each token

## 📊 Token Statistics

- **Colors**: 150+ color tokens across all palettes
- **Typography**: 50+ typography tokens (sizes, weights, spacing)
- **Spacing**: 13 spacing tokens from 0px to 128px
- **Components**: 30+ component-specific tokens
- **Animations**: 12 pre-defined animation keyframes
- **Themes**: 2 complete theme implementations (light/dark)

## 🎯 Best Practices

1. **Always use tokens**: Never hardcode design values
2. **Semantic naming**: Prefer semantic over literal names
3. **Theme awareness**: Use theme-aware functions for dynamic values
4. **Performance**: Import only needed tokens to optimize bundle size
5. **Validation**: Use TypeScript types to prevent invalid token usage
6. **Documentation**: Document custom tokens and their intended usage

## 🔮 Future Enhancements

- **High Contrast Theme**: Accessibility-focused theme variant
- **Brand Variations**: Different brand color schemes for white-label
- **Motion Preferences**: Respect user's motion preferences
- **Custom Theme Builder**: UI for creating custom themes
- **Token Documentation UI**: Interactive token browser and documentation

---

This design token system provides the foundation for a consistent, scalable, and maintainable design system across the entire DevAssist Pro application.