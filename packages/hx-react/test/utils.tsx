import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

export interface RenderResult {
  container: HTMLDivElement;
  unmount(): void;
  query(selector: string): Element | null;
}

/**
 * Renders a React element into a detached container div, returns helpers.
 * Call `result.unmount()` in afterEach to clean up.
 */
export async function render(element: React.ReactElement): Promise<RenderResult> {
  const container = document.createElement('div');
  document.body.appendChild(container);

  let root!: Root;
  await act(async () => {
    root = createRoot(container);
    root.render(element);
  });

  return {
    container,
    unmount() {
      act(() => root.unmount());
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    },
    query(selector: string) {
      return container.querySelector(selector);
    },
  };
}

/**
 * Converts a React component display name (e.g. "HxButton") to its
 * custom element tag name (e.g. "hx-button").
 */
export function toTagName(name: string): string {
  // Strip the 'Hx' prefix, then build kebab-case tag name
  const withoutPrefix = name.slice(2);
  let kebab = '';
  for (let i = 0; i < withoutPrefix.length; i++) {
    const ch = withoutPrefix[i] ?? '';
    if (ch >= 'A' && ch <= 'Z') {
      kebab += (i === 0 ? '' : '-') + ch.toLowerCase();
    } else {
      kebab += ch;
    }
  }
  return `hx-${kebab}`;
}
