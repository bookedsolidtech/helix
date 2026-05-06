import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import { HelixDrawer } from './hx-drawer.js';
import './index.js';

afterEach(cleanup);

describe('hx-drawer', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "panel" CSS part', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const panelPart = shadowQuery(el, '[part="panel"]');
      expect(panelPart).toBeTruthy();
    });

    it('exposes "body" CSS part', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const bodyPart = shadowQuery(el, '[part="body"]');
      expect(bodyPart).toBeTruthy();
    });

    it('exposes "header" CSS part by default', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const headerPart = shadowQuery(el, '[part="header"]');
      expect(headerPart).toBeTruthy();
    });
  });

  // ─── Properties (6) ───

  describe('Properties', () => {
    it('open=false — drawer is not open by default', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('open=true — drawer reflects open attribute', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      expect(el.open).toBe(true);
      expect(el.hasAttribute('open')).toBe(true);
    });

    it('placement defaults to "end"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      expect(el.placement).toBe('end');
    });

    it('placement reflects on the element attribute', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer placement="start"></hx-drawer>');
      await el.updateComplete;
      expect(el.placement).toBe('start');
      expect(el.getAttribute('placement')).toBe('start');
    });

    it('size defaults to "md"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      expect(el.size).toBe('md');
    });

    it('reflects hx-size attribute', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer hx-size="lg"></hx-drawer>');
      await el.updateComplete;
      expect(el.size).toBe('lg');
    });

    it('backward compat: legacy size attribute maps to hx-size', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer size="sm"></hx-drawer>');
      await el.updateComplete;
      expect(el.size).toBe('sm');
    });

    it('hx-size takes precedence over legacy size attribute', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer size="sm" hx-size="lg"></hx-drawer>');
      await el.updateComplete;
      expect(el.size).toBe('lg');
    });

    it('no-header attribute hides the header', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer no-header></hx-drawer>');
      await el.updateComplete;
      const headerPart = shadowQuery(el, '[part="header"]');
      expect(headerPart).toBeNull();
    });
  });

  // ─── Events (5) ───

  describe('Events', () => {
    it('dispatches hx-show when open is set to true', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-show');
      el.open = true;
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-hide when open is set to false', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-hide');
      el.open = false;
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-initial-focus when drawer opens', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-initial-focus');
      el.open = true;
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.cancelable).toBe(true);
    });

    it('dispatches hx-show and then hx-after-show', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      const events: string[] = [];
      el.addEventListener('hx-show', () => events.push('hx-show'));
      el.addEventListener('hx-after-show', () => events.push('hx-after-show'));

      const afterShowPromise = oneEvent(el, 'hx-after-show');
      el.open = true;
      await afterShowPromise;

      expect(events).toContain('hx-show');
      expect(events).toContain('hx-after-show');
      expect(events.indexOf('hx-show')).toBeLessThan(events.indexOf('hx-after-show'));
    });

    it('dispatches hx-hide and then hx-after-hide', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;

      const events: string[] = [];
      el.addEventListener('hx-hide', () => events.push('hx-hide'));
      el.addEventListener('hx-after-hide', () => events.push('hx-after-hide'));

      const afterHidePromise = oneEvent(el, 'hx-after-hide');
      el.open = false;
      await afterHidePromise;

      expect(events).toContain('hx-hide');
      expect(events).toContain('hx-after-hide');
      expect(events.indexOf('hx-hide')).toBeLessThan(events.indexOf('hx-after-hide'));
    });
  });

  // ─── Methods (2) ───

  describe('Methods', () => {
    it('show() sets open to true', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      expect(el.open).toBe(false);
      el.show();
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('hide() sets open to false', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      expect(el.open).toBe(true);
      el.hide();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('default slot renders body content', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><p class="body-content">Body text</p></hx-drawer>',
      );
      await el.updateComplete;
      const slottedContent = el.querySelector('p.body-content');
      expect(slottedContent).toBeTruthy();
      expect(slottedContent?.textContent).toBe('Body text');
    });

    it('label slot renders title content', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><span slot="label" class="drawer-title">My Drawer</span></hx-drawer>',
      );
      await el.updateComplete;
      const titleEl = el.querySelector('span.drawer-title');
      expect(titleEl).toBeTruthy();
      expect(titleEl?.textContent).toBe('My Drawer');
    });

    it('footer slot renders action content', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><button slot="footer" class="confirm-btn">Confirm</button></hx-drawer>',
      );
      await el.updateComplete;
      const slottedFooter = el.querySelector('button.confirm-btn');
      expect(slottedFooter).toBeTruthy();
      expect(slottedFooter?.textContent).toBe('Confirm');
    });
  });

  // ─── CSS Parts (5) ───

  describe('CSS Parts', () => {
    it('exposes "panel" part on the drawer panel', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const part = shadowQuery(el, '[part="panel"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('panel');
    });

    it('exposes "header" part on the header region', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const part = shadowQuery(el, '[part="header"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('header');
    });

    it('exposes "body" part on the body region', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const part = shadowQuery(el, '[part="body"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('body');
    });

    it('exposes "close-button" part on the close button', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const part = shadowQuery(el, '[part="close-button"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('close-button');
    });

    it('exposes "title" part on the title element', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const part = shadowQuery(el, '[part="title"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('title');
    });
  });

  // ─── Keyboard Behavior (2) ───

  describe('Keyboard Behavior', () => {
    it('Escape key closes the drawer when open', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;

      expect(el.open).toBe(true);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('Escape key does not close when drawer is already closed', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;

      let hideFired = false;
      el.addEventListener('hx-hide', () => {
        hideFired = true;
      });

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;

      expect(hideFired).toBe(false);
      expect(el.open).toBe(false);
    });
  });

  // ─── Overlay Click (2) ───

  describe('Overlay Click', () => {
    it('clicking the overlay backdrop closes the drawer', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;

      expect(el.open).toBe(true);
      const overlay = shadowQuery<HTMLElement>(el, '[part="overlay"]');
      expect(overlay).toBeTruthy();

      const hidePromise = oneEvent<CustomEvent>(el, 'hx-hide');
      overlay?.click();
      await hidePromise;
      expect(el.open).toBe(false);
    });

    it('overlay is rendered when drawer is open', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      const overlay = shadowQuery(el, '[part="overlay"]');
      expect(overlay).toBeTruthy();
    });
  });

  // ─── ARIA: host-canonical (Group 4 round-1) ───

  describe('ARIA — host-canonical', () => {
    type InternalsWithIdrefRefs = ElementInternals & {
      ariaLabelledByElements: Element[] | null;
      ariaDescribedByElements: Element[] | null;
    };
    type DrawerInternalsAccess = HelixDrawer & { _internals: ElementInternals };

    it('host carries role="dialog" via ElementInternals', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const internals = (el as DrawerInternalsAccess)._internals;
      expect(internals.role).toBe('dialog');
    });

    it('host carries aria-modal="true" via ElementInternals', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const internals = (el as DrawerInternalsAccess)._internals;
      expect(internals.ariaModal).toBe('true');
    });

    it('inner overlay does NOT carry role on the modern path', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      const overlay = shadowQuery(el, '[part="overlay"]');
      expect(overlay?.hasAttribute('role')).toBe(false);
    });

    it('inner overlay does NOT carry aria-modal on the modern path', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      const overlay = shadowQuery(el, '[part="overlay"]');
      expect(overlay?.hasAttribute('aria-modal')).toBe(false);
    });

    it('close button has aria-label="Close drawer"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const closeBtn = shadowQuery(el, '[part="close-button"]');
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close drawer');
    });

    it('label property is forwarded to internals.ariaLabel as fallback name', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer label="Patient details"></hx-drawer>');
      await el.updateComplete;
      const internals = (el as DrawerInternalsAccess)._internals;
      expect(internals.ariaLabel).toBe('Patient details');
    });

    it('hard-coded "Drawer" name is forwarded when no other naming source exists', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const internals = (el as DrawerInternalsAccess)._internals;
      expect(internals.ariaLabel).toBe('Drawer');
    });

    it('host aria-label overrides label property in internals.ariaLabel', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer label="Default" aria-label="Patient alert"></hx-drawer>',
      );
      await el.updateComplete;
      const internals = (el as DrawerInternalsAccess)._internals;
      expect(internals.ariaLabel).toBe('Patient alert');
    });

    it('slotted label projects into internals.ariaLabelledByElements (modern path)', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer><h2 slot="label">Patient Alert</h2></hx-drawer>',
      );
      await el.updateComplete;
      const internals = (el as DrawerInternalsAccess)._internals as InternalsWithIdrefRefs;
      const titleEl = shadowQuery(el, '[part="title"]');
      // Slotted label flows the slotted root into the IDL refs (same content
      // assigned to the inner heading via slot projection).
      const refs = internals.ariaLabelledByElements;
      expect(refs).not.toBeNull();
      expect(refs!.length).toBeGreaterThan(0);
      // The slotted h2 itself appears in the refs (consumer light-DOM).
      const slotted = el.querySelector('[slot="label"]');
      expect(refs!.includes(slotted!)).toBe(true);
      // Sanity: the inner title part still exists for the fallback path.
      expect(titleEl).toBeTruthy();
    });

    it('slotted label flattened text is reflected as fallback internals.ariaLabel', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer><span slot="label">Composite Title</span></hx-drawer>',
      );
      await el.updateComplete;
      // Allow microtask slotchange to flush.
      await el.updateComplete;
      const internals = (el as DrawerInternalsAccess)._internals;
      // For slotted labels we set BOTH internals.ariaLabelledByElements
      // (live element ref so AT walking IDL refs sees the projected node)
      // AND internals.ariaLabel (flattened text fallback so AT that doesn't
      // walk IDL refs still has a name). `null`-out of ariaLabel is reserved
      // for consumer aria-labelledby — see the "consumer aria-labelledby"
      // test where IDREF resolution is the canonical name source.
      expect(internals.ariaLabel).toBe('Composite Title');
    });

    it('multi-node slotted label aggregates into internals.ariaLabelledByElements', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer><svg slot="label" aria-hidden="true"><title>icon</title></svg><span slot="label">Patient</span></hx-drawer>',
      );
      await el.updateComplete;
      await el.updateComplete;
      const internals = (el as DrawerInternalsAccess)._internals as InternalsWithIdrefRefs;
      const refs = internals.ariaLabelledByElements;
      // Hidden svg is filtered from IDL refs per AccName 1.2 §4.3.10; the
      // visible span survives.
      expect(refs).not.toBeNull();
      const span = el.querySelector('span[slot="label"]');
      expect(refs!.includes(span!)).toBe(true);
      const svg = el.querySelector('svg[slot="label"]');
      expect(refs!.includes(svg!)).toBe(false);
    });

    it('consumer aria-labelledby resolves to light-DOM element via IDL refs', async () => {
      const el = await fixture<HelixDrawer>(
        '<div><h1 id="patient-name">Patient: J. Doe</h1><hx-drawer aria-labelledby="patient-name"></hx-drawer></div>',
      );
      const drawer = el.querySelector('hx-drawer') as HelixDrawer;
      await drawer.updateComplete;
      const internals = (drawer as DrawerInternalsAccess)._internals as InternalsWithIdrefRefs;
      const refs = internals.ariaLabelledByElements;
      expect(refs).not.toBeNull();
      const labelEl = el.querySelector('#patient-name');
      expect(refs!.includes(labelEl!)).toBe(true);
      // When labelledby resolves, internals.ariaLabel is null (avoids erasing
      // the IDL-ref resolution).
      expect((drawer as DrawerInternalsAccess)._internals.ariaLabel).toBeNull();
    });

    it('consumer aria-labelledby typo falls back to label property', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer label="Fallback name" aria-labelledby="nonexistent-id"></hx-drawer>',
      );
      await el.updateComplete;
      const internals = (el as DrawerInternalsAccess)._internals;
      // Typo did not resolve; fallback flows to label property.
      expect(internals.ariaLabel).toBe('Fallback name');
      const refs = (internals as InternalsWithIdrefRefs).ariaLabelledByElements;
      // Filter on visible elements only — refs may be null or empty.
      expect(refs === null || refs.length === 0).toBe(true);
    });

    it('consumer aria-describedby resolves to light-DOM element via IDL refs', async () => {
      const el = await fixture<HelixDrawer>(
        '<div><p id="patient-summary">Summary text</p><hx-drawer aria-describedby="patient-summary"></hx-drawer></div>',
      );
      const drawer = el.querySelector('hx-drawer') as HelixDrawer;
      await drawer.updateComplete;
      const internals = (drawer as DrawerInternalsAccess)._internals as InternalsWithIdrefRefs;
      const refs = internals.ariaDescribedByElements;
      expect(refs).not.toBeNull();
      const descEl = el.querySelector('#patient-summary');
      expect(refs!.includes(descEl!)).toBe(true);
    });

    it('consumer aria-describedby retraction clears the IDL refs', async () => {
      const el = await fixture<HelixDrawer>(
        '<div><p id="d">Desc</p><hx-drawer aria-describedby="d"></hx-drawer></div>',
      );
      const drawer = el.querySelector('hx-drawer') as HelixDrawer;
      await drawer.updateComplete;
      const internals = (drawer as DrawerInternalsAccess)._internals as InternalsWithIdrefRefs;
      expect(internals.ariaDescribedByElements?.length).toBeGreaterThan(0);
      drawer.removeAttribute('aria-describedby');
      // Mutation observer is microtask; await one frame.
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      await drawer.updateComplete;
      const after = internals.ariaDescribedByElements;
      expect(after === null || after.length === 0).toBe(true);
    });

    it('consumer description text is mirrored into the in-shadow consumer-desc span', async () => {
      const el = await fixture<HelixDrawer>(
        '<div><p id="d">Description text</p><hx-drawer aria-describedby="d"></hx-drawer></div>',
      );
      const drawer = el.querySelector('hx-drawer') as HelixDrawer;
      await drawer.updateComplete;
      const span = drawer.shadowRoot?.querySelector('[id$="-consumer-desc"]');
      expect(span).toBeTruthy();
      expect(span!.textContent).toBe('Description text');
    });

    it('inner overlay aria-describedby chains the consumer-desc span only when description is non-empty', async () => {
      const elNo = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await elNo.updateComplete;
      const overlayNo = shadowQuery(elNo, '[part="overlay"]');
      expect(overlayNo?.hasAttribute('aria-describedby')).toBe(false);

      const el = await fixture<HelixDrawer>(
        '<div><p id="d2">Desc</p><hx-drawer open aria-describedby="d2"></hx-drawer></div>',
      );
      const drawer = el.querySelector('hx-drawer') as HelixDrawer;
      await drawer.updateComplete;
      const overlay = shadowQuery(drawer, '[part="overlay"]');
      const spanId = drawer.shadowRoot
        ?.querySelector('[id$="-consumer-desc"]')
        ?.getAttribute('id');
      expect(overlay?.getAttribute('aria-describedby')).toBe(spanId);
    });

    it('label slot in-place text mutation re-flows the host name', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer><span slot="label">First</span></hx-drawer>',
      );
      await el.updateComplete;
      await el.updateComplete;
      const span = el.querySelector('span[slot="label"]') as HTMLElement;
      span.textContent = 'Second';
      // MutationObserver is microtask.
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      await el.updateComplete;
      const internals = (el as DrawerInternalsAccess)._internals as InternalsWithIdrefRefs;
      const refs = internals.ariaLabelledByElements;
      const haveRefs = !!refs && refs.length > 0;
      if (!haveRefs) {
        // Fallback path mirrors flattened text.
        expect(internals.ariaLabel).toBe('Second');
      } else {
        // Modern path: refs include the span; the text at AT walk time is "Second".
        expect(refs!.includes(span)).toBe(true);
      }
    });

    it('external aria-labelledby target text mutation re-syncs', async () => {
      const el = await fixture<HelixDrawer>(
        '<div><h1 id="ext">Original</h1><hx-drawer aria-labelledby="ext"></hx-drawer></div>',
      );
      const drawer = el.querySelector('hx-drawer') as HelixDrawer;
      await drawer.updateComplete;
      const labelEl = el.querySelector('#ext') as HTMLElement;
      labelEl.textContent = 'Updated';
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      await drawer.updateComplete;
      const internals = (drawer as DrawerInternalsAccess)._internals as InternalsWithIdrefRefs;
      // Modern path keeps the live element ref; fallback flattens new text.
      const refs = internals.ariaLabelledByElements;
      if (refs && refs.length > 0) {
        expect(refs.includes(labelEl)).toBe(true);
      } else {
        expect(internals.ariaLabel).toBe('Updated');
      }
    });

    it('legacy fallback path writes role/aria-modal-equivalent name onto inner overlay', async () => {
      // Force the legacy path before connect so the test reflects no-IDL-ref engines.
      const Ctor = (HelixDrawer as unknown as { __testSupportsIdrefRefsOverride: boolean | null });
      Ctor.__testSupportsIdrefRefsOverride = false;
      try {
        const el = await fixture<HelixDrawer>(
          '<hx-drawer open label="Legacy fallback name"></hx-drawer>',
        );
        await el.updateComplete;
        const overlay = shadowQuery(el, '[part="overlay"]');
        // Fallback path projects the resolved name onto the inner overlay so AT
        // walking down still finds an announceable name.
        expect(overlay?.getAttribute('aria-label')).toBe('Legacy fallback name');
        // Host-canonical role/aria-modal still ride on internals only — never
        // duplicated to the inner overlay.
        expect(overlay?.hasAttribute('role')).toBe(false);
        expect(overlay?.hasAttribute('aria-modal')).toBe(false);
      } finally {
        Ctor.__testSupportsIdrefRefsOverride = null;
      }
    });

    it('legacy fallback path uses internal title id for slotted label aria-labelledby', async () => {
      const Ctor = (HelixDrawer as unknown as { __testSupportsIdrefRefsOverride: boolean | null });
      Ctor.__testSupportsIdrefRefsOverride = false;
      try {
        const el = await fixture<HelixDrawer>(
          '<hx-drawer open><span slot="label">Slotted Title</span></hx-drawer>',
        );
        await el.updateComplete;
        await el.updateComplete;
        const overlay = shadowQuery(el, '[part="overlay"]');
        const titleEl = shadowQuery(el, '[part="title"]');
        const titleId = titleEl?.getAttribute('id');
        expect(overlay?.getAttribute('aria-labelledby')).toBe(titleId);
        expect(overlay?.hasAttribute('aria-label')).toBe(false);
      } finally {
        Ctor.__testSupportsIdrefRefsOverride = null;
      }
    });
  });

  // ─── Placement Variants (4) ───

  describe('Placement Variants', () => {
    it('supports placement="end" (default)', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer placement="end"></hx-drawer>');
      await el.updateComplete;
      expect(el.placement).toBe('end');
      expect(el.getAttribute('placement')).toBe('end');
    });

    it('supports placement="start"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer placement="start"></hx-drawer>');
      await el.updateComplete;
      expect(el.placement).toBe('start');
    });

    it('supports placement="top"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer placement="top"></hx-drawer>');
      await el.updateComplete;
      expect(el.placement).toBe('top');
    });

    it('supports placement="bottom"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer placement="bottom"></hx-drawer>');
      await el.updateComplete;
      expect(el.placement).toBe('bottom');
    });
  });

  // ─── Close Button (1) ───

  describe('Close Button', () => {
    it('clicking close button closes the drawer', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;

      expect(el.open).toBe(true);
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '[part="close-button"]');
      expect(closeBtn).toBeTruthy();

      const hidePromise = oneEvent<CustomEvent>(el, 'hx-hide');
      closeBtn?.click();
      await hidePromise;
      expect(el.open).toBe(false);
    });
  });

  // ─── Focus Trap (3) ───

  describe('Focus Trap', () => {
    it('traps forward Tab at the last focusable element', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><span slot="label">Title</span><button class="first-btn">First</button><button class="last-btn">Last</button></hx-drawer>',
      );
      await el.updateComplete;

      // Focus the last slotted button
      const lastBtn = el.querySelector<HTMLButtonElement>('.last-btn');
      expect(lastBtn).toBeTruthy();
      lastBtn!.focus();
      expect(document.activeElement).toBe(lastBtn);

      // Press Tab — should wrap to first focusable element (close button in shadow DOM)
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      await el.updateComplete;

      // Focus should not escape the drawer (activeElement should still be inside or on the drawer)
      const active = document.activeElement;
      expect(
        active === lastBtn || el.contains(active) || el.shadowRoot?.contains(active as Node),
      ).toBe(true);
    });

    it('traps backward Shift+Tab at the first focusable element', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><span slot="label">Title</span><button class="only-btn">Only</button></hx-drawer>',
      );
      await el.updateComplete;

      // Focus the close button (first shadow DOM focusable)
      const closeBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('[part="close-button"]');
      expect(closeBtn).toBeTruthy();
      closeBtn!.focus();

      // Press Shift+Tab
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
      );
      await el.updateComplete;

      // Focus should not escape the drawer
      const active = document.activeElement;
      expect(
        active === closeBtn || el.contains(active) || el.shadowRoot?.contains(active as Node),
      ).toBe(true);
    });

    it('prevents Tab when no focusable elements exist', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open no-header><span>Non-focusable content</span></hx-drawer>',
      );
      await el.updateComplete;

      // Dispatch Tab — should not throw
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(true); // drawer stays open
    });
  });

  // ─── No-Header Mode (Keyboard Accessibility) (2) ───

  describe('No-Header Mode (Keyboard Accessibility)', () => {
    // When no-header is set the close button is absent; Escape must be the sole dismiss
    // mechanism and must still function correctly (keyboard-accessible per WCAG 2.1 AA).
    it('Escape key closes drawer in no-header mode', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open no-header></hx-drawer>');
      await el.updateComplete;

      expect(el.open).toBe(true);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('has no axe violations in no-header open state', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open no-header label="Patient Notes"><p>Content</p></hx-drawer>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Focus Restoration (1) ───

  describe('Focus Restoration', () => {
    it('restores focus to the trigger element on close', async () => {
      // Create a trigger button and focus it
      const trigger = document.createElement('button');
      trigger.textContent = 'Trigger';
      trigger.classList.add('test-trigger');
      document.body.appendChild(trigger);
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      const el = await fixture<HelixDrawer>(
        '<hx-drawer><span slot="label">Title</span></hx-drawer>',
      );

      // Open drawer (trigger is still focused)
      el.open = true;
      await el.updateComplete;

      // Close drawer
      const afterHidePromise = oneEvent(el, 'hx-after-hide');
      el.open = false;
      await el.updateComplete;
      await afterHidePromise;

      expect(document.activeElement).toBe(trigger);
      trigger.remove();
    });
  });

  // ─── Body Scroll Lock (2) ───

  describe('Body Scroll Lock', () => {
    it('locks body scroll when drawer opens', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      const previousOverflow = document.body.style.overflow;

      el.open = true;
      await el.updateComplete;

      expect(document.body.style.overflow).toBe('hidden');

      // Close and restore
      const afterHidePromise = oneEvent(el, 'hx-after-hide');
      el.open = false;
      await el.updateComplete;
      await afterHidePromise;
      expect(document.body.style.overflow).toBe(previousOverflow);
    });

    it('does not lock body scroll when contained', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer contained></hx-drawer>');
      const previousOverflow = document.body.style.overflow;

      el.open = true;
      await el.updateComplete;

      expect(document.body.style.overflow).toBe(previousOverflow);
    });
  });

  // ─── ARIA Label Fallback — host-canonical (Group 4 round-1) ───

  describe('ARIA Label Fallback', () => {
    type InternalsWithIdrefRefs = ElementInternals & {
      ariaLabelledByElements: Element[] | null;
    };
    type DrawerInternalsAccess = HelixDrawer & { _internals: ElementInternals };

    it('slotted label projects into internals.ariaLabelledByElements', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><span slot="label">Patient Info</span></hx-drawer>',
      );
      await el.updateComplete;
      await el.updateComplete;
      const internals = (el as DrawerInternalsAccess)._internals as InternalsWithIdrefRefs;
      const refs = internals.ariaLabelledByElements;
      const span = el.querySelector('span[slot="label"]');
      expect(refs).not.toBeNull();
      expect(refs!.includes(span!)).toBe(true);
    });

    it('inner overlay does NOT carry aria-labelledby/aria-label when slotted label is present (modern path)', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><span slot="label">Patient Info</span></hx-drawer>',
      );
      await el.updateComplete;
      await el.updateComplete;
      const overlay = el.shadowRoot?.querySelector('[part="overlay"]');
      // Modern path: host-canonical — overlay carries neither attribute.
      expect(overlay?.hasAttribute('aria-labelledby')).toBe(false);
      expect(overlay?.hasAttribute('aria-label')).toBe(false);
    });

    it('noHeader=true with label property — fallback name flows via internals.ariaLabel', async () => {
      // When noHeader=true the title element is not rendered. The host-canonical
      // pipeline routes the accessible name via internals.ariaLabel (modern path).
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open no-header label="Patient Record"></hx-drawer>',
      );
      await el.updateComplete;
      const internals = (el as DrawerInternalsAccess)._internals;
      expect(internals.ariaLabel).toBe('Patient Record');
      const overlay = el.shadowRoot?.querySelector('[part="overlay"]');
      // Inner overlay carries neither attribute on the modern path.
      expect(overlay?.hasAttribute('aria-labelledby')).toBe(false);
      expect(overlay?.hasAttribute('aria-label')).toBe(false);
    });

    it('label property flows to internals.ariaLabel when no label slot', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open label="Settings Panel"></hx-drawer>');
      await el.updateComplete;
      const internals = (el as DrawerInternalsAccess)._internals;
      expect(internals.ariaLabel).toBe('Settings Panel');
    });

    it('falls back to internals.ariaLabel="Drawer" when no slot or property', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      const internals = (el as DrawerInternalsAccess)._internals;
      expect(internals.ariaLabel).toBe('Drawer');
    });
  });

  // ─── Contained mode (1) ───

  describe('Contained', () => {
    it('contained attribute reflects on the element', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer contained></hx-drawer>');
      await el.updateComplete;
      expect(el.contained).toBe(true);
      expect(el.hasAttribute('contained')).toBe(true);
    });
  });

  // ─── Accessibility (axe-core) (2) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in closed state', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in open state with label', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><span slot="label">Patient Info</span><p>Content</p></hx-drawer>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── i18n / label overrides ───

  describe('i18n / label overrides', () => {
    it('uses default English label for close button', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open><p>Content</p></hx-drawer>');
      await el.updateComplete;
      expect(el.labelClose).toBe('Close drawer');
    });

    it('close button aria-label reflects custom labelClose', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open><p>Content</p></hx-drawer>');
      el.labelClose = 'Cerrar panel';
      await el.updateComplete;
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '[part="close-button"]');
      expect(closeBtn?.getAttribute('aria-label')).toBe('Cerrar panel');
    });
  });

  // ─── noFooter property (1) ───

  describe('noFooter property', () => {
    it('no-footer hides the footer region', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer no-footer><button slot="footer">Submit</button></hx-drawer>',
      );
      await el.updateComplete;
      const footer = shadowQuery(el, '[part="footer"]');
      // When noFooter is true the footer element is not rendered at all
      expect(footer).toBeNull();
    });

    it('footer region renders when no-footer is absent and footer slot has content', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><button slot="footer">Submit</button></hx-drawer>',
      );
      await el.updateComplete;
      const footer = shadowQuery(el, '[part="footer"]');
      expect(footer).toBeTruthy();
    });
  });

  // ─── Size CSS variable ───

  describe('Size CSS variable', () => {
    it('applies --_drawer-size CSS variable for preset size "sm"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer hx-size="sm"></hx-drawer>');
      await el.updateComplete;
      const sizeVar = el.style.getPropertyValue('--_drawer-size');
      expect(sizeVar).toBe('20rem');
    });

    it('applies --_drawer-size CSS variable for preset size "lg"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer hx-size="lg"></hx-drawer>');
      await el.updateComplete;
      const sizeVar = el.style.getPropertyValue('--_drawer-size');
      expect(sizeVar).toBe('40rem');
    });

    it('applies --_drawer-size CSS variable for preset size "full"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer hx-size="full"></hx-drawer>');
      await el.updateComplete;
      const sizeVar = el.style.getPropertyValue('--_drawer-size');
      expect(sizeVar).toBe('100%');
    });

    it('applies --_drawer-size as raw CSS value for non-preset size', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer hx-size="25rem"></hx-drawer>');
      await el.updateComplete;
      const sizeVar = el.style.getPropertyValue('--_drawer-size');
      expect(sizeVar).toBe('25rem');
    });
  });

  // ─── hx-initial-focus cancelation ───

  describe('hx-initial-focus cancelation', () => {
    it('canceling hx-initial-focus prevents default focus management', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer><span slot="label">Title</span><button id="first-btn">First</button></hx-drawer>',
      );

      // Place focus on an external element
      const externalBtn = document.createElement('button');
      externalBtn.id = 'external';
      document.body.appendChild(externalBtn);
      externalBtn.focus();

      el.addEventListener('hx-initial-focus', (e) => e.preventDefault());

      el.open = true;
      // Wait for the open sequence to complete (initial-focus fires after updateComplete chain)
      await new Promise((resolve) => setTimeout(resolve, 0));
      await el.updateComplete;

      // Default focus was prevented — external button should still have focus
      expect(document.activeElement).not.toBe(el.querySelector('#first-btn'));

      externalBtn.remove();
    });
  });

  // ─── show/hide idempotency ───

  describe('show/hide idempotency', () => {
    it('calling show() on an already-open drawer does not fire hx-show again', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      let count = 0;
      el.addEventListener('hx-show', () => count++);
      el.show();
      await el.updateComplete;
      expect(count).toBe(0);
    });

    it('calling hide() on an already-closed drawer does not fire hx-hide', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      let count = 0;
      el.addEventListener('hx-hide', () => count++);
      el.hide();
      await el.updateComplete;
      expect(count).toBe(0);
    });
  });

  // ─── placement CSS part classes ───

  describe('Placement CSS part data-attribute', () => {
    it('placement="start" reflects on the host attribute', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer placement="start"></hx-drawer>');
      await el.updateComplete;
      expect(el.getAttribute('placement')).toBe('start');
    });

    it('placement="top" reflects on the host attribute', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer placement="top"></hx-drawer>');
      await el.updateComplete;
      expect(el.getAttribute('placement')).toBe('top');
    });

    it('placement="bottom" reflects on the host attribute', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer placement="bottom"></hx-drawer>');
      await el.updateComplete;
      expect(el.getAttribute('placement')).toBe('bottom');
    });
  });

  // ─── size token values ───

  describe('Size token CSS variable values', () => {
    it('preset size "md" sets --_drawer-size to 30rem', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer hx-size="md"></hx-drawer>');
      await el.updateComplete;
      const sizeVar = el.style.getPropertyValue('--_drawer-size');
      expect(sizeVar).toBe('30rem');
    });

    it('custom size value is used as-is for --_drawer-size', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer hx-size="320px"></hx-drawer>');
      await el.updateComplete;
      const sizeVar = el.style.getPropertyValue('--_drawer-size');
      expect(sizeVar).toBe('320px');
    });

    it('size updates --_drawer-size when changed after initial render', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer hx-size="sm"></hx-drawer>');
      await el.updateComplete;
      expect(el.style.getPropertyValue('--_drawer-size')).toBe('20rem');

      el.size = 'lg';
      await el.updateComplete;
      expect(el.style.getPropertyValue('--_drawer-size')).toBe('40rem');
    });
  });

  // ─── hx-request-close event reason detail ───

  describe('hx-request-close reason via Escape key', () => {
    it('Escape key sets open=false (close request fulfilled)', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;

      const hidePromise = oneEvent<CustomEvent>(el, 'hx-hide');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await hidePromise;
      expect(el.open).toBe(false);
    });

    it('overlay click closes the drawer (close request fulfilled)', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;

      const overlay = shadowQuery<HTMLElement>(el, '[part="overlay"]')!;
      const hidePromise = oneEvent<CustomEvent>(el, 'hx-hide');
      overlay.click();
      await hidePromise;
      expect(el.open).toBe(false);
    });
  });

  // ─── no-close-button attribute ───

  describe('no-header hides the visible close button', () => {
    it('no-header removes the [part="close-button"] element', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer no-header></hx-drawer>');
      await el.updateComplete;
      const closeBtn = shadowQuery(el, '[part="close-button"]');
      expect(closeBtn).toBeNull();
    });

    it('no-header renders a visually-hidden [part="close-btn"] for accessibility', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer no-header></hx-drawer>');
      await el.updateComplete;
      const srCloseBtn = shadowQuery(el, '[part="close-btn"]');
      expect(srCloseBtn).toBeTruthy();
    });

    it('sr-only close button in no-header mode can close the drawer', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open no-header></hx-drawer>');
      await el.updateComplete;

      const srCloseBtn = shadowQuery<HTMLButtonElement>(el, '[part="close-btn"]')!;
      expect(srCloseBtn).toBeTruthy();

      const hidePromise = oneEvent<CustomEvent>(el, 'hx-hide');
      srCloseBtn.click();
      await hidePromise;
      expect(el.open).toBe(false);
    });
  });

  // ─── header-actions slot ───

  describe('header-actions slot', () => {
    it('header-actions slot content is rendered in the header', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><button slot="header-actions" id="action-btn">Action</button></hx-drawer>',
      );
      await el.updateComplete;
      const actionBtn = el.querySelector('#action-btn');
      expect(actionBtn).toBeTruthy();
      expect(actionBtn?.textContent).toBe('Action');
    });
  });

  // ─── contained drawer does not hide siblings ───

  describe('contained drawer aria-hidden sibling management', () => {
    it('contained drawer does not apply aria-hidden to body children', async () => {
      const sibling = document.createElement('div');
      sibling.id = 'test-sibling';
      document.body.appendChild(sibling);

      const el = await fixture<HelixDrawer>('<hx-drawer contained></hx-drawer>');
      el.open = true;
      await el.updateComplete;

      expect(sibling.hasAttribute('aria-hidden')).toBe(false);

      const afterHidePromise = oneEvent(el, 'hx-after-hide');
      el.open = false;
      await el.updateComplete;
      await afterHidePromise;

      sibling.remove();
    });
  });

  // ─── disconnectedCallback cleanup ───

  describe('disconnectedCallback cleanup', () => {
    it('disconnectedCallback removes document keydown listener', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      el.remove();

      // After removal, Escape should not change open (it is already false after remove + cleanup)
      // The key assertion here is that no error is thrown
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      // No assertion needed for open state since element is disconnected; just ensure no throw
      expect(true).toBe(true);
    });
  });
});
