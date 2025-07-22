// Tailwind Config Extension for Design Tokens
// Automatically generates Tailwind configuration from design tokens

import { designTokens } from './tokens'

// Helper function to convert design tokens to Tailwind format
const convertSpacingTokens = () => {
  const spacing: Record<string, string> = {}
  Object.entries(designTokens.spacing).forEach(([key, token]) => {
    spacing[key] = token.value
  })
  return spacing
}

const convertColorTokens = () => {
  const colors: Record<string, any> = {}
  
  // Brand colors
  colors.brand = {
    primary: {},
    secondary: {},
    accent: {}
  }
  
  Object.entries(designTokens.colors.brand.primary).forEach(([shade, token]) => {
    colors.brand.primary[shade] = token.value
  })
  
  Object.entries(designTokens.colors.brand.secondary).forEach(([shade, token]) => {
    colors.brand.secondary[shade] = token.value
  })
  
  Object.entries(designTokens.colors.brand.accent).forEach(([shade, token]) => {
    colors.brand.accent[shade] = token.value
  })
  
  // Semantic colors
  colors.semantic = {
    success: {},
    warning: {},
    info: {},
    error: {}
  }
  
  Object.entries(designTokens.colors.semantic.success).forEach(([shade, token]) => {
    colors.semantic.success[shade] = token.value
  })
  
  Object.entries(designTokens.colors.semantic.warning).forEach(([shade, token]) => {
    colors.semantic.warning[shade] = token.value
  })
  
  Object.entries(designTokens.colors.semantic.info).forEach(([shade, token]) => {
    colors.semantic.info[shade] = token.value
  })
  
  Object.entries(designTokens.colors.semantic.error).forEach(([shade, token]) => {
    colors.semantic.error[shade] = token.value
  })
  
  // Neutral colors
  colors.neutral = {
    white: designTokens.colors.neutral.white.value,
    black: designTokens.colors.neutral.black.value,
    gray: {}
  }
  
  Object.entries(designTokens.colors.neutral.gray).forEach(([shade, token]) => {
    colors.neutral.gray[shade] = token.value
  })
  
  // AI colors
  colors.ai = {
    openai: designTokens.colors.ai.openai.value,
    anthropic: designTokens.colors.ai.anthropic.value,
    google: designTokens.colors.ai.google.value,
    processing: designTokens.colors.ai.processing.value,
    completion: designTokens.colors.ai.completion.value
  }
  
  // Module colors
  colors.modules = {
    'kp-analyzer': designTokens.colors.modules.kpAnalyzer.value,
    'tz-generator': designTokens.colors.modules.tzGenerator.value,
    'project-evaluation': designTokens.colors.modules.projectEvaluation.value,
    'marketing-planner': designTokens.colors.modules.marketingPlanner.value,
    'knowledge-base': designTokens.colors.modules.knowledgeBase.value
  }
  
  return colors
}

const convertBorderRadiusTokens = () => {
  const borderRadius: Record<string, string> = {}
  Object.entries(designTokens.borderRadius).forEach(([key, token]) => {
    borderRadius[key] = token.value
  })
  return borderRadius
}

const convertShadowTokens = () => {
  const boxShadow: Record<string, string> = {}
  Object.entries(designTokens.shadows).forEach(([key, token]) => {
    boxShadow[key] = token.value
  })
  return boxShadow
}

const convertFontFamilyTokens = () => {
  const fontFamily: Record<string, string[]> = {}
  Object.entries(designTokens.typography.fontFamily).forEach(([key, token]) => {
    fontFamily[key] = token.value.split(', ')
  })
  return fontFamily
}

const convertFontSizeTokens = () => {
  const fontSize: Record<string, [string, { lineHeight: string; fontWeight?: string }]> = {}
  Object.entries(designTokens.typography.fontSize).forEach(([key, token]) => {
    fontSize[key] = [
      token.fontSize,
      {
        lineHeight: token.lineHeight,
        fontWeight: token.fontWeight
      }
    ]
  })
  return fontSize
}

const convertFontWeightTokens = () => {
  const fontWeight: Record<string, string> = {}
  Object.entries(designTokens.typography.fontWeight).forEach(([key, token]) => {
    fontWeight[key] = token.value
  })
  return fontWeight
}

const convertLineHeightTokens = () => {
  const lineHeight: Record<string, string> = {}
  Object.entries(designTokens.typography.lineHeight).forEach(([key, token]) => {
    lineHeight[key] = token.value
  })
  return lineHeight
}

const convertLetterSpacingTokens = () => {
  const letterSpacing: Record<string, string> = {}
  Object.entries(designTokens.typography.letterSpacing).forEach(([key, token]) => {
    letterSpacing[key] = token.value
  })
  return letterSpacing
}

const convertAnimationTokens = () => {
  const animation: Record<string, string> = {}
  Object.entries(designTokens.animations.keyframes).forEach(([key, token]) => {
    animation[key] = token.value
  })
  return animation
}

const convertBreakpointTokens = () => {
  const screens: Record<string, string> = {}
  Object.entries(designTokens.breakpoints).forEach(([key, token]) => {
    screens[key] = token.value
  })
  return screens
}

