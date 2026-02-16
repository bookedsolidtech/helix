import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

const helixTheme = create({
  base: 'light',

  // Brand
  brandTitle: 'HELIX Design System',
  brandUrl: '/',

  // Colors
  colorPrimary: '#2563EB',
  colorSecondary: '#8b5cf6',

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
  barSelectedColor: '#2563EB',
  barBg: '#ffffff',
});

addons.setConfig({
  theme: helixTheme,
});
