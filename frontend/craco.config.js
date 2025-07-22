const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig, { env, paths }) => {
      // Исключаем Storybook файлы из всех build
      webpackConfig.module.rules.push({
        test: /\.stories\.(ts|tsx|js|jsx)$/,
        loader: 'ignore-loader'
      });
      
      // Заменяем storybook на mock в production
      if (env === 'production') {
        webpackConfig.resolve.alias = {
          ...webpackConfig.resolve.alias,
          '@storybook/addon-actions': path.resolve(__dirname, 'src/mocks/storybook.js'),
          '@storybook/react': path.resolve(__dirname, 'src/mocks/storybook.js'),
          'storybook/internal/preview-api': path.resolve(__dirname, 'src/mocks/storybook.js'),
          'storybook/internal/preview-errors': path.resolve(__dirname, 'src/mocks/storybook.js')
        };
      }
      
      return webpackConfig;
    },
  },
};