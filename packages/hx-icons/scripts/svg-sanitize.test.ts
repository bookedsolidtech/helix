import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import { sanitizeTree } from './svg-sanitize.js';

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
});
