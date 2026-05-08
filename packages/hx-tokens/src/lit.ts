import { css } from 'lit';
import { tokenEntries, darkTokenEntries, highContrastTokenEntries } from './index.js';

/**
 * Lit CSSResult with all light-mode tokens as `:host` custom properties.
 *
 * @deprecated Since `@helixui/library@2.1.0`. Tokens are now adopted at the
 * document level via `document.adoptedStyleSheets` and cascade through Shadow DOM
 * via CSS inheritance. You no longer need to include `tokenStyles` in component
 * `static styles`. This export remains for edge cases (isolated test fixtures,
 * iframe contexts) but should not be used in production components.
 *
 * @see ensureDocumentTokens in `@helixui/library`
 */
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

/** Lit CSSResult with high-contrast overrides for :host when data-hx-contrast="high" or data-theme="high-contrast" */
export const highContrastTokenStyles =
  highContrastTokenEntries.length > 0
    ? css([
        `:host([data-hx-contrast="high"]),\n:host([data-theme="high-contrast"]) {\n${highContrastTokenEntries.map((t) => `  ${t.name}: ${t.value};`).join('\n')}\n}\n` +
          `@media (prefers-contrast: more) {\n  :host(:not([data-hx-contrast="normal"]):not([data-theme="light"]):not([data-theme="dark"])) {\n${highContrastTokenEntries.map((t) => `    ${t.name}: ${t.value};`).join('\n')}\n  }\n}`,
      ] as unknown as TemplateStringsArray)
    : css``;
