/**
 * @module document-token-adoption
 *
 * Adopts HELiX design tokens into `document.adoptedStyleSheets` exactly once,
 * so that every Shadow DOM component can reference `var(--hx-*)` tokens via
 * CSS inheritance rather than declaring them on each component's `:host`.
 *
 * This is the correct architecture for theme provider compatibility:
 * - Tokens declared at the document level provide fallback values
 * - `hx-theme` overrides tokens on its `:host`, which flow down via inheritance
 * - Components simply consume `var(--hx-*)` in their styles without redeclaring
 *
 * Inspired by @phase2/outline-adopted-stylesheets-controller.
 *
 * @example
 * ```ts
 * // Auto-registers on first import — no API call needed
 * import '../utilities/document-token-adoption.js';
 * ```
 */
import { tokenEntries } from '@helixui/tokens';

/** Module-level flag — ensures adoption runs exactly once. */
let _adopted = false;

/**
 * Adopts the full set of HELiX design tokens into `document.adoptedStyleSheets`.
 * Safe to call multiple times — only the first invocation has any effect.
 *
 * The tokens are declared on `:root` so they participate in CSS inheritance
 * and can be overridden by `hx-theme` (which declares on its `:host`).
 */
export function ensureDocumentTokens(): void {
  if (_adopted) return;

  if (
    typeof document === 'undefined' ||
    typeof CSSStyleSheet === 'undefined' ||
    typeof CSSStyleSheet.prototype.replaceSync !== 'function'
  ) {
    return;
  }

  const cssText = `:root {\n${tokenEntries.map((t) => `  ${t.name}: ${t.value};`).join('\n')}\n}`;

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(cssText);

  if (!document.adoptedStyleSheets.includes(sheet)) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }

  _adopted = true;
}

// Auto-execute on module load so that importing this module is sufficient.
ensureDocumentTokens();
