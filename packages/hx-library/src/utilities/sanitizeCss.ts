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
 * Handles both quoted and unquoted forms. The `s` (dotAll) flag allows the
 * content to span newlines so CSS line-continuation escapes (`\<LF>`) inside
 * `url()` do not slip past the matcher entirely — those continuations are
 * part of the url payload the CSS parser will still evaluate.
 */
const URL_PATTERN = /url\(\s*(['"]?)(.*?)\1\s*\)/gis;

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
 * Decodes CSS escape sequences found inside `url()` payloads to defeat
 * encoding-based bypasses of the scheme check.
 *
 * Three escape forms per CSS Syntax Level 3 are handled:
 *
 * 1. Hex escape: `\` followed by 1-6 hex digits, optionally terminated by a
 *    single whitespace character. Decodes to the codepoint
 *    (e.g. `\3a` → `:`, `\2f\2f` → `//`, `\68\74\74\70\3a` → `http:`).
 * 2. Line continuation: `\` followed by a newline (`\n`, `\r\n`, `\r`, or
 *    `\f`). Decodes to the empty string — the browser strips these and the
 *    remaining characters are concatenated, so `http\<LF>:xyz` becomes
 *    `http:xyz`.
 * 3. Identity escape: `\` followed by any other character. Decodes to the
 *    literal character (e.g. `\:` → `:`).
 *
 * This intentionally implements only the subset of CSS escape handling that
 * the parser applies to `url()` token contents. It is not a full CSS lexer.
 */
function decodeCssEscapes(input: string): string {
  let out = '';
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];

    if (ch !== '\\') {
      out += ch;
      i++;
      continue;
    }

    // Trailing lone backslash — keep it literal.
    if (i + 1 >= len) {
      out += ch;
      i++;
      continue;
    }

    const next = input[i + 1];

    // Line continuation: \\r\n, \\n, \\r, \\f all decode to empty string.
    if (next === '\n' || next === '\f') {
      i += 2;
      continue;
    }
    if (next === '\r') {
      // Handle CRLF as a single continuation.
      if (input[i + 2] === '\n') {
        i += 3;
      } else {
        i += 2;
      }
      continue;
    }

    // Hex escape: up to 6 hex digits, optional single whitespace terminator.
    if (next !== undefined && /[0-9a-fA-F]/.test(next)) {
      let hex = '';
      let j = i + 1;
      while (j < len && hex.length < 6) {
        const hexCh = input[j];
        if (hexCh === undefined || !/[0-9a-fA-F]/.test(hexCh)) break;
        hex += hexCh;
        j++;
      }
      // Consume a single optional whitespace terminator per CSS spec.
      // CRLF is treated as one whitespace token.
      if (j < len) {
        const term = input[j];
        if (term === '\r' && input[j + 1] === '\n') {
          j += 2;
        } else if (
          term === ' ' ||
          term === '\t' ||
          term === '\n' ||
          term === '\r' ||
          term === '\f'
        ) {
          j++;
        }
      }
      const codepoint = parseInt(hex, 16);
      // Spec: a codepoint of 0 or a surrogate or above max Unicode is replaced
      // with U+FFFD. We replicate that defensively.
      if (
        !Number.isFinite(codepoint) ||
        codepoint === 0 ||
        (codepoint >= 0xd800 && codepoint <= 0xdfff) ||
        codepoint > 0x10ffff
      ) {
        out += '\uFFFD';
      } else {
        out += String.fromCodePoint(codepoint);
      }
      i = j;
      continue;
    }

    // Identity escape: \X decodes to literal X (for any non-hex, non-newline X).
    out += next;
    i += 2;
  }

  return out;
}

/**
 * Returns true if a `url()` value is safe for injection.
 * Safe values are: relative paths, data: URIs, blob: URIs, and fragment refs.
 * Anything with an explicit protocol scheme (http:, https:, ftp:, etc.) is blocked.
 *
 * The payload is CSS-escape-decoded before any scheme / prefix check is
 * applied. `sanitizeCss` pre-decodes the full stylesheet so this decode is
 * normally idempotent, but the defense is retained here so `isUrlSafe` remains
 * correct in isolation and survives any future caller that passes raw payloads.
 */
function isUrlSafe(urlValue: string): boolean {
  const trimmedRaw = urlValue.trim();

  // Empty url() is harmless. Check this on the raw (pre-decode) value so a
  // string consisting only of whitespace escapes still short-circuits cleanly
  // after decoding — see below.
  if (trimmedRaw === '') return true;

  // Decode CSS escapes first so the scheme / prefix checks run against the
  // same string the browser's CSS parser will materialize.
  const decoded = decodeCssEscapes(trimmedRaw).trim();

  // A url() that decodes to empty (e.g. only line-continuations) is harmless.
  if (decoded === '') return true;

  // Protocol-relative URLs (//host/path) resolve against the page's current
  // protocol and load from an external host — same risk as explicit http://.
  // Must reject before the allow-prefix / scheme checks, since they have no colon.
  if (decoded.startsWith('//')) return false;

  // Allow explicitly safe prefixes
  for (const prefix of ALLOWED_URL_PREFIXES) {
    if (decoded.startsWith(prefix)) return true;
  }

  // Block any value containing a protocol scheme (e.g. http://, https://, ftp://)
  if (/^[a-z][a-z0-9+\-.]*:/i.test(decoded)) {
    return false;
  }

  // No scheme — treat as relative path, which is safe
  return true;
}

/**
 * Checks whether braces in the CSS string are balanced.
 * Unbalanced braces can be used to escape scoped selectors and inject global
 * styles into the document. Braces inside strings (`"..."`, `'...'`) and block
 * comments are ignored so legitimate content like `content: "}"` or SVG data
 * URIs (`url("data:image/svg+xml,<svg>{...}</svg>")`) does not trigger a false
 * rejection.
 */
function areBracesBalanced(css: string): boolean {
  let depth = 0;
  let quote: '"' | "'" | null = null;
  let inComment = false;

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];

    if (inComment) {
      if (ch === '*' && css[i + 1] === '/') {
        inComment = false;
        i++;
      }
      continue;
    }

    if (quote !== null) {
      if (ch === '\\') {
        // Skip the escaped character (including an escaped quote).
        i++;
        continue;
      }
      if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '/' && css[i + 1] === '*') {
      inComment = true;
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

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
  // Check brace balance on the raw input — the balance scanner already tracks
  // string quoting and backslash escapes, so it does not need pre-decoded CSS
  // and is safer run against the source bytes.
  if (!areBracesBalanced(css)) {
    devWarn(
      componentName,
      'light-css rejected: unbalanced braces detected. ' +
        'This may indicate a CSS injection attempt.',
    );
    return null;
  }

  // Decode CSS escape sequences before the token-level checks.
  // The CSS tokenizer decodes escapes inside <ident-token>, <at-keyword-token>,
  // and <url-token> before comparing against rule/function names (CSS Syntax
  // Level 3 §4.3.3–§4.3.7). So `@\69mport` tokenizes as `@import` and
  // `u\72l(http://evil/x)` tokenizes as `url(http://evil/x)` — both would slip
  // past regex checks that match only the literal bytes. Decoding first forces
  // our patterns to see what the browser will actually tokenize.
  const decoded = decodeCssEscapes(css);

  // Check for blocked patterns against the decoded CSS.
  for (const { pattern, label } of BLOCKED_PATTERNS) {
    if (pattern.test(decoded)) {
      devWarn(componentName, `light-css rejected: ${label} is not allowed in injected styles.`);
      return null;
    }
  }

  // Validate all url() values on the decoded CSS — block external domains.
  let urlMatch: RegExpExecArray | null;
  URL_PATTERN.lastIndex = 0;
  while ((urlMatch = URL_PATTERN.exec(decoded)) !== null) {
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
