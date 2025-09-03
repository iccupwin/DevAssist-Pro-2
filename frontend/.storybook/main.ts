import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: [
    '../src/components/ui/SimpleButton.stories.tsx',
  ],
  addons: [
    '@storybook/preset-create-react-app',
    '@storybook/addon-essentials',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      builder: {
        useSWC: true,
      },
    },
  },
  docs: {
    autodocs: false,
  },
  typescript: {
    check: false,
    reactDocgen: false,
  },
  staticDirs: ['../public'],
  core: {
    disableTelemetry: true,
  },
};

export default config;