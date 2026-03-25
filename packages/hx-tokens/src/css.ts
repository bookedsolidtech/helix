import { tokenEntries, darkTokenEntries, highContrastTokenEntries } from './index.js';

/** Light-mode CSS with all tokens as :root custom properties */
export const tokensCSS: string = `:root {\n${tokenEntries
  .map((t) => `  ${t.name}: ${t.value};`)
  .join('\n')}\n}\n`;

/** Dark-mode override CSS for @media prefers-color-scheme */
export const darkMediaCSS: string =
  darkTokenEntries.length > 0
    ? `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${darkTokenEntries
        .map((t) => `    ${t.name}: ${t.value};`)
        .join('\n')}\n  }\n}\n`
    : '';

/** Dark-mode override CSS for manual [data-theme="dark"] */
export const darkManualCSS: string =
  darkTokenEntries.length > 0
    ? `:root[data-theme="dark"] {\n${darkTokenEntries
        .map((t) => `  ${t.name}: ${t.value};`)
        .join('\n')}\n}\n`
    : '';

/** High-contrast override CSS for @media prefers-contrast: more */
export const highContrastMediaCSS: string =
  highContrastTokenEntries.length > 0
    ? `@media (prefers-contrast: more) {\n  :root:not([data-hx-contrast="normal"]) {\n${highContrastTokenEntries
        .map((t) => `    ${t.name}: ${t.value};`)
        .join('\n')}\n  }\n}\n`
    : '';

/** High-contrast override CSS for manual [data-hx-contrast="high"] */
export const highContrastManualCSS: string =
  highContrastTokenEntries.length > 0
    ? `:root[data-hx-contrast="high"] {\n${highContrastTokenEntries
        .map((t) => `  ${t.name}: ${t.value};`)
        .join('\n')}\n}\n`
    : '';

/** Complete CSS with light mode, auto dark mode, manual dark mode, and high-contrast modes */
export const fullTokensCSS: string = [
  tokensCSS,
  darkMediaCSS,
  darkManualCSS,
  highContrastMediaCSS,
  highContrastManualCSS,
]
  .filter(Boolean)
  .join('\n');
