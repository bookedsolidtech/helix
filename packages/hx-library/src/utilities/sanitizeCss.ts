/**
 * @module sanitizeCss
 *
 * Validates and sanitizes a CSS string before injection into the document.
 * Prevents CSS injection attacks including scope escape via unbalanced braces,
 * external resource loading via `url()` / `@import`, and legacy browser
 * exploits (`expression()`, `-moz-binding`, `behavior:`).
 *
 * Returns the CSS string unchanged if it passes all checks, or `null` if
 * the input is rejected. Callers should treat a `null` return as a hard
 * rejection — the CSS must NOT be injected.
 */

import { devWarn } from '../utils/dev-warn.js';

/** Patterns that are never allowed in injected CSS. */
const BLOCKED_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /expression\s*\(/i, label: 'CSS expression()' },
  { pattern: /-moz-binding\s*:/i, label: '-moz-binding (XBL injection)' },
  { pattern: /behavior\s*:/i, label: 'behavior: (HTC injection)' },
  { pattern: /@import\b/i, label: '@import rule' },
];

/**
 * Matches `url(...)` values. Captures the content inside the parens.
 * Handles both quoted and unquoted forms.
 */
const URL_PATTERN = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;

/**
 * Allowed URI schemes inside `url()`. Relative paths (no scheme) are also
 * allowed — only explicit external schemes are blocked.
 */
const ALLOWED_URL_PREFIXES: ReadonlyArray<string> = [
  'data:',
  'blob:',
  '#', // fragment references (e.g. SVG filters)
];

/**
 * Returns true if a `url()` value is safe for injection.
 * Safe values are: relative paths, data: URIs, blob: URIs, and fragment refs.
 * Anything with an explicit protocol scheme (http:, https:, ftp:, etc.) is blocked.
 */
function isUrlSafe(urlValue: string): boolean {
  const trimmed = urlValue.trim();

  // Empty url() is harmless
  if (trimmed === '') return true;

  // Allow explicitly safe prefixes
  for (const prefix of ALLOWED_URL_PREFIXES) {
    if (trimmed.startsWith(prefix)) return true;
  }

  // Block any value containing a protocol scheme (e.g. http://, https://, ftp://)
  if (/^[a-z][a-z0-9+\-.]*:/i.test(trimmed)) {
    return false;
  }

  // No scheme — treat as relative path, which is safe
  return true;
}

/**
 * Checks whether braces in the CSS string are balanced.
 * Unbalanced braces can be used to escape scoped selectors and inject global
 * styles into the document.
 */
function areBracesBalanced(css: string): boolean {
  let depth = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      // A negative depth means a closing brace appeared before its opener,
      // which is a clear scope-escape attempt.
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

/**
 * Sanitizes a CSS string for safe injection into `document.head`.
 *
 * Rejects CSS that contains:
 * - Unbalanced braces (scope escape)
 * - `url()` values pointing to external domains
 * - `@import` rules
 * - `expression()` (IE CSS expressions)
 * - `-moz-binding` (XBL injection)
 * - `behavior:` (HTC injection)
 *
 * @param css - The raw CSS string to validate.
 * @param componentName - The component name, used in dev warnings.
 * @returns The original CSS if safe, or `null` if rejected.
 */
export function sanitizeCss(css: string, componentName: string): string | null {
  // Check brace balance first — this is the primary scope-escape vector.
  if (!areBracesBalanced(css)) {
    devWarn(
      componentName,
      'light-css rejected: unbalanced braces detected. ' +
        'This may indicate a CSS injection attempt.',
    );
    return null;
  }

  // Check for blocked patterns.
  for (const { pattern, label } of BLOCKED_PATTERNS) {
    if (pattern.test(css)) {
      devWarn(componentName, `light-css rejected: ${label} is not allowed in injected styles.`);
      return null;
    }
  }

  // Validate all url() values — block external domains.
  let urlMatch: RegExpExecArray | null;
  URL_PATTERN.lastIndex = 0;
  while ((urlMatch = URL_PATTERN.exec(css)) !== null) {
    const urlValue = urlMatch[2] ?? '';
    if (!isUrlSafe(urlValue)) {
      devWarn(
        componentName,
        'light-css rejected: url() with external domain detected. ' +
          'Only relative paths, data:, and blob: URIs are allowed.',
      );
      return null;
    }
  }

  return css;
}
