/**
 * Prop forwarding tests — verifies that React props are correctly forwarded
 * to the underlying web component elements via @lit/react createComponent.
 *
 * @lit/react sets React props as JS properties on the custom element instance,
 * which Lit then reflects to attributes (for @property({ reflect: true }) props)
 * or stores internally.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { COMPONENT_METADATA } from './cem-parser.js';

// Import representative components for detailed testing
import { HxButton } from '../src/components/HxButton/index.js';
import { HxTextInput } from '../src/components/HxTextInput/index.js';
import { HxCheckbox } from '../src/components/HxCheckbox/index.js';
import { HxSwitch } from '../src/components/HxSwitch/index.js';
import { HxSelect } from '../src/components/HxSelect/index.js';
import { HxTextarea } from '../src/components/HxTextarea/index.js';
import { HxAlert } from '../src/components/HxAlert/index.js';
import { HxBadge } from '../src/components/HxBadge/index.js';
import { HxText } from '../src/components/HxText/index.js';
import { HxSpinner } from '../src/components/HxSpinner/index.js';
import { HxProgressBar } from '../src/components/HxProgressBar/index.js';

describe('Prop forwarding', () => {
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

  // --- HxButton ---
  describe('HxButton', () => {
    it('forwards variant prop as JS property', async () => {
      await act(async () => {
        root.render(React.createElement(HxButton, { variant: 'secondary' }));
      });
      const el = container.querySelector('hx-button') as HTMLElement & { variant?: string };
      expect(el?.variant).toBe('secondary');
    });

    it('forwards disabled prop as JS property', async () => {
      await act(async () => {
        root.render(React.createElement(HxButton, { disabled: true }));
      });
      const el = container.querySelector('hx-button') as HTMLElement & { disabled?: boolean };
      expect(el?.disabled).toBe(true);
    });

    it('forwards size prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxButton, { size: 'lg' }));
      });
      const el = container.querySelector('hx-button') as HTMLElement & { size?: string };
      expect(el?.size).toBe('lg');
    });

    it('forwards loading prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxButton, { loading: true }));
      });
      const el = container.querySelector('hx-button') as HTMLElement & { loading?: boolean };
      expect(el?.loading).toBe(true);
    });

    it('renders slot content as children', async () => {
      await act(async () => {
        root.render(React.createElement(HxButton, {}, 'Click me'));
      });
      const el = container.querySelector('hx-button');
      expect(el?.textContent).toContain('Click me');
    });

    it('forwards type prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxButton, { type: 'submit' }));
      });
      const el = container.querySelector('hx-button') as HTMLElement & { type?: string };
      expect(el?.type).toBe('submit');
    });

    it('forwards href prop (renders as anchor)', async () => {
      await act(async () => {
        root.render(React.createElement(HxButton, { href: 'https://example.com' }));
      });
      const el = container.querySelector('hx-button') as HTMLElement & { href?: string };
      expect(el?.href).toBe('https://example.com');
    });
  });

  // --- HxTextInput ---
  describe('HxTextInput', () => {
    it('forwards label prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxTextInput, { label: 'Email address' }));
      });
      const el = container.querySelector('hx-text-input') as HTMLElement & { label?: string };
      expect(el?.label).toBe('Email address');
    });

    it('forwards disabled prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxTextInput, { disabled: true }));
      });
      const el = container.querySelector('hx-text-input') as HTMLElement & { disabled?: boolean };
      expect(el?.disabled).toBe(true);
    });

    it('forwards required prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxTextInput, { required: true }));
      });
      const el = container.querySelector('hx-text-input') as HTMLElement & { required?: boolean };
      expect(el?.required).toBe(true);
    });
  });

  // --- HxCheckbox ---
  describe('HxCheckbox', () => {
    it('forwards label prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxCheckbox, { label: 'Accept terms' }));
      });
      const el = container.querySelector('hx-checkbox') as HTMLElement & { label?: string };
      expect(el?.label).toBe('Accept terms');
    });

    it('forwards disabled prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxCheckbox, { disabled: true }));
      });
      const el = container.querySelector('hx-checkbox') as HTMLElement & { disabled?: boolean };
      expect(el?.disabled).toBe(true);
    });
  });

  // --- HxSwitch ---
  describe('HxSwitch', () => {
    it('forwards label prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxSwitch, { label: 'Dark mode' }));
      });
      const el = container.querySelector('hx-switch') as HTMLElement & { label?: string };
      expect(el?.label).toBe('Dark mode');
    });

    it('forwards disabled prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxSwitch, { disabled: true }));
      });
      const el = container.querySelector('hx-switch') as HTMLElement & { disabled?: boolean };
      expect(el?.disabled).toBe(true);
    });
  });

  // --- HxSelect ---
  describe('HxSelect', () => {
    it('forwards label prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxSelect, { label: 'Country' }));
      });
      const el = container.querySelector('hx-select') as HTMLElement & { label?: string };
      expect(el?.label).toBe('Country');
    });

    it('forwards disabled prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxSelect, { disabled: true }));
      });
      const el = container.querySelector('hx-select') as HTMLElement & { disabled?: boolean };
      expect(el?.disabled).toBe(true);
    });
  });

  // --- HxTextarea ---
  describe('HxTextarea', () => {
    it('forwards label prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxTextarea, { label: 'Comments' }));
      });
      const el = container.querySelector('hx-textarea') as HTMLElement & { label?: string };
      expect(el?.label).toBe('Comments');
    });

    it('forwards disabled prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxTextarea, { disabled: true }));
      });
      const el = container.querySelector('hx-textarea') as HTMLElement & { disabled?: boolean };
      expect(el?.disabled).toBe(true);
    });
  });

  // --- HxAlert ---
  describe('HxAlert', () => {
    it('forwards variant prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxAlert, { variant: 'warning' }));
      });
      const el = container.querySelector('hx-alert') as HTMLElement & { variant?: string };
      expect(el?.variant).toBe('warning');
    });

    it('renders slot content as children', async () => {
      await act(async () => {
        root.render(React.createElement(HxAlert, {}, 'Alert message'));
      });
      const el = container.querySelector('hx-alert');
      expect(el?.textContent).toContain('Alert message');
    });
  });

  // --- HxBadge ---
  describe('HxBadge', () => {
    it('forwards variant prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxBadge, { variant: 'danger' }));
      });
      const el = container.querySelector('hx-badge') as HTMLElement & { variant?: string };
      expect(el?.variant).toBe('danger');
    });

    it('renders slot content as children', async () => {
      await act(async () => {
        root.render(React.createElement(HxBadge, {}, '42'));
      });
      const el = container.querySelector('hx-badge');
      expect(el?.textContent).toContain('42');
    });
  });

  // --- HxText ---
  describe('HxText', () => {
    it('renders slot content as children', async () => {
      await act(async () => {
        root.render(React.createElement(HxText, {}, 'Hello world'));
      });
      const el = container.querySelector('hx-text');
      expect(el?.textContent).toContain('Hello world');
    });
  });

  // --- HxProgressBar ---
  describe('HxProgressBar', () => {
    it('forwards value prop', async () => {
      await act(async () => {
        root.render(React.createElement(HxProgressBar, { value: 75 }));
      });
      const el = container.querySelector('hx-progress-bar') as HTMLElement & { value?: number };
      expect(el?.value).toBe(75);
    });
  });

  // --- Generic metadata-driven test: all COMPONENT_METADATA items render ---
  // Use import.meta.glob (statically analyzable by Vite) instead of dynamic import().
  const allComponentModules = import.meta.glob('../src/components/**/index.ts', {
    eager: true,
  }) as Record<string, Record<string, React.ComponentType>>;

  describe('All metadata-tracked components accept their documented props', () => {
    COMPONENT_METADATA.forEach(({ name, tagName, props }) => {
      it(`${name} renders with sample props`, async () => {
        const globKey = `../src/components/${name}/index.ts`;
        const mod = allComponentModules[globKey];
        if (!mod) {
          throw new Error(`Glob did not find module at ${globKey}`);
        }
        const Component = mod[name];
        if (!Component) {
          throw new Error(`Expected ${name} export in components/${name}/index.ts`);
        }

        await act(async () => {
          root.render(React.createElement(Component, props as Record<string, unknown>));
        });

        const el = container.querySelector(tagName);
        expect(el, `Expected <${tagName}> in DOM after rendering ${name}`).not.toBeNull();
      });
    });
  });
});
