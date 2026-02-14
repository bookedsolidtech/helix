import type { Preview } from '@storybook/web-components';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
    a11y: {
      // axe-core configuration
      config: {
        rules: [
          {
            // Ensure color contrast checks run
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'grey', value: '#f8f9fa' },
        { name: 'dark', value: '#212529' },
      ],
    },
  },
};

export default preview;
