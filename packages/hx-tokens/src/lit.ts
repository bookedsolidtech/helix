import { css } from 'lit';
import { tokenEntries, darkTokenEntries } from './index.js';

/** Lit CSSResult with all light-mode tokens as :host custom properties (Shadow DOM compatible) */
export const tokenStyles = css([
  `:host {\n${tokenEntries.map((t) => `  ${t.name}: ${t.value};`).join('\n')}\n}`,
] as unknown as TemplateStringsArray);

/** Lit CSSResult with dark-mode overrides for :host when data-theme="dark" */
export const darkTokenStyles =
  darkTokenEntries.length > 0
    ? css([
        `:host([data-theme="dark"]) {\n${darkTokenEntries.map((t) => `  ${t.name}: ${t.value};`).join('\n')}\n}\n` +
          `@media (prefers-color-scheme: dark) {\n  :host(:not([data-theme="light"])) {\n${darkTokenEntries.map((t) => `    ${t.name}: ${t.value};`).join('\n')}\n  }\n}`,
      ] as unknown as TemplateStringsArray)
    : css``;
