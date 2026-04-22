import { describe, it, expect, afterEach } from 'vitest';
import { html, LitElement } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { fixture, cleanup } from '../../test-utils.js';
import { FocusMixin } from '../FocusMixin.js';

// ─── Test Component ──────────────────────────────────────────────────────────

@customElement('test-focus-mixin-element')
class TestFocusMixinElement extends FocusMixin(LitElement) {
  @query('input') private _input!: HTMLInputElement;

  protected override get _focusableNode(): HTMLElement | null {
    return this._input ?? null;
  }

  override render() {
    return html`<input type="text" />`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'test-focus-mixin-element': TestFocusMixinElement;
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

afterEach(cleanup);

describe('FocusMixin', () => {
  describe('mixin application', () => {
    it('applies to a LitElement subclass without errors', async () => {
      const el = await fixture<TestFocusMixinElement>(
        '<test-focus-mixin-element></test-focus-mixin-element>',
      );
      expect(el).toBeInstanceOf(LitElement);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('has focused property initially false', async () => {
      const el = await fixture<TestFocusMixinElement>(
        '<test-focus-mixin-element></test-focus-mixin-element>',
      );
      expect(el.focused).toBe(false);
    });

    it('has focusedVisible property initially false', async () => {
      const el = await fixture<TestFocusMixinElement>(
        '<test-focus-mixin-element></test-focus-mixin-element>',
      );
      expect(el.focusedVisible).toBe(false);
    });
  });

  describe('focus delegation', () => {
    it('delegates focus() to the inner focusable node', async () => {
      const el = await fixture<TestFocusMixinElement>(
        '<test-focus-mixin-element></test-focus-mixin-element>',
      );
      el.focus();
      await el.updateComplete;
      const inner = el.shadowRoot!.querySelector('input')!;
      expect(el.shadowRoot!.activeElement).toBe(inner);
    });

    it('delegates blur() to the inner focusable node', async () => {
      const el = await fixture<TestFocusMixinElement>(
        '<test-focus-mixin-element></test-focus-mixin-element>',
      );
      el.focus();
      await el.updateComplete;
      el.blur();
      await el.updateComplete;
      expect(el.shadowRoot!.activeElement).toBeNull();
    });
  });

  describe('focused attribute reflection', () => {
    it('sets focused=true on focusin', async () => {
      const el = await fixture<TestFocusMixinElement>(
        '<test-focus-mixin-element></test-focus-mixin-element>',
      );
      el.focus();
      await el.updateComplete;
      expect(el.focused).toBe(true);
      expect(el.hasAttribute('focused')).toBe(true);
    });

    it('sets focused=false on focusout', async () => {
      const el = await fixture<TestFocusMixinElement>(
        '<test-focus-mixin-element></test-focus-mixin-element>',
      );
      el.focus();
      await el.updateComplete;
      el.blur();
      await el.updateComplete;
      expect(el.focused).toBe(false);
      expect(el.hasAttribute('focused')).toBe(false);
    });
  });

  describe('focusedVisible detection', () => {
    it('sets focusedVisible=false when focus arrives via pointer', async () => {
      const el = await fixture<TestFocusMixinElement>(
        '<test-focus-mixin-element></test-focus-mixin-element>',
      );
      // Simulate pointer interaction then focus
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      el.focus();
      await el.updateComplete;
      expect(el.focused).toBe(true);
      expect(el.focusedVisible).toBe(false);
    });

    it('sets focusedVisible=true when focus arrives via keyboard', async () => {
      const el = await fixture<TestFocusMixinElement>(
        '<test-focus-mixin-element></test-focus-mixin-element>',
      );
      // Simulate keyboard interaction then focus
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      el.focus();
      await el.updateComplete;
      expect(el.focused).toBe(true);
      expect(el.focusedVisible).toBe(true);
    });

    it('resets focusedVisible on focusout', async () => {
      const el = await fixture<TestFocusMixinElement>(
        '<test-focus-mixin-element></test-focus-mixin-element>',
      );
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      el.focus();
      await el.updateComplete;
      expect(el.focusedVisible).toBe(true);
      el.blur();
      await el.updateComplete;
      expect(el.focusedVisible).toBe(false);
    });
  });
});
