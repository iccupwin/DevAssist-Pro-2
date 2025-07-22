// Theme Configuration for DevAssist Pro
// Maps design tokens to theme-specific values

import { designTokens } from './tokens'

export interface Theme {
  name: string
  colors: {
    // Background colors
    background: {
      primary: string
      secondary: string
      tertiary: string
      inverse: string
    }
    
    // Text colors
    text: {
      primary: string
      secondary: string
      tertiary: string
      inverse: string
      disabled: string
    }
    
    // Border colors
    border: {
      primary: string
      secondary: string
      focus: string
      error: string
      success: string
      warning: string
    }
    
    // Interactive colors
    interactive: {
      primary: string
      primaryHover: string
      primaryActive: string
      secondary: string
      secondaryHover: string
      secondaryActive: string
      danger: string
      dangerHover: string
      dangerActive: string
    }
    
    // Status colors
    status: {
      success: string
      warning: string
      error: string
      info: string
    }
    
    // AI Module colors
    ai: {
      openai: string
      anthropic: string
      google: string
      processing: string
      completion: string
    }
    
    // Module colors
    modules: {
      kpAnalyzer: string
      tzGenerator: string
      projectEvaluation: string
      marketingPlanner: string
      knowledgeBase: string
    }
  }
}

// Light Theme
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: {
      primary: designTokens.colors.neutral.white.value,
      secondary: designTokens.colors.neutral.gray[50].value,
      tertiary: designTokens.colors.neutral.gray[100].value,
      inverse: designTokens.colors.neutral.gray[900].value
    },
    text: {
      primary: designTokens.colors.neutral.gray[900].value,
      secondary: designTokens.colors.neutral.gray[600].value,
      tertiary: designTokens.colors.neutral.gray[400].value,
      inverse: designTokens.colors.neutral.white.value,
      disabled: designTokens.colors.neutral.gray[300].value
    },
    border: {
      primary: designTokens.colors.neutral.gray[200].value,
      secondary: designTokens.colors.neutral.gray[100].value,
      focus: designTokens.colors.brand.primary[500].value,
      error: designTokens.colors.semantic.error[500].value,
      success: designTokens.colors.semantic.success[500].value,
      warning: designTokens.colors.semantic.warning[500].value
    },
    interactive: {
      primary: designTokens.colors.brand.primary[500].value,
      primaryHover: designTokens.colors.brand.primary[600].value,
      primaryActive: designTokens.colors.brand.primary[700].value,
      secondary: designTokens.colors.brand.secondary[500].value,
      secondaryHover: designTokens.colors.brand.secondary[600].value,
      secondaryActive: designTokens.colors.brand.secondary[700].value,
      danger: designTokens.colors.semantic.error[500].value,
      dangerHover: designTokens.colors.semantic.error[600].value,
      dangerActive: designTokens.colors.semantic.error[700].value
    },
    status: {
      success: designTokens.colors.semantic.success[500].value,
      warning: designTokens.colors.semantic.warning[500].value,
      error: designTokens.colors.semantic.error[500].value,
      info: designTokens.colors.semantic.info[500].value
    },
    ai: {
      openai: designTokens.colors.ai.openai.value,
      anthropic: designTokens.colors.ai.anthropic.value,
      google: designTokens.colors.ai.google.value,
      processing: designTokens.colors.ai.processing.value,
      completion: designTokens.colors.ai.completion.value
    },
    modules: {
      kpAnalyzer: designTokens.colors.modules.kpAnalyzer.value,
      tzGenerator: designTokens.colors.modules.tzGenerator.value,
      projectEvaluation: designTokens.colors.modules.projectEvaluation.value,
      marketingPlanner: designTokens.colors.modules.marketingPlanner.value,
      knowledgeBase: designTokens.colors.modules.knowledgeBase.value
    }
  }
}

// Dark Theme
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: {
      primary: designTokens.colors.neutral.gray[900].value,
      secondary: designTokens.colors.neutral.gray[800].value,
      tertiary: designTokens.colors.neutral.gray[700].value,
      inverse: designTokens.colors.neutral.white.value
    },
    text: {
      primary: designTokens.colors.neutral.white.value,
      secondary: designTokens.colors.neutral.gray[300].value,
      tertiary: designTokens.colors.neutral.gray[400].value,
      inverse: designTokens.colors.neutral.gray[900].value,
      disabled: designTokens.colors.neutral.gray[500].value
    },
    border: {
      primary: designTokens.colors.neutral.gray[600].value,
      secondary: designTokens.colors.neutral.gray[700].value,
      focus: designTokens.colors.brand.primary[400].value,
      error: designTokens.colors.semantic.error[400].value,
      success: designTokens.colors.semantic.success[400].value,
      warning: designTokens.colors.semantic.warning[400].value
    },
    interactive: {
      primary: designTokens.colors.brand.primary[400].value,
      primaryHover: designTokens.colors.brand.primary[300].value,
      primaryActive: designTokens.colors.brand.primary[500].value,
      secondary: designTokens.colors.brand.secondary[400].value,
      secondaryHover: designTokens.colors.brand.secondary[300].value,
      secondaryActive: designTokens.colors.brand.secondary[500].value,
      danger: designTokens.colors.semantic.error[400].value,
      dangerHover: designTokens.colors.semantic.error[300].value,
      dangerActive: designTokens.colors.semantic.error[500].value
    },
    status: {
      success: designTokens.colors.semantic.success[400].value,
      warning: designTokens.colors.semantic.warning[400].value,
      error: designTokens.colors.semantic.error[400].value,
      info: designTokens.colors.semantic.info[400].value
    },
    ai: {
      openai: designTokens.colors.ai.openai.value,
      anthropic: designTokens.colors.ai.anthropic.value,
      google: designTokens.colors.ai.google.value,
      processing: designTokens.colors.ai.processing.value,
      completion: designTokens.colors.ai.completion.value
    },
    modules: {
      kpAnalyzer: designTokens.colors.modules.kpAnalyzer.value,
      tzGenerator: designTokens.colors.modules.tzGenerator.value,
      projectEvaluation: designTokens.colors.modules.projectEvaluation.value,
      marketingPlanner: designTokens.colors.modules.marketingPlanner.value,
      knowledgeBase: designTokens.colors.modules.knowledgeBase.value
    }
  }
}

