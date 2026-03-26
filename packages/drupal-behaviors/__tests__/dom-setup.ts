/**
 * Minimal fake DOM for testing Drupal behaviors in Node environment.
 *
 * Provides document, window.location, history, KeyboardEvent, and MouseEvent
 * globals so that behaviors (which reference these as browser globals) can
 * be tested without a real browser or jsdom.
 */

import { vi } from 'vitest';

// ─── Fake DOM Element ─────────────────────────────────────────────────────────

type Handler = (event: { type: string; bubbles?: boolean; [key: string]: unknown }) => void;

export class FakeElement {
  readonly tagName: string;
  id = '';
  style: Record<string, string> = {};
  open: boolean | undefined = undefined;

  private _attrs = new Map<string, string>();
  private _listeners = new Map<string, Handler[]>();
  _children: FakeElement[] = [];
  parentNode: FakeElement | FakeDocument | null = null;

  // Allow dynamic properties from behavior code (e.g. _hxMenuCloseHandler)
  [key: string]: unknown;

  constructor(tag: string) {
    this.tagName = tag.toUpperCase();
    // Re-declare typed properties after index signature
    this.id = '';
    this.style = {};
    this.open = undefined;
  }

  get dataset(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, val] of this._attrs) {
      if (key.startsWith('data-')) {
        const camel = key.slice(5).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
        result[camel] = val;
      }
    }
    return result;
  }

  setAttribute(name: string, value: string): void {
    this._attrs.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this._attrs.get(name) ?? null;
  }

  addEventListener(type: string, handler: Handler): void {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type)!.push(handler);
  }

  removeEventListener(type: string, handler: Handler): void {
    const handlers = this._listeners.get(type);
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
  }

  dispatchEvent(event: { type: string; bubbles?: boolean; [key: string]: unknown }): boolean {
    if (event['target'] == null) {
      try {
        Object.defineProperty(event, 'target', {
          value: this,
          configurable: true,
          writable: true,
        });
      } catch {
        /* read-only target — leave as-is */
      }
    }
    const handlers = this._listeners.get(event.type) ?? [];
    handlers.slice().forEach((h) => h(event));
    if (event.bubbles && this.parentNode) {
      this.parentNode.dispatchEvent(event);
    }
    return true;
  }

  contains(other: unknown): boolean {
    if (other == null) return false;
    if (other === this) return true;
    return this._children.some((child) => child.contains(other));
  }

  appendChild(child: FakeElement): FakeElement {
    child.parentNode = this;
    this._children.push(child);
    return child;
  }

  removeChild(child: FakeElement): FakeElement {
    const idx = this._children.indexOf(child);
    if (idx !== -1) {
      this._children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  querySelector(selector: string): FakeElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    return this._children.flatMap((child) => {
      const results: FakeElement[] = [];
      if (child.matches(selector)) results.push(child);
      results.push(...child.querySelectorAll(selector));
      return results;
    });
  }

  matches(selector: string): boolean {
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector.startsWith('[') && selector.endsWith(']')) {
      return this._attrs.has(selector.slice(1, -1));
    }
    return this.tagName.toLowerCase() === selector;
  }

  click(): void {
    this.dispatchEvent({ type: 'click', bubbles: true });
  }

  focus(): void {
    /* noop — spy over this in tests that check focus */
  }
}

// ─── Fake Document ────────────────────────────────────────────────────────────

export class FakeDocument {
  readonly body: FakeElement;
  private _listeners = new Map<string, Handler[]>();

  constructor() {
    this.body = new FakeElement('BODY');
    this.body.style = {};
    this.body.parentNode = this;
  }

  createElement(tag: string): FakeElement {
    return new FakeElement(tag);
  }

  querySelector(selector: string): FakeElement | null {
    return this.body.querySelector(selector);
  }

  querySelectorAll(selector: string): FakeElement[] {
    return this.body.querySelectorAll(selector);
  }

  addEventListener(type: string, handler: Handler): void {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type)!.push(handler);
  }

  removeEventListener(type: string, handler: Handler): void {
    const handlers = this._listeners.get(type);
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
  }

  dispatchEvent(event: { type: string; bubbles?: boolean; [key: string]: unknown }): boolean {
    if (event['target'] == null) {
      try {
        Object.defineProperty(event, 'target', {
          value: this,
          configurable: true,
          writable: true,
        });
      } catch {
        /* ignore */
      }
    }
    const handlers = this._listeners.get(event.type) ?? [];
    handlers.slice().forEach((h) => h(event));
    return true;
  }
}

// ─── Install Globals ──────────────────────────────────────────────────────────

const fakeDoc = new FakeDocument();

(globalThis as Record<string, unknown>).document = fakeDoc;

(globalThis as Record<string, unknown>).window = {
  location: { hash: '', pathname: '/' },
};

(globalThis as Record<string, unknown>).history = {
  replaceState: vi.fn(),
  pushState: vi.fn().mockImplementation((_state: unknown, _title: unknown, url: unknown) => {
    if (typeof url === 'string') {
      const loc = (
        (globalThis as Record<string, unknown>).window as Record<string, Record<string, string>>
      ).location;
      if (url.startsWith('#')) {
        loc['hash'] = url;
      } else {
        loc['hash'] = '';
        loc['pathname'] = url;
      }
    }
  }),
};

// KeyboardEvent is not available in Node 24 — provide a minimal shim
(globalThis as Record<string, unknown>).KeyboardEvent = class extends Event {
  readonly key: string;
  constructor(type: string, init: { key?: string; bubbles?: boolean; cancelable?: boolean } = {}) {
    super(type, { bubbles: init.bubbles ?? false, cancelable: init.cancelable ?? false });
    this.key = init.key ?? '';
  }
};

// MouseEvent is not available in Node 24 — provide a minimal shim
(globalThis as Record<string, unknown>).MouseEvent = class extends Event {
  constructor(type: string, init: { bubbles?: boolean; cancelable?: boolean } = {}) {
    super(type, { bubbles: init.bubbles ?? false, cancelable: init.cancelable ?? false });
  }
};
