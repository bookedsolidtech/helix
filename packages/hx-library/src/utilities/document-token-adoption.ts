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
 * Limitation: tokens are adopted into the current `document` only. Components
 * rendered inside iframes or cross-document contexts will need their own
 * `ensureDocumentTokens()` call against the appropriate document.
 *
 * @example
 * ```ts
 * // Auto-registers on first import — no API call needed
 * import '../utilities/document-token-adoption.js';
 * ```
 */
import { lightTokenCss } from '@helixui/tokens';

/** Cross-bundle marker — Symbol.for ensures all copies share the same key */
const MARKER = Symbol.for('hx-tokens-adopted');

/**
 * Adopts the full set of HELiX design tokens into `document.adoptedStyleSheets`.
 * Safe to call multiple times — only the first invocation has any effect.
 * Uses a document-level Symbol marker to survive multiple bundled copies of the library.
 *
 * The tokens are declared on `:root` so they participate in CSS inheritance
 * and can be overridden by `hx-theme` (which declares on its `:host`).
 */
export function ensureDocumentTokens(): void {
  if (
    typeof document === 'undefined' ||
    typeof CSSStyleSheet === 'undefined' ||
    typeof CSSStyleSheet.prototype.replaceSync !== 'function'
  ) {
    return;
  }

  const doc = document as unknown as Record<symbol, unknown>;
  if (doc[MARKER]) return;

  try {
    const cssText = `:root {\n${lightTokenCss}\n}`;

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssText);

    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    doc[MARKER] = MARKER;
  } catch (e: unknown) {
    console.warn('[HELiX] Could not adopt document-level token styles:', e);
  }
}

// Auto-execute on import so bare `import './document-token-adoption.js'` works
// in browser components. The SSR guard inside ensureDocumentTokens() makes this
// safe in Node/Deno/SSR environments where `document` is not defined.
if (typeof document !== 'undefined') {
  ensureDocumentTokens();
}