// Theme mapping for easy access
export const themes = {
  light: lightTheme,
  dark: darkTheme
} as const

export type ThemeName = keyof typeof themes

// CSS variables generation for themes
export const generateCSSVariables = (theme: Theme): Record<string, string> => {
  return {
    // Background variables
    '--color-bg-primary': theme.colors.background.primary,
    '--color-bg-secondary': theme.colors.background.secondary,
    '--color-bg-tertiary': theme.colors.background.tertiary,
    '--color-bg-inverse': theme.colors.background.inverse,
    
    // Text variables
    '--color-text-primary': theme.colors.text.primary,
    '--color-text-secondary': theme.colors.text.secondary,
    '--color-text-tertiary': theme.colors.text.tertiary,
    '--color-text-inverse': theme.colors.text.inverse,
    '--color-text-disabled': theme.colors.text.disabled,
    
    // Border variables
    '--color-border-primary': theme.colors.border.primary,
    '--color-border-secondary': theme.colors.border.secondary,
    '--color-border-focus': theme.colors.border.focus,
    '--color-border-error': theme.colors.border.error,
    '--color-border-success': theme.colors.border.success,
    '--color-border-warning': theme.colors.border.warning,
    
    // Interactive variables
    '--color-interactive-primary': theme.colors.interactive.primary,
    '--color-interactive-primary-hover': theme.colors.interactive.primaryHover,
    '--color-interactive-primary-active': theme.colors.interactive.primaryActive,
    '--color-interactive-secondary': theme.colors.interactive.secondary,
    '--color-interactive-secondary-hover': theme.colors.interactive.secondaryHover,
    '--color-interactive-secondary-active': theme.colors.interactive.secondaryActive,
    '--color-interactive-danger': theme.colors.interactive.danger,
    '--color-interactive-danger-hover': theme.colors.interactive.dangerHover,
    '--color-interactive-danger-active': theme.colors.interactive.dangerActive,
    
    // Status variables
    '--color-status-success': theme.colors.status.success,
    '--color-status-warning': theme.colors.status.warning,
    '--color-status-error': theme.colors.status.error,
    '--color-status-info': theme.colors.status.info,
    
    // AI variables
    '--color-ai-openai': theme.colors.ai.openai,
    '--color-ai-anthropic': theme.colors.ai.anthropic,
    '--color-ai-google': theme.colors.ai.google,
    '--color-ai-processing': theme.colors.ai.processing,
    '--color-ai-completion': theme.colors.ai.completion,
    
    // Module variables
    '--color-module-kp-analyzer': theme.colors.modules.kpAnalyzer,
    '--color-module-tz-generator': theme.colors.modules.tzGenerator,
    '--color-module-project-evaluation': theme.colors.modules.projectEvaluation,
    '--color-module-marketing-planner': theme.colors.modules.marketingPlanner,
    '--color-module-knowledge-base': theme.colors.modules.knowledgeBase,
    
    // Spacing variables
    '--spacing-xs': designTokens.spacing[1].value,
    '--spacing-sm': designTokens.spacing[2].value,
    '--spacing-md': designTokens.spacing[4].value,
    '--spacing-lg': designTokens.spacing[6].value,
    '--spacing-xl': designTokens.spacing[8].value,
    '--spacing-2xl': designTokens.spacing[12].value,
    
    // Border radius variables
    '--radius-sm': designTokens.borderRadius.sm.value,
    '--radius-md': designTokens.borderRadius.md.value,
    '--radius-lg': designTokens.borderRadius.lg.value,
    '--radius-xl': designTokens.borderRadius.xl.value,
    '--radius-full': designTokens.borderRadius.full.value,
    
    // Shadow variables
    '--shadow-sm': designTokens.shadows.sm.value,
    '--shadow-md': designTokens.shadows.md.value,
    '--shadow-lg': designTokens.shadows.lg.value,
    '--shadow-xl': designTokens.shadows.xl.value,
    '--shadow-glow': designTokens.shadows.glow.value,
    
    // Animation variables
    '--duration-fast': designTokens.animations.duration.fast.value,
    '--duration-base': designTokens.animations.duration.base.value,
    '--duration-slow': designTokens.animations.duration.slow.value,
    '--easing-smooth': designTokens.animations.easing.smooth.value,
    '--easing-bounce': designTokens.animations.easing.bounce.value
  }
}

export default themes