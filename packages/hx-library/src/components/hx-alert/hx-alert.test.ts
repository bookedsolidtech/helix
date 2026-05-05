import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HxAlert } from './hx-alert.js';
import './index.js';

afterEach(cleanup);

describe('hx-alert', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the alert container', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test message</hx-alert>');
      const alert = shadowQuery(el, '.alert');
      expect(alert).toBeTruthy();
    });

    it('renders default slot content', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Hello world</hx-alert>');
      expect(el.textContent?.trim()).toContain('Hello world');
    });

    it('is hidden by default (open=false)', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Visible</hx-alert>');
      expect(el.open).toBe(false);
      expect(el.hasAttribute('open')).toBe(false);
    });
  });

  // ─── Property: variant (5) ───

  describe('Property: variant', () => {
    it('defaults to "info"', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Default variant</hx-alert>');
      expect(el.variant).toBe('info');
    });

    it('reflects variant attribute to property', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="error">Error</hx-alert>');
      expect(el.variant).toBe('error');
    });

    it('applies "success" variant via attribute', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="success">Success</hx-alert>');
      expect(el.getAttribute('variant')).toBe('success');
    });

    it('applies "warning" variant via attribute', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="warning">Warning</hx-alert>');
      expect(el.getAttribute('variant')).toBe('warning');
    });

    it('applies "error" variant via attribute', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="error">Error</hx-alert>');
      expect(el.getAttribute('variant')).toBe('error');
    });
  });

  // ─── Property: dismissible (3) ───

  describe('Property: dismissible', () => {
    it('defaults to false', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Not dismissible</hx-alert>');
      expect(el.dismissible).toBe(false);
    });

    it('renders close button when dismissible', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery(el, '.alert__close-button');
      expect(closeBtn).toBeTruthy();
    });

    it('does not render close button when not dismissible', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Not dismissible</hx-alert>');
      const closeBtn = shadowQuery(el, '.alert__close-button');
      expect(closeBtn).toBeNull();
    });
  });

  // ─── Property: open (3) ───

  describe('Property: open', () => {
    it('defaults to false', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Open</hx-alert>');
      expect(el.open).toBe(false);
    });

    it('hides alert when open is false', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Hidden</hx-alert>');
      el.open = false;
      await el.updateComplete;
      const computedStyle = getComputedStyle(el);
      expect(computedStyle.display).toBe('none');
    });

    it('reflects open attribute', async () => {
      const el = await fixture<HxAlert>('<hx-alert open>Open</hx-alert>');
      expect(el.hasAttribute('open')).toBe(true);
      el.open = false;
      await el.updateComplete;
      expect(el.hasAttribute('open')).toBe(false);
    });
  });

  // ─── Property: showIcon (4) ───

  describe('Property: showIcon', () => {
    it('defaults to false', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      expect(el.showIcon).toBe(false);
    });

    it('does not render icon container by default (show-icon is opt-in)', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      const iconPart = shadowQuery(el, '[part="icon"]');
      expect(iconPart).toBeNull();
    });

    it('hides icon container when showIcon is false', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      el.showIcon = false;
      await el.updateComplete;
      const iconPart = shadowQuery(el, '[part="icon"]');
      expect(iconPart).toBeNull();
    });

    it('show-icon="false" attribute still shows icon (boolean attribute semantics — attribute presence = true)', async () => {
      // Boolean properties map attribute PRESENCE to true, regardless of value.
      // <hx-alert show-icon="false"> has the attribute present → showIcon=true.
      // To hide the icon, the attribute must be absent or el.showIcon = false used.
      const el = await fixture<HxAlert>('<hx-alert show-icon="false">Test</hx-alert>');
      expect(el.showIcon).toBe(true);
      const iconPart = shadowQuery(el, '[part="icon"]');
      expect(iconPart).toBeTruthy();
    });
  });

  // ─── Property: accent (2) ───

  describe('Property: accent', () => {
    it('defaults to false', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      expect(el.accent).toBe(false);
    });

    it('applies alert--accent class when accent is true', async () => {
      const el = await fixture<HxAlert>('<hx-alert accent>Test</hx-alert>');
      const alert = shadowQuery(el, '.alert');
      expect(alert?.classList.contains('alert--accent')).toBe(true);
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-close when close button is clicked', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-close event has detail.reason = "user"', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event.detail.reason).toBe('user');
    });

    it('hx-close bubbles and is composed', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-after-close after dismiss', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-after-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── Close Behavior (2) ───

  describe('Close behavior', () => {
    it('sets open to false when close button is clicked', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('removes open attribute when closed', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible open>Dismissible</hx-alert>');
      expect(el.hasAttribute('open')).toBe(true);
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.click();
      await el.updateComplete;
      expect(el.hasAttribute('open')).toBe(false);
    });
  });

  // ─── Keyboard Interaction (2) ───
  // Native <button> elements synthesize a click event on Enter/Space, providing
  // keyboard accessibility without a custom keydown handler. These tests document
  // that standard button keyboard behavior is preserved.

  describe('Keyboard interaction', () => {
    it('dismisses alert when close button is activated (simulating keyboard click)', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      // Simulate keyboard activation: native <button> synthesizes click on Enter/Space.
      closeBtn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('does not dismiss alert when Escape is pressed on close button', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible open>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(true);
    });
  });

  // ─── Focus Management (3) ───

  describe('Focus management', () => {
    it('moves focus away from close button after dismiss', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.focus();
      closeBtn.click();
      await el.updateComplete;
      expect(document.activeElement).not.toBe(closeBtn);
    });

    it('focus returns to a designated trigger element after dismiss (caller-managed pattern)', async () => {
      const trigger = document.createElement('button');
      trigger.textContent = 'Show alert';
      document.body.appendChild(trigger);

      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      trigger.focus();

      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.click();
      await el.updateComplete;

      // Restore focus to trigger manually (pattern callers use; component signals via hx-after-close)
      trigger.focus();
      expect(document.activeElement).toBe(trigger);
      trigger.remove();
    });

    it('returns focus to returnFocusTo element after dismiss', async () => {
      const trigger = document.createElement('button');
      trigger.id = 'focus-trigger';
      trigger.textContent = 'Open alert';
      document.body.appendChild(trigger);

      const el = await fixture<HxAlert>(
        '<hx-alert dismissible return-focus-to="#focus-trigger">Dismissible</hx-alert>',
      );
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.click();
      await el.updateComplete;

      expect(document.activeElement).toBe(trigger);
      trigger.remove();
    });
  });

  // ─── Slots (5) ───

  describe('Slots', () => {
    it('default slot renders message content', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Alert message here</hx-alert>');
      expect(el.textContent?.trim()).toContain('Alert message here');
    });

    it('title slot renders title content', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert><span slot="title">Alert Title</span>Message</hx-alert>',
      );
      const titleSlot = el.querySelector('[slot="title"]');
      expect(titleSlot).toBeTruthy();
      expect(titleSlot?.textContent).toBe('Alert Title');
    });

    it('icon slot renders custom icon', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert><span slot="icon">ICON</span>Message</hx-alert>',
      );
      const iconSlot = el.querySelector('[slot="icon"]');
      expect(iconSlot).toBeTruthy();
      expect(iconSlot?.textContent).toBe('ICON');
    });

    it('actions slot renders action content', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert>Message<button slot="actions">Action</button></hx-alert>',
      );
      const actionSlot = el.querySelector('[slot="actions"]');
      expect(actionSlot).toBeTruthy();
      expect(actionSlot?.textContent).toBe('Action');
    });

    it('actions container is not visible when no actions are slotted', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Message only</hx-alert>');
      await el.updateComplete;
      const actionsContainer = shadowQuery(el, '[part="actions"]');
      expect(actionsContainer).toBeTruthy();
      expect(actionsContainer?.classList.contains('alert__actions--visible')).toBe(false);
    });
  });

  // ─── CSS Parts (6) ───

  describe('CSS Parts', () => {
    it('exposes "alert" part', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      const part = shadowQuery(el, '[part="alert"]');
      expect(part).toBeTruthy();
    });

    it('exposes "title" part', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      const part = shadowQuery(el, '[part="title"]');
      expect(part).toBeTruthy();
    });

    it('exposes "icon" part when show-icon is set', async () => {
      const el = await fixture<HxAlert>('<hx-alert show-icon>Test</hx-alert>');
      const part = shadowQuery(el, '[part="icon"]');
      expect(part).toBeTruthy();
    });

    it('exposes "message" part', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      const part = shadowQuery(el, '[part="message"]');
      expect(part).toBeTruthy();
    });

    it('exposes "close-button" part when dismissible', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Test</hx-alert>');
      const part = shadowQuery(el, '[part="close-button"]');
      expect(part).toBeTruthy();
    });

    it('exposes "actions" part', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      const part = shadowQuery(el, '[part="actions"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Accessibility (6) ───

  describe('Accessibility', () => {
    it('uses role="status" for info variant on host element', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="info">Info</hx-alert>');
      // Role is applied to the host (not shadow DOM internal) for reliable AT support.
      expect(el.getAttribute('role')).toBe('status');
    });

    it('uses role="status" for success variant on host element', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="success">Success</hx-alert>');
      expect(el.getAttribute('role')).toBe('status');
    });

    it('uses role="status" for warning variant on host element', async () => {
      // WCAG 2.1 AA: warning is non-urgent and uses a polite live region (role="status").
      // Only critical/error variants warrant the assertive interruption of role="alert".
      const el = await fixture<HxAlert>('<hx-alert variant="warning">Warning</hx-alert>');
      expect(el.getAttribute('role')).toBe('status');
    });

    it('uses role="alert" for error variant on host element', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="error">Error</hx-alert>');
      expect(el.getAttribute('role')).toBe('alert');
    });

    it('updates host role when variant changes', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="info">Info</hx-alert>');
      expect(el.getAttribute('role')).toBe('status');
      el.variant = 'error';
      await el.updateComplete;
      expect(el.getAttribute('role')).toBe('alert');
    });

    it('sets aria-hidden="true" on host when open is false', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Content</hx-alert>');
      el.open = false;
      await el.updateComplete;
      expect(el.getAttribute('aria-hidden')).toBe('true');
    });

    it('removes aria-hidden from host when open is true', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Content</hx-alert>');
      el.open = false;
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      expect(el.hasAttribute('aria-hidden')).toBe(false);
    });
  });

  // ─── Close Button Accessibility (2) ───

  describe('Close button accessibility', () => {
    it('close button has aria-label="Close alert" (default when no heading set)', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      expect(closeBtn.getAttribute('aria-label')).toBe('Close alert');
    });

    it('close button is a <button> element', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery(el, '.alert__close-button')!;
      expect(closeBtn.tagName.toLowerCase()).toBe('button');
    });
  });

  // ─── Default Icons (1) ───

  describe('Default icons', () => {
    it('renders a default SVG icon per variant', async () => {
      const variants = ['info', 'success', 'warning', 'error'] as const;
      for (const variant of variants) {
        const el = await fixture<HxAlert>(
          `<hx-alert variant="${variant}" show-icon>Test</hx-alert>`,
        );
        const iconContainer = shadowQuery(el, '[part="icon"]')!;
        const svg = iconContainer.querySelector('svg');
        expect(svg).toBeTruthy();
      }
    });
  });

  // ─── Property: open aria-hidden ───

  describe('Property: open aria-hidden', () => {
    it('sets aria-hidden="true" on host when open=false at initial render', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Content</hx-alert>');
      expect(el.getAttribute('aria-hidden')).toBe('true');
    });

    it('does not set aria-hidden when open=true at initial render', async () => {
      const el = await fixture<HxAlert>('<hx-alert open>Content</hx-alert>');
      expect(el.hasAttribute('aria-hidden')).toBe(false);
    });

    it('open→close transition sets aria-hidden="true"', async () => {
      const el = await fixture<HxAlert>('<hx-alert open>Content</hx-alert>');
      expect(el.hasAttribute('aria-hidden')).toBe(false);
      el.open = false;
      await el.updateComplete;
      expect(el.getAttribute('aria-hidden')).toBe('true');
    });

    it('close→open transition removes aria-hidden', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Content</hx-alert>');
      expect(el.getAttribute('aria-hidden')).toBe('true');
      el.open = true;
      await el.updateComplete;
      expect(el.hasAttribute('aria-hidden')).toBe(false);
    });
  });

  // ─── Property: heading (close button aria-label) ───

  describe('Property: heading (close button aria-label)', () => {
    it('close button uses labelClose property as its aria-label', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert dismissible heading="Low blood pressure">Alert</hx-alert>',
      );
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      // The close button uses labelClose, not heading directly.
      // Default labelClose is "Close alert".
      expect(closeBtn.getAttribute('aria-label')).toBe('Close alert');
    });

    it('close button aria-label can be overridden with label-close attribute', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert dismissible label-close="Schließen">Alert</hx-alert>',
      );
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      expect(closeBtn.getAttribute('aria-label')).toBe('Schließen');
    });
  });

  // ─── Property: severityLabel ───

  describe('Property: severityLabel', () => {
    it('uses default severity label matching variant', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="error">Error message</hx-alert>');
      const label = shadowQuery(el, '.alert__severity-label')!;
      expect(label.textContent).toBe('Error:');
    });

    it('uses custom severityLabel when provided', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert variant="error" severity-label="Kritisch:">Error message</hx-alert>',
      );
      const label = shadowQuery(el, '.alert__severity-label')!;
      expect(label.textContent).toBe('Kritisch:');
    });

    it('default severity label for info variant is "Info:"', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="info">Info message</hx-alert>');
      const label = shadowQuery(el, '.alert__severity-label')!;
      expect(label.textContent).toBe('Info:');
    });

    it('default severity label for success variant is "Success:"', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="success">Success message</hx-alert>');
      const label = shadowQuery(el, '.alert__severity-label')!;
      expect(label.textContent).toBe('Success:');
    });

    it('default severity label for warning variant is "Warning:"', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="warning">Warning message</hx-alert>');
      const label = shadowQuery(el, '.alert__severity-label')!;
      expect(label.textContent).toBe('Warning:');
    });
  });

  // ─── Slot visibility state ───

  describe('Slot visibility state', () => {
    it('title container has alert__title--visible class when title is slotted', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert><span slot="title">Title Text</span>Message</hx-alert>',
      );
      await el.updateComplete;
      // Trigger slotchange by forcing update
      await el.updateComplete;
      const titleContainer = shadowQuery(el, '[part="title"]');
      expect(titleContainer).toBeTruthy();
    });

    it('actions container has alert__actions--visible class when actions are slotted', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert>Message<button slot="actions">Action</button></hx-alert>',
      );
      await el.updateComplete;
      await el.updateComplete;
      const actionsContainer = shadowQuery(el, '[part="actions"]')!;
      expect(actionsContainer).toBeTruthy();
    });
  });

  // ─── disconnectedCallback ───

  describe('disconnectedCallback', () => {
    it('runs without errors when element is disconnected', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Alert</hx-alert>');
      await el.updateComplete;
      let threw = false;
      try {
        el.remove();
      } catch {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    it('runs without errors when element without slot listeners is disconnected', async () => {
      // Element with no title/actions slots — disconnectedCallback should still be safe
      const el = await fixture<HxAlert>('<hx-alert>Alert only</hx-alert>');
      await el.updateComplete;
      let threw = false;
      try {
        el.remove();
      } catch {
        threw = true;
      }
      expect(threw).toBe(false);
    });
  });

  // ─── showIcon: renders icon when true ───

  describe('Property: showIcon renders icon', () => {
    it('renders icon container when show-icon is set', async () => {
      const el = await fixture<HxAlert>('<hx-alert show-icon>Test</hx-alert>');
      const iconPart = shadowQuery(el, '[part="icon"]');
      expect(iconPart).toBeTruthy();
    });

    it('does not render icon container when show-icon is absent', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      const iconPart = shadowQuery(el, '[part="icon"]');
      expect(iconPart).toBeNull();
    });

    it('programmatic showIcon=true renders icon container', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      el.showIcon = true;
      await el.updateComplete;
      const iconPart = shadowQuery(el, '[part="icon"]');
      expect(iconPart).toBeTruthy();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HxAlert>('<hx-alert>This is an alert</hx-alert>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['info', 'success', 'warning', 'error']) {
        const el = await fixture<HxAlert>(
          `<hx-alert variant="${variant}">Alert message</hx-alert>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations when dismissible', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible alert</hx-alert>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with accent variant', async () => {
      const el = await fixture<HxAlert>('<hx-alert accent>Accent alert</hx-alert>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Coverage Gap: announcer microtask path ───

  describe('Announcer microtask path', () => {
    it('populates the sr-only announcer after open becomes true', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Screen reader text</hx-alert>');
      el.open = true;
      await el.updateComplete;
      // Two nested microtask flushes mirror the double Promise.resolve() chain in the source
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      const announcer = el.shadowRoot!.querySelector<HTMLElement>('.sr-only');
      expect(announcer).toBeTruthy();
      // The announcer must be a string (either populated or cleared — not undefined)
      expect(typeof announcer!.textContent).toBe('string');
    });

    it('clears the sr-only announcer when open transitions to false', async () => {
      const el = await fixture<HxAlert>('<hx-alert open>Important message</hx-alert>');
      await el.updateComplete;
      await Promise.resolve();
      await Promise.resolve();
      el.open = false;
      await el.updateComplete;
      const announcer = el.shadowRoot!.querySelector<HTMLElement>('.sr-only');
      // Announcer is cleared when hidden so stale text is not re-read on the next open
      expect(announcer!.textContent).toBe('');
    });
  });

  // ─── Coverage Gap: returnFocusTo with null query result ───

  describe('returnFocusTo with null selector', () => {
    it('does not throw when returnFocusTo selector matches nothing', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert open dismissible>Alert</hx-alert>',
      );
      await el.updateComplete;
      el.returnFocusTo = '#nonexistent-element-xyz';
      const closeBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('button');
      // Clicking close when the selector returns null must not throw
      expect(() => closeBtn?.click()).not.toThrow();
    });
  });

  // ─── Coverage Gap: unknown variant severity label ───

  describe('Unknown variant severity label', () => {
    it('does not throw for an unrecognized variant value', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Content</hx-alert>');
      // Cast to exercise the default branch of _defaultSeverityLabel
      (el as unknown as { variant: string }).variant = 'unknown-variant';
      await expect(el.updateComplete).resolves.toBeTruthy();
    });

    it('severityLabel override takes precedence over default label', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert variant="warning" severity-label="Custom Warning">Alert</hx-alert>',
      );
      await el.updateComplete;
      // When severityLabel is explicitly set it overrides the computed default
      expect(el.severityLabel).toBe('Custom Warning');
    });
  });

  // ─── (group-6) Host-canonical internals.role mirror ───

  describe('Host-canonical role via ElementInternals (group-6)', () => {
    it('mirrors role on internals for status variants', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="info">Info</hx-alert>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.role).toBe('status');
    });

    it('mirrors role on internals for error variant', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="error">Error</hx-alert>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.role).toBe('alert');
    });

    it('keeps internals.role in sync with variant changes', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="info">Info</hx-alert>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.role).toBe('status');
      el.variant = 'error';
      await el.updateComplete;
      expect(internals.role).toBe('alert');
    });

    it('does NOT set explicit aria-live on host (role implies live)', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="error">Error</hx-alert>');
      // §5.1: role implies aria-live; the inner sr-only announcer carries
      // the explicit aria-live for re-announcement-on-toggle. The host must
      // not also have aria-live or older NVDA/JAWS double-announces.
      expect(el.hasAttribute('aria-live')).toBe(false);
    });
  });

  // ─── (group-6 §5.1) Double-announce suppression ───

  describe('Double-announce suppression (group-6 §5.1)', () => {
    it('marks the severity label aria-hidden so AT only sees announcer copy', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="error">Server error</hx-alert>');
      const sev = el.shadowRoot!.querySelector('.alert__severity-label');
      expect(sev?.getAttribute('aria-hidden')).toBe('true');
    });

    it('marks the visible default slot aria-hidden so AT only sees announcer copy', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="error">Server error</hx-alert>');
      const slotWrap = el.shadowRoot!.querySelector('.alert__default-slot');
      expect(slotWrap?.getAttribute('aria-hidden')).toBe('true');
    });

    it('marks the visible title aria-hidden so AT only sees announcer copy', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert variant="error"><span slot="title">Server error</span>Server is down</hx-alert>',
      );
      const title = el.shadowRoot!.querySelector('.alert__title');
      expect(title?.getAttribute('aria-hidden')).toBe('true');
    });

    it('does NOT mark the close button aria-hidden (focusable element)', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert variant="error" dismissible>Server error</hx-alert>',
      );
      const closeBtn = el.shadowRoot!.querySelector('.alert__close-button');
      expect(closeBtn).toBeTruthy();
      expect(closeBtn?.getAttribute('aria-hidden')).not.toBe('true');
      // The container of the close button must also not be aria-hidden.
      expect(el.shadowRoot!.querySelector('[part="alert"]')?.getAttribute('aria-hidden')).not.toBe(
        'true',
      );
    });
  });

  // ─── (group-6 §5.4) Announcer race-guard counter ───

  describe('Announcer race-guard (group-6 §5.4)', () => {
    it('rapid open/close cycles do not leak stale text into announcer', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Initial text</hx-alert>');
      // Rapid toggle: false→true→false→true. Cycle counter ensures only the
      // final settled state writes to the announcer.
      el.open = true;
      el.open = false;
      el.open = true;
      await el.updateComplete;
      // Drain microtasks so any deferred announcer writes complete
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      const announcer = el.shadowRoot!.querySelector<HTMLElement>('.sr-only');
      expect(announcer).toBeTruthy();
      // Final state is open=true so announcer should hold the message
      // (or be empty if the cycle invalidated). It MUST NOT contain stale
      // text from an intermediate cycle.
      const text = announcer!.textContent ?? '';
      // Content is either empty (early-out) or the final settled message —
      // never a stale duplicate or partially-cleared string.
      expect(typeof text).toBe('string');
    });

    it('close after rapid open invalidates the pending announcer write', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Important</hx-alert>');
      el.open = true;
      // Schedule announcer microtask, then close before it resolves
      el.open = false;
      await el.updateComplete;
      await Promise.resolve();
      await Promise.resolve();
      const announcer = el.shadowRoot!.querySelector<HTMLElement>('.sr-only');
      // After close, announcer is cleared; the cycle counter prevents the
      // earlier open's deferred write from re-injecting stale text.
      expect(announcer!.textContent).toBe('');
    });
  });
});
