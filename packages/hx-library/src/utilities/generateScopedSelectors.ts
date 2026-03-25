/**
 * @module generateScopedSelectors
 *
 * Generates CSS with all selectors scoped under a `[data-hx-styled="componentName"]`
 * attribute selector. This ensures injected light DOM styles only apply to content
 * wrapped in `<hx-style-scope component="...">` and do not leak to the rest of the page.
 *
 * @example
 * ```ts
 * import { generateScopedSelectors } from './generateScopedSelectors.js';
 *
 * const scoped = generateScopedSelectors('hx-card', 'p { color: red; }');
 * // '[data-hx-styled="hx-card"] p { color: red; }'
 * ```
 */

/**
 * Wraps all CSS selectors to be scoped under `[data-hx-styled="componentName"]`.
 *
 * Handles:
 * - Standard selectors: `p { ... }` → `[data-hx-styled="hx-card"] p { ... }`
 * - `::slotted(*)` patterns: `::slotted(p) { ... }` → `[data-hx-styled="hx-card"] p { ... }`
 * - At-rules (`@media`, `@supports`, etc.) are preserved with their inner rules scoped
 * - `:host` selectors are replaced with the scope attribute selector
 *
 * @param componentName - The component tag name used as the scope identifier.
 * @param css - The CSS string to transform.
 * @returns The transformed CSS with all selectors scoped.
 */
export function generateScopedSelectors(componentName: string, css: string): string {
  const scopeAttr = `[data-hx-styled="${componentName}"]`;
  return transformCss(css, scopeAttr);
}

/**
 * Returns the character at position `i` in `str`, or an empty string if out of bounds.
 * Avoids the `string | undefined` issue from `noUncheckedIndexedAccess`.
 */
function charAt(str: string, i: number): string {
  return str[i] ?? '';
}

/**
 * Recursively transforms CSS text, scoping all selectors under the given
 * attribute selector prefix.
 *
 * @param css - The CSS text to transform.
 * @param scopeAttr - The attribute selector to prepend (e.g. `[data-hx-styled="hx-card"]`).
 * @returns The scoped CSS string.
 */
function transformCss(css: string, scopeAttr: string): string {
  const result: string[] = [];
  let i = 0;
  const len = css.length;

  while (i < len) {
    // Skip whitespace
    while (i < len && /\s/.test(charAt(css, i))) {
      result.push(charAt(css, i));
      i++;
    }

    if (i >= len) break;

    // Check for at-rule (e.g. @media, @supports, @keyframes)
    if (charAt(css, i) === '@') {
      const atBlock = extractAtRule(css, i);
      result.push(transformAtRule(atBlock.text, scopeAttr));
      i = atBlock.end;
      continue;
    }

    // Extract a selector block up to the opening brace
    const selectorEnd = css.indexOf('{', i);
    if (selectorEnd === -1) break;

    const selectorRaw = css.slice(i, selectorEnd);
    const bodyStart = selectorEnd + 1;
    const bodyEnd = findMatchingBrace(css, selectorEnd);

    if (bodyEnd === -1) break;

    const body = css.slice(bodyStart, bodyEnd);
    const scopedSelector = scopeSelector(selectorRaw, scopeAttr);
    result.push(`${scopedSelector}{${body}}`);
    i = bodyEnd + 1;
  }

  return result.join('');
}

/**
 * Scopes a raw selector string under the given attribute selector.
 * Handles comma-separated selectors, `::slotted()`, and `:host`.
 *
 * @param selectorRaw - The raw selector string (may be comma-separated).
 * @param scopeAttr - The attribute selector prefix.
 * @returns The scoped selector string.
 */
function scopeSelector(selectorRaw: string, scopeAttr: string): string {
  return selectorRaw
    .split(',')
    .map((part) => {
      const trimmed = part.trim();

      // Replace ::slotted(*) with a direct descendant selector
      if (trimmed.startsWith('::slotted(') && trimmed.endsWith(')')) {
        const inner = trimmed.slice('::slotted('.length, -1).trim();
        return `${scopeAttr} ${inner}`;
      }

      // Replace :host with the scope attribute selector
      if (trimmed === ':host' || trimmed.startsWith(':host(') || trimmed.startsWith(':host ')) {
        return trimmed.replace(/^:host(\([^)]*\))?/, scopeAttr);
      }

      // Standard selector — prepend scope
      return `${scopeAttr} ${trimmed}`;
    })
    .join(', ');
}

/**
 * Handles transformation of an at-rule block. For container at-rules
 * (`@media`, `@supports`, `@layer`, `@container`) the inner rules are scoped.
 * Non-container at-rules (e.g. `@keyframes`, `@charset`) are passed through unchanged.
 *
 * @param atRuleText - The full at-rule text including its block.
 * @param scopeAttr - The attribute selector prefix.
 * @returns The transformed at-rule text.
 */
function transformAtRule(atRuleText: string, scopeAttr: string): string {
  const containerAtRules = /^@(media|supports|layer|container|document)\b/;
  const braceIndex = atRuleText.indexOf('{');

  if (braceIndex === -1 || !containerAtRules.test(atRuleText.trim())) {
    return atRuleText;
  }

  const head = atRuleText.slice(0, braceIndex + 1);
  const innerEnd = atRuleText.lastIndexOf('}');
  const inner = atRuleText.slice(braceIndex + 1, innerEnd);
  const tail = atRuleText.slice(innerEnd);

  return `${head}${transformCss(inner, scopeAttr)}${tail}`;
}

/**
 * Extracts a complete at-rule (potentially with a block) starting at index `start`.
 * Returns the text and the end index.
 */
function extractAtRule(css: string, start: number): { text: string; end: number } {
  // Find either ';' (simple at-rule) or the matching '{...}' (block at-rule)
  let i = start;
  while (i < css.length && charAt(css, i) !== '{' && charAt(css, i) !== ';') {
    i++;
  }

  if (i >= css.length) {
    return { text: css.slice(start), end: css.length };
  }

  if (charAt(css, i) === ';') {
    return { text: css.slice(start, i + 1), end: i + 1 };
  }

  // Block at-rule — find matching closing brace
  const end = findMatchingBrace(css, i);
  if (end === -1) {
    return { text: css.slice(start), end: css.length };
  }

  return { text: css.slice(start, end + 1), end: end + 1 };
}

/**
 * Finds the index of the closing `}` that matches the `{` at `openIndex`.
 * Returns -1 if no matching brace is found.
 */
function findMatchingBrace(css: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < css.length; i++) {
    const ch = charAt(css, i);
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}
