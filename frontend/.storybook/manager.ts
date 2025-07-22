import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

// DevAssist Pro custom theme with dark glassmorphism design
const devAssistTheme = create({
  base: 'dark',

  // Brand
  brandTitle: 'DevAssist Pro Components',
  brandUrl: 'https://devassist.pro',
  brandImage: undefined,
  brandTarget: '_self',

  // Typography
  fontBase: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontCode: '"Fira Code", "Monaco", "Cascadia Code", "Consolas", monospace',

  // UI Colors
  colorPrimary: '#7c3aed', // violet-600 - primary brand color
  colorSecondary: '#0ea5e9', // sky-500 - secondary accent

  // App background
  appBg: '#0f172a', // slate-900 - main background
  appContentBg: '#1e293b', // slate-800 - content background
  appPreviewBg: '#0f172a', // slate-900 - preview background
  appBorderColor: '#334155', // slate-700 - borders
  appBorderRadius: 12,

  // Text colors
  textColor: '#f8fafc', // slate-50 - primary text
  textInverseColor: '#0f172a', // slate-900 - inverse text
  textMutedColor: '#94a3b8', // slate-400 - muted text

  // Toolbar
  barTextColor: '#cbd5e1', // slate-300 - toolbar text
  barHoverColor: '#f8fafc', // slate-50 - toolbar hover
  barSelectedColor: '#7c3aed', // violet-600 - selected item
  barBg: '#1e293b', // slate-800 - toolbar background

  // Form elements
  inputBg: '#334155', // slate-700 - input background
  inputBorder: '#475569', // slate-600 - input border
  inputTextColor: '#f8fafc', // slate-50 - input text
  inputBorderRadius: 8,

  // Buttons
  buttonBg: '#7c3aed', // violet-600 - button background
  buttonBorder: '#7c3aed', // violet-600 - button border

  // Boolean controls
  booleanBg: '#334155', // slate-700
  booleanSelectedBg: '#7c3aed', // violet-600
});

// Enhanced addon configuration
addons.setConfig({
  theme: devAssistTheme,
  
  // Panel positioning
  panelPosition: 'bottom',
  selectedPanel: 'storybook/docs/panel',
  
  // Sidebar configuration
  sidebar: {
    showRoots: false,
    collapsedRoots: ['other'],
    renderLabel: (item) => item.name,
  },
  
  // Toolbar configuration
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
    'storybook/background': { hidden: false },
    'storybook/viewport': { hidden: false },
    'storybook/docs': { hidden: false },
  },
  
  // Navigation
  initialActive: 'sidebar',
  showPanel: true,
  enableShortcuts: true,
  isToolshown: true,
  
  // Layout
  showNav: true,
  showTabs: true,
});