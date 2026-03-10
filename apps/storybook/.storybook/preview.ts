import '@helix/tokens/tokens.css';
import type { Preview } from '@storybook/web-components';
import { setCustomElementsManifest } from '@storybook/web-components';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { html } from 'lit';
import customElements from '@helix/library/custom-elements.json';

// Register the Custom Elements Manifest so autodocs API tables
// are populated with properties, events, slots, CSS parts, and
// CSS custom properties.
setCustomElementsManifest(customElements);

const preview: Preview = {
  parameters: {
    controls: {
      expanded: true,
      sort: 'requiredFirst',
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: {
        headingSelector: 'h2, h3',
        title: 'Table of Contents',
      },
    },
    options: {
      storySort: {
        order: [
          'Welcome Center',
          ['Introduction', '*'],
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
    theme: 'light',
  },

  decorators: [
    // Global padding so stories do not render edge-to-edge.
    (story) => html`<div style="padding: 2rem;">${story()}</div>`,

    // Theme switching via data-theme attribute on <html>.
    // @helix/tokens/tokens.css defines :root[data-theme="dark"]
    // overrides, so this decorator activates them automatically.
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
  ],
};

export default preview;
