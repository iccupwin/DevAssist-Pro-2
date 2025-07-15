// Design Tokens for DevAssist Pro
// Based on Technical Specification (ТЗ) and Brand Guidelines

export interface ColorToken {
  value: string
  description: string
  usage: string[]
}

export interface SizeToken {
  value: string
  px: number
  description: string
}

export interface TypographyToken {
  fontSize: string
  lineHeight: string
  fontWeight: string
  letterSpacing?: string
  description: string
}

export interface SpacingToken {
  value: string
  px: number
  description: string
}

export interface ShadowToken {
  value: string
  description: string
  usage: string[]
}

export interface AnimationToken {
  value: string
  description: string
  usage: string[]
}

export interface BorderRadiusToken {
  value: string
  description: string
}

export interface ZIndexToken {
  value: number
  description: string
}

// ======================
// COLOR TOKENS
// ======================

export const colors = {
  // Brand Colors (Primary Palette)
  brand: {
    primary: {
      50: { value: '#f0f9ff', description: 'Primary brand color - lightest tint', usage: ['background', 'subtle accents'] },
      100: { value: '#e0f2fe', description: 'Primary brand color - light tint', usage: ['background', 'hover states'] },
      200: { value: '#bae6fd', description: 'Primary brand color - medium light', usage: ['borders', 'dividers'] },
      300: { value: '#7dd3fc', description: 'Primary brand color - medium', usage: ['icons', 'secondary elements'] },
      400: { value: '#38bdf8', description: 'Primary brand color - medium dark', usage: ['interactive elements'] },
      500: { value: '#0ea5e9', description: 'Primary brand color - main', usage: ['primary buttons', 'main brand color'] },
      600: { value: '#0284c7', description: 'Primary brand color - dark', usage: ['hover states', 'active elements'] },
      700: { value: '#0369a1', description: 'Primary brand color - darker', usage: ['pressed states', 'emphasis'] },
      800: { value: '#075985', description: 'Primary brand color - very dark', usage: ['text', 'strong emphasis'] },
      900: { value: '#0c4a6e', description: 'Primary brand color - darkest', usage: ['headings', 'highest contrast'] }
    },
    secondary: {
      50: { value: '#f8fafc', description: 'Secondary brand color - lightest', usage: ['background', 'cards'] },
      100: { value: '#f1f5f9', description: 'Secondary brand color - light', usage: ['backgrounds', 'subtle elements'] },
      200: { value: '#e2e8f0', description: 'Secondary brand color - medium light', usage: ['borders', 'dividers'] },
      300: { value: '#cbd5e1', description: 'Secondary brand color - medium', usage: ['placeholders', 'disabled states'] },
      400: { value: '#94a3b8', description: 'Secondary brand color - medium dark', usage: ['secondary text', 'icons'] },
      500: { value: '#64748b', description: 'Secondary brand color - main', usage: ['body text', 'secondary elements'] },
      600: { value: '#475569', description: 'Secondary brand color - dark', usage: ['labels', 'captions'] },
      700: { value: '#334155', description: 'Secondary brand color - darker', usage: ['headings', 'important text'] },
      800: { value: '#1e293b', description: 'Secondary brand color - very dark', usage: ['main text', 'navigation'] },
      900: { value: '#0f172a', description: 'Secondary brand color - darkest', usage: ['headers', 'highest contrast'] }
    },
    accent: {
      50: { value: '#fef3f2', description: 'Accent color - lightest', usage: ['error backgrounds', 'alerts'] },
      100: { value: '#fee4e2', description: 'Accent color - light', usage: ['warning backgrounds'] },
      200: { value: '#fecaca', description: 'Accent color - medium light', usage: ['error borders'] },
      300: { value: '#fca5a5', description: 'Accent color - medium', usage: ['error icons'] },
      400: { value: '#f87171', description: 'Accent color - medium dark', usage: ['error elements'] },
      500: { value: '#ef4444', description: 'Accent color - main', usage: ['error states', 'destructive actions'] },
      600: { value: '#dc2626', description: 'Accent color - dark', usage: ['error hover states'] },
      700: { value: '#b91c1c', description: 'Accent color - darker', usage: ['error pressed states'] },
      800: { value: '#991b1b', description: 'Accent color - very dark', usage: ['error text'] },
      900: { value: '#7f1d1d', description: 'Accent color - darkest', usage: ['error emphasis'] }
    }
  },

  // Semantic Colors
  semantic: {
    success: {
      50: { value: '#f0fdf4', description: 'Success color - lightest', usage: ['success backgrounds'] },
      100: { value: '#dcfce7', description: 'Success color - light', usage: ['success alerts'] },
      200: { value: '#bbf7d0', description: 'Success color - medium light', usage: ['success borders'] },
      300: { value: '#86efac', description: 'Success color - medium', usage: ['success icons'] },
      400: { value: '#4ade80', description: 'Success color - medium dark', usage: ['success elements'] },
      500: { value: '#22c55e', description: 'Success color - main', usage: ['success states', 'positive actions'] },
      600: { value: '#16a34a', description: 'Success color - dark', usage: ['success hover states'] },
      700: { value: '#15803d', description: 'Success color - darker', usage: ['success pressed states'] },
      800: { value: '#166534', description: 'Success color - very dark', usage: ['success text'] },
      900: { value: '#14532d', description: 'Success color - darkest', usage: ['success emphasis'] }
    },
    warning: {
      50: { value: '#fffbeb', description: 'Warning color - lightest', usage: ['warning backgrounds'] },
      100: { value: '#fef3c7', description: 'Warning color - light', usage: ['warning alerts'] },
      200: { value: '#fde68a', description: 'Warning color - medium light', usage: ['warning borders'] },
      300: { value: '#fcd34d', description: 'Warning color - medium', usage: ['warning icons'] },
      400: { value: '#fbbf24', description: 'Warning color - medium dark', usage: ['warning elements'] },
      500: { value: '#f59e0b', description: 'Warning color - main', usage: ['warning states', 'caution actions'] },
      600: { value: '#d97706', description: 'Warning color - dark', usage: ['warning hover states'] },
      700: { value: '#b45309', description: 'Warning color - darker', usage: ['warning pressed states'] },
      800: { value: '#92400e', description: 'Warning color - very dark', usage: ['warning text'] },
      900: { value: '#78350f', description: 'Warning color - darkest', usage: ['warning emphasis'] }
    },
    info: {
      50: { value: '#eff6ff', description: 'Info color - lightest', usage: ['info backgrounds'] },
      100: { value: '#dbeafe', description: 'Info color - light', usage: ['info alerts'] },
      200: { value: '#bfdbfe', description: 'Info color - medium light', usage: ['info borders'] },
      300: { value: '#93c5fd', description: 'Info color - medium', usage: ['info icons'] },
      400: { value: '#60a5fa', description: 'Info color - medium dark', usage: ['info elements'] },
      500: { value: '#3b82f6', description: 'Info color - main', usage: ['info states', 'informational actions'] },
      600: { value: '#2563eb', description: 'Info color - dark', usage: ['info hover states'] },
      700: { value: '#1d4ed8', description: 'Info color - darker', usage: ['info pressed states'] },
      800: { value: '#1e40af', description: 'Info color - very dark', usage: ['info text'] },
      900: { value: '#1e3a8a', description: 'Info color - darkest', usage: ['info emphasis'] }
    },
    error: {
      50: { value: '#fef2f2', description: 'Error color - lightest', usage: ['error backgrounds'] },
      100: { value: '#fee2e2', description: 'Error color - light', usage: ['error alerts'] },
      200: { value: '#fecaca', description: 'Error color - medium light', usage: ['error borders'] },
      300: { value: '#fca5a5', description: 'Error color - medium', usage: ['error icons'] },
      400: { value: '#f87171', description: 'Error color - medium dark', usage: ['error elements'] },
      500: { value: '#ef4444', description: 'Error color - main', usage: ['error states', 'destructive actions'] },
      600: { value: '#dc2626', description: 'Error color - dark', usage: ['error hover states'] },
      700: { value: '#b91c1c', description: 'Error color - darker', usage: ['error pressed states'] },
      800: { value: '#991b1b', description: 'Error color - very dark', usage: ['error text'] },
      900: { value: '#7f1d1d', description: 'Error color - darkest', usage: ['error emphasis'] }
    }
  },

  // Neutral Colors
  neutral: {
    white: { value: '#ffffff', description: 'Pure white', usage: ['backgrounds', 'cards', 'overlays'] },
    black: { value: '#000000', description: 'Pure black', usage: ['text', 'icons', 'shadows'] },
    gray: {
      50: { value: '#f9fafb', description: 'Neutral gray - lightest', usage: ['backgrounds', 'subtle elements'] },
      100: { value: '#f3f4f6', description: 'Neutral gray - light', usage: ['disabled backgrounds'] },
      200: { value: '#e5e7eb', description: 'Neutral gray - medium light', usage: ['borders', 'dividers'] },
      300: { value: '#d1d5db', description: 'Neutral gray - medium', usage: ['placeholders', 'disabled text'] },
      400: { value: '#9ca3af', description: 'Neutral gray - medium dark', usage: ['secondary text', 'icons'] },
      500: { value: '#6b7280', description: 'Neutral gray - main', usage: ['body text', 'labels'] },
      600: { value: '#4b5563', description: 'Neutral gray - dark', usage: ['headings', 'important text'] },
      700: { value: '#374151', description: 'Neutral gray - darker', usage: ['navigation', 'emphasis'] },
      800: { value: '#1f2937', description: 'Neutral gray - very dark', usage: ['headers', 'high contrast'] },
      900: { value: '#111827', description: 'Neutral gray - darkest', usage: ['main text', 'highest contrast'] }
    }
  },

  // AI Module Colors
  ai: {
    openai: { value: '#10a37f', description: 'OpenAI brand color', usage: ['OpenAI integration', 'AI indicators'] },
    anthropic: { value: '#d97706', description: 'Anthropic brand color', usage: ['Claude integration', 'AI indicators'] },
    google: { value: '#4285f4', description: 'Google brand color', usage: ['Google AI integration', 'AI indicators'] },
    processing: { value: '#8b5cf6', description: 'AI processing color', usage: ['AI processing states', 'loading'] },
    completion: { value: '#10b981', description: 'AI completion color', usage: ['AI completion states', 'success'] }
  },

  // Module Specific Colors
  modules: {
    kpAnalyzer: { value: '#0ea5e9', description: 'KP Analyzer module color', usage: ['KP Analyzer module', 'navigation'] },
    tzGenerator: { value: '#8b5cf6', description: 'TZ Generator module color', usage: ['TZ Generator module', 'navigation'] },
    projectEvaluation: { value: '#f59e0b', description: 'Project Evaluation module color', usage: ['Project Evaluation module', 'navigation'] },
    marketingPlanner: { value: '#ef4444', description: 'Marketing Planner module color', usage: ['Marketing Planner module', 'navigation'] },
    knowledgeBase: { value: '#10b981', description: 'Knowledge Base module color', usage: ['Knowledge Base module', 'navigation'] }
  }
} as const

// ======================
// SPACING TOKENS
// ======================

export const spacing = {
  0: { value: '0px', px: 0, description: 'No spacing' },
  1: { value: '0.25rem', px: 4, description: 'Extra small spacing' },
  2: { value: '0.5rem', px: 8, description: 'Small spacing' },
  3: { value: '0.75rem', px: 12, description: 'Medium small spacing' },
  4: { value: '1rem', px: 16, description: 'Medium spacing' },
  5: { value: '1.25rem', px: 20, description: 'Medium large spacing' },
  6: { value: '1.5rem', px: 24, description: 'Large spacing' },
  8: { value: '2rem', px: 32, description: 'Extra large spacing' },
  10: { value: '2.5rem', px: 40, description: 'Extra extra large spacing' },
  12: { value: '3rem', px: 48, description: 'Huge spacing' },
  16: { value: '4rem', px: 64, description: 'Very huge spacing' },
  20: { value: '5rem', px: 80, description: 'Massive spacing' },
  24: { value: '6rem', px: 96, description: 'Very massive spacing' },
  32: { value: '8rem', px: 128, description: 'Gigantic spacing' }
} as const

// ======================
// TYPOGRAPHY TOKENS
// ======================

export const typography = {
  // Font Families
  fontFamily: {
    sans: { value: 'Inter, system-ui, -apple-system, sans-serif', description: 'Primary sans-serif font' },
    serif: { value: 'Georgia, serif', description: 'Primary serif font' },
    mono: { value: 'JetBrains Mono, Menlo, monospace', description: 'Primary monospace font' },
    display: { value: 'SF Pro Display, system-ui, -apple-system, sans-serif', description: 'Display font for headings' }
  },

  // Font Sizes
  fontSize: {
    xs: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '400', description: 'Extra small text' },
    sm: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400', description: 'Small text' },
    base: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '400', description: 'Base text' },
    lg: { fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: '400', description: 'Large text' },
    xl: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: '500', description: 'Extra large text' },
    '2xl': { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: '600', description: 'Heading 4' },
    '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: '600', description: 'Heading 3' },
    '4xl': { fontSize: '2.25rem', lineHeight: '2.5rem', fontWeight: '700', description: 'Heading 2' },
    '5xl': { fontSize: '3rem', lineHeight: '1', fontWeight: '700', description: 'Heading 1' },
    '6xl': { fontSize: '3.75rem', lineHeight: '1', fontWeight: '800', description: 'Display large' },
    '7xl': { fontSize: '4.5rem', lineHeight: '1', fontWeight: '800', description: 'Display extra large' },
    '8xl': { fontSize: '6rem', lineHeight: '1', fontWeight: '900', description: 'Display huge' },
    '9xl': { fontSize: '8rem', lineHeight: '1', fontWeight: '900', description: 'Display massive' }
  },

  // Font Weights
  fontWeight: {
    thin: { value: '100', description: 'Thin font weight' },
    extralight: { value: '200', description: 'Extra light font weight' },
    light: { value: '300', description: 'Light font weight' },
    normal: { value: '400', description: 'Normal font weight' },
    medium: { value: '500', description: 'Medium font weight' },
    semibold: { value: '600', description: 'Semibold font weight' },
    bold: { value: '700', description: 'Bold font weight' },
    extrabold: { value: '800', description: 'Extra bold font weight' },
    black: { value: '900', description: 'Black font weight' }
  },

  // Line Heights
  lineHeight: {
    none: { value: '1', description: 'No line height' },
    tight: { value: '1.25', description: 'Tight line height' },
    snug: { value: '1.375', description: 'Snug line height' },
    normal: { value: '1.5', description: 'Normal line height' },
    relaxed: { value: '1.625', description: 'Relaxed line height' },
    loose: { value: '2', description: 'Loose line height' }
  },

  // Letter Spacing
  letterSpacing: {
    tighter: { value: '-0.05em', description: 'Tighter letter spacing' },
    tight: { value: '-0.025em', description: 'Tight letter spacing' },
    normal: { value: '0', description: 'Normal letter spacing' },
    wide: { value: '0.025em', description: 'Wide letter spacing' },
    wider: { value: '0.05em', description: 'Wider letter spacing' },
    widest: { value: '0.1em', description: 'Widest letter spacing' }
  }
} as const

