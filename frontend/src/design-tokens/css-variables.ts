// CSS Variables Generator for Design Tokens
// Generates CSS custom properties from design tokens

import { designTokens } from './tokens'
import { generateCSSVariables, lightTheme, darkTheme } from './theme'

// Generate CSS string for all design tokens
export const generateTokenCSS = (): string => {
  const lightVars = generateCSSVariables(lightTheme)
  const darkVars = generateCSSVariables(darkTheme)
  
  return `
/* DevAssist Pro Design Tokens */
/* Generated automatically from design tokens */

:root {
  /* Light theme variables (default) */
  ${Object.entries(lightVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')}

  /* Typography tokens */
  --font-family-sans: ${designTokens.typography.fontFamily.sans.value};
  --font-family-serif: ${designTokens.typography.fontFamily.serif.value};
  --font-family-mono: ${designTokens.typography.fontFamily.mono.value};
  --font-family-display: ${designTokens.typography.fontFamily.display.value};

  /* Font size tokens */
  --font-size-xs: ${designTokens.typography.fontSize.xs.fontSize};
  --font-size-sm: ${designTokens.typography.fontSize.sm.fontSize};
  --font-size-base: ${designTokens.typography.fontSize.base.fontSize};
  --font-size-lg: ${designTokens.typography.fontSize.lg.fontSize};
  --font-size-xl: ${designTokens.typography.fontSize.xl.fontSize};
  --font-size-2xl: ${designTokens.typography.fontSize['2xl'].fontSize};
  --font-size-3xl: ${designTokens.typography.fontSize['3xl'].fontSize};
  --font-size-4xl: ${designTokens.typography.fontSize['4xl'].fontSize};
  --font-size-5xl: ${designTokens.typography.fontSize['5xl'].fontSize};
  --font-size-6xl: ${designTokens.typography.fontSize['6xl'].fontSize};
  --font-size-7xl: ${designTokens.typography.fontSize['7xl'].fontSize};
  --font-size-8xl: ${designTokens.typography.fontSize['8xl'].fontSize};
  --font-size-9xl: ${designTokens.typography.fontSize['9xl'].fontSize};

  /* Line height tokens */
  --line-height-xs: ${designTokens.typography.fontSize.xs.lineHeight};
  --line-height-sm: ${designTokens.typography.fontSize.sm.lineHeight};
  --line-height-base: ${designTokens.typography.fontSize.base.lineHeight};
  --line-height-lg: ${designTokens.typography.fontSize.lg.lineHeight};
  --line-height-xl: ${designTokens.typography.fontSize.xl.lineHeight};
  --line-height-2xl: ${designTokens.typography.fontSize['2xl'].lineHeight};
  --line-height-3xl: ${designTokens.typography.fontSize['3xl'].lineHeight};
  --line-height-4xl: ${designTokens.typography.fontSize['4xl'].lineHeight};
  --line-height-5xl: ${designTokens.typography.fontSize['5xl'].lineHeight};

  /* Font weight tokens */
  --font-weight-thin: ${designTokens.typography.fontWeight.thin.value};
  --font-weight-extralight: ${designTokens.typography.fontWeight.extralight.value};
  --font-weight-light: ${designTokens.typography.fontWeight.light.value};
  --font-weight-normal: ${designTokens.typography.fontWeight.normal.value};
  --font-weight-medium: ${designTokens.typography.fontWeight.medium.value};
  --font-weight-semibold: ${designTokens.typography.fontWeight.semibold.value};
  --font-weight-bold: ${designTokens.typography.fontWeight.bold.value};
  --font-weight-extrabold: ${designTokens.typography.fontWeight.extrabold.value};
  --font-weight-black: ${designTokens.typography.fontWeight.black.value};

  /* Letter spacing tokens */
  --letter-spacing-tighter: ${designTokens.typography.letterSpacing.tighter.value};
  --letter-spacing-tight: ${designTokens.typography.letterSpacing.tight.value};
  --letter-spacing-normal: ${designTokens.typography.letterSpacing.normal.value};
  --letter-spacing-wide: ${designTokens.typography.letterSpacing.wide.value};
  --letter-spacing-wider: ${designTokens.typography.letterSpacing.wider.value};
  --letter-spacing-widest: ${designTokens.typography.letterSpacing.widest.value};

  /* Z-index tokens */
  --z-index-hide: ${designTokens.zIndex.hide.value};
  --z-index-auto: ${designTokens.zIndex.auto.value};
  --z-index-base: ${designTokens.zIndex.base.value};
  --z-index-docked: ${designTokens.zIndex.docked.value};
  --z-index-dropdown: ${designTokens.zIndex.dropdown.value};
  --z-index-sticky: ${designTokens.zIndex.sticky.value};
  --z-index-banner: ${designTokens.zIndex.banner.value};
  --z-index-overlay: ${designTokens.zIndex.overlay.value};
  --z-index-modal: ${designTokens.zIndex.modal.value};
  --z-index-popover: ${designTokens.zIndex.popover.value};
  --z-index-skip-link: ${designTokens.zIndex.skipLink.value};
  --z-index-toast: ${designTokens.zIndex.toast.value};
  --z-index-tooltip: ${designTokens.zIndex.tooltip.value};

  /* Component tokens */
  --button-padding-sm: ${designTokens.components.button.padding.sm.value};
  --button-padding-md: ${designTokens.components.button.padding.md.value};
  --button-padding-lg: ${designTokens.components.button.padding.lg.value};
  --button-height-sm: ${designTokens.components.button.height.sm.value};
  --button-height-md: ${designTokens.components.button.height.md.value};
  --button-height-lg: ${designTokens.components.button.height.lg.value};
  --button-font-size-sm: ${designTokens.components.button.fontSize.sm.value};
  --button-font-size-md: ${designTokens.components.button.fontSize.md.value};
  --button-font-size-lg: ${designTokens.components.button.fontSize.lg.value};

  --input-padding: ${designTokens.components.input.padding.value};
  --input-height: ${designTokens.components.input.height.value};
  --input-font-size: ${designTokens.components.input.fontSize.value};
  --input-border-width: ${designTokens.components.input.borderWidth.value};
  --input-border-radius: ${designTokens.components.input.borderRadius.value};

  --card-padding: ${designTokens.components.card.padding.value};
  --card-border-radius: ${designTokens.components.card.borderRadius.value};
  --card-border-width: ${designTokens.components.card.borderWidth.value};

  --modal-padding: ${designTokens.components.modal.padding.value};
  --modal-border-radius: ${designTokens.components.modal.borderRadius.value};
  --modal-max-width: ${designTokens.components.modal.maxWidth.value};

  /* Brand tokens */
  --logo-size-sm: ${designTokens.brand.logo.sm.value};
  --logo-size-md: ${designTokens.brand.logo.md.value};
  --logo-size-lg: ${designTokens.brand.logo.lg.value};

  --brand-spacing-section: ${designTokens.brand.spacing.section.value};
  --brand-spacing-container: ${designTokens.brand.spacing.container.value};
  --brand-spacing-component: ${designTokens.brand.spacing.component.value};

  /* Russian brand colors */
  --brand-russian-blue: ${designTokens.brand.colors.russian.blue.value};
  --brand-russian-red: ${designTokens.brand.colors.russian.red.value};
  --brand-russian-white: ${designTokens.brand.colors.russian.white.value};

  /* Breakpoint tokens */
  --breakpoint-xs: ${designTokens.breakpoints.xs.value};
  --breakpoint-sm: ${designTokens.breakpoints.sm.value};
  --breakpoint-md: ${designTokens.breakpoints.md.value};
  --breakpoint-lg: ${designTokens.breakpoints.lg.value};
  --breakpoint-xl: ${designTokens.breakpoints.xl.value};
  --breakpoint-2xl: ${designTokens.breakpoints['2xl'].value};
}

/* Dark theme variables */
[data-theme="dark"], .dark {
  ${Object.entries(darkVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')}
}

/* Responsive breakpoint media queries */
@media (min-width: ${designTokens.breakpoints.sm.value}) {
  .container {
    max-width: ${designTokens.breakpoints.sm.value};
  }
}

@media (min-width: ${designTokens.breakpoints.md.value}) {
  .container {
    max-width: ${designTokens.breakpoints.md.value};
  }
}

@media (min-width: ${designTokens.breakpoints.lg.value}) {
  .container {
    max-width: ${designTokens.breakpoints.lg.value};
  }
}

@media (min-width: ${designTokens.breakpoints.xl.value}) {
  .container {
    max-width: ${designTokens.breakpoints.xl.value};
  }
}

@media (min-width: ${designTokens.breakpoints['2xl'].value}) {
  .container {
    max-width: ${designTokens.breakpoints['2xl'].value};
  }
}

/* Animation keyframes */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideLeft {
  from {
    opacity: 0;
    transform: translateX(16px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(-16px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scaleOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

@keyframes wiggle {
  0%, 100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg);
  }
}

/* Utility classes for design tokens */
.text-xs { font-size: var(--font-size-xs); line-height: var(--line-height-xs); }
.text-sm { font-size: var(--font-size-sm); line-height: var(--line-height-sm); }
.text-base { font-size: var(--font-size-base); line-height: var(--line-height-base); }
.text-lg { font-size: var(--font-size-lg); line-height: var(--line-height-lg); }
.text-xl { font-size: var(--font-size-xl); line-height: var(--line-height-xl); }
.text-2xl { font-size: var(--font-size-2xl); line-height: var(--line-height-2xl); }
.text-3xl { font-size: var(--font-size-3xl); line-height: var(--line-height-3xl); }
.text-4xl { font-size: var(--font-size-4xl); line-height: var(--line-height-4xl); }
.text-5xl { font-size: var(--font-size-5xl); line-height: var(--line-height-5xl); }

.font-thin { font-weight: var(--font-weight-thin); }
.font-extralight { font-weight: var(--font-weight-extralight); }
.font-light { font-weight: var(--font-weight-light); }
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }
.font-extrabold { font-weight: var(--font-weight-extrabold); }
.font-black { font-weight: var(--font-weight-black); }

.bg-primary { background-color: var(--color-bg-primary); }
.bg-secondary { background-color: var(--color-bg-secondary); }
.bg-tertiary { background-color: var(--color-bg-tertiary); }

.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-tertiary { color: var(--color-text-tertiary); }
.text-inverse { color: var(--color-text-inverse); }
.text-disabled { color: var(--color-text-disabled); }

.border-primary { border-color: var(--color-border-primary); }
.border-secondary { border-color: var(--color-border-secondary); }
.border-focus { border-color: var(--color-border-focus); }
.border-error { border-color: var(--color-border-error); }
.border-success { border-color: var(--color-border-success); }
.border-warning { border-color: var(--color-border-warning); }

.rounded-sm { border-radius: var(--radius-sm); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-xl { border-radius: var(--radius-xl); }
.rounded-full { border-radius: var(--radius-full); }

.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-xl { box-shadow: var(--shadow-xl); }
.shadow-glow { box-shadow: var(--shadow-glow); }

.animate-fade-in { animation: fadeIn var(--duration-base) var(--easing-smooth); }
.animate-fade-out { animation: fadeOut var(--duration-base) var(--easing-smooth); }
.animate-slide-up { animation: slideUp var(--duration-slow) var(--easing-smooth); }
.animate-slide-down { animation: slideDown var(--duration-slow) var(--easing-smooth); }
.animate-slide-left { animation: slideLeft var(--duration-slow) var(--easing-smooth); }
.animate-slide-right { animation: slideRight var(--duration-slow) var(--easing-smooth); }
.animate-scale-in { animation: scaleIn var(--duration-base) var(--easing-smooth); }
.animate-scale-out { animation: scaleOut var(--duration-base) var(--easing-smooth); }
.animate-spin { animation: spin 1s linear infinite; }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.animate-bounce { animation: bounce 1s infinite; }
.animate-wiggle { animation: wiggle 1s ease-in-out; }
`
}

// Apply CSS variables to document
export const applyCSSVariables = (theme: 'light' | 'dark' = 'light'): void => {
  const root = document.documentElement
  const vars = theme === 'light' ? generateCSSVariables(lightTheme) : generateCSSVariables(darkTheme)
  
  Object.entries(vars).forEach(([property, value]) => {
    root.style.setProperty(property, value)
  })
}

// Get CSS variable value
export const getCSSVariable = (variable: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
}

// Set CSS variable value
export const setCSSVariable = (variable: string, value: string): void => {
  document.documentElement.style.setProperty(variable, value)
}

export default generateTokenCSS