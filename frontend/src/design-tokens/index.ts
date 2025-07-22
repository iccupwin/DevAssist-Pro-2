// Design Tokens Entry Point
// Main export file for the DevAssist Pro design token system

// Core tokens
export { designTokens } from './tokens'
export type {
  ColorToken,
  SizeToken,
  TypographyToken,
  SpacingToken,
  ShadowToken,
  AnimationToken,
  BorderRadiusToken,
  ZIndexToken,
  DesignTokens
} from './tokens'

// Theme system
export { themes, lightTheme, darkTheme, generateCSSVariables } from './theme'
export type { Theme, ThemeName } from './theme'

// CSS variables
export {
  generateTokenCSS,
  applyCSSVariables,
  getCSSVariable,
  setCSSVariable
} from './css-variables'

// Tailwind integration
export { generateTailwindConfig, tailwindTokens } from './tailwind-config'

// Import the tokens for internal use
import { designTokens } from './tokens'
import { themes } from './theme'
import type { ThemeName } from './theme'
import { applyCSSVariables, getCSSVariable, setCSSVariable } from './css-variables'

// Utility functions for working with design tokens
export const getTokenValue = (tokenPath: string): string => {
  const pathArray = tokenPath.split('.')
  let current: any = designTokens
  
  for (const key of pathArray) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      throw new Error(`Token path "${tokenPath}" not found`)
    }
  }
  
  if (current && typeof current === 'object' && 'value' in current) {
    return current.value
  }
  
  throw new Error(`Token at path "${tokenPath}" does not have a value property`)
}

// Get color token with specific shade
export const getColorToken = (
  palette: keyof typeof designTokens.colors,
  category: string,
  shade?: string | number
): string => {
  const colorPalette = designTokens.colors[palette] as any
  
  if (!colorPalette || !colorPalette[category]) {
    throw new Error(`Color palette "${String(palette)}.${category}" not found`)
  }
  
  if (shade) {
    if (colorPalette[category][shade]) {
      return colorPalette[category][shade].value
    } else {
      throw new Error(`Color shade "${String(palette)}.${category}.${shade}" not found`)
    }
  }
  
  // If no shade specified, return the main value or 500 shade
  if (colorPalette[category].value) {
    return colorPalette[category].value
  } else if (colorPalette[category][500]) {
    return colorPalette[category][500].value
  } else if (colorPalette[category][50]) {
    // Fallback to first available shade
    const firstShade = Object.keys(colorPalette[category])[0]
    return colorPalette[category][firstShade].value
  }
  
  throw new Error(`No valid color found for "${String(palette)}.${category}"`)
}

// Get spacing token
export const getSpacingToken = (size: keyof typeof designTokens.spacing): string => {
  return designTokens.spacing[size].value
}

// Get typography token
export const getTypographyToken = (size: keyof typeof designTokens.typography.fontSize) => {
  return designTokens.typography.fontSize[size]
}

// Get shadow token
export const getShadowToken = (size: keyof typeof designTokens.shadows): string => {
  return designTokens.shadows[size].value
}

// Get border radius token
export const getBorderRadiusToken = (size: keyof typeof designTokens.borderRadius): string => {
  return designTokens.borderRadius[size].value
}

// Get animation token
export const getAnimationToken = (name: keyof typeof designTokens.animations.keyframes): string => {
  return designTokens.animations.keyframes[name].value
}

// Get z-index token
export const getZIndexToken = (level: keyof typeof designTokens.zIndex): number => {
  return designTokens.zIndex[level].value
}

// Helper to check if current theme is dark
export const isDarkTheme = (): boolean => {
  return document.documentElement.classList.contains('dark') || 
         document.documentElement.getAttribute('data-theme') === 'dark'
}

// Helper to get current theme name
export const getCurrentTheme = (): ThemeName => {
  return isDarkTheme() ? 'dark' : 'light'
}

