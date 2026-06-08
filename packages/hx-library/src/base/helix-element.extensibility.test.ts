/**
 * Consumer extensibility contract for `HelixElement`.
 *
 * Project teams that build custom components on top of HELiX use one of two
 * proven "thin-shell" patterns:
 *
 *   Track-1 — extend a concrete HELiX component:
 *     `class DemoButton extends HelixButton {}`
 *
 *   Track-2 — extend the base class + the ARIA-delegation mixin to author a
 *   brand-new custom HELiX component:
 *     `class DemoEl extends mixinDelegatesAria(HelixElement) {}`
 *
 * This suite proves both patterns work end-to-end **using only the public
 * `@helixui/library` root export surface** (`../index.js`). It deliberately
 * imports from the package barrel — not deep module paths — so it regresses if
 * `mixinDelegatesAria`, `HelixElement`, `HelixButton`, or
 * `AriaDelegationMixinInterface` ever drops out of the public API.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { fixture, shadowQuery, oneEvent, cleanup } from '../test-utils.js';

// Public root export surface — the exact entry point a consumer imports from.
// Importing the root barrel also runs each component module's
// `@customElement` side effect, so `hx-button` (and the rest) are registered.
import {
  HelixElement,
  HelixButton,
  mixinDelegatesAria,
  type AriaDelegationMixinInterface,
} from '../index.js';

// ─── Track-1 — extend a concrete HELiX component ─────────────────────────────

/**
 * The proven Track-1 pattern: a consumer extends `HelixButton` and gets the
 * full component API (properties, form participation, `hx-click`) for free,
 * with no re-implementation. No new behaviour is added here — the point is to
 * confirm inheritance of the base component's public surface.
 */
@customElement('demo-button')
class DemoButton extends HelixButton {}

// ─── Track-2 — extend HelixElement + the public ARIA-delegation mixin ─────────

/**
 * The proven Track-2 pattern: a consumer authors a brand-new custom HELiX
 * component from `HelixElement` and the publicly-exported `mixinDelegatesAria`.
 * This must yield both working host-ARIA delegation (from the mixin) and form
 * participation (from `HelixElement` + `ElementInternals`).
 */
@customElement('demo-el')
class DemoEl extends mixinDelegatesAria(HelixElement) {
  static override formAssociated = true;

  @property({ type: String, reflect: true })
  value = '';

  override _onFormReset(): void {
    this.value = '';
    this._internals.setFormValue('');
  }

  override render() {
    return html`<button aria-label=${this.ariaLabel ?? nothing}>
      <slot></slot>
    </button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'demo-button': DemoButton;
    'demo-el': DemoEl;
  }
}

afterEach(cleanup);

describe('HelixElement consumer extensibility', () => {
  // ── Track-1: extends HelixButton ───────────────────────────────────────────

  describe('Track-1: class DemoButton extends HelixButton', () => {
    it('is an instance of HelixButton (and HelixElement)', async () => {
      const el = await fixture<DemoButton>('<demo-button>Save</demo-button>');
      expect(el).toBeInstanceOf(HelixButton);
      expect(el).toBeInstanceOf(HelixElement);
    });

    it('inherits the full public property API with defaults', async () => {
      const el = await fixture<DemoButton>('<demo-button>Save</demo-button>');
      // Properties declared on HelixButton are inherited verbatim.
      expect(el.variant).toBe('primary');
      expect(el.size).toBe('md');
      expect(el.disabled).toBe(false);
      expect(el.loading).toBe(false);
      expect(el.type).toBe('button');
    });

    it('inherits attribute reflection for inherited properties', async () => {
      const el = await fixture<DemoButton>(
        '<demo-button variant="danger">Delete</demo-button>',
      );
      expect(el.variant).toBe('danger');
      expect(el.hasAttribute('variant')).toBe(true);
      // Inner control renders inside the inherited shadow root.
      expect(shadowQuery(el, 'button, a')).toBeTruthy();
    });

    it('inherits form association from HelixButton', () => {
      // formAssociated is read off the registered subclass constructor.
      expect((DemoButton as typeof HelixButton).formAssociated).toBe(true);
    });

    it('inherits the hx-click event contract', async () => {
      const el = await fixture<DemoButton>('<demo-button>Click</demo-button>');
      const inner = shadowQuery<HTMLButtonElement>(el, 'button')!;
      const clickEvent = oneEvent<CustomEvent>(el, 'hx-click');
      inner.click();
      const detail = (await clickEvent).detail;
      expect(detail).toBeTruthy();
    });
  });

  // ── Track-2: extends mixinDelegatesAria(HelixElement) ──────────────────────

  describe('Track-2: class DemoEl extends mixinDelegatesAria(HelixElement)', () => {
    it('is an instance of HelixElement', async () => {
      const el = await fixture<DemoEl>('<demo-el>Field</demo-el>');
      expect(el).toBeInstanceOf(HelixElement);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('gets working host-ARIA delegation from the public mixin', async () => {
      const el = await fixture<DemoEl>(
        '<demo-el aria-label="Patient name">Field</demo-el>',
      );
      // Mixin shifts aria-* off the host to data-aria-* to avoid Shadow DOM
      // double-announcement.
      expect(el.hasAttribute('aria-label')).toBe(false);
      expect(el.getAttribute('data-aria-label')).toBe('Patient name');
      // Typed accessor from the public interface reads the delegated value.
      expect((el as unknown as AriaDelegationMixinInterface).ariaLabel).toBe('Patient name');
    });

    it('forwards the delegated ARIA value to the inner control on render', async () => {
      const el = await fixture<DemoEl>(
        '<demo-el aria-label="Save record">Field</demo-el>',
      );
      const inner = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(inner.getAttribute('aria-label')).toBe('Save record');
    });

    it('re-renders the inner control when the delegated value changes', async () => {
      const el = await fixture<DemoEl>('<demo-el>Field</demo-el>');
      const inner = shadowQuery<HTMLButtonElement>(el, 'button')!;

      el.setAttribute('aria-label', 'Updated');
      await el.updateComplete;

      expect(el.hasAttribute('aria-label')).toBe(false);
      expect(inner.getAttribute('aria-label')).toBe('Updated');
    });

    it('retains HelixElement form participation alongside the mixin', () => {
      // formAssociated is honoured on the registered subclass, so the element
      // participates in forms while also delegating ARIA.
      expect((DemoEl as typeof HelixElement).formAssociated).toBe(true);
    });

    it('exposes ElementInternals and the form lifecycle hooks', async () => {
      const el = await fixture<DemoEl>('<demo-el>Field</demo-el>');
      // Lazy _internals is inherited from HelixElement and usable.
      expect(el._internals).toBeTruthy();
      expect(el._internals.form).toBeNull();

      // Form-reset hook delegation still works under the mixin.
      el.value = 'dirty';
      el._internals.setFormValue('dirty');
      el.formResetCallback();
      expect(el.value).toBe('');
    });

    it('participates in a real <form> with both behaviours active', async () => {
      const form = document.createElement('form');
      const el = document.createElement('demo-el');
      el.setAttribute('aria-label', 'Notes');
      form.appendChild(el);
      document.body.appendChild(form);
      try {
        await el.updateComplete;
        // ARIA delegated.
        expect(el.hasAttribute('aria-label')).toBe(false);
        expect(el.getAttribute('data-aria-label')).toBe('Notes');
        // Form-associated: the element resolves its owning form via internals.
        expect(el._internals.form).toBe(form);
      } finally {
        form.remove();
      }
    });
  });
});
