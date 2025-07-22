import type { Preview } from '@storybook/react';
import { withThemeFromJSXProvider } from '@storybook/addon-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

import '../src/index.css';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { ToastProvider } from '../src/contexts/ToastContext';

// Mock QueryClient для Storybook
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    docs: {
      toc: {
        contentsSelector: '.sbdocs-content',
        headingSelector: 'h1, h2, h3',
        ignoreSelector: '#storybook-root',
        disable: false,
        unsafeTocbotOptions: {
          orderedList: false,
        },
      },
      source: {
        format: 'dedent',
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0f172a',
        },
        {
          name: 'gray',
          value: '#f8fafc',
        },
        {
          name: 'gradient',
          value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        mobileLarge: {
          name: 'Mobile Large',
          styles: {
            width: '414px',
            height: '896px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1024px',
            height: '768px',
          },
        },
        largeDesktop: {
          name: 'Large Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
        ultraWide: {
          name: 'Ultra Wide',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
      },
    },
    layout: 'centered',
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Internationalization locale',
      defaultValue: 'ru',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'ru', title: 'Русский' },
          { value: 'en', title: 'English' },
        ],
      },
    },
  },
  decorators: [
    // Theme decorator
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      
      // Apply theme to document
      React.useEffect(() => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
          document.documentElement.setAttribute('data-theme', theme);
          
          // Apply CSS custom properties
          const root = document.documentElement;
          if (theme === 'dark') {
            root.style.setProperty('--background', '15 23 42'); // slate-900
            root.style.setProperty('--foreground', '248 250 252'); // slate-50
          } else {
            root.style.setProperty('--background', '255 255 255'); // white
            root.style.setProperty('--foreground', '15 23 42'); // slate-900
          }
        }
      }, [theme]);
      
      return React.createElement(Story);
    },
    
    // Providers decorator
    (Story) => {
      return React.createElement(
        BrowserRouter,
        {},
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(
            ThemeProvider,
            {},
            React.createElement(
              AuthProvider,
              {},
              React.createElement(
                ToastProvider,
                {},
                React.createElement(Story)
              )
            )
          )
        )
      );
    },
  ],
  tags: ['autodocs'],
};

export default preview;