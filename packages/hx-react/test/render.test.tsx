/**
 * Render tests — verifies all @helixui/react wrappers render without errors.
 *
 * Each component is rendered using React 18's createRoot API in a real Chromium
 * browser context (Vitest browser mode with Playwright). Tests verify that:
 * 1. The component renders without throwing
 * 2. The underlying custom element appears in the DOM
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import * as HelixReact from '../src/index.js';
import { toTagName } from './utils.js';

// Filter to only component exports (not Props type aliases — those are erased at runtime).
// @lit/react createComponent returns a React.forwardRef exotic component (object with $$typeof),
// not a plain function, so we check for both.
const isReactComponent = (val: unknown): boolean =>
  typeof val === 'function' ||
  (typeof val === 'object' && val !== null && '$$typeof' in val);

type ComponentEntry = [string, React.ComponentType | React.ExoticComponent];
const ALL_COMPONENTS = Object.entries(HelixReact).filter(
  ([name, value]) => name.startsWith('Hx') && isReactComponent(value),
) as ComponentEntry[];

describe('All @helixui/react wrappers render without errors', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  });

  it('exports at least 90 components', () => {
    expect(ALL_COMPONENTS.length).toBeGreaterThanOrEqual(90);
  });

  ALL_COMPONENTS.forEach(([name, Component]) => {
    const tag = toTagName(name);

    it(`${name} renders <${tag}> in the DOM`, async () => {
      await act(async () => {
        root.render(React.createElement(Component));
      });
      // The custom element should be the immediate child of the container
      const el = container.firstChild as Element | null;
      expect(el, `Expected <${tag}> to be rendered`).not.toBeNull();
      expect(el?.tagName.toLowerCase()).toBe(tag);
    });
  });
});
