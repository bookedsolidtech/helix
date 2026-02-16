import { tokenEntries, darkTokenEntries } from './index.js';

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

/** Complete CSS with light mode, auto dark mode, and manual dark mode */
export const fullTokensCSS: string = [tokensCSS, darkMediaCSS, darkManualCSS]
  .filter(Boolean)
  .join('\n');
