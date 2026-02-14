import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';

const wcTheme = create({
  base: 'light',

  // Brand
  brandTitle: 'WC-2026 Design System',
  brandUrl: '/',

  // Colors
  colorPrimary: '#007878',
  colorSecondary: '#007878',

  // UI
  appBg: '#f8f9fa',
  appContentBg: '#ffffff',
  appBorderColor: '#dee2e6',
  appBorderRadius: 6,

  // Text
  textColor: '#212529',
  textInverseColor: '#ffffff',

  // Toolbar
  barTextColor: '#6c757d',
  barSelectedColor: '#007878',
  barBg: '#ffffff',
});

addons.setConfig({
  theme: wcTheme,
});