// Get theme-aware color
export const getThemeColor = (colorType: string): string => {
  const theme = getCurrentTheme()
  const cssVariable = `--color-${colorType.replace(/([A-Z])/g, '-$1').toLowerCase()}`
  return getCSSVariable(cssVariable) || getColorToken('neutral', 'gray', 500)
}

// Module-specific color helpers
export const getModuleColor = (moduleName: keyof typeof designTokens.colors.modules): string => {
  return designTokens.colors.modules[moduleName].value
}

// AI provider color helpers
export const getAIProviderColor = (provider: keyof typeof designTokens.colors.ai): string => {
  return designTokens.colors.ai[provider].value
}

// Semantic color helpers
export const getSemanticColor = (
  type: keyof typeof designTokens.colors.semantic,
  shade: keyof typeof designTokens.colors.semantic.success = 500
): string => {
  return (designTokens.colors.semantic[type] as any)[shade].value
}

// Component token helpers
export const getButtonTokens = (size: keyof typeof designTokens.components.button.padding) => {
  return {
    padding: designTokens.components.button.padding[size].value,
    height: designTokens.components.button.height[size].value,
    fontSize: designTokens.components.button.fontSize[size].value
  }
}

export const getInputTokens = () => {
  return {
    padding: designTokens.components.input.padding.value,
    height: designTokens.components.input.height.value,
    fontSize: designTokens.components.input.fontSize.value,
    borderWidth: designTokens.components.input.borderWidth.value,
    borderRadius: designTokens.components.input.borderRadius.value
  }
}

export const getCardTokens = () => {
  return {
    padding: designTokens.components.card.padding.value,
    borderRadius: designTokens.components.card.borderRadius.value,
    borderWidth: designTokens.components.card.borderWidth.value
  }
}

export const getModalTokens = () => {
  return {
    padding: designTokens.components.modal.padding.value,
    borderRadius: designTokens.components.modal.borderRadius.value,
    maxWidth: designTokens.components.modal.maxWidth.value
  }
}

// Breakpoint helpers
export const getBreakpoint = (size: keyof typeof designTokens.breakpoints): string => {
  return designTokens.breakpoints[size].value
}

// Media query helpers
export const createMediaQuery = (size: keyof typeof designTokens.breakpoints): string => {
  return `@media (min-width: ${designTokens.breakpoints[size].value})`
}

// Brand token helpers
export const getBrandSpacing = (type: keyof typeof designTokens.brand.spacing): string => {
  return designTokens.brand.spacing[type].value
}

export const getLogoSize = (size: keyof typeof designTokens.brand.logo): string => {
  return designTokens.brand.logo[size].value
}

export const getRussianBrandColor = (color: keyof typeof designTokens.brand.colors.russian): string => {
  return designTokens.brand.colors.russian[color].value
}

// Token validation helpers
export const validateTokenPath = (tokenPath: string): boolean => {
  try {
    getTokenValue(tokenPath)
    return true
  } catch {
    return false
  }
}

// Get all available tokens for a category
export const getTokenCategory = (category: keyof typeof designTokens) => {
  return designTokens[category]
}

// Default export with commonly used functions
export default {
  // Core tokens
  designTokens,
  themes,
  
  // Utility functions
  getTokenValue,
  getColorToken,
  getSpacingToken,
  getTypographyToken,
  getShadowToken,
  getBorderRadiusToken,
  getAnimationToken,
  getZIndexToken,
  
  // Theme functions
  isDarkTheme,
  getCurrentTheme,
  getThemeColor,
  
  // Specialized helpers
  getModuleColor,
  getAIProviderColor,
  getSemanticColor,
  getButtonTokens,
  getInputTokens,
  getCardTokens,
  getModalTokens,
  getBreakpoint,
  createMediaQuery,
  getBrandSpacing,
  getLogoSize,
  getRussianBrandColor,
  
  // CSS functions
  applyCSSVariables,
  getCSSVariable,
  setCSSVariable,
  
  // Validation
  validateTokenPath,
  getTokenCategory
}