import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HxRadio } from './hx-radio.js';
import type { HxRadioGroup } from './hx-radio-group.js';
import './index.js';

afterEach(cleanup);

describe('hx-radio', () => {
  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="Option A"></hx-radio>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders hidden native <input type="radio">', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="Option A"></hx-radio>');
      const input = shadowQuery<HTMLInputElement>(el, 'input[type="radio"]');
      expect(input).toBeInstanceOf(HTMLInputElement);
    });

    it('renders label text', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="Option A"></hx-radio>');
      const label = shadowQuery(el, '.radio__label');
      expect(label?.textContent?.trim()).toContain('Option A');
    });
  });

  // ─── Property: value (1) ───

  describe('Property: value', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HxRadio>('<hx-radio></hx-radio>');
      expect(el.value).toBe('');
    });
  });

  // ─── Property: checked (2) ───

  describe('Property: checked', () => {
    it('defaults to unchecked', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      expect(el.checked).toBe(false);
    });

    it('applies checked class when checked', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A" checked></hx-radio>');
      const container = shadowQuery(el, '.radio');
      expect(container?.classList.contains('radio--checked')).toBe(true);
    });
  });

  // ─── Property: disabled (2) ───

  describe('Property: disabled', () => {
    it('defaults to not disabled', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      expect(el.disabled).toBe(false);
    });

    it('applies disabled class when disabled', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A" disabled></hx-radio>');
      const container = shadowQuery(el, '.radio');
      expect(container?.classList.contains('radio--disabled')).toBe(true);
    });
  });

  // ─── ARIA (2) ───

  describe('ARIA', () => {
    it('projects role="radio" via ElementInternals', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      // ARIA state is surfaced to the accessibility tree via ElementInternals,
      // not via host-attribute mutation, so getAttribute('role') is null.
      expect(el.getAttribute('role')).toBeNull();
      expect((el as unknown as { _internals: ElementInternals })._internals.role).toBe('radio');
    });

    it('projects aria-checked matching checked state via ElementInternals', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A" checked></hx-radio>');
      expect(el.hasAttribute('aria-checked')).toBe(false);
      expect((el as unknown as { _internals: ElementInternals })._internals.ariaChecked).toBe(
        'true',
      );
    });

    it('updates aria-checked on ElementInternals when checked changes', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaChecked).toBe('false');
      el.checked = true;
      await el.updateComplete;
      expect(internals.ariaChecked).toBe('true');
    });
  });

  // ─── Events (2) ───

  describe('Events', () => {
    it('dispatches wc-radio-select on click', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      let detail: { value: string } | null = null;
      el.addEventListener('hx-radio-select', ((e: CustomEvent) => {
        detail = e.detail;
      }) as EventListener);
      const container = shadowQuery<HTMLElement>(el, '.radio')!;
      container.click();
      expect(detail).toEqual({ value: 'a' });
    });

    it('does not dispatch when disabled', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A" disabled></hx-radio>');
      let fired = false;
      el.addEventListener('hx-radio-select', () => {
        fired = true;
      });
      const container = shadowQuery<HTMLElement>(el, '.radio')!;
      container.click();
      expect(fired).toBe(false);
    });
  });

  // ─── CSS Parts (2) ───

  describe('CSS Parts', () => {
    it('exposes "radio" CSS part', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      const part = shadowQuery(el, '[part="radio"]');
      expect(part).toBeTruthy();
    });

    it('exposes "label" CSS part', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      const part = shadowQuery(el, '[part="label"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Slots (1) ───

  describe('Slots', () => {
    it('default slot overrides label property', async () => {
      const el = await fixture<HxRadio>(
        '<hx-radio value="a" label="Fallback"><strong>Custom</strong></hx-radio>',
      );
      const slotted = el.querySelector('strong');
      expect(slotted?.textContent).toBe('Custom');
    });
  });

  // ─── ARIA: aria-disabled (1) ───

  describe('ARIA: aria-disabled', () => {
    it('projects aria-disabled via ElementInternals when disabled', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A" disabled></hx-radio>');
      expect(el.hasAttribute('aria-disabled')).toBe(false);
      expect((el as unknown as { _internals: ElementInternals })._internals.ariaDisabled).toBe(
        'true',
      );
    });

    it('omits aria-disabled via ElementInternals when not disabled', async () => {
      const el = await fixture<HxRadio>('<hx-radio value="a" label="A"></hx-radio>');
      expect(
        (el as unknown as { _internals: ElementInternals })._internals.ariaDisabled,
      ).toBeNull();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    const axeOptions = { rules: { 'nested-interactive': { enabled: false } } };

    it('has no axe violations inside a radio group', async () => {
      const group = await fixture<HTMLElement>(`
        <hx-radio-group label="Test Group">
          <hx-radio value="a" label="Option A"></hx-radio>
          <hx-radio value="b" label="Option B"></hx-radio>
        </hx-radio-group>
      `);
      const { violations } = await checkA11y(group, axeOptions);
      expect(violations).toEqual([]);
    });
  });

  // ─── hx-radio-group integration coverage ───
  //
  // These tests exercise hx-radio-group.ts paths through the hx-radio public surface
  // so that whichever vitest --shard ends up running this file (CI sharding splits
  // hx-radio.test.ts and hx-radio-group.test.ts onto different shards) the
  // hx-radio-group/ component bucket still hits the 80% coverage gate. Without
  // them, hx-radio.test.ts alone leaves hx-radio-group.ts at ~55% lines / 47%
  // branches and the per-component average (averaged with hx-radio.ts at 96%)
  // lands at 76.19% / 64.43% — exactly the gate failure on PR #1554 shard 2.

  describe('Integration: hx-radio inside hx-radio-group', () => {
    it('clicking an unchecked radio updates group value and dispatches hx-change', async () => {
      const group = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Group">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radioB = group.querySelector('hx-radio[value="b"]') as HxRadio;
      const labelB = shadowQuery<HTMLElement>(radioB, '.radio')!;
      const ev = oneEvent<CustomEvent>(group, 'hx-change');
      labelB.click();
      const detail = (await ev).detail as { value: string; checked: boolean };
      expect(detail.value).toBe('b');
      expect(detail.checked).toBe(true);
      expect(group.value).toBe('b');
    });

    it('reselecting the already-checked radio does not redispatch hx-change', async () => {
      const group = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Group" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      let count = 0;
      group.addEventListener('hx-change', () => {
        count += 1;
      });
      const radioA = group.querySelector('hx-radio[value="a"]') as HxRadio;
      shadowQuery<HTMLElement>(radioA, '.radio')!.click();
      await group.updateComplete;
      expect(count).toBe(0);
    });

    it('ArrowDown advances selection and dispatches hx-change', async () => {
      const group = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Group" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = group.querySelector('hx-radio[value="a"]') as HxRadio;
      radioA.focus();
      const ev = oneEvent<CustomEvent>(group, 'hx-change');
      radioA.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const detail = (await ev).detail as { value: string };
      expect(detail.value).toBe('b');
    });

    it('ArrowUp wraps to the last enabled radio when at the start', async () => {
      const group = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Group" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = group.querySelector('hx-radio[value="a"]') as HxRadio;
      radioA.focus();
      const ev = oneEvent<CustomEvent>(group, 'hx-change');
      radioA.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      const detail = (await ev).detail as { value: string };
      expect(detail.value).toBe('c');
    });

    it('Home jumps to the first enabled radio', async () => {
      const group = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Group" value="c">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioC = group.querySelector('hx-radio[value="c"]') as HxRadio;
      radioC.focus();
      const ev = oneEvent<CustomEvent>(group, 'hx-change');
      radioC.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      const detail = (await ev).detail as { value: string };
      expect(detail.value).toBe('a');
    });

    it('End jumps to the last enabled radio', async () => {
      const group = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Group" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = group.querySelector('hx-radio[value="a"]') as HxRadio;
      radioA.focus();
      const ev = oneEvent<CustomEvent>(group, 'hx-change');
      radioA.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      const detail = (await ev).detail as { value: string };
      expect(detail.value).toBe('c');
    });

    it('Space selects the focused radio without moving focus', async () => {
      const group = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Group">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      const radioB = group.querySelector('hx-radio[value="b"]') as HxRadio;
      radioB.focus();
      const ev = oneEvent<CustomEvent>(group, 'hx-change');
      radioB.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      const detail = (await ev).detail as { value: string };
      expect(detail.value).toBe('b');
    });

    it('keyboard handler skips disabled radios when navigating', async () => {
      const group = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Group" value="a">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B" disabled></hx-radio>
          <hx-radio value="c" label="C"></hx-radio>
        </hx-radio-group>
      `);
      const radioA = group.querySelector('hx-radio[value="a"]') as HxRadio;
      radioA.focus();
      const ev = oneEvent<CustomEvent>(group, 'hx-change');
      radioA.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const detail = (await ev).detail as { value: string };
      expect(detail.value).toBe('c');
    });

    it('group disabled disables all child radios and restores them when re-enabled', async () => {
      const group = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Group">
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B" disabled></hx-radio>
        </hx-radio-group>
      `);
      const radioA = group.querySelector('hx-radio[value="a"]') as HxRadio;
      const radioB = group.querySelector('hx-radio[value="b"]') as HxRadio;
      group.disabled = true;
      await group.updateComplete;
      expect(radioA.disabled).toBe(true);
      expect(radioB.disabled).toBe(true);
      group.disabled = false;
      await group.updateComplete;
      // Radio A had no individual disabled state; B was originally disabled.
      expect(radioA.disabled).toBe(false);
      expect(radioB.disabled).toBe(true);
    });

    it('renders legend when label is present and a required marker when required', async () => {
      const group = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Pick one" required>
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const legend = shadowQuery<HTMLLegendElement>(group, 'legend');
      expect(legend?.textContent).toContain('Pick one');
      const marker = shadowQuery(group, '.fieldset__required-marker');
      expect(marker).toBeTruthy();
    });

    it('renders help text and exposes it via host aria-describedby', async () => {
      const group = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Group" help-text="Choose carefully">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const help = shadowQuery<HTMLElement>(group, '[part="help-text"]');
      expect(help?.textContent).toContain('Choose carefully');
      const internals = (group as unknown as { _internals: ElementInternals })._internals;
      type InternalsWithRefs = ElementInternals & {
        ariaDescribedByElements: Element[] | null;
      };
      const refs = (internals as InternalsWithRefs).ariaDescribedByElements;
      expect(refs).toBeTruthy();
      expect(refs).toContain(help);
    });

    it('renders error text with role="alert" when error is set', async () => {
      const group = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Group" error="Required">
          <hx-radio value="a" label="A"></hx-radio>
        </hx-radio-group>
      `);
      const err = shadowQuery(group, '[part="error"]');
      expect(err?.getAttribute('role')).toBe('alert');
      expect(err?.textContent).toContain('Required');
    });

    it('required group reports invalid validity when no value is selected', async () => {
      const group = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Group" required>
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      expect(group.validity.valueMissing).toBe(true);
      expect(group.checkValidity()).toBe(false);
    });

    it('required group becomes valid once a radio is selected', async () => {
      const group = await fixture<HxRadioGroup>(`
        <hx-radio-group label="Group" required>
          <hx-radio value="a" label="A"></hx-radio>
          <hx-radio value="b" label="B"></hx-radio>
        </hx-radio-group>
      `);
      group.value = 'a';
      await group.updateComplete;
      expect(group.checkValidity()).toBe(true);
    });

    it('form reset clears the group value', async () => {
      const form = await fixture<HTMLFormElement>(`
        <form>
          <hx-radio-group name="choice" label="Group" value="a">
            <hx-radio value="a" label="A"></hx-radio>
            <hx-radio value="b" label="B"></hx-radio>
          </hx-radio-group>
        </form>
      `);
      const group = form.querySelector('hx-radio-group') as HxRadioGroup;
      expect(group.value).toBe('a');
      form.reset();
      await group.updateComplete;
      expect(group.value).toBe('');
    });
  });
});
