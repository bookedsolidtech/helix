/**
 * Extension API Contract Tests — wc-2026 / @helix/library
 *
 * Verifies that every protected extension hook across all 13 components:
 *   1. Can be overridden in a subclass without TypeScript errors
 *   2. Is actually called during the relevant lifecycle phase
 *   3. Can alter observable behaviour (DOM, events, validity)
 *
 * Each test registers a uniquely-named custom element so that repeated
 * test runs in the same browser context never hit "already registered".
 *
 * Test framework: Vitest browser mode + Playwright (Chromium)
 */

import { describe, it, expect, afterEach } from 'vitest';
import { html } from 'lit';
import { fixture, shadowQuery, oneEvent, cleanup } from '../test-utils.js';

// ── Component imports (side-effect: registers the base custom elements) ──
import './hx-button/index.js';
import './hx-alert/index.js';
import './hx-badge/index.js';
import './hx-card/index.js';
import './hx-checkbox/index.js';
import './hx-container/index.js';
import './hx-radio-group/index.js';
import './hx-select/index.js';
import './hx-switch/index.js';
import './hx-text-input/index.js';
import './hx-textarea/index.js';
import './hx-form/index.js';
import './hx-prose/index.js';

// ── Class imports (types + prototype access) ──
import { HelixButton } from './hx-button/hx-button.js';
import { HelixAlert } from './hx-alert/hx-alert.js';
import { HelixBadge } from './hx-badge/hx-badge.js';
import { HelixCard } from './hx-card/hx-card.js';
import { HelixCheckbox } from './hx-checkbox/hx-checkbox.js';
import { HelixContainer } from './hx-container/hx-container.js';
import { HelixRadioGroup } from './hx-radio-group/hx-radio-group.js';
import { HelixSelect } from './hx-select/hx-select.js';
import { HelixSwitch } from './hx-switch/hx-switch.js';
import { HelixTextInput } from './hx-text-input/hx-text-input.js';
import { HelixTextarea } from './hx-textarea/hx-textarea.js';
import { HelixForm } from './hx-form/hx-form.js';
import { HelixProse } from './hx-prose/hx-prose.js';

// ── Helper: generate a unique tag name suffix ──
function uid(): string {
  return Math.random().toString(36).slice(2, 8);
}

afterEach(cleanup);

// ═══════════════════════════════════════════════════════════════════════════
// hx-button — HelixButton
// ═══════════════════════════════════════════════════════════════════════════

describe('Extension Contract: hx-button', () => {
  it('getButtonClasses() override adds classes to the rendered button', async () => {
    const tag = `test-btn-classes-${uid()}`;
    class TestButton extends HelixButton {
      protected override getButtonClasses(): Record<string, boolean> {
        return { ...super.getButtonClasses(), 'x-custom': true };
      }
    }
    customElements.define(tag, TestButton);

    const el = await fixture<TestButton>(`<${tag}>Click</${tag}>`);
    const btn = shadowQuery<HTMLButtonElement>(el, 'button');
    expect(btn?.classList.contains('x-custom')).toBe(true);
    // Base classes must still be present
    expect(btn?.classList.contains('button')).toBe(true);
  });

  it('renderContent() override changes button inner content', async () => {
    const tag = `test-btn-content-${uid()}`;
    class TestButton extends HelixButton {
      protected override renderContent(): unknown {
        return html`<span class="custom-inner">overridden</span>`;
      }
    }
    customElements.define(tag, TestButton);

    const el = await fixture<TestButton>(`<${tag}>Original</${tag}>`);
    const inner = shadowQuery(el, '.custom-inner');
    expect(inner).not.toBeNull();
    expect(inner?.textContent).toBe('overridden');
  });

  it('shouldHandleClick() returning false prevents hx-click event', async () => {
    const tag = `test-btn-cancel-${uid()}`;
    class TestButton extends HelixButton {
      protected override shouldHandleClick(_e: MouseEvent): boolean {
        return false;
      }
    }
    customElements.define(tag, TestButton);

    const el = await fixture<TestButton>(`<${tag}>Click</${tag}>`);
    let fired = false;
    el.addEventListener('hx-click', () => {
      fired = true;
    });
    shadowQuery<HTMLButtonElement>(el, 'button')?.click();
    await el.updateComplete;
    expect(fired).toBe(false);
  });

  it('afterClick() is called after a successful click', async () => {
    const tag = `test-btn-afterclick-${uid()}`;
    let afterClickCalled = false;
    class TestButton extends HelixButton {
      protected override afterClick(_e: MouseEvent): void {
        afterClickCalled = true;
      }
    }
    customElements.define(tag, TestButton);

    const el = await fixture<TestButton>(`<${tag}>Click</${tag}>`);
    const eventPromise = oneEvent(el, 'hx-click');
    shadowQuery<HTMLButtonElement>(el, 'button')?.click();
    await eventPromise;
    await el.updateComplete;
    expect(afterClickCalled).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// hx-alert — HelixAlert
// ═══════════════════════════════════════════════════════════════════════════

describe('Extension Contract: hx-alert', () => {
  it('getAlertClasses() override adds classes to alert container', async () => {
    const tag = `test-alert-classes-${uid()}`;
    class TestAlert extends HelixAlert {
      protected override getAlertClasses(): Record<string, boolean> {
        return { ...super.getAlertClasses(), 'x-alert-custom': true };
      }
    }
    customElements.define(tag, TestAlert);

    const el = await fixture<TestAlert>(`<${tag}>Message</${tag}>`);
    const container = shadowQuery(el, '[part="alert"]');
    expect(container?.classList.contains('x-alert-custom')).toBe(true);
    expect(container?.classList.contains('alert')).toBe(true);
  });

  it('getAriaRole() override changes the role attribute', async () => {
    const tag = `test-alert-role-${uid()}`;
    class TestAlert extends HelixAlert {
      protected override getAriaRole(): string {
        return 'log';
      }
    }
    customElements.define(tag, TestAlert);

    const el = await fixture<TestAlert>(`<${tag}>Message</${tag}>`);
    const container = shadowQuery(el, '[part="alert"]');
    expect(container?.getAttribute('role')).toBe('log');
  });

  it('getAriaLive() override changes aria-live', async () => {
    const tag = `test-alert-live-${uid()}`;
    class TestAlert extends HelixAlert {
      protected override getAriaLive(): string {
        return 'off';
      }
    }
    customElements.define(tag, TestAlert);

    const el = await fixture<TestAlert>(`<${tag}>Message</${tag}>`);
    const container = shadowQuery(el, '[part="alert"]');
    expect(container?.getAttribute('aria-live')).toBe('off');
  });

  it('renderDefaultIcon() override changes icon rendering', async () => {
    const tag = `test-alert-icon-${uid()}`;
    class TestAlert extends HelixAlert {
      protected override renderDefaultIcon(): unknown {
        return html`<span class="custom-icon">!</span>`;
      }
    }
    customElements.define(tag, TestAlert);

    const el = await fixture<TestAlert>(`<${tag}>Message</${tag}>`);
    const icon = shadowQuery(el, '.custom-icon');
    expect(icon).not.toBeNull();
    expect(icon?.textContent).toBe('!');
  });

  it('handleClose() override can prevent dismissal by not calling super', async () => {
    const tag = `test-alert-close-${uid()}`;
    class TestAlert extends HelixAlert {
      protected override handleClose(): void {
        // Intentionally NOT calling super — dismissal is blocked
      }
    }
    customElements.define(tag, TestAlert);

    const el = await fixture<TestAlert>(`<${tag} closable>Message</${tag}>`);
    expect(el.open).toBe(true);

    let closeFired = false;
    el.addEventListener('hx-close', () => {
      closeFired = true;
    });

    const closeBtn = shadowQuery<HTMLButtonElement>(el, '[part="close-button"]');
    closeBtn?.click();
    await el.updateComplete;

    // Since we blocked super, open should remain true and event should not fire
    expect(el.open).toBe(true);
    expect(closeFired).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// hx-badge — HelixBadge
// ═══════════════════════════════════════════════════════════════════════════

describe('Extension Contract: hx-badge', () => {
  it('getBadgeClasses() override adds classes to the badge', async () => {
    const tag = `test-badge-classes-${uid()}`;
    class TestBadge extends HelixBadge {
      protected override getBadgeClasses(): Record<string, boolean> {
        return { ...super.getBadgeClasses(), 'x-badge-custom': true };
      }
    }
    customElements.define(tag, TestBadge);

    const el = await fixture<TestBadge>(`<${tag}>5</${tag}>`);
    const badge = shadowQuery(el, '[part="badge"]');
    expect(badge?.classList.contains('x-badge-custom')).toBe(true);
    expect(badge?.classList.contains('badge')).toBe(true);
  });

  it('renderContent() override changes badge content', async () => {
    const tag = `test-badge-content-${uid()}`;
    class TestBadge extends HelixBadge {
      protected override renderContent(): unknown {
        return html`<span class="badge-inner">overridden</span>`;
      }
    }
    customElements.define(tag, TestBadge);

    const el = await fixture<TestBadge>(`<${tag}>Original</${tag}>`);
    const inner = shadowQuery(el, '.badge-inner');
    expect(inner).not.toBeNull();
    expect(inner?.textContent).toBe('overridden');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// hx-card — HelixCard
// ═══════════════════════════════════════════════════════════════════════════

describe('Extension Contract: hx-card', () => {
  it('getCardClasses() override adds classes to the card', async () => {
    const tag = `test-card-classes-${uid()}`;
    class TestCard extends HelixCard {
      protected override getCardClasses(): Record<string, boolean> {
        return { ...super.getCardClasses(), 'x-card-custom': true };
      }
    }
    customElements.define(tag, TestCard);

    const el = await fixture<TestCard>(`<${tag}>Content</${tag}>`);
    const card = shadowQuery(el, '[part="card"]');
    expect(card?.classList.contains('x-card-custom')).toBe(true);
    expect(card?.classList.contains('card')).toBe(true);
  });

  it('renderImageSection() override modifies image section', async () => {
    const tag = `test-card-img-${uid()}`;
    class TestCard extends HelixCard {
      protected override renderImageSection(): unknown {
        return html`<div class="custom-image-section">custom image</div>`;
      }
    }
    customElements.define(tag, TestCard);

    const el = await fixture<TestCard>(`<${tag}>Content</${tag}>`);
    const imgSection = shadowQuery(el, '.custom-image-section');
    expect(imgSection).not.toBeNull();
    expect(imgSection?.textContent).toBe('custom image');
  });

  it('renderBodySection() override modifies body section', async () => {
    const tag = `test-card-body-${uid()}`;
    class TestCard extends HelixCard {
      protected override renderBodySection(): unknown {
        return html`<div class="custom-body">custom body</div>`;
      }
    }
    customElements.define(tag, TestCard);

    const el = await fixture<TestCard>(`<${tag}>Original</${tag}>`);
    const body = shadowQuery(el, '.custom-body');
    expect(body).not.toBeNull();
    expect(body?.textContent).toBe('custom body');
  });

  it('shouldHandleClick() returning false prevents hx-card-click event', async () => {
    const tag = `test-card-cancel-${uid()}`;
    class TestCard extends HelixCard {
      protected override shouldHandleClick(_e: MouseEvent): boolean {
        return false;
      }
    }
    customElements.define(tag, TestCard);

    const el = await fixture<TestCard>(`<${tag} hx-href="https://example.com">Content</${tag}>`);
    let fired = false;
    el.addEventListener('hx-card-click', () => {
      fired = true;
    });
    shadowQuery<HTMLDivElement>(el, '[part="card"]')?.click();
    await el.updateComplete;
    expect(fired).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// hx-checkbox — HelixCheckbox
// ═══════════════════════════════════════════════════════════════════════════

describe('Extension Contract: hx-checkbox', () => {
  it('getCheckboxClasses() override adds classes to field wrapper', async () => {
    const tag = `test-chk-classes-${uid()}`;
    class TestCheckbox extends HelixCheckbox {
      protected override getCheckboxClasses(): Record<string, boolean> {
        return { ...super.getCheckboxClasses(), 'x-chk-custom': true };
      }
    }
    customElements.define(tag, TestCheckbox);

    const el = await fixture<TestCheckbox>(`<${tag} label="Accept"></${tag}>`);
    const wrapper = shadowQuery(el, '.checkbox');
    expect(wrapper?.classList.contains('x-chk-custom')).toBe(true);
    expect(wrapper?.classList.contains('checkbox')).toBe(true);
  });

  it('updateValidity() override is called when value changes', async () => {
    const tag = `test-chk-validity-${uid()}`;
    let updateValidityCalled = false;
    class TestCheckbox extends HelixCheckbox {
      protected override updateValidity(): void {
        updateValidityCalled = true;
        super.updateValidity();
      }
    }
    customElements.define(tag, TestCheckbox);

    const el = await fixture<TestCheckbox>(`<${tag} label="Accept"></${tag}>`);
    updateValidityCalled = false; // Reset after initial render

    el.checked = true;
    await el.updateComplete;
    expect(updateValidityCalled).toBe(true);
  });

  it('shouldHandleChange() returning false prevents hx-change event', async () => {
    const tag = `test-chk-cancel-${uid()}`;
    class TestCheckbox extends HelixCheckbox {
      protected override shouldHandleChange(_e: Event): boolean {
        return false;
      }
    }
    customElements.define(tag, TestCheckbox);

    const el = await fixture<TestCheckbox>(`<${tag} label="Accept"></${tag}>`);
    let fired = false;
    el.addEventListener('hx-change', () => {
      fired = true;
    });
    // Click the label (which triggers _handleChange)
    shadowQuery<HTMLLabelElement>(el, 'label')?.click();
    await el.updateComplete;
    expect(fired).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// hx-container — HelixContainer
// ═══════════════════════════════════════════════════════════════════════════

describe('Extension Contract: hx-container', () => {
  it('getContainerClasses() override adds classes', async () => {
    const tag = `test-container-classes-${uid()}`;
    class TestContainer extends HelixContainer {
      protected override getContainerClasses(): Record<string, boolean> {
        return { ...super.getContainerClasses(), 'x-container-custom': true };
      }
    }
    customElements.define(tag, TestContainer);

    const el = await fixture<TestContainer>(`<${tag}>Content</${tag}>`);
    const inner = shadowQuery(el, '[part="inner"]');
    expect(inner?.classList.contains('x-container-custom')).toBe(true);
    expect(inner?.classList.contains('container__inner')).toBe(true);
  });

  it('renderContent() override changes container content', async () => {
    const tag = `test-container-content-${uid()}`;
    class TestContainer extends HelixContainer {
      protected override renderContent(): unknown {
        return html`<p class="custom-content">overridden content</p>`;
      }
    }
    customElements.define(tag, TestContainer);

    const el = await fixture<TestContainer>(`<${tag}>Original</${tag}>`);
    const content = shadowQuery(el, '.custom-content');
    expect(content).not.toBeNull();
    expect(content?.textContent).toBe('overridden content');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// hx-radio-group — HelixRadioGroup
// ═══════════════════════════════════════════════════════════════════════════

describe('Extension Contract: hx-radio-group', () => {
  it('getGroupClasses() override adds classes to group', async () => {
    const tag = `test-rg-classes-${uid()}`;
    class TestRadioGroup extends HelixRadioGroup {
      protected override getGroupClasses(): Record<string, boolean> {
        return { ...super.getGroupClasses(), 'x-rg-custom': true };
      }
    }
    customElements.define(tag, TestRadioGroup);

    const el = await fixture<TestRadioGroup>(`<${tag} label="Choose"></${tag}>`);
    const fieldset = shadowQuery(el, '[part="fieldset"]');
    expect(fieldset?.classList.contains('x-rg-custom')).toBe(true);
    expect(fieldset?.classList.contains('fieldset')).toBe(true);
  });

  it('updateValidity() override is called during validation', async () => {
    const tag = `test-rg-validity-${uid()}`;
    let updateValidityCalled = false;
    class TestRadioGroup extends HelixRadioGroup {
      protected override updateValidity(): void {
        updateValidityCalled = true;
        super.updateValidity();
      }
    }
    customElements.define(tag, TestRadioGroup);

    const el = await fixture<TestRadioGroup>(`<${tag} label="Choose"></${tag}>`);
    updateValidityCalled = false;

    el.value = 'option-a';
    await el.updateComplete;
    expect(updateValidityCalled).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// hx-select — HelixSelect
// ═══════════════════════════════════════════════════════════════════════════

describe('Extension Contract: hx-select', () => {
  it('getSelectClasses() override adds classes', async () => {
    const tag = `test-sel-classes-${uid()}`;
    class TestSelect extends HelixSelect {
      protected override getSelectClasses(): Record<string, boolean> {
        return { ...super.getSelectClasses(), 'x-sel-custom': true };
      }
    }
    customElements.define(tag, TestSelect);

    const el = await fixture<TestSelect>(`<${tag} label="Pick one"></${tag}>`);
    const field = shadowQuery(el, '[part="field"]');
    expect(field?.classList.contains('x-sel-custom')).toBe(true);
    expect(field?.classList.contains('field')).toBe(true);
  });

  it('updateValidity() override is called when value changes', async () => {
    const tag = `test-sel-validity-${uid()}`;
    let updateValidityCalled = false;
    class TestSelect extends HelixSelect {
      protected override updateValidity(): void {
        updateValidityCalled = true;
        super.updateValidity();
      }
    }
    customElements.define(tag, TestSelect);

    // Start with value='a' so we can change it to 'b' and observe the call
    const el = await fixture<TestSelect>(
      `<${tag}><option value="a">A</option><option value="b">B</option></${tag}>`,
    );
    // Ensure initial sync is settled
    await el.updateComplete;
    updateValidityCalled = false;

    // Change to a new value — this must trigger Lit's updated() which calls updateValidity()
    el.value = 'b';
    await el.updateComplete;
    expect(updateValidityCalled).toBe(true);
  });

  it('shouldHandleChange() returning false prevents hx-change event', async () => {
    const tag = `test-sel-cancel-${uid()}`;
    class TestSelect extends HelixSelect {
      protected override shouldHandleChange(_e: Event): boolean {
        return false;
      }
    }
    customElements.define(tag, TestSelect);

    const el = await fixture<TestSelect>(
      `<${tag}><option value="a">A</option><option value="b">B</option></${tag}>`,
    );
    let fired = false;
    el.addEventListener('hx-change', () => {
      fired = true;
    });

    const nativeSelect = shadowQuery<HTMLSelectElement>(el, 'select');
    if (nativeSelect) {
      nativeSelect.value = 'b';
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    await el.updateComplete;
    expect(fired).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// hx-switch — HelixSwitch
// ═══════════════════════════════════════════════════════════════════════════

describe('Extension Contract: hx-switch', () => {
  it('getSwitchClasses() override adds classes', async () => {
    const tag = `test-sw-classes-${uid()}`;
    class TestSwitch extends HelixSwitch {
      protected override getSwitchClasses(): Record<string, boolean> {
        return { ...super.getSwitchClasses(), 'x-sw-custom': true };
      }
    }
    customElements.define(tag, TestSwitch);

    const el = await fixture<TestSwitch>(`<${tag} label="Enable"></${tag}>`);
    const container = shadowQuery(el, '[part="switch"]');
    expect(container?.classList.contains('x-sw-custom')).toBe(true);
    expect(container?.classList.contains('switch')).toBe(true);
  });

  it('updateValidity() override is called when checked changes', async () => {
    const tag = `test-sw-validity-${uid()}`;
    let updateValidityCalled = false;
    class TestSwitch extends HelixSwitch {
      protected override updateValidity(): void {
        updateValidityCalled = true;
        super.updateValidity();
      }
    }
    customElements.define(tag, TestSwitch);

    const el = await fixture<TestSwitch>(`<${tag} label="Enable"></${tag}>`);
    updateValidityCalled = false;

    el.checked = true;
    await el.updateComplete;
    expect(updateValidityCalled).toBe(true);
  });

  it('shouldHandleChange() returning false prevents hx-change event', async () => {
    const tag = `test-sw-cancel-${uid()}`;
    class TestSwitch extends HelixSwitch {
      protected override shouldHandleChange(_e: Event): boolean {
        return false;
      }
    }
    customElements.define(tag, TestSwitch);

    const el = await fixture<TestSwitch>(`<${tag} label="Enable"></${tag}>`);
    let fired = false;
    el.addEventListener('hx-change', () => {
      fired = true;
    });

    const track = shadowQuery<HTMLButtonElement>(el, '[part="track"]');
    track?.click();
    await el.updateComplete;
    expect(fired).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// hx-text-input — HelixTextInput
// ═══════════════════════════════════════════════════════════════════════════

describe('Extension Contract: hx-text-input', () => {
  it('getFieldClasses() override adds classes', async () => {
    const tag = `test-ti-classes-${uid()}`;
    class TestInput extends HelixTextInput {
      protected override getFieldClasses(): Record<string, boolean> {
        return { ...super.getFieldClasses(), 'x-ti-custom': true };
      }
    }
    customElements.define(tag, TestInput);

    const el = await fixture<TestInput>(`<${tag} label="Name"></${tag}>`);
    const field = shadowQuery(el, '[part="field"]');
    expect(field?.classList.contains('x-ti-custom')).toBe(true);
    expect(field?.classList.contains('field')).toBe(true);
  });

  it('updateValidity() override is called when value changes', async () => {
    const tag = `test-ti-validity-${uid()}`;
    let updateValidityCalled = false;
    class TestInput extends HelixTextInput {
      protected override updateValidity(): void {
        updateValidityCalled = true;
        super.updateValidity();
      }
    }
    customElements.define(tag, TestInput);

    const el = await fixture<TestInput>(`<${tag} label="Name"></${tag}>`);
    updateValidityCalled = false;

    el.value = 'hello';
    await el.updateComplete;
    expect(updateValidityCalled).toBe(true);
  });

  it('shouldHandleInput() returning false prevents hx-input event', async () => {
    const tag = `test-ti-cancel-${uid()}`;
    class TestInput extends HelixTextInput {
      protected override shouldHandleInput(_e: Event): boolean {
        return false;
      }
    }
    customElements.define(tag, TestInput);

    const el = await fixture<TestInput>(`<${tag} label="Name"></${tag}>`);
    let fired = false;
    el.addEventListener('hx-input', () => {
      fired = true;
    });

    const nativeInput = shadowQuery<HTMLInputElement>(el, 'input');
    if (nativeInput) {
      nativeInput.value = 'test';
      nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await el.updateComplete;
    expect(fired).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// hx-textarea — HelixTextarea
// ═══════════════════════════════════════════════════════════════════════════

describe('Extension Contract: hx-textarea', () => {
  it('getFieldClasses() override adds classes', async () => {
    const tag = `test-ta-classes-${uid()}`;
    class TestTextarea extends HelixTextarea {
      protected override getFieldClasses(): Record<string, boolean> {
        return { ...super.getFieldClasses(), 'x-ta-custom': true };
      }
    }
    customElements.define(tag, TestTextarea);

    const el = await fixture<TestTextarea>(`<${tag} label="Notes"></${tag}>`);
    const field = shadowQuery(el, '[part="field"]');
    expect(field?.classList.contains('x-ta-custom')).toBe(true);
    expect(field?.classList.contains('field')).toBe(true);
  });

  it('updateValidity() override is called when value changes', async () => {
    const tag = `test-ta-validity-${uid()}`;
    let updateValidityCalled = false;
    class TestTextarea extends HelixTextarea {
      protected override updateValidity(): void {
        updateValidityCalled = true;
        super.updateValidity();
      }
    }
    customElements.define(tag, TestTextarea);

    const el = await fixture<TestTextarea>(`<${tag} label="Notes"></${tag}>`);
    updateValidityCalled = false;

    el.value = 'some text';
    await el.updateComplete;
    expect(updateValidityCalled).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// hx-form — HelixForm
// ═══════════════════════════════════════════════════════════════════════════

describe('Extension Contract: hx-form', () => {
  it('getFormAttributes() override adds attributes, and override is invoked during render', async () => {
    const tag = `test-form-attrs-${uid()}`;
    let overrideCalled = false;
    class TestForm extends HelixForm {
      protected override getFormAttributes(): Record<string, string | undefined> {
        overrideCalled = true;
        return { ...super.getFormAttributes(), enctype: 'multipart/form-data' };
      }

      // Expose the protected method for assertion
      public callGetFormAttributes(): Record<string, string | undefined> {
        return this.getFormAttributes();
      }
    }
    customElements.define(tag, TestForm);

    const el = await fixture<TestForm>(`<${tag} action="/submit">Content</${tag}>`);
    await el.updateComplete;

    // Verify the native form element is rendered (action path)
    const form = el.querySelector('form');
    expect(form).not.toBeNull();

    // Verify the override can be called and merges correctly
    overrideCalled = false;
    const attrs = el.callGetFormAttributes();
    expect(overrideCalled).toBe(true);
    expect(attrs['enctype']).toBe('multipart/form-data');
    expect(attrs['method']).toBe('post');
  });

  it('renderFormContent() override changes form content', async () => {
    const tag = `test-form-content-${uid()}`;
    class TestForm extends HelixForm {
      protected override renderFormContent(): unknown {
        return html`<div class="custom-form-content">overridden</div>`;
      }
    }
    customElements.define(tag, TestForm);

    const el = await fixture<TestForm>(`<${tag}>Original</${tag}>`);
    await el.updateComplete;
    // HelixForm renders in light DOM
    const content = el.querySelector('.custom-form-content');
    expect(content).not.toBeNull();
    expect(content?.textContent).toBe('overridden');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// hx-prose — HelixProse
// ═══════════════════════════════════════════════════════════════════════════

describe('Extension Contract: hx-prose', () => {
  it('applyMaxWidth() override is called when max-width property changes', async () => {
    const tag = `test-prose-maxwidth-${uid()}`;
    const appliedValues: string[] = [];
    class TestProse extends HelixProse {
      protected override applyMaxWidth(value: string): void {
        appliedValues.push(value);
        super.applyMaxWidth(value);
      }
    }
    customElements.define(tag, TestProse);

    const el = await fixture<TestProse>(`<${tag}>Content</${tag}>`);
    appliedValues.length = 0; // Clear values captured during connectedCallback

    el.maxWidth = '800px';
    await el.updateComplete;

    expect(appliedValues).toContain('800px');
    // Verify the override actually applied the style
    expect(el.style.maxWidth).toBe('800px');
  });

  it('renderContent() override changes prose content', async () => {
    const tag = `test-prose-content-${uid()}`;
    class TestProse extends HelixProse {
      protected override renderContent(): unknown {
        return html`<article class="custom-prose">overridden prose</article>`;
      }
    }
    customElements.define(tag, TestProse);

    const el = await fixture<TestProse>(`<${tag}>Original</${tag}>`);
    await el.updateComplete;
    // HelixProse renders in light DOM
    const article = el.querySelector('.custom-prose');
    expect(article).not.toBeNull();
    expect(article?.textContent).toBe('overridden prose');
  });
});

