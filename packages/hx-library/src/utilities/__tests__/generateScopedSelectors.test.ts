import { describe, it, expect } from 'vitest';
import { generateScopedSelectors } from '../generateScopedSelectors.js';

describe('generateScopedSelectors', () => {
  describe('basic selector scoping', () => {
    it('scopes a simple element selector', () => {
      const result = generateScopedSelectors('hx-card', 'p { color: red; }');
      expect(result).toContain('[data-hx-styled="hx-card"] p');
    });

    it('scopes a class selector', () => {
      const result = generateScopedSelectors('hx-card', '.lead { font-size: 1.2em; }');
      expect(result).toContain('[data-hx-styled="hx-card"] .lead');
    });

    it('scopes a descendant selector', () => {
      const result = generateScopedSelectors('hx-card', 'ul li { margin: 0; }');
      expect(result).toContain('[data-hx-styled="hx-card"] ul li');
    });

    it('scopes comma-separated selectors individually', () => {
      const result = generateScopedSelectors('hx-card', 'h1, h2 { font-weight: bold; }');
      expect(result).toContain('[data-hx-styled="hx-card"] h1');
      expect(result).toContain('[data-hx-styled="hx-card"] h2');
    });

    it('uses the provided componentName in the scope attribute', () => {
      const result = generateScopedSelectors('hx-dialog', 'p { margin: 0; }');
      expect(result).toContain('[data-hx-styled="hx-dialog"] p');
      expect(result).not.toContain('[data-hx-styled="hx-card"]');
    });

    it('preserves CSS property values', () => {
      const css = 'p { font-size: var(--hx-font-size-md); }';
      const result = generateScopedSelectors('hx-card', css);
      expect(result).toContain('var(--hx-font-size-md)');
    });
  });

  describe('::slotted() patterns', () => {
    it('converts ::slotted(*) to a direct descendant selector', () => {
      const result = generateScopedSelectors('hx-card', '::slotted(*) { color: blue; }');
      expect(result).toContain('[data-hx-styled="hx-card"] *');
    });

    it('converts ::slotted(p) to a direct descendant p selector', () => {
      const result = generateScopedSelectors('hx-card', '::slotted(p) { color: blue; }');
      expect(result).toContain('[data-hx-styled="hx-card"] p');
    });

    it('converts ::slotted(.class) to a class descendant selector', () => {
      const result = generateScopedSelectors('hx-card', '::slotted(.highlight) { background: yellow; }');
      expect(result).toContain('[data-hx-styled="hx-card"] .highlight');
    });
  });

  describe(':host patterns', () => {
    it('replaces :host with the scope attribute selector', () => {
      const result = generateScopedSelectors('hx-card', ':host { display: block; }');
      expect(result).toContain('[data-hx-styled="hx-card"]');
      expect(result).not.toContain(':host');
    });
  });

  describe('at-rules', () => {
    it('scopes selectors inside @media queries', () => {
      const css = '@media (min-width: 640px) { p { font-size: 1rem; } }';
      const result = generateScopedSelectors('hx-card', css);
      expect(result).toContain('@media (min-width: 640px)');
      expect(result).toContain('[data-hx-styled="hx-card"] p');
    });

    it('scopes selectors inside @supports', () => {
      const css = '@supports (display: grid) { .grid { display: grid; } }';
      const result = generateScopedSelectors('hx-card', css);
      expect(result).toContain('@supports');
      expect(result).toContain('[data-hx-styled="hx-card"] .grid');
    });

    it('passes through @keyframes unchanged', () => {
      const css = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
      const result = generateScopedSelectors('hx-card', css);
      expect(result).toContain('@keyframes spin');
    });
  });

  describe('multiple rules', () => {
    it('scopes multiple consecutive rules', () => {
      const css = 'p { margin: 0; } h2 { font-weight: bold; }';
      const result = generateScopedSelectors('hx-card', css);
      expect(result).toContain('[data-hx-styled="hx-card"] p');
      expect(result).toContain('[data-hx-styled="hx-card"] h2');
    });

    it('returns empty string for empty input', () => {
      const result = generateScopedSelectors('hx-card', '');
      expect(result).toBe('');
    });
  });
});