const convertZIndexTokens = () => {
  const zIndex: Record<string, string> = {}
  Object.entries(designTokens.zIndex).forEach(([key, token]) => {
    zIndex[key] = token.value.toString()
  })
  return zIndex
}

// Generate the complete Tailwind config extension
export const generateTailwindConfig = () => {
  return {
    darkMode: 'class',
    theme: {
      extend: {
        // Spacing tokens
        spacing: convertSpacingTokens(),
        
        // Color tokens
        colors: convertColorTokens(),
        
        // Border radius tokens
        borderRadius: convertBorderRadiusTokens(),
        
        // Shadow tokens
        boxShadow: convertShadowTokens(),
        
        // Typography tokens
        fontFamily: convertFontFamilyTokens(),
        fontSize: convertFontSizeTokens(),
        fontWeight: convertFontWeightTokens(),
        lineHeight: convertLineHeightTokens(),
        letterSpacing: convertLetterSpacingTokens(),
        
        // Animation tokens
        animation: convertAnimationTokens(),
        
        // Z-index tokens
        zIndex: convertZIndexTokens(),
        
        // Breakpoint tokens
        screens: convertBreakpointTokens(),
        
        // Custom utilities for design tokens
        utilities: {
          // Module-specific utilities
          '.module-kp-analyzer': {
            color: designTokens.colors.modules.kpAnalyzer.value
          },
          '.module-tz-generator': {
            color: designTokens.colors.modules.tzGenerator.value
          },
          '.module-project-evaluation': {
            color: designTokens.colors.modules.projectEvaluation.value
          },
          '.module-marketing-planner': {
            color: designTokens.colors.modules.marketingPlanner.value
          },
          '.module-knowledge-base': {
            color: designTokens.colors.modules.knowledgeBase.value
          },
          
          // AI provider utilities
          '.ai-openai': {
            color: designTokens.colors.ai.openai.value
          },
          '.ai-anthropic': {
            color: designTokens.colors.ai.anthropic.value
          },
          '.ai-google': {
            color: designTokens.colors.ai.google.value
          },
          '.ai-processing': {
            color: designTokens.colors.ai.processing.value
          },
          '.ai-completion': {
            color: designTokens.colors.ai.completion.value
          },
          
          // Button component utilities
          '.btn-sm': {
            padding: designTokens.components.button.padding.sm.value,
            height: designTokens.components.button.height.sm.value,
            fontSize: designTokens.components.button.fontSize.sm.value
          },
          '.btn-md': {
            padding: designTokens.components.button.padding.md.value,
            height: designTokens.components.button.height.md.value,
            fontSize: designTokens.components.button.fontSize.md.value
          },
          '.btn-lg': {
            padding: designTokens.components.button.padding.lg.value,
            height: designTokens.components.button.height.lg.value,
            fontSize: designTokens.components.button.fontSize.lg.value
          },
          
          // Input component utilities
          '.input-default': {
            padding: designTokens.components.input.padding.value,
            height: designTokens.components.input.height.value,
            fontSize: designTokens.components.input.fontSize.value,
            borderWidth: designTokens.components.input.borderWidth.value,
            borderRadius: designTokens.components.input.borderRadius.value
          },
          
          // Card component utilities
          '.card-default': {
            padding: designTokens.components.card.padding.value,
            borderRadius: designTokens.components.card.borderRadius.value,
            borderWidth: designTokens.components.card.borderWidth.value
          },
          
          // Modal component utilities
          '.modal-default': {
            padding: designTokens.components.modal.padding.value,
            borderRadius: designTokens.components.modal.borderRadius.value,
            maxWidth: designTokens.components.modal.maxWidth.value
          },
          
          // Brand utilities
          '.logo-sm': {
            width: designTokens.brand.logo.sm.value,
            height: designTokens.brand.logo.sm.value
          },
          '.logo-md': {
            width: designTokens.brand.logo.md.value,
            height: designTokens.brand.logo.md.value
          },
          '.logo-lg': {
            width: designTokens.brand.logo.lg.value,
            height: designTokens.brand.logo.lg.value
          },
          
          // Russian brand utilities
          '.brand-russian-blue': {
            color: designTokens.brand.colors.russian.blue.value
          },
          '.brand-russian-red': {
            color: designTokens.brand.colors.russian.red.value
          },
          '.brand-russian-white': {
            color: designTokens.brand.colors.russian.white.value
          }
        }
      }
    },
    plugins: [
      // Custom plugin for design token utilities
      function({ addUtilities, theme }: any) {
        const tokenUtilities = theme('extend.utilities') || {}
        addUtilities(tokenUtilities)
      }
    ]
  }
}

// Export individual token converters for flexibility
export const tailwindTokens = {
  spacing: convertSpacingTokens(),
  colors: convertColorTokens(),
  borderRadius: convertBorderRadiusTokens(),
  boxShadow: convertShadowTokens(),
  fontFamily: convertFontFamilyTokens(),
  fontSize: convertFontSizeTokens(),
  fontWeight: convertFontWeightTokens(),
  lineHeight: convertLineHeightTokens(),
  letterSpacing: convertLetterSpacingTokens(),
  animation: convertAnimationTokens(),
  screens: convertBreakpointTokens(),
  zIndex: convertZIndexTokens()
}

export default generateTailwindConfig