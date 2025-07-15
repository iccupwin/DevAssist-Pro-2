import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

const theme = create({
  base: 'light',
  brandTitle: 'DevAssist Pro Design System',
  brandUrl: '',
  
  // UI
  appBg: '#f8fafc',
  appContentBg: '#ffffff',
  appBorderColor: '#e2e8f0',
  appBorderRadius: 8,
  
  // Text colors
  textColor: '#1e293b',
  textInverseColor: '#ffffff',
  
  // Toolbar default and active colors
  barTextColor: '#64748b',
  barSelectedColor: '#0ea5e9',
  barBg: '#ffffff',
  
  // Form colors
  inputBg: '#ffffff',
  inputBorder: '#d1d5db',
  inputTextColor: '#1e293b',
  inputBorderRadius: 6,
});

addons.setConfig({
  theme,
  panelPosition: 'bottom',
  selectedPanel: 'docs',
  sidebar: {
    showRoots: true,
    collapsedRoots: ['UI'],
  },
});