import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/preset-create-react-app',
    '@storybook/addon-essentials',
    '@storybook/addon-actions',
    '@storybook/addon-docs'
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation'
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen',
  },
  staticDirs: ['../public'],
  features: {
    storyStoreV7: true,
  },
};

export default config;