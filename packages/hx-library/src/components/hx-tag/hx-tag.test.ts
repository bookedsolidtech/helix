import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y, oneEvent } from '../../test-utils.js';
import type { HelixTag } from './hx-tag.js';
import './index.js';

afterEach(cleanup);

describe('hx-tag', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Label</hx-tag>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "tag" CSS part', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]');
      expect(tag).toBeTruthy();
    });

    it('renders as a span with role="button"', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.tagName.toLowerCase()).toBe('span');
      expect(tag.getAttribute('role')).toBe('button');
    });

    it('applies default variant=neutral class (tag--neutral)', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.classList.contains('tag--neutral')).toBe(true);
    });

    it('applies default size=md class (tag--md)', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.classList.contains('tag--md')).toBe(true);
    });
  });

  // ─── Property: variant (4) ───

  describe('Property: variant', () => {
    it('reflects variant attr to host', async () => {
      const el = await fixture<HelixTag>('<hx-tag variant="primary">Label</hx-tag>');
      expect(el.getAttribute('variant')).toBe('primary');
    });

    it('applies primary class', async () => {
      const el = await fixture<HelixTag>('<hx-tag variant="primary">Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.classList.contains('tag--primary')).toBe(true);
    });

    it('applies secondary class', async () => {
      const el = await fixture<HelixTag>('<hx-tag variant="secondary">Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.classList.contains('tag--secondary')).toBe(true);
    });

    it('applies outline class', async () => {
      const el = await fixture<HelixTag>('<hx-tag variant="outline">Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.classList.contains('tag--outline')).toBe(true);
    });
  });

  // ─── Property: size (3) ───

  describe('Property: size', () => {
    it('applies sm class (hx-size="sm")', async () => {
      const el = await fixture<HelixTag>('<hx-tag hx-size="sm">Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.classList.contains('tag--sm')).toBe(true);
    });

    it('applies md class (hx-size="md")', async () => {
      const el = await fixture<HelixTag>('<hx-tag hx-size="md">Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.classList.contains('tag--md')).toBe(true);
    });

    it('applies lg class (hx-size="lg")', async () => {
      const el = await fixture<HelixTag>('<hx-tag hx-size="lg">Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.classList.contains('tag--lg')).toBe(true);
    });
  });

  // ─── Property: removable (4) ───

  describe('Property: removable', () => {
    it('does not render remove button by default', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Label</hx-tag>');
      const removeBtn = shadowQuery(el, '[part="remove-button"]');
      expect(removeBtn).toBeNull();
    });

    it('renders remove button when removable is set', async () => {
      const el = await fixture<HelixTag>('<hx-tag removable>Label</hx-tag>');
      const removeBtn = shadowQuery(el, '[part="remove-button"]');
      expect(removeBtn).toBeTruthy();
    });

    it('remove button has part="remove-button"', async () => {
      const el = await fixture<HelixTag>('<hx-tag removable>Label</hx-tag>');
      const removeBtn = shadowQuery(el, '[part="remove-button"]')!;
      expect(removeBtn.getAttribute('part')).toBe('remove-button');
    });

    it('remove button has aria-label="Remove" and type="button"', async () => {
      const el = await fixture<HelixTag>('<hx-tag removable>Label</hx-tag>');
      const removeBtn = shadowQuery<HTMLButtonElement>(el, '[part="remove-button"]')!;
      expect(removeBtn.getAttribute('aria-label')).toBe('Remove');
      expect(removeBtn.getAttribute('type')).toBe('button');
    });
  });

  // ─── Property: disabled (4) ───

  describe('Property: disabled', () => {
    it('applies tag--disabled class when disabled', async () => {
      const el = await fixture<HelixTag>('<hx-tag disabled>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.classList.contains('tag--disabled')).toBe(true);
    });

    it('sets aria-disabled="true" on tag span when disabled', async () => {
      const el = await fixture<HelixTag>('<hx-tag disabled>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.getAttribute('aria-disabled')).toBe('true');
    });

    it('tabindex is -1 when disabled', async () => {
      const el = await fixture<HelixTag>('<hx-tag disabled>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.getAttribute('tabindex')).toBe('-1');
    });

    it('remove button is disabled when disabled=true', async () => {
      const el = await fixture<HelixTag>('<hx-tag removable disabled>Label</hx-tag>');
      const removeBtn = shadowQuery<HTMLButtonElement>(el, '[part="remove-button"]')!;
      expect(removeBtn.disabled).toBe(true);
    });
  });

  // ─── Property: selected (4) ───

  describe('Property: selected', () => {
    it('applies tag--selected class when selected', async () => {
      const el = await fixture<HelixTag>('<hx-tag selected>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.classList.contains('tag--selected')).toBe(true);
    });

    it('reflects selected attr to host', async () => {
      const el = await fixture<HelixTag>('<hx-tag selected>Label</hx-tag>');
      expect(el.hasAttribute('selected')).toBe(true);
    });

    it('sets aria-pressed="true" when selected', async () => {
      const el = await fixture<HelixTag>('<hx-tag selected>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.getAttribute('aria-pressed')).toBe('true');
    });

    it('sets aria-pressed="false" when not selected', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      expect(tag.getAttribute('aria-pressed')).toBe('false');
    });
  });

  // ─── Events: hx-select (4) ───

  describe('Events: hx-select', () => {
    it('dispatches hx-select on click', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      tag.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      const event = await eventPromise;
      expect(event).toBeInstanceOf(CustomEvent);
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-select detail contains selected=true after first click', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      const eventPromise = oneEvent<CustomEvent<{ selected: boolean }>>(el, 'hx-select');
      tag.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      const event = await eventPromise;
      expect(event.detail.selected).toBe(true);
    });

    it('hx-select detail contains selected=false after second click (toggle)', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;

      // First click — select
      tag.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await el.updateComplete;

      // Second click — deselect
      const eventPromise = oneEvent<CustomEvent<{ selected: boolean }>>(el, 'hx-select');
      tag.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      const event = await eventPromise;
      expect(event.detail.selected).toBe(false);
    });

    it('does not dispatch hx-select when disabled', async () => {
      const el = await fixture<HelixTag>('<hx-tag disabled>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      let fired = false;
      el.addEventListener('hx-select', () => {
        fired = true;
      });
      tag.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Events: hx-remove (3) ───

  describe('Events: hx-remove', () => {
    it('dispatches hx-remove when remove button is clicked', async () => {
      const el = await fixture<HelixTag>('<hx-tag removable>Label</hx-tag>');
      const removeBtn = shadowQuery(el, '[part="remove-button"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-remove');
      removeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      const event = await eventPromise;
      expect(event).toBeInstanceOf(CustomEvent);
    });

    it('hx-remove does not bubble up as hx-select (stopPropagation)', async () => {
      const el = await fixture<HelixTag>('<hx-tag removable>Label</hx-tag>');
      const removeBtn = shadowQuery(el, '[part="remove-button"]')!;
      let selectFired = false;
      el.addEventListener('hx-select', () => {
        selectFired = true;
      });
      removeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await el.updateComplete;
      expect(selectFired).toBe(false);
    });

    it('does not dispatch hx-remove when disabled', async () => {
      const el = await fixture<HelixTag>('<hx-tag removable disabled>Label</hx-tag>');
      const removeBtn = shadowQuery(el, '[part="remove-button"]')!;
      let fired = false;
      el.addEventListener('hx-remove', () => {
        fired = true;
      });
      removeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('default slot renders tag label text', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Patient Status</hx-tag>');
      expect(el.textContent?.trim()).toBe('Patient Status');
    });

    it('prefix slot content makes prefix visible', async () => {
      const el = await fixture<HelixTag>('<hx-tag><span slot="prefix">PFX</span>Label</hx-tag>');
      // Wait for slotchange to fire and update internal state
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const prefix = shadowQuery(el, '[part="prefix"]')!;
      expect(prefix.hasAttribute('hidden')).toBe(false);
    });
  });

  // ─── CSS Parts (3) ───

  describe('CSS Parts', () => {
    it('tag part is accessible', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]');
      expect(tag).toBeTruthy();
      expect(tag?.getAttribute('part')).toBe('tag');
    });

    it('remove-button part is accessible when removable', async () => {
      const el = await fixture<HelixTag>('<hx-tag removable>Label</hx-tag>');
      const removeBtn = shadowQuery(el, '[part="remove-button"]');
      expect(removeBtn).toBeTruthy();
      expect(removeBtn?.getAttribute('part')).toBe('remove-button');
    });

    it('prefix part is accessible', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Label</hx-tag>');
      const prefix = shadowQuery(el, '[part="prefix"]');
      expect(prefix).toBeTruthy();
      expect(prefix?.getAttribute('part')).toBe('prefix');
    });
  });

  // ─── Keyboard Interaction (3) ───

  describe('Keyboard Interaction', () => {
    it('Enter keydown on tag dispatches hx-select', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      tag.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }),
      );
      const event = await eventPromise;
      expect(event).toBeInstanceOf(CustomEvent);
    });

    it('Space keydown on tag dispatches hx-select', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      tag.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));
      const event = await eventPromise;
      expect(event).toBeInstanceOf(CustomEvent);
    });

    it('does not respond to keyboard when disabled', async () => {
      const el = await fixture<HelixTag>('<hx-tag disabled>Label</hx-tag>');
      const tag = shadowQuery(el, '[part="tag"]')!;
      let fired = false;
      el.addEventListener('hx-select', () => {
        fired = true;
      });
      tag.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }),
      );
      await el.updateComplete;
      expect(fired).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) (2) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixTag>('<hx-tag>Patient Status</hx-tag>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in removable state', async () => {
      const el = await fixture<HelixTag>('<hx-tag removable>Patient Status</hx-tag>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
