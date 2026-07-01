import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import { escapeAttr, sanitizeTree } from './svg-sanitize.js';

/** Sanitize the CHILDREN of a source <svg> (mirrors how the generators use it). */
function sanitizeChildren(svg: string): string {
  const { document } = parseHTML(`<!doctype html><body>${svg}</body>`);
  const root = document.querySelector('svg') as unknown as Element;
  for (const child of Array.from(root.children)) sanitizeTree(child as Element);
  return root.innerHTML;
}

describe('sanitizeTree', () => {
  it('preserves fill="currentColor" (Lucide terminal dots must not hollow out)', () => {
    const out = sanitizeChildren(
      '<svg><path fill="none" d="M0 0"/><circle fill="currentColor" cx="1" cy="1" r="1"/></svg>',
    );
    expect(out).toContain('fill="currentColor"');
  });

  it('preserves fill="none" and stroke="currentColor"', () => {
    const out = sanitizeChildren('<svg><path fill="none" stroke="currentColor" d="M0 0"/></svg>');
    expect(out).toContain('fill="none"');
    expect(out).toContain('stroke="currentColor"');
  });

  it('strips hardcoded color fills/strokes that fight the cascade', () => {
    const out = sanitizeChildren(
      '<svg><path fill="#ff0000" d="M0 0"/><path stroke="rgb(0,0,0)" d="M1 1"/></svg>',
    );
    expect(out).not.toContain('#ff0000');
    expect(out).not.toContain('rgb(0,0,0)');
  });

  it('strips id/class/style and every aria-* attribute', () => {
    const out = sanitizeChildren(
      '<svg><path id="x" class="y" style="color:red" aria-hidden="true" aria-label="z" d="M0 0"/></svg>',
    );
    expect(out).not.toMatch(/\b(id|class|style|aria-hidden|aria-label)=/);
  });

  it('recurses into nested groups', () => {
    const out = sanitizeChildren(
      '<svg><g fill="#abc"><circle fill="currentColor" id="dot"/></g></svg>',
    );
    expect(out).toContain('fill="currentColor"');
    expect(out).not.toContain('#abc');
    expect(out).not.toContain('id="dot"');
  });

  // Paint keywords are case-INSENSITIVE per SVG/CSS: lowercase, uppercase, and
  // mixed-case spellings of a preserved keyword must all survive sanitization.
  it('preserves case-variant paint keywords (currentcolor, CONTEXT-STROKE, CurrentColor)', () => {
    const out = sanitizeChildren(
      '<svg>' +
        '<path fill="currentcolor" d="M0 0"/>' +
        '<path stroke="CONTEXT-STROKE" d="M1 1"/>' +
        '<path fill="CurrentColor" d="M2 2"/>' +
        '<path fill="NONE" stroke="Context-Fill" d="M3 3"/>' +
        '<path fill="TRANSPARENT" d="M4 4"/>' +
        '</svg>',
    );
    expect(out).toContain('fill="currentcolor"');
    expect(out).toContain('stroke="CONTEXT-STROKE"');
    expect(out).toContain('fill="CurrentColor"');
    expect(out).toContain('fill="NONE"');
    expect(out).toContain('stroke="Context-Fill"');
    expect(out).toContain('fill="TRANSPARENT"');
  });

  it('still strips genuinely-unsafe paints regardless of case', () => {
    const out = sanitizeChildren(
      '<svg>' +
        '<path fill="url(#evil)" d="M0 0"/>' +
        '<path stroke="JavaScript:alert(1)" d="M1 1"/>' +
        '<path fill="#FF0000" d="M2 2"/>' +
        '</svg>',
    );
    expect(out).not.toContain('url(#evil)');
    expect(out).not.toContain('JavaScript:alert(1)');
    expect(out).not.toContain('#FF0000');
  });
});

describe('escapeAttr', () => {
  it('escapes the four XML-significant characters', () => {
    expect(escapeAttr('a"b')).toBe('a&quot;b');
    expect(escapeAttr('a<b')).toBe('a&lt;b');
    expect(escapeAttr('a>b')).toBe('a&gt;b');
    expect(escapeAttr('a&b')).toBe('a&amp;b');
  });

  it('escapes `&` first so entities are not double-encoded', () => {
    // If `"` were escaped before `&`, the resulting `&quot;` would then have its
    // `&` re-escaped to `&amp;quot;`. Escaping `&` first prevents that.
    expect(escapeAttr('"')).toBe('&quot;');
    expect(escapeAttr('&quot;')).toBe('&amp;quot;');
  });

  it('neutralizes an attribute-breakout payload so no raw markup survives', () => {
    // A malformed third-party stroke-linecap that tries to close the attribute
    // and inject a <script>. After escaping, no raw `"`, `<`, or `>` remain, so
    // the serialized `<symbol id=".." stroke-linecap="${escaped}">` cannot be
    // structurally altered.
    const payload = 'round"><script>alert(1)</script><symbol id="x';
    const escaped = escapeAttr(payload);
    expect(escaped).not.toMatch(/[<>"]/);
    expect(escaped).toContain('&quot;');
    expect(escaped).toContain('&lt;script&gt;');
    // Sanity: interpolating the escaped value keeps the attribute intact.
    const serialized = `<symbol stroke-linecap="${escaped}"></symbol>`;
    const { document } = parseHTML(`<!doctype html><body>${serialized}</body>`);
    const symbol = document.querySelector('symbol');
    expect(symbol).not.toBeNull();
    expect(symbol?.getAttribute('stroke-linecap')).toBe(payload);
    // No injected <script> element made it into the DOM.
    expect(document.querySelector('script')).toBeNull();
  });
});