// ======================
// BORDER RADIUS TOKENS
// ======================

export const borderRadius = {
  none: { value: '0px', description: 'No border radius' },
  sm: { value: '0.125rem', description: 'Small border radius' },
  base: { value: '0.25rem', description: 'Base border radius' },
  md: { value: '0.375rem', description: 'Medium border radius' },
  lg: { value: '0.5rem', description: 'Large border radius' },
  xl: { value: '0.75rem', description: 'Extra large border radius' },
  '2xl': { value: '1rem', description: 'Extra extra large border radius' },
  '3xl': { value: '1.5rem', description: 'Huge border radius' },
  full: { value: '9999px', description: 'Full border radius (circular)' }
} as const

// ======================
// SHADOW TOKENS
// ======================

export const shadows = {
  none: { value: 'none', description: 'No shadow', usage: ['flat elements'] },
  sm: { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)', description: 'Small shadow', usage: ['cards', 'buttons'] },
  base: { value: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', description: 'Base shadow', usage: ['cards', 'dialogs'] },
  md: { value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', description: 'Medium shadow', usage: ['dropdowns', 'tooltips'] },
  lg: { value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', description: 'Large shadow', usage: ['modals', 'popovers'] },
  xl: { value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', description: 'Extra large shadow', usage: ['overlays', 'floating elements'] },
  '2xl': { value: '0 25px 50px -12px rgb(0 0 0 / 0.25)', description: 'Extra extra large shadow', usage: ['drawers', 'major overlays'] },
  inner: { value: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)', description: 'Inner shadow', usage: ['inputs', 'wells'] },
  glow: { value: '0 0 20px rgb(59 130 246 / 0.5)', description: 'Glow shadow', usage: ['focus states', 'active elements'] },
  colored: { value: '0 4px 14px 0 rgb(0 118 255 / 0.39)', description: 'Colored shadow', usage: ['primary buttons', 'brand elements'] }
} as const

// ======================
// ANIMATION TOKENS
// ======================

export const animations = {
  // Durations
  duration: {
    instant: { value: '0ms', description: 'Instant animation' },
    fast: { value: '150ms', description: 'Fast animation' },
    base: { value: '200ms', description: 'Base animation' },
    slow: { value: '300ms', description: 'Slow animation' },
    slower: { value: '500ms', description: 'Slower animation' },
    slowest: { value: '1000ms', description: 'Slowest animation' }
  },

  // Easing Functions
  easing: {
    linear: { value: 'linear', description: 'Linear easing' },
    ease: { value: 'ease', description: 'Ease easing' },
    'ease-in': { value: 'ease-in', description: 'Ease in easing' },
    'ease-out': { value: 'ease-out', description: 'Ease out easing' },
    'ease-in-out': { value: 'ease-in-out', description: 'Ease in out easing' },
    'bounce': { value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', description: 'Bounce easing' },
    'smooth': { value: 'cubic-bezier(0.4, 0, 0.2, 1)', description: 'Smooth easing' }
  },

  // Predefined Animations
  keyframes: {
    fadeIn: { value: 'fadeIn 0.2s ease-out', description: 'Fade in animation', usage: ['modals', 'tooltips'] },
    fadeOut: { value: 'fadeOut 0.2s ease-in', description: 'Fade out animation', usage: ['modals', 'tooltips'] },
    slideUp: { value: 'slideUp 0.3s ease-out', description: 'Slide up animation', usage: ['sheets', 'drawers'] },
    slideDown: { value: 'slideDown 0.3s ease-out', description: 'Slide down animation', usage: ['dropdowns', 'accordions'] },
    slideLeft: { value: 'slideLeft 0.3s ease-out', description: 'Slide left animation', usage: ['navigation', 'carousels'] },
    slideRight: { value: 'slideRight 0.3s ease-out', description: 'Slide right animation', usage: ['navigation', 'carousels'] },
    scaleIn: { value: 'scaleIn 0.2s ease-out', description: 'Scale in animation', usage: ['buttons', 'interactive elements'] },
    scaleOut: { value: 'scaleOut 0.2s ease-in', description: 'Scale out animation', usage: ['buttons', 'interactive elements'] },
    spin: { value: 'spin 1s linear infinite', description: 'Spin animation', usage: ['loading indicators'] },
    pulse: { value: 'pulse 2s ease-in-out infinite', description: 'Pulse animation', usage: ['loading states', 'attention'] },
    bounce: { value: 'bounce 1s ease-in-out infinite', description: 'Bounce animation', usage: ['notifications', 'alerts'] },
    wiggle: { value: 'wiggle 1s ease-in-out', description: 'Wiggle animation', usage: ['error states', 'validation'] }
  }
} as const

// ======================
// BREAKPOINT TOKENS
// ======================

export const breakpoints = {
  xs: { value: '0px', description: 'Extra small devices' },
  sm: { value: '640px', description: 'Small devices (tablets)' },
  md: { value: '768px', description: 'Medium devices (small laptops)' },
  lg: { value: '1024px', description: 'Large devices (laptops)' },
  xl: { value: '1280px', description: 'Extra large devices (desktops)' },
  '2xl': { value: '1536px', description: 'Extra extra large devices (large desktops)' }
} as const

// ======================
// Z-INDEX TOKENS
// ======================

export const zIndex = {
  hide: { value: -1, description: 'Hide element behind others' },
  auto: { value: 0, description: 'Auto z-index' },
  base: { value: 1, description: 'Base z-index' },
  docked: { value: 10, description: 'Docked elements' },
  dropdown: { value: 1000, description: 'Dropdown menus' },
  sticky: { value: 1100, description: 'Sticky elements' },
  banner: { value: 1200, description: 'Banner notifications' },
  overlay: { value: 1300, description: 'Overlay elements' },
  modal: { value: 1400, description: 'Modal dialogs' },
  popover: { value: 1500, description: 'Popover elements' },
  skipLink: { value: 1600, description: 'Skip navigation links' },
  toast: { value: 1700, description: 'Toast notifications' },
  tooltip: { value: 1800, description: 'Tooltip elements' }
} as const

// ======================
// COMPONENT TOKENS
// ======================

export const components = {
  // Button tokens
  button: {
    padding: {
      sm: { value: '0.5rem 1rem', description: 'Small button padding' },
      md: { value: '0.75rem 1.5rem', description: 'Medium button padding' },
      lg: { value: '1rem 2rem', description: 'Large button padding' }
    },
    height: {
      sm: { value: '2rem', description: 'Small button height' },
      md: { value: '2.5rem', description: 'Medium button height' },
      lg: { value: '3rem', description: 'Large button height' }
    },
    fontSize: {
      sm: { value: '0.875rem', description: 'Small button font size' },
      md: { value: '1rem', description: 'Medium button font size' },
      lg: { value: '1.125rem', description: 'Large button font size' }
    }
  },

  // Input tokens
  input: {
    padding: { value: '0.75rem 1rem', description: 'Input padding' },
    height: { value: '2.5rem', description: 'Input height' },
    fontSize: { value: '1rem', description: 'Input font size' },
    borderWidth: { value: '1px', description: 'Input border width' },
    borderRadius: { value: '0.375rem', description: 'Input border radius' }
  },

  // Card tokens
  card: {
    padding: { value: '1.5rem', description: 'Card padding' },
    borderRadius: { value: '0.5rem', description: 'Card border radius' },
    borderWidth: { value: '1px', description: 'Card border width' }
  },

  // Modal tokens
  modal: {
    padding: { value: '1.5rem', description: 'Modal padding' },
    borderRadius: { value: '0.75rem', description: 'Modal border radius' },
    maxWidth: { value: '32rem', description: 'Modal max width' }
  }
} as const

// ======================
// BRAND TOKENS
// ======================

export const brand = {
  // Logo dimensions
  logo: {
    sm: { value: '1.5rem', description: 'Small logo size' },
    md: { value: '2rem', description: 'Medium logo size' },
    lg: { value: '3rem', description: 'Large logo size' }
  },

  // Brand spacing
  spacing: {
    section: { value: '4rem', description: 'Section spacing' },
    container: { value: '2rem', description: 'Container spacing' },
    component: { value: '1.5rem', description: 'Component spacing' }
  },

  // Brand colors (Russian market specific)
  colors: {
    russian: {
      blue: { value: '#0066cc', description: 'Russian blue color' },
      red: { value: '#dc143c', description: 'Russian red color' },
      white: { value: '#ffffff', description: 'Russian white color' }
    }
  }
} as const

// ======================
// EXPORT ALL TOKENS
// ======================

export const designTokens = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  animations,
  breakpoints,
  zIndex,
  components,
  brand
} as const

export type DesignTokens = typeof designTokens