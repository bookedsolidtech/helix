import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixTabs } from './hx-tabs.js';
import type { HelixTab } from './hx-tab.js';
import type { HelixTabPanel } from './hx-tab-panel.js';
import './index.js';

afterEach(cleanup);

// ─── Test Helpers ──────────────────────────────────────────────────────────────

/** Asserts an element is non-null and returns it typed, avoiding non-null assertions. */
function assertEl<T extends Element>(el: T | null | undefined, label: string): T {
  if (!el) throw new Error(`Expected element "${label}" to exist in DOM`);
  return el;
}

/** Reads `_internals` off a host that elevates ARIA semantics via ElementInternals. */
function getInternals(el: HTMLElement): ElementInternals {
  return (el as unknown as { _internals: ElementInternals })._internals;
}

// ─── Fixture Helpers ───────────────────────────────────────────────────────────

const DEFAULT_TABS_HTML = `
  <hx-tabs>
    <hx-tab slot="tab" panel="alpha">Alpha</hx-tab>
    <hx-tab slot="tab" panel="beta">Beta</hx-tab>
    <hx-tab slot="tab" panel="gamma">Gamma</hx-tab>
    <hx-tab-panel name="alpha">Alpha content</hx-tab-panel>
    <hx-tab-panel name="beta">Beta content</hx-tab-panel>
    <hx-tab-panel name="gamma">Gamma content</hx-tab-panel>
  </hx-tabs>
`;

const TWO_TABS_HTML = `
  <hx-tabs>
    <hx-tab slot="tab" panel="one">One</hx-tab>
    <hx-tab slot="tab" panel="two">Two</hx-tab>
    <hx-tab-panel name="one">Panel One</hx-tab-panel>
    <hx-tab-panel name="two">Panel Two</hx-tab-panel>
  </hx-tabs>
`;

/**
 * Fixture HTML with `activation="automatic"` for keyboard tests that exercise
 * focus-follows-selection semantics. The library default flipped to `manual`
 * in Group 5a; tests covering automatic-mode behaviour pin the activation
 * mode explicitly.
 */
const AUTO_TABS_HTML = `
  <hx-tabs activation="automatic">
    <hx-tab slot="tab" panel="alpha">Alpha</hx-tab>
    <hx-tab slot="tab" panel="beta">Beta</hx-tab>
    <hx-tab slot="tab" panel="gamma">Gamma</hx-tab>
    <hx-tab-panel name="alpha">Alpha content</hx-tab-panel>
    <hx-tab-panel name="beta">Beta content</hx-tab-panel>
    <hx-tab-panel name="gamma">Gamma content</hx-tab-panel>
  </hx-tabs>
`;

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('hx-tabs', () => {
  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a tablist with role="tablist" on the host (host-canonical)', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      expect(getInternals(el).role).toBe('tablist');
    });

    it('renders tablist with part="tablist"', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tablist = shadowQuery(el, '[part="tablist"]');
      expect(tablist).toBeTruthy();
    });

    it('renders panels container with part="panels"', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const panels = shadowQuery(el, '[part="panels"]');
      expect(panels).toBeTruthy();
    });

    it('hx-tab hosts carry role="tab" via ElementInternals (host-canonical)', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      for (const tab of tabs) {
        expect(getInternals(tab).role).toBe('tab');
      }
    });

    it('hx-tab-panel hosts carry role="tabpanel" via ElementInternals', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const panelEls = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      for (const panel of panelEls) {
        expect(getInternals(panel).role).toBe('tabpanel');
      }
    });

    it('first tab is selected by default', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[0].selected).toBe(true);
      expect(tabs[1].selected).toBe(false);
      expect(tabs[2].selected).toBe(false);
    });

    it('first panel is visible, others are hidden', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const panelEls = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      expect(panelEls[0].hasAttribute('hidden')).toBe(false);
      expect(panelEls[1].hasAttribute('hidden')).toBe(true);
      expect(panelEls[2].hasAttribute('hidden')).toBe(true);
    });

    it('hx-tab exposes "tab" CSS part', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tab = el.querySelector('hx-tab') as HelixTab;
      const part = shadowQuery(tab, '[part="tab"]');
      expect(part).toBeTruthy();
    });

    it('hx-tab-panel exposes "panel" CSS part', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const panel = el.querySelector('hx-tab-panel') as HelixTabPanel;
      const part = shadowQuery(panel, '[part="panel"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Tab Selection ────────────────────────────────────────────────────────────

  describe('Tab Selection', () => {
    it('clicking a tab activates it (aria-selected="true" on host internals)', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnBeta = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnBeta, '[part=tab]').click();
      await el.updateComplete;
      expect(getInternals(tabs[1]).ariaSelected).toBe('true');
    });

    it('clicking a tab shows its panel', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      const btnBeta = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnBeta, '[part=tab]').click();
      await el.updateComplete;
      expect(panels[1].hasAttribute('hidden')).toBe(false);
    });

    it('clicking a tab hides all other panels', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      const btnBeta = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnBeta, '[part=tab]').click();
      await el.updateComplete;
      expect(panels[0].hasAttribute('hidden')).toBe(true);
      expect(panels[2].hasAttribute('hidden')).toBe(true);
    });

    it('dispatches hx-tab-change when tab is clicked', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-tab-change');
      const btnBeta = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnBeta, '[part=tab]').click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-tab-change event bubbles and is composed', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-tab-change');
      const btnBeta = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnBeta, '[part=tab]').click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-tab-change detail contains correct index', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const eventPromise = oneEvent<CustomEvent<{ tabId: string; index: number }>>(
        el,
        'hx-tab-change',
      );
      const btnBeta = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnBeta, '[part=tab]').click();
      const event = await eventPromise;
      expect(event.detail.index).toBe(1);
    });

    it('hx-tab-change detail contains the tab id', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const eventPromise = oneEvent<CustomEvent<{ tabId: string; index: number }>>(
        el,
        'hx-tab-change',
      );
      const btnGamma = shadowQuery<HTMLElement>(tabs[2], '[part="tab"]');
      assertEl(btnGamma, '[part=tab]').click();
      const event = await eventPromise;
      expect(event.detail.tabId).toBe(tabs[2].id);
    });

    it('does not dispatch hx-tab-change when clicking the already-active tab', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      let eventFired = false;
      el.addEventListener('hx-tab-change', () => {
        eventFired = true;
      });
      const btnAlpha = shadowQuery<HTMLElement>(tabs[0], '[part="tab"]');
      assertEl(btnAlpha, '[part=tab]').click();
      await el.updateComplete;
      expect(eventFired).toBe(false);
    });

    it('clicking a tab moves focus to the clicked tab (host-canonical roving tabstop)', async () => {
      // Regression: on the host-canonical path hx-tab renders a
      // div[tabindex="-1"], so clicking a tab without an explicit focus
      // call leaves document.activeElement on whatever the user clicked
      // from. Arrow/Home/End would then have no anchor inside the
      // tablist until the user tabbed back in.
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      // Park focus outside the tablist on a known sibling control.
      const sibling = document.createElement('button');
      sibling.textContent = 'sibling';
      el.parentElement?.insertBefore(sibling, el);
      sibling.focus();
      expect(document.activeElement).toBe(sibling);
      const btnBeta = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnBeta, '[part=tab]').click();
      await el.updateComplete;
      // The hx-tab host (single roving tabstop) is now the active element.
      expect(document.activeElement).toBe(tabs[1]);
      sibling.remove();
    });

    it('clicking a disabled tab does not move focus', async () => {
      // Disabled tabs are not activated and must not steal focus on click.
      const el = await fixture<HelixTabs>(`
        <hx-tabs>
          <hx-tab slot="tab" panel="a">A</hx-tab>
          <hx-tab slot="tab" panel="b" disabled>B</hx-tab>
          <hx-tab-panel id="a">A panel</hx-tab-panel>
          <hx-tab-panel id="b">B panel</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const sibling = document.createElement('button');
      sibling.textContent = 'sibling';
      el.parentElement?.insertBefore(sibling, el);
      sibling.focus();
      const btnB = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnB, '[part=tab]').click();
      await el.updateComplete;
      // Disabled tab did not pull focus.
      expect(document.activeElement).not.toBe(tabs[1]);
      sibling.remove();
    });
  });

  // ─── Keyboard Navigation — Horizontal / Automatic (default) ──────────────────

  describe('Keyboard Navigation — Horizontal Automatic', () => {
    // Note: focus the HOST (host-canonical Path A) — the tab host is the
    // single roving-tabindex surface; the inner [part="tab"] is presentational
    // (tabindex=-1) on the modern path.
    it('ArrowRight moves focus to the next tab and activates it', async () => {
      const el = await fixture<HelixTabs>(AUTO_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      tabs[0].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      expect(tabs[1].selected).toBe(true);
    });

    it('ArrowLeft moves focus to the previous tab and activates it', async () => {
      const el = await fixture<HelixTabs>(AUTO_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnBeta = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnBeta, '[part=tab]').click();
      await el.updateComplete;
      tabs[1].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;
      expect(tabs[0].selected).toBe(true);
    });

    it('Home key moves focus to the first tab', async () => {
      const el = await fixture<HelixTabs>(AUTO_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnGamma = shadowQuery<HTMLElement>(tabs[2], '[part="tab"]');
      assertEl(btnGamma, '[part=tab]').click();
      await el.updateComplete;
      tabs[2].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await el.updateComplete;
      expect(tabs[0].selected).toBe(true);
    });

    it('End key moves focus to the last tab', async () => {
      const el = await fixture<HelixTabs>(AUTO_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      tabs[0].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await el.updateComplete;
      expect(tabs[2].selected).toBe(true);
    });

    it('ArrowRight wraps from last tab to first tab', async () => {
      const el = await fixture<HelixTabs>(AUTO_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnGamma = shadowQuery<HTMLElement>(tabs[2], '[part="tab"]');
      assertEl(btnGamma, '[part=tab]').click();
      await el.updateComplete;
      tabs[2].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      expect(tabs[0].selected).toBe(true);
    });

    it('ArrowLeft wraps from first tab to last tab', async () => {
      const el = await fixture<HelixTabs>(AUTO_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      tabs[0].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;
      expect(tabs[2].selected).toBe(true);
    });
  });

  // ─── Keyboard Navigation — Manual Activation ─────────────────────────────────

  describe('Keyboard Navigation — Manual Activation', () => {
    it('ArrowRight moves focus but does NOT activate the tab', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs activation="manual">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab slot="tab" panel="three">Three</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
          <hx-tab-panel name="three">Panel Three</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnOne = shadowQuery<HTMLElement>(tabs[0], '[part="tab"]');
      assertEl(btnOne, '[part=tab]').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      // Tab 0 should still be selected since activation is manual
      expect(tabs[0].selected).toBe(true);
      expect(tabs[1].selected).toBe(false);
    });

    it('Space key activates focused tab in manual mode', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs activation="manual">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      // Navigate to tab two with ArrowRight (no activation)
      const btnOne = shadowQuery<HTMLElement>(tabs[0], '[part="tab"]');
      assertEl(btnOne, '[part=tab]').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      // Now the button for tab two should be focused — press Space
      const btnTwo = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnTwo, '[part=tab]').focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-tab-change');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      const event = await eventPromise;
      await el.updateComplete;
      expect(event).toBeTruthy();
      expect(tabs[1].selected).toBe(true);
    });

    it('Enter key activates focused tab in manual mode', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs activation="manual">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnTwo = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnTwo, '[part=tab]').focus();
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-tab-change');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const event = await eventPromise;
      await el.updateComplete;
      expect(event).toBeTruthy();
      expect(tabs[1].selected).toBe(true);
    });
  });

  // ─── Keyboard Navigation — Vertical Orientation ───────────────────────────────

  describe('Keyboard Navigation — Vertical Orientation', () => {
    it('ArrowDown navigates to the next tab in vertical mode (automatic)', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs orientation="vertical" activation="automatic">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab slot="tab" panel="three">Three</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
          <hx-tab-panel name="three">Panel Three</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      tabs[0].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await el.updateComplete;
      expect(tabs[1].selected).toBe(true);
    });

    it('ArrowUp navigates to the previous tab in vertical mode (automatic)', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs orientation="vertical" activation="automatic">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnTwo = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnTwo, '[part=tab]').click();
      await el.updateComplete;
      tabs[1].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await el.updateComplete;
      expect(tabs[0].selected).toBe(true);
    });

    it('ArrowLeft does NOT navigate in vertical mode', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs orientation="vertical">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnTwo = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnTwo, '[part=tab]').click();
      await el.updateComplete;
      assertEl(btnTwo, '[part=tab]').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      await el.updateComplete;
      // Tab two should still be active because ArrowLeft does not apply in vertical
      expect(tabs[1].selected).toBe(true);
    });

    it('ArrowRight does NOT navigate in vertical mode', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs orientation="vertical">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnOne = shadowQuery<HTMLElement>(tabs[0], '[part="tab"]');
      assertEl(btnOne, '[part=tab]').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      // Tab one should still be active because ArrowRight does not apply in vertical
      expect(tabs[0].selected).toBe(true);
    });
  });

  // ─── Disabled Tabs ────────────────────────────────────────────────────────────

  describe('Disabled Tabs', () => {
    it('disabled tab cannot be activated by clicking', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs>
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two" disabled>Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      let eventFired = false;
      el.addEventListener('hx-tab-change', () => {
        eventFired = true;
      });
      const btnTwo = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnTwo, '[part=tab]').click();
      await el.updateComplete;
      expect(eventFired).toBe(false);
      expect(tabs[0].selected).toBe(true);
      expect(tabs[1].selected).toBe(false);
    });

    it('ArrowRight moves focus to a disabled tab without activating it (ARIA APG)', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs>
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two" disabled>Two</hx-tab>
          <hx-tab slot="tab" panel="three">Three</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
          <hx-tab-panel name="three">Panel Three</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnOne = shadowQuery<HTMLElement>(tabs[0], '[part="tab"]');
      assertEl(btnOne, '[part=tab]').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      // Disabled tab two receives focus but is NOT activated — tab one stays selected
      expect(tabs[0].selected).toBe(true);
      expect(tabs[1].selected).toBe(false);
      expect(document.activeElement).toBe(tabs[1]);
    });

    it('ArrowRight past a disabled tab continues to the next enabled tab (automatic)', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs activation="automatic">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two" disabled>Two</hx-tab>
          <hx-tab slot="tab" panel="three">Three</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
          <hx-tab-panel name="three">Panel Three</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      // Focus disabled tab two, then press ArrowRight
      tabs[1].focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await el.updateComplete;
      // Tab three is enabled so it gets focus and activated
      expect(tabs[2].selected).toBe(true);
    });

    it('Space key on a disabled tab does not activate it', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs>
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two" disabled>Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      let eventFired = false;
      el.addEventListener('hx-tab-change', () => {
        eventFired = true;
      });
      // Focus disabled tab two
      const btnTwo = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnTwo, '[part=tab]').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await el.updateComplete;
      expect(eventFired).toBe(false);
      expect(tabs[0].selected).toBe(true);
    });

    it('Enter key on a disabled tab does not activate it', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs>
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two" disabled>Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      let eventFired = false;
      el.addEventListener('hx-tab-change', () => {
        eventFired = true;
      });
      const btnTwo = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnTwo, '[part=tab]').focus();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await el.updateComplete;
      expect(eventFired).toBe(false);
      expect(tabs[0].selected).toBe(true);
    });

    it('disabled tab reflects disabled attribute', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs>
          <hx-tab slot="tab" panel="one" disabled>One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[0].disabled).toBe(true);
      expect(tabs[0].hasAttribute('disabled')).toBe(true);
    });

    it('first enabled tab is activated by default when first tab is disabled', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs>
          <hx-tab slot="tab" panel="one" disabled>One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[0].selected).toBe(false);
      expect(tabs[1].selected).toBe(true);
    });
  });

  // ─── ARIA ─────────────────────────────────────────────────────────────────────

  describe('ARIA', () => {
    it('host has aria-orientation="horizontal" by default (host-canonical)', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      expect(getInternals(el).ariaOrientation).toBe('horizontal');
    });

    it('host has aria-orientation="vertical" when orientation is vertical', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs orientation="vertical">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
        </hx-tabs>
      `);
      expect(getInternals(el).ariaOrientation).toBe('vertical');
    });

    it('tab host has aria-selected="true" when selected (host-canonical)', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(getInternals(tabs[0]).ariaSelected).toBe('true');
    });

    it('tab host has aria-selected="false" when not selected', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(getInternals(tabs[1]).ariaSelected).toBe('false');
    });

    it('tab host references its panel via internals.ariaControlsElements (modern path)', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      type RefsInternals = ElementInternals & {
        ariaControlsElements: Element[] | null;
      };
      const refs = (getInternals(tabs[0]) as RefsInternals).ariaControlsElements;
      expect(refs).toBeTruthy();
      expect(refs?.[0]).toBe(panels[0]);
    });

    it('panel host references its tab via internals.ariaLabelledByElements (modern path)', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      type RefsInternals = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
      };
      const refs = (getInternals(panels[0]) as RefsInternals).ariaLabelledByElements;
      expect(refs).toBeTruthy();
      expect(refs?.[0]).toBe(tabs[0]);
    });

    it('panel has tabindex="0" for keyboard accessibility', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      expect(panels[0].getAttribute('tabindex')).toBe('0');
    });

    it('active tab has tabindex=0, inactive tabs have tabindex=-1', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[0].tabIndex).toBe(0);
      expect(tabs[1].tabIndex).toBe(-1);
      expect(tabs[2].tabIndex).toBe(-1);
    });

    it('tabindex updates on tabs when selection changes', async () => {
      const el = await fixture<HelixTabs>(TWO_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnTwo = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnTwo, '[part=tab]').click();
      await el.updateComplete;
      expect(tabs[0].tabIndex).toBe(-1);
      expect(tabs[1].tabIndex).toBe(0);
    });

    // Cross-AT smoke test: validates the role-on-host with inner-button
    // activation pattern. Confirms `document.activeElement` matches the host
    // (not an inner shadow node) when focus lands on a tab, and that the
    // host's `internals.role` / `ariaSelected` reflect the announced surface.
    it('host owns focus + ARIA when a tab is focused (cross-AT smoke)', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      tabs[0].focus();
      expect(document.activeElement).toBe(tabs[0]);
      const internals = getInternals(tabs[0]);
      expect(internals.role).toBe('tab');
      expect(internals.ariaSelected).toBe('true');
    });
  });

  // ─── Properties ───────────────────────────────────────────────────────────────

  describe('Properties', () => {
    it('orientation defaults to "horizontal"', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      expect(el.orientation).toBe('horizontal');
    });

    it('orientation="vertical" is reflected as attribute', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs orientation="vertical">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
        </hx-tabs>
      `);
      expect(el.getAttribute('orientation')).toBe('vertical');
    });

    it('activation defaults to "manual" (Group 5a healthcare default)', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      expect(el.activation).toBe('manual');
    });

    it('activation="automatic" is settable via attribute', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs activation="automatic">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
        </hx-tabs>
      `);
      expect(el.activation).toBe('automatic');
    });

    it('activation="manual" is settable via attribute', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs activation="manual">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
        </hx-tabs>
      `);
      expect(el.activation).toBe('manual');
    });

    it('hx-tab selected property reflects as attribute', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[0].hasAttribute('selected')).toBe(true);
      expect(tabs[1].hasAttribute('selected')).toBe(false);
    });

    it('hx-tab panel property reflects as attribute', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[0].getAttribute('panel')).toBe('alpha');
      expect(tabs[1].getAttribute('panel')).toBe('beta');
    });

    it('hx-tab-panel name property reflects as attribute', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      expect(panels[0].getAttribute('name')).toBe('alpha');
      expect(panels[1].getAttribute('name')).toBe('beta');
    });
  });

  // ─── Dynamic Tab Add / Remove ─────────────────────────────────────────────────

  describe('Dynamic Tab Add / Remove', () => {
    it('adding a new tab and panel updates the tab list', async () => {
      const el = await fixture<HelixTabs>(TWO_TABS_HTML);
      const newTab = document.createElement('hx-tab') as HelixTab;
      newTab.setAttribute('slot', 'tab');
      newTab.setAttribute('panel', 'three');
      newTab.textContent = 'Three';
      const newPanel = document.createElement('hx-tab-panel') as HelixTabPanel;
      newPanel.setAttribute('name', 'three');
      newPanel.textContent = 'Panel Three';
      el.appendChild(newTab);
      el.appendChild(newPanel);
      await el.updateComplete;
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs).toHaveLength(3);
    });

    it('newly added tab can be clicked and activates its panel', async () => {
      const el = await fixture<HelixTabs>(TWO_TABS_HTML);
      const newTab = document.createElement('hx-tab') as HelixTab;
      newTab.setAttribute('slot', 'tab');
      newTab.setAttribute('panel', 'three');
      newTab.textContent = 'Three';
      const newPanel = document.createElement('hx-tab-panel') as HelixTabPanel;
      newPanel.setAttribute('name', 'three');
      newPanel.textContent = 'Panel Three';
      el.appendChild(newTab);
      el.appendChild(newPanel);
      await el.updateComplete;
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btn = shadowQuery<HTMLElement>(tabs[2], '[part="tab"]');
      assertEl(btn, '[part=tab]').click();
      await el.updateComplete;
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      expect(panels[2].hasAttribute('hidden')).toBe(false);
    });

    it('removing a tab updates the tab list', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      el.removeChild(tabs[2]);
      await el.updateComplete;
      const remainingTabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(remainingTabs).toHaveLength(2);
    });
  });

  // ─── Slots ────────────────────────────────────────────────────────────────────

  describe('Slots', () => {
    it('tab default slot renders label text content', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tab = el.querySelector('hx-tab') as HelixTab;
      expect(tab.textContent?.trim()).toBe('Alpha');
    });

    it('tab-panel default slot renders panel content', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const panel = el.querySelector('hx-tab-panel') as HelixTabPanel;
      expect(panel.textContent?.trim()).toBe('Alpha content');
    });

    it('tab prefix slot is hidden when empty', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tab = el.querySelector('hx-tab') as HelixTab;
      const prefixSpan = shadowQuery(tab, '[part="prefix"]');
      expect(prefixSpan?.hasAttribute('hidden')).toBe(true);
    });

    it('tab suffix slot is hidden when empty', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tab = el.querySelector('hx-tab') as HelixTab;
      const suffixSpan = shadowQuery(tab, '[part="suffix"]');
      expect(suffixSpan?.hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Label Property ──────────────────────────────────────────────────────────

  describe('Label Property', () => {
    it('host has no internals.ariaLabel by default (no `label` set)', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      // Group 5a host-canonical: when `label` is empty and no consumer
      // aria-label/aria-labelledby is supplied, internals.ariaLabel is null.
      // The dev warning at firstUpdated still surfaces the WCAG concern.
      expect(getInternals(el).ariaLabel).toBeFalsy();
    });

    it('host carries internals.ariaLabel when `label` is set', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs label="Patient record sections">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
        </hx-tabs>
      `);
      expect(getInternals(el).ariaLabel).toBe('Patient record sections');
    });

    it('host aria-label attribute overrides `label` property via internals', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs label="Property label" aria-label="Attribute label">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
        </hx-tabs>
      `);
      expect(getInternals(el).ariaLabel).toBe('Attribute label');
    });

    it('host aria-labelledby resolves to internals.ariaLabelledByElements (modern path)', async () => {
      const el = await fixture<HelixTabs>(`
        <div>
          <h2 id="tabs-heading">Patient sections</h2>
          <hx-tabs aria-labelledby="tabs-heading">
            <hx-tab slot="tab" panel="one">One</hx-tab>
            <hx-tab-panel name="one">Panel One</hx-tab-panel>
          </hx-tabs>
        </div>
      `);
      const tabs = el.querySelector('hx-tabs') as HelixTabs;
      type RefsInternals = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
      };
      const refs = (getInternals(tabs) as RefsInternals).ariaLabelledByElements;
      expect(refs).toBeTruthy();
      expect(refs?.[0]).toBe(el.querySelector('#tabs-heading'));
    });

    it('label property reflects as attribute', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs label="Test label">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
        </hx-tabs>
      `);
      expect(el.getAttribute('label')).toBe('Test label');
    });
  });

  // ─── selectedIndex API ────────────────────────────────────────────────────────

  describe('selectedIndex API', () => {
    it('selectedIndex returns 0 when first tab is active', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      expect(el.selectedIndex).toBe(0);
    });

    it('selectedIndex returns correct index after clicking second tab', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnBeta = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnBeta, '[part=tab]').click();
      await el.updateComplete;
      expect(el.selectedIndex).toBe(1);
    });

    it('setting selectedIndex activates the corresponding tab', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      el.selectedIndex = 2;
      await el.updateComplete;
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[2].selected).toBe(true);
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      expect(panels[2].hasAttribute('hidden')).toBe(false);
    });

    it('setting selectedIndex to disabled tab does not activate it', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs>
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two" disabled>Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      el.selectedIndex = 1;
      await el.updateComplete;
      expect(el.selectedIndex).toBe(0);
    });

    it('setting selectedIndex out of range does not change selection', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      el.selectedIndex = 99;
      await el.updateComplete;
      expect(el.selectedIndex).toBe(0);
    });

    it('selected-index HTML attribute activates the tab at that index on initialisation', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs selected-index="2">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab slot="tab" panel="three">Three</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
          <hx-tab-panel name="three">Panel Three</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[2].selected).toBe(true);
      expect(tabs[0].selected).toBe(false);
    });

    it('selected-index HTML attribute is ignored when the target tab is disabled', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs selected-index="1">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two" disabled>Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      // Disabled tab cannot be activated — falls through to first enabled tab
      expect(tabs[0].selected).toBe(true);
      expect(tabs[1].selected).toBe(false);
    });

    it('dynamically setting selected-index attribute activates the corresponding tab', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      el.setAttribute('selected-index', '1');
      await el.updateComplete;
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      expect(tabs[1].selected).toBe(true);
    });
  });

  // ─── selected attribute initialization (3) ───────────────────────────────────

  describe('selected attribute initialization', () => {
    it('first enabled tab is activated on initialization (selected attr on child is ignored)', async () => {
      // hx-tabs manages selection state internally; it always activates the first enabled tab
      // on initialization. A `selected` attribute on a child hx-tab is not a pre-selection hint.
      const el = await fixture<HelixTabs>(`
        <hx-tabs>
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two" selected>Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      // hx-tabs activates the first enabled tab (index 0), not the one with selected attr
      expect(tabs[0].selected).toBe(true);
      expect(tabs[1].selected).toBe(false);
    });

    it('panel associated with the first tab is shown on initialization', async () => {
      // hx-tabs activates the first tab, so the first panel is visible regardless of
      // any `selected` attribute on child hx-tab elements.
      const el = await fixture<HelixTabs>(`
        <hx-tabs>
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two" selected>Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      // First panel is shown (not hidden); second panel is hidden
      expect(panels[0].hasAttribute('hidden')).toBe(false);
      expect(panels[1].hasAttribute('hidden')).toBe(true);
    });

    it('tab-panel name maps to tab panel attribute for wiring', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      // Each tab.panel attribute matches the corresponding hx-tab-panel.name attribute
      expect(tabs[0].getAttribute('panel')).toBe(panels[0].getAttribute('name'));
      expect(tabs[1].getAttribute('panel')).toBe(panels[1].getAttribute('name'));
    });
  });

  // ─── selectTab public API (3) ──────────────────────────────────────────────────

  describe('Programmatic tab activation', () => {
    it('setting selectedIndex to -1 out-of-range does not change selection', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      el.selectedIndex = -1;
      await el.updateComplete;
      // Out of range — no change to current selection (index 0)
      expect(el.selectedIndex).toBe(0);
    });

    it('tab activated by click updates selectedIndex correctly', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const btnGamma = shadowQuery<HTMLElement>(tabs[2], '[part="tab"]');
      assertEl(btnGamma, '[part=tab]').click();
      await el.updateComplete;
      expect(el.selectedIndex).toBe(2);
    });

    it('hx-tab-change detail.tabId matches the id of the activated tab element', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const eventPromise = oneEvent<CustomEvent<{ tabId: string; index: number }>>(
        el,
        'hx-tab-change',
      );
      const btnAlphaSecond = shadowQuery<HTMLElement>(tabs[1], '[part="tab"]');
      assertEl(btnAlphaSecond, '[part=tab]').click();
      const event = await eventPromise;
      expect(event.detail.tabId).toBeTruthy();
      expect(event.detail.index).toBe(1);
    });
  });

  // ─── panel slot content (1) ──────────────────────────────────────────────────

  describe('panel content visibility after selection', () => {
    it('panel content remains accessible (not hidden) for the selected tab', async () => {
      const el = await fixture<HelixTabs>(DEFAULT_TABS_HTML);
      const tabs = Array.from(el.querySelectorAll('hx-tab')) as HelixTab[];
      const panels = Array.from(el.querySelectorAll('hx-tab-panel')) as HelixTabPanel[];
      // Select gamma (index 2)
      const btnGamma = shadowQuery<HTMLElement>(tabs[2], '[part="tab"]');
      assertEl(btnGamma, '[part=tab]').click();
      await el.updateComplete;
      expect(panels[2].hasAttribute('hidden')).toBe(false);
      expect(panels[0].hasAttribute('hidden')).toBe(true);
      expect(panels[1].hasAttribute('hidden')).toBe(true);
    });
  });

  // ─── Accessibility (axe-core) ─────────────────────────────────────────────────

  // axe-core rule exclusions for shadow DOM tab pattern:
  // - aria-required-children: axe cannot resolve slotted <hx-tab> custom elements as valid
  //   tablist children since they carry role="tab" on their inner shadow button, not the host
  // - aria-valid-attr-value: aria-controls references panel IDs in light DOM, which axe
  //   cannot resolve when scanning from within the shadow root
  describe('Accessibility (axe-core)', () => {
    const a11yRules = {
      'aria-required-children': { enabled: false },
      'aria-valid-attr-value': { enabled: false },
    };

    it('default state has no a11y violations', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs label="Test tabs">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const { violations } = await checkA11y(el, { rules: a11yRules });
      expect(violations).toEqual([]);
    });

    it('vertical orientation has no a11y violations', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs orientation="vertical" label="Vertical tabs">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const { violations } = await checkA11y(el, { rules: a11yRules });
      expect(violations).toEqual([]);
    });

    it('disabled tab state has no a11y violations', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs label="Tabs with disabled">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two" disabled>Two</hx-tab>
          <hx-tab slot="tab" panel="three">Three</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
          <hx-tab-panel name="three">Panel Three</hx-tab-panel>
        </hx-tabs>
      `);
      const { violations } = await checkA11y(el, { rules: a11yRules });
      expect(violations).toEqual([]);
    });

    it('manual activation has no a11y violations', async () => {
      const el = await fixture<HelixTabs>(`
        <hx-tabs activation="manual" label="Manual tabs">
          <hx-tab slot="tab" panel="one">One</hx-tab>
          <hx-tab slot="tab" panel="two">Two</hx-tab>
          <hx-tab-panel name="one">Panel One</hx-tab-panel>
          <hx-tab-panel name="two">Panel Two</hx-tab-panel>
        </hx-tabs>
      `);
      const { violations } = await checkA11y(el, { rules: a11yRules });
      expect(violations).toEqual([]);
    });
  });
});
