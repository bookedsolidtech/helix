import { describe, it, expect, afterEach } from 'vitest';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { fixture, cleanup, shadowQuery } from '../../test-utils.js';
import { mixinDelegatesAria } from '../aria-delegation.js';
import type { AriaDelegationMixinInterface } from '../aria-delegation.js';

// ─── Test Components ─────────────────────────────────────────────────────────
//
// Minimal elements that apply mixinDelegatesAria. Registered once for
// the entire test suite — vitest browser mode shares a single document.

@customElement('test-aria-delegation')
class TestAriaDelegation extends mixinDelegatesAria(LitElement) {
  override render() {
    return html`<button aria-label=${this.ariaLabel ?? nothing}>Click</button>`;
  }
}

/**
 * A second test element with a Lit reactive property, used to verify that
 * observedAttributes merges ARIA attributes with Lit's own property-driven
 * attributes.
 */
@customElement('test-aria-delegation-with-props')
class TestAriaDelegationWithProps extends mixinDelegatesAria(LitElement) {
  @property({ type: String })
  variant = 'primary';

  override render() {
    return html`<button
      class=${this.variant}
      aria-label=${this.ariaLabel ?? nothing}
      role=${this.role ?? nothing}
    >
      Click
    </button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'test-aria-delegation': TestAriaDelegation;
    'test-aria-delegation-with-props': TestAriaDelegationWithProps;
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

afterEach(cleanup);

describe('mixinDelegatesAria', () => {
  // ── Mixin application ──────────────────────────────────────────────────

  describe('mixin application', () => {
    it('applies to a LitElement subclass without errors', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      expect(el).toBeInstanceOf(LitElement);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders shadow DOM content', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button');
      expect(btn).toBeTruthy();
      expect(btn!.textContent).toBe('Click');
    });
  });

  // ── Attribute interception ─────────────────────────────────────────────

  describe('attribute interception', () => {
    it('moves aria-label from host to data-aria-label', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-label="Save"></test-aria-delegation>',
      );
      // aria-label should be removed from host
      expect(el.hasAttribute('aria-label')).toBe(false);
      // data-aria-label should be set
      expect(el.getAttribute('data-aria-label')).toBe('Save');
    });

    it('moves aria-checked from host to data-aria-checked', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-checked="true"></test-aria-delegation>',
      );
      expect(el.hasAttribute('aria-checked')).toBe(false);
      expect(el.getAttribute('data-aria-checked')).toBe('true');
    });

    it('moves aria-expanded from host to data-aria-expanded', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-expanded="false"></test-aria-delegation>',
      );
      expect(el.hasAttribute('aria-expanded')).toBe(false);
      expect(el.getAttribute('data-aria-expanded')).toBe('false');
    });

    it('moves role from host to data-role', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation role="button"></test-aria-delegation>',
      );
      expect(el.hasAttribute('role')).toBe(false);
      expect(el.getAttribute('data-role')).toBe('button');
    });

    it('intercepts setAttribute for aria-label after initial render', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      el.setAttribute('aria-label', 'Updated');
      await el.updateComplete;

      expect(el.hasAttribute('aria-label')).toBe(false);
      expect(el.getAttribute('data-aria-label')).toBe('Updated');
    });
  });

  // ── Property accessors ─────────────────────────────────────────────────

  describe('property accessors', () => {
    it('ariaLabel getter reads from data-aria-label', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-label="Read me"></test-aria-delegation>',
      );
      expect(el.ariaLabel).toBe('Read me');
    });

    it('ariaLabel setter sets data-aria-label and removes aria-label', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      el.ariaLabel = 'Programmatic';
      await el.updateComplete;

      expect(el.getAttribute('data-aria-label')).toBe('Programmatic');
      expect(el.hasAttribute('aria-label')).toBe(false);
    });

    it('role getter reads from data-role', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation role="tab"></test-aria-delegation>',
      );
      expect(el.role).toBe('tab');
    });

    it('role setter sets data-role', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      el.role = 'menuitem';
      await el.updateComplete;

      expect(el.getAttribute('data-role')).toBe('menuitem');
      expect(el.hasAttribute('role')).toBe(false);
    });

    it('ariaExpanded accessor works correctly', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      (el as unknown as AriaDelegationMixinInterface).ariaExpanded = 'true';
      await el.updateComplete;

      expect(el.getAttribute('data-aria-expanded')).toBe('true');
      expect((el as unknown as AriaDelegationMixinInterface).ariaExpanded).toBe('true');
    });

    it('ariaDisabled accessor works correctly', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      (el as unknown as AriaDelegationMixinInterface).ariaDisabled = 'true';
      await el.updateComplete;

      expect(el.getAttribute('data-aria-disabled')).toBe('true');
      expect((el as unknown as AriaDelegationMixinInterface).ariaDisabled).toBe('true');
    });
  });

  // ── Null / removal ─────────────────────────────────────────────────────

  describe('null and removal', () => {
    it('setting property to null removes data-aria-* attribute', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-label="Remove me"></test-aria-delegation>',
      );
      expect(el.getAttribute('data-aria-label')).toBe('Remove me');

      el.ariaLabel = null;
      await el.updateComplete;

      expect(el.hasAttribute('data-aria-label')).toBe(false);
      expect(el.ariaLabel).toBeNull();
    });

    it('setting property to null also removes the aria-* attribute', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      el.ariaLabel = 'Temporary';
      await el.updateComplete;
      expect(el.getAttribute('data-aria-label')).toBe('Temporary');

      el.ariaLabel = null;
      await el.updateComplete;

      expect(el.hasAttribute('aria-label')).toBe(false);
      expect(el.hasAttribute('data-aria-label')).toBe(false);
    });

    it('removeAttribute for aria-label via property null removes data-aria-label', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-label="Gone soon"></test-aria-delegation>',
      );
      expect(el.getAttribute('data-aria-label')).toBe('Gone soon');

      // After initial interception, aria-label is already removed from the host.
      // The correct way to clear the delegated value is via the property setter.
      el.ariaLabel = null;
      await el.updateComplete;

      expect(el.hasAttribute('data-aria-label')).toBe(false);
      expect(el.ariaLabel).toBeNull();
    });

    it('removeAttribute for role via property null removes data-role', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation role="navigation"></test-aria-delegation>',
      );
      expect(el.getAttribute('data-role')).toBe('navigation');

      el.role = null;
      await el.updateComplete;

      expect(el.hasAttribute('data-role')).toBe(false);
    });

    it('removeAttribute on data-aria-* directly clears the delegated storage', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-label="Direct remove"></test-aria-delegation>',
      );
      expect(el.getAttribute('data-aria-label')).toBe('Direct remove');

      el.removeAttribute('data-aria-label');

      expect(el.hasAttribute('data-aria-label')).toBe(false);
      expect(el.ariaLabel).toBeNull();
    });
  });

  // ── Multiple attributes ────────────────────────────────────────────────

  describe('multiple attributes', () => {
    it('handles multiple ARIA attributes simultaneously', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-label="Multi" aria-expanded="true" role="combobox"></test-aria-delegation>',
      );

      // All aria-* removed from host
      expect(el.hasAttribute('aria-label')).toBe(false);
      expect(el.hasAttribute('aria-expanded')).toBe(false);
      expect(el.hasAttribute('role')).toBe(false);

      // All data-aria-* present
      expect(el.getAttribute('data-aria-label')).toBe('Multi');
      expect(el.getAttribute('data-aria-expanded')).toBe('true');
      expect(el.getAttribute('data-role')).toBe('combobox');

      // Property accessors
      expect(el.ariaLabel).toBe('Multi');
      expect((el as unknown as AriaDelegationMixinInterface).ariaExpanded).toBe('true');
      expect(el.role).toBe('combobox');
    });

    it('setting multiple properties programmatically works', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );

      el.ariaLabel = 'Label';
      el.role = 'button';
      (el as unknown as AriaDelegationMixinInterface).ariaPressed = 'false';
      await el.updateComplete;

      expect(el.getAttribute('data-aria-label')).toBe('Label');
      expect(el.getAttribute('data-role')).toBe('button');
      expect(el.getAttribute('data-aria-pressed')).toBe('false');
    });
  });

  // ── Recursive guard ────────────────────────────────────────────────────

  describe('recursive guard (#processingAria)', () => {
    it('does not cause infinite loop when setting aria-* triggers attributeChangedCallback', async () => {
      // This test verifies that the #processingAria guard works.
      // If the guard were missing, setAttribute('aria-label', ...)
      // -> attributeChangedCallback -> removeAttribute('aria-label')
      // -> attributeChangedCallback (recursive) would loop or clear data-aria-*.
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );

      // This should complete without hanging or throwing
      el.setAttribute('aria-label', 'Guard test');
      await el.updateComplete;

      expect(el.getAttribute('data-aria-label')).toBe('Guard test');
      expect(el.hasAttribute('aria-label')).toBe(false);
    });

    it('rapid sequential attribute changes do not corrupt state', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );

      el.setAttribute('aria-label', 'First');
      el.setAttribute('aria-label', 'Second');
      el.setAttribute('aria-label', 'Third');
      await el.updateComplete;

      expect(el.getAttribute('data-aria-label')).toBe('Third');
      expect(el.hasAttribute('aria-label')).toBe(false);
    });
  });

  // ── requestUpdate trigger ──────────────────────────────────────────────

  describe('requestUpdate trigger', () => {
    it('ARIA attribute change triggers Lit re-render', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

      // Initially no aria-label on inner button
      expect(btn.getAttribute('aria-label')).toBeNull();

      // Set aria-label on host, which delegates to data-aria-label and
      // calls requestUpdate, causing render() to re-read this.ariaLabel
      el.setAttribute('aria-label', 'Rendered');
      await el.updateComplete;

      // After re-render, inner button picks up the value
      expect(btn.getAttribute('aria-label')).toBe('Rendered');
    });

    it('property setter triggers Lit re-render', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

      el.ariaLabel = 'Via setter';
      await el.updateComplete;

      expect(btn.getAttribute('aria-label')).toBe('Via setter');
    });

    it('clearing ariaLabel re-renders inner element without the attribute', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-label="Present"></test-aria-delegation>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.getAttribute('aria-label')).toBe('Present');

      el.ariaLabel = null;
      await el.updateComplete;

      // Lit's `nothing` directive should remove the attribute
      expect(btn.hasAttribute('aria-label')).toBe(false);
    });
  });

  // ── Non-ARIA passthrough ───────────────────────────────────────────────

  describe('non-ARIA attribute passthrough', () => {
    it('non-ARIA attributes pass through to super.attributeChangedCallback', async () => {
      const el = await fixture<TestAriaDelegationWithProps>(
        '<test-aria-delegation-with-props variant="secondary"></test-aria-delegation-with-props>',
      );
      // Lit reactive property should work normally
      expect(el.variant).toBe('secondary');
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.classList.contains('secondary')).toBe(true);
    });

    it('ARIA and non-ARIA attributes work side by side', async () => {
      const el = await fixture<TestAriaDelegationWithProps>(
        '<test-aria-delegation-with-props variant="danger" aria-label="Delete" role="button"></test-aria-delegation-with-props>',
      );

      // Non-ARIA: Lit property works
      expect(el.variant).toBe('danger');

      // ARIA: delegated to data-*
      expect(el.getAttribute('data-aria-label')).toBe('Delete');
      expect(el.getAttribute('data-role')).toBe('button');
      expect(el.hasAttribute('aria-label')).toBe(false);
      expect(el.hasAttribute('role')).toBe(false);
    });
  });

  // ── observedAttributes ─────────────────────────────────────────────────

  describe('observedAttributes', () => {
    it('includes ARIA attributes in observedAttributes', () => {
      // We check via the element's constructor
      const ctor = customElements.get('test-aria-delegation');
      const attrs = (ctor as unknown as { observedAttributes: string[] }).observedAttributes;

      expect(attrs).toContain('aria-label');
      expect(attrs).toContain('aria-expanded');
      expect(attrs).toContain('aria-checked');
      expect(attrs).toContain('role');
    });

    it('includes Lit property attributes alongside ARIA attributes', () => {
      const ctor = customElements.get('test-aria-delegation-with-props');
      const attrs = (ctor as unknown as { observedAttributes: string[] }).observedAttributes;

      // Lit reactive property
      expect(attrs).toContain('variant');

      // ARIA attributes
      expect(attrs).toContain('aria-label');
      expect(attrs).toContain('role');
    });
  });

  // ── Canonical IDL accessor names ───────────────────────────────────────
  //
  // The mixin must define its delegated accessors under the exact ARIAMixin IDL
  // property names (e.g. `ariaColCount`, not `ariaColcount`). We assert this on
  // the *mixin's own prototype* via getOwnPropertyDescriptor, which is
  // independent of whether the host engine ships native ARIAMixin — this is the
  // regression guard for engines that lack native ARIA IDL props, where the
  // mixin's own accessor is the only one a consumer can reach.

  describe('canonical ARIAMixin IDL accessor names', () => {
    function mixinProto(): object {
      const ctor = customElements.get('test-aria-delegation') as unknown as {
        prototype: object;
      };
      // The mixin class sits between the test element and LitElement; walk up to
      // the prototype that actually owns an ARIA accessor.
      let proto: object | null = ctor.prototype;
      while (proto && !Object.getOwnPropertyDescriptor(proto, 'ariaColCount')) {
        proto = Object.getPrototypeOf(proto) as object | null;
      }
      return proto ?? ctor.prototype;
    }

    const canonicalNames = [
      'ariaColCount',
      'ariaColIndex',
      'ariaColIndexText',
      'ariaColSpan',
      'ariaRowCount',
      'ariaRowIndex',
      'ariaRowIndexText',
      'ariaRowSpan',
      'ariaDescribedBy',
      'ariaLabelledBy',
      'ariaActiveDescendant',
      'ariaBrailleRoleDescription',
      'ariaBrailleLabel',
      'ariaAutoComplete',
      'ariaHasPopup',
      'ariaKeyShortcuts',
      'ariaMultiLine',
      'ariaMultiSelectable',
      'ariaPosInSet',
      'ariaSetSize',
      'ariaReadOnly',
      'ariaRoleDescription',
      'ariaValueMax',
      'ariaValueMin',
      'ariaValueNow',
      'ariaValueText',
      'ariaErrorMessage',
    ];

    const wrongCasedNames = [
      'ariaColcount',
      'ariaDescribedby',
      'ariaLabelledby',
      'ariaBrailleroledescription',
      'ariaRowindex',
      'ariaActivedescendant',
    ];

    it('defines an own accessor for every canonical IDL name', () => {
      const proto = mixinProto();
      const missing = canonicalNames.filter(
        (name) => !Object.getOwnPropertyDescriptor(proto, name),
      );
      expect(missing).toEqual([]);
    });

    it('does not define any wrong-cased accessor', () => {
      const proto = mixinProto();
      const leaked = wrongCasedNames.filter((name) =>
        Object.getOwnPropertyDescriptor(proto, name),
      );
      expect(leaked).toEqual([]);
    });

    it('canonical accessor delegates to data-aria-* storage', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      // Set via the canonical accessor (the property a consumer would use).
      (el as unknown as AriaDelegationMixinInterface).ariaColCount = '7';
      expect(el.getAttribute('data-aria-colcount')).toBe('7');
      expect((el as unknown as AriaDelegationMixinInterface).ariaColCount).toBe('7');
    });
  });

  // ── Attribute → IDL property name mapping (via property accessors) ──────

  describe('attribute → IDL property name mapping (via property accessors)', () => {
    it('aria-label maps to ariaLabel', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-label="Test"></test-aria-delegation>',
      );
      expect(el.ariaLabel).toBe('Test');
    });

    it('aria-activedescendant is delegated to data-aria-activedescendant', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-activedescendant="opt-1"></test-aria-delegation>',
      );
      // Verify delegation happened: aria-* removed, data-aria-* set
      expect(el.hasAttribute('aria-activedescendant')).toBe(false);
      expect(el.getAttribute('data-aria-activedescendant')).toBe('opt-1');
    });

    it('aria-braillelabel is delegated to data-aria-braillelabel', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-braillelabel="braille test"></test-aria-delegation>',
      );
      expect(el.hasAttribute('aria-braillelabel')).toBe(false);
      expect(el.getAttribute('data-aria-braillelabel')).toBe('braille test');
    });

    it('aria-brailleroledescription maps to ariaBrailleRoleDescription', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      (el as unknown as AriaDelegationMixinInterface).ariaBrailleRoleDescription = 'slider';
      expect(el.getAttribute('data-aria-brailleroledescription')).toBe('slider');
    });

    it('aria-autocomplete maps to ariaAutoComplete', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      (el as unknown as AriaDelegationMixinInterface).ariaAutoComplete = 'list';
      expect(el.getAttribute('data-aria-autocomplete')).toBe('list');
    });

    it('aria-colindextext maps to ariaColIndexText (multi-hyphen)', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      (el as unknown as AriaDelegationMixinInterface).ariaColIndexText = 'Column A';
      expect(el.getAttribute('data-aria-colindextext')).toBe('Column A');
    });

    it('aria-rowindextext maps to ariaRowIndexText', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      (el as unknown as AriaDelegationMixinInterface).ariaRowIndexText = 'Row 5';
      expect(el.getAttribute('data-aria-rowindextext')).toBe('Row 5');
    });

    it('role maps to role (no prefix conversion)', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation role="tab"></test-aria-delegation>',
      );
      expect(el.role).toBe('tab');
      expect(el.getAttribute('data-role')).toBe('tab');
    });
  });

  // ── Inner element receives value ───────────────────────────────────────

  describe('inner element receives delegated value', () => {
    it('inner button gets aria-label from host delegation', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-label="Save form"></test-aria-delegation>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

      // The render() method binds this.ariaLabel to the inner button
      expect(btn.getAttribute('aria-label')).toBe('Save form');
    });

    it('inner button updates when host ariaLabel changes', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-label="Old"></test-aria-delegation>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
      expect(btn.getAttribute('aria-label')).toBe('Old');

      el.ariaLabel = 'New';
      await el.updateComplete;

      expect(btn.getAttribute('aria-label')).toBe('New');
    });

    it('inner button in element with props gets correct values', async () => {
      const el = await fixture<TestAriaDelegationWithProps>(
        '<test-aria-delegation-with-props aria-label="Props test" role="menuitem"></test-aria-delegation-with-props>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

      expect(btn.getAttribute('aria-label')).toBe('Props test');
      expect(btn.getAttribute('role')).toBe('menuitem');
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('empty string is a valid ARIA value', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );
      el.ariaLabel = '';
      await el.updateComplete;

      // Empty string is not null, so data-aria-label should be set
      expect(el.getAttribute('data-aria-label')).toBe('');
      expect(el.hasAttribute('aria-label')).toBe(false);
    });

    it('setting undefined is treated like null', async () => {
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation aria-label="Remove"></test-aria-delegation>',
      );

      // The setter checks for both null and undefined
      (el as unknown as { ariaLabel: string | null | undefined }).ariaLabel = undefined;
      await el.updateComplete;

      expect(el.hasAttribute('data-aria-label')).toBe(false);
    });

    it('data-aria-* attributes are not in observedAttributes (no recursive observation)', () => {
      const ctor = customElements.get('test-aria-delegation');
      const attrs = (ctor as unknown as { observedAttributes: string[] }).observedAttributes;

      expect(attrs).not.toContain('data-aria-label');
      expect(attrs).not.toContain('data-aria-expanded');
      expect(attrs).not.toContain('data-role');
    });

    it('all ARIA_ATTRIBUTES entries are intercepted', async () => {
      // Verify a broad sampling of ARIA attributes across the full list
      const el = await fixture<TestAriaDelegation>(
        '<test-aria-delegation></test-aria-delegation>',
      );

      const sampleAttrs = [
        'aria-atomic',
        'aria-busy',
        'aria-controls',
        'aria-describedby',
        'aria-hidden',
        'aria-invalid',
        'aria-live',
        'aria-modal',
        'aria-orientation',
        'aria-required',
        'aria-selected',
        'aria-sort',
        'aria-valuemax',
        'aria-valuemin',
        'aria-valuenow',
        'aria-valuetext',
      ];

      for (const attr of sampleAttrs) {
        el.setAttribute(attr, 'test-value');
        expect(el.hasAttribute(attr)).toBe(false);
        expect(el.getAttribute(`data-${attr}`)).toBe('test-value');
      }
    });
  });
});
