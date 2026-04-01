/**
 * Ref forwarding tests — verifies that React refs correctly reference the
 * underlying HTMLElement of each web component wrapper.
 *
 * @lit/react createComponent supports ref forwarding out of the box.
 * These tests verify that ref.current points to the actual custom element
 * instance, allowing imperative access to the DOM node.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { HxButton } from '../src/components/HxButton/index.js';
import { HxTextInput } from '../src/components/HxTextInput/index.js';
import { HxCheckbox } from '../src/components/HxCheckbox/index.js';
import { HxSelect } from '../src/components/HxSelect/index.js';
import { HxDialog } from '../src/components/HxDialog/index.js';
import { HxTextarea } from '../src/components/HxTextarea/index.js';
import { HxSwitch } from '../src/components/HxSwitch/index.js';

describe('Ref forwarding', () => {
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
    it('forwards ref to the hx-button element', async () => {
      const ref = React.createRef<HTMLElement>();
      await act(async () => {
        root.render(React.createElement(HxButton, { ref }));
      });

      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName.toLowerCase()).toBe('hx-button');
    });

    it('ref.current is an HTMLElement instance', async () => {
      const ref = React.createRef<HTMLElement>();
      await act(async () => {
        root.render(React.createElement(HxButton, { ref }));
      });

      expect(ref.current).toBeInstanceOf(HTMLElement);
    });

    it('focus() can be called via ref', async () => {
      const ref = React.createRef<HTMLElement>();
      await act(async () => {
        root.render(React.createElement(HxButton, { ref }));
      });

      expect(() => ref.current?.focus()).not.toThrow();
    });

    it('ref is null after unmount', async () => {
      const ref = React.createRef<HTMLElement>();
      await act(async () => {
        root.render(React.createElement(HxButton, { ref }));
      });

      expect(ref.current).not.toBeNull();

      await act(async () => root.unmount());

      expect(ref.current).toBeNull();
    });
  });

  // --- HxTextInput ---
  describe('HxTextInput', () => {
    it('forwards ref to the hx-text-input element', async () => {
      const ref = React.createRef<HTMLElement>();
      await act(async () => {
        root.render(React.createElement(HxTextInput, { ref, label: 'Name' }));
      });

      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName.toLowerCase()).toBe('hx-text-input');
    });

    it('ref.current is in the DOM', async () => {
      const ref = React.createRef<HTMLElement>();
      await act(async () => {
        root.render(React.createElement(HxTextInput, { ref }));
      });

      expect(document.body.contains(ref.current)).toBe(true);
    });
  });

  // --- HxCheckbox ---
  describe('HxCheckbox', () => {
    it('forwards ref to the hx-checkbox element', async () => {
      const ref = React.createRef<HTMLElement>();
      await act(async () => {
        root.render(React.createElement(HxCheckbox, { ref, label: 'Accept' }));
      });

      expect(ref.current?.tagName.toLowerCase()).toBe('hx-checkbox');
    });
  });

  // --- HxSelect ---
  describe('HxSelect', () => {
    it('forwards ref to the hx-select element', async () => {
      const ref = React.createRef<HTMLElement>();
      await act(async () => {
        root.render(React.createElement(HxSelect, { ref }));
      });

      expect(ref.current?.tagName.toLowerCase()).toBe('hx-select');
    });
  });

  // --- HxTextarea ---
  describe('HxTextarea', () => {
    it('forwards ref to the hx-textarea element', async () => {
      const ref = React.createRef<HTMLElement>();
      await act(async () => {
        root.render(React.createElement(HxTextarea, { ref }));
      });

      expect(ref.current?.tagName.toLowerCase()).toBe('hx-textarea');
    });
  });

  // --- HxSwitch ---
  describe('HxSwitch', () => {
    it('forwards ref to the hx-switch element', async () => {
      const ref = React.createRef<HTMLElement>();
      await act(async () => {
        root.render(React.createElement(HxSwitch, { ref, label: 'Enable' }));
      });

      expect(ref.current?.tagName.toLowerCase()).toBe('hx-switch');
    });
  });

  // --- HxDialog ---
  describe('HxDialog', () => {
    it('forwards ref to the hx-dialog element', async () => {
      const ref = React.createRef<HTMLElement>();
      await act(async () => {
        root.render(React.createElement(HxDialog, { ref }));
      });

      expect(ref.current?.tagName.toLowerCase()).toBe('hx-dialog');
    });
  });

  // --- Functional refs (callback refs) ---
  describe('Callback refs', () => {
    it('calls a callback ref with the hx-button element', async () => {
      let captured: HTMLElement | null = null;
      const callbackRef = (el: HTMLElement | null) => {
        captured = el;
      };

      await act(async () => {
        root.render(React.createElement(HxButton, { ref: callbackRef }));
      });

      expect(captured).not.toBeNull();
      expect((captured as HTMLElement | null)?.tagName.toLowerCase()).toBe('hx-button');
    });

    it('calls the callback ref with null on unmount', async () => {
      let captured: HTMLElement | null = null;
      const callbackRef = (el: HTMLElement | null) => {
        captured = el;
      };

      await act(async () => {
        root.render(React.createElement(HxButton, { ref: callbackRef }));
      });

      expect(captured).not.toBeNull();

      await act(async () => root.unmount());

      expect(captured).toBeNull();
    });
  });

  // --- useRef integration ---
  describe('useRef integration', () => {
    it('useRef can access custom element properties via ref.current', async () => {
      // Test component that uses useRef to access the element
      let elementRef: HTMLElement & { variant?: string } | null = null;

      function ButtonWithRef() {
        const ref = React.useRef<HTMLElement & { variant?: string }>(null);
        React.useEffect(() => {
          elementRef = ref.current;
        }, []);
        return React.createElement(HxButton, { ref, variant: 'secondary' });
      }

      await act(async () => {
        root.render(React.createElement(ButtonWithRef));
      });

      expect(elementRef).not.toBeNull();
      expect(elementRef?.tagName.toLowerCase()).toBe('hx-button');
    });
  });
});
