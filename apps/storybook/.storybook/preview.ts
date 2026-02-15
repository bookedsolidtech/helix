import '@helix/tokens/tokens.css';
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
    options: {
      storySort: {
        order: [
          'Introduction',
          'Design Tokens',
          ['Colors', 'Spacing', 'Typography', 'Borders', 'Shadows'],
          'Components',
          ['Button', 'Card', 'Text Input', '*'],
          '*',
        ],
      },
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
      options: {
        light: { name: 'light', value: '#ffffff' },
        grey: { name: 'grey', value: '#f8f9fa' },
        dark: { name: 'dark', value: '#212529' },
      },
    },
  },

  initialGlobals: {
    backgrounds: {
      value: 'light',
    },
  },
};

export default preview;
