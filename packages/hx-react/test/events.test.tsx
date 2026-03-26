/**
 * Event mapping tests — verifies that @lit/react createComponent correctly
 * maps custom events (e.g. 'hx-click') to React handler props (e.g. onHxClick).
 *
 * Tests dispatch native CustomEvents on the custom element and assert the
 * corresponding React handler is called with the correct event object.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { HxButton } from '../src/components/HxButton/index.js';
import { HxTextInput } from '../src/components/HxTextInput/index.js';
import { HxCheckbox } from '../src/components/HxCheckbox/index.js';
import { HxSwitch } from '../src/components/HxSwitch/index.js';
import { HxCard } from '../src/components/HxCard/index.js';
import { HxSlider } from '../src/components/HxSlider/index.js';

describe('Event mapping', () => {
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

  // --- HxButton: onHxClick → 'hx-click' ---
  describe('HxButton', () => {
    it('calls onHxClick when hx-click fires', async () => {
      const handler = vi.fn();
      await act(async () => {
        root.render(React.createElement(HxButton, { onHxClick: handler }));
      });

      const el = container.querySelector('hx-button')!;
      await act(async () => {
        el.dispatchEvent(new CustomEvent('hx-click', { bubbles: true, composed: true }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });

    it('passes the CustomEvent instance to onHxClick', async () => {
      const handler = vi.fn();
      await act(async () => {
        root.render(React.createElement(HxButton, { onHxClick: handler }));
      });

      const el = container.querySelector('hx-button')!;
      const evt = new CustomEvent('hx-click', { bubbles: true, composed: true, detail: { value: 42 } });
      await act(async () => {
        el.dispatchEvent(evt);
      });

      expect(handler).toHaveBeenCalledWith(evt);
    });

    it('does not call onHxClick when handler is not provided', async () => {
      await act(async () => {
        root.render(React.createElement(HxButton));
      });

      const el = container.querySelector('hx-button')!;
      // Should not throw when no handler is attached
      expect(() => {
        el.dispatchEvent(new CustomEvent('hx-click', { bubbles: true, composed: true }));
      }).not.toThrow();
    });
  });

  // --- HxTextInput: onHxInput + onHxChange → 'hx-input' + 'hx-change' ---
  describe('HxTextInput', () => {
    it('calls onHxInput when hx-input fires', async () => {
      const handler = vi.fn();
      await act(async () => {
        root.render(React.createElement(HxTextInput, { onHxInput: handler }));
      });

      const el = container.querySelector('hx-text-input')!;
      await act(async () => {
        el.dispatchEvent(new CustomEvent('hx-input', { bubbles: true, composed: true }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });

    it('calls onHxChange when hx-change fires', async () => {
      const handler = vi.fn();
      await act(async () => {
        root.render(React.createElement(HxTextInput, { onHxChange: handler }));
      });

      const el = container.querySelector('hx-text-input')!;
      await act(async () => {
        el.dispatchEvent(new CustomEvent('hx-change', { bubbles: true, composed: true }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });

    it('calls both handlers independently', async () => {
      const inputHandler = vi.fn();
      const changeHandler = vi.fn();
      await act(async () => {
        root.render(
          React.createElement(HxTextInput, { onHxInput: inputHandler, onHxChange: changeHandler }),
        );
      });

      const el = container.querySelector('hx-text-input')!;
      await act(async () => {
        el.dispatchEvent(new CustomEvent('hx-input', { bubbles: true, composed: true }));
        el.dispatchEvent(new CustomEvent('hx-change', { bubbles: true, composed: true }));
      });

      expect(inputHandler).toHaveBeenCalledOnce();
      expect(changeHandler).toHaveBeenCalledOnce();
    });
  });

  // --- HxCheckbox: onHxChange → 'hx-change' ---
  describe('HxCheckbox', () => {
    it('calls onHxChange when hx-change fires', async () => {
      const handler = vi.fn();
      await act(async () => {
        root.render(React.createElement(HxCheckbox, { onHxChange: handler, label: 'Accept' }));
      });

      const el = container.querySelector('hx-checkbox')!;
      await act(async () => {
        el.dispatchEvent(new CustomEvent('hx-change', { bubbles: true, composed: true }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });
  });

  // --- HxSwitch: onHxChange → 'hx-change' ---
  describe('HxSwitch', () => {
    it('calls onHxChange when hx-change fires', async () => {
      const handler = vi.fn();
      await act(async () => {
        root.render(React.createElement(HxSwitch, { onHxChange: handler, label: 'Enable' }));
      });

      const el = container.querySelector('hx-switch')!;
      await act(async () => {
        el.dispatchEvent(new CustomEvent('hx-change', { bubbles: true, composed: true }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });
  });

  // --- HxCard: onHxClick → 'hx-click' ---
  describe('HxCard', () => {
    it('calls onHxClick when hx-click fires', async () => {
      const handler = vi.fn();
      await act(async () => {
        root.render(React.createElement(HxCard, { onHxClick: handler }));
      });

      const el = container.querySelector('hx-card')!;
      await act(async () => {
        el.dispatchEvent(new CustomEvent('hx-click', { bubbles: true, composed: true }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });
  });

  // --- HxSlider: onHxChange → 'hx-change' ---
  describe('HxSlider', () => {
    it('calls onHxChange when hx-change fires', async () => {
      const handler = vi.fn();
      await act(async () => {
        root.render(React.createElement(HxSlider, { onHxChange: handler }));
      });

      const el = container.querySelector('hx-slider')!;
      await act(async () => {
        el.dispatchEvent(
          new CustomEvent('hx-change', { bubbles: true, composed: true, detail: { value: 50 } }),
        );
      });

      expect(handler).toHaveBeenCalledOnce();
    });

    it('passes event detail to onHxChange handler', async () => {
      const handler = vi.fn();
      await act(async () => {
        root.render(React.createElement(HxSlider, { onHxChange: handler }));
      });

      const el = container.querySelector('hx-slider')!;
      const evt = new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: 75 },
      });
      await act(async () => {
        el.dispatchEvent(evt);
      });

      expect(handler).toHaveBeenCalledWith(evt);
    });
  });

  // --- Handler replacement: updating the handler prop triggers the new handler ---
  describe('Handler prop updates', () => {
    it('calls the updated onHxClick handler after re-render', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      await act(async () => {
        root.render(React.createElement(HxButton, { onHxClick: handler1 }));
      });

      const el = container.querySelector('hx-button')!;

      // Replace handler via re-render
      await act(async () => {
        root.render(React.createElement(HxButton, { onHxClick: handler2 }));
      });

      await act(async () => {
        el.dispatchEvent(new CustomEvent('hx-click', { bubbles: true, composed: true }));
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledOnce();
    });
  });
});
