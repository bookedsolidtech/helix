/**
 * Tests for AdoptedStylesheetsController (Lit ReactiveController wrapper).
 *
 * Tests run in Node environment. Lit host, ShadowRoot, and CSSStyleSheet
 * are mocked so controller lifecycle can be tested without a real browser.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockCSSStyleSheet {
  replaceSync(_css: string): void {
    /* no-op */
  }
}

/** Minimal ShadowRoot mock with adoptedStyleSheets array semantics. */
class MockShadowRoot {
  adoptedStyleSheets: CSSStyleSheet[] = [];
}

/** Minimal Document mock with adoptedStyleSheets array semantics. */
class MockDocument {
  adoptedStyleSheets: CSSStyleSheet[] = [];
}

type ControllerList = ReactiveController[];

/** Minimal Lit ReactiveControllerHost mock. */
function makeMockHost(rootNode: MockShadowRoot | MockDocument): ReactiveControllerHost & Element {
  const controllers: ControllerList = [];

  const host = {
    addController(ctrl: ReactiveController): void {
      controllers.push(ctrl);
    },
    removeController(ctrl: ReactiveController): void {
      const idx = controllers.indexOf(ctrl);
      if (idx !== -1) controllers.splice(idx, 1);
    },
    getRootNode(): MockShadowRoot | MockDocument {
      return rootNode;
    },
    requestUpdate(): void {
      /* no-op */
    },
    updateComplete: Promise.resolve(true),
    _controllers: controllers,
  } as unknown as ReactiveControllerHost & Element;

  return host;
}

// Inject globals before module import.
if (typeof window === 'undefined') {
  (globalThis as Record<string, unknown>).window = {};
}
(globalThis as Record<string, unknown>).CSSStyleSheet = MockCSSStyleSheet;
(globalThis as Record<string, unknown>).ShadowRoot = MockShadowRoot;
(globalThis as Record<string, unknown>).Document = MockDocument;

// Import after globals are set.
const { AdoptedStylesheetsController } = await import('./lit-controller.js');
const { clearRegistry } = await import('./registry.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSheet(): CSSStyleSheet {
  return new MockCSSStyleSheet() as unknown as CSSStyleSheet;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdoptedStylesheetsController', () => {
  let shadowRoot: MockShadowRoot;
  let host: ReturnType<typeof makeMockHost>;
  let sheet: CSSStyleSheet;

  beforeEach(() => {
    clearRegistry();
    shadowRoot = new MockShadowRoot();
    host = makeMockHost(shadowRoot);
    sheet = makeSheet();
  });

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  describe('constructor', () => {
    it('registers itself with the host via addController', () => {
      const addSpy = vi.spyOn(host, 'addController');
      new AdoptedStylesheetsController(host, sheet);
      expect(addSpy).toHaveBeenCalledOnce();
    });

    it('stores references to all provided sheets', () => {
      const sheet2 = makeSheet();
      const controller = new AdoptedStylesheetsController(host, sheet, sheet2);
      // Verify by triggering hostConnected and checking adoptedStyleSheets
      controller.hostConnected();
      expect(shadowRoot.adoptedStyleSheets).toContain(sheet);
      expect(shadowRoot.adoptedStyleSheets).toContain(sheet2);
    });
  });

  // -------------------------------------------------------------------------
  // hostConnected
  // -------------------------------------------------------------------------

  describe('hostConnected', () => {
    it('adopts sheets on the host root node (ShadowRoot)', () => {
      const controller = new AdoptedStylesheetsController(host, sheet);
      controller.hostConnected();
      expect(shadowRoot.adoptedStyleSheets).toContain(sheet);
    });

    it('adopts sheets on a Document root', () => {
      const doc = new MockDocument();
      const docHost = makeMockHost(doc);
      const controller = new AdoptedStylesheetsController(docHost, sheet);
      controller.hostConnected();
      expect(doc.adoptedStyleSheets).toContain(sheet);
    });

    it('does not adopt when root is neither ShadowRoot nor Document', () => {
      // Return a plain element as root — should be ignored gracefully.
      const alienHost = {
        addController: vi.fn(),
        getRootNode: () => ({ some: 'element' }),
      } as unknown as ReactiveControllerHost & Element;

      const controller = new AdoptedStylesheetsController(alienHost, sheet);
      // Should not throw.
      expect(() => controller.hostConnected()).not.toThrow();
    });

    it('can be called multiple times (ref count increments, sheet added once)', () => {
      const controller = new AdoptedStylesheetsController(host, sheet);
      controller.hostConnected();
      controller.hostConnected();
      const occurrences = shadowRoot.adoptedStyleSheets.filter((s) => s === sheet).length;
      expect(occurrences).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // hostDisconnected
  // -------------------------------------------------------------------------

  describe('hostDisconnected', () => {
    it('removes the sheet when ref count reaches zero', () => {
      const controller = new AdoptedStylesheetsController(host, sheet);
      controller.hostConnected();
      controller.hostDisconnected();
      expect(shadowRoot.adoptedStyleSheets).not.toContain(sheet);
    });

    it('keeps the sheet when another consumer still holds a reference', () => {
      const controller1 = new AdoptedStylesheetsController(host, sheet);
      const controller2 = new AdoptedStylesheetsController(host, sheet);

      controller1.hostConnected();
      controller2.hostConnected();

      // Only disconnect one controller.
      controller1.hostDisconnected();

      // Sheet should remain because controller2 still holds a reference.
      expect(shadowRoot.adoptedStyleSheets).toContain(sheet);

      // Disconnecting the second removes it.
      controller2.hostDisconnected();
      expect(shadowRoot.adoptedStyleSheets).not.toContain(sheet);
    });

    it('does not throw when called before hostConnected', () => {
      const controller = new AdoptedStylesheetsController(host, sheet);
      // hostDisconnected without a prior hostConnected should be safe.
      expect(() => controller.hostDisconnected()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Full lifecycle: connect → disconnect → reconnect
  // -------------------------------------------------------------------------

  describe('full lifecycle', () => {
    it('supports reconnection after disconnect', () => {
      const controller = new AdoptedStylesheetsController(host, sheet);

      controller.hostConnected();
      expect(shadowRoot.adoptedStyleSheets).toContain(sheet);

      controller.hostDisconnected();
      expect(shadowRoot.adoptedStyleSheets).not.toContain(sheet);

      controller.hostConnected();
      expect(shadowRoot.adoptedStyleSheets).toContain(sheet);
    });

    it('cleans up correctly across multiple sheets and lifecycles', () => {
      const sheet2 = makeSheet();
      const controller = new AdoptedStylesheetsController(host, sheet, sheet2);

      controller.hostConnected();
      expect(shadowRoot.adoptedStyleSheets).toContain(sheet);
      expect(shadowRoot.adoptedStyleSheets).toContain(sheet2);

      controller.hostDisconnected();
      expect(shadowRoot.adoptedStyleSheets).not.toContain(sheet);
      expect(shadowRoot.adoptedStyleSheets).not.toContain(sheet2);
    });
  });
});
