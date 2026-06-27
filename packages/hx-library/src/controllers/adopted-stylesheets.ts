/**
 * @module AdoptedStylesheetsController
 *
 * A Lit ReactiveController that injects CSS into a document or shadow root
 * via the Adopted Stylesheets API, with global deduplication.
 *
 * Inspired by @phase2/outline-adopted-stylesheets-controller.
 *
 * @example
 * ```ts
 * import { AdoptedStylesheetsController } from '../controllers/adopted-stylesheets.js';
 *
 * class MyElement extends LitElement {
 *   private _globalStyles = new AdoptedStylesheetsController(
 *     this,
 *     ':root { --hx-color-primary: #2563EB; }'
 *   );
 * }
 * ```
 */
import type { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * Manages adopted stylesheets on a given root (`document` or `ShadowRoot`),
 * ensuring each unique stylesheet is created only once and cleaned up only
 * when the last consumer disconnects (reference counting).
 */
export class AdoptedStylesheetsController implements ReactiveController {
  /** Global cache keyed by cssText to avoid creating duplicate CSSStyleSheet instances. */
  private static _cache = new Map<string, CSSStyleSheet>();

  /**
   * Reference counter keyed by a compound key of `cssText + root identity`.
   * Tracks how many live instances are using a given stylesheet on a given root.
   */
  private static _refCounts = new Map<string, number>();

  private readonly _host: ReactiveControllerHost & HTMLElement;
  private readonly _cssText: string;
  private readonly _passedRoot: Document | ShadowRoot | undefined;
  private _sheet: CSSStyleSheet | undefined;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    cssText: string,
    root?: Document | ShadowRoot,
  ) {
    this._host = host;
    this._cssText = cssText;
    // Store the caller-supplied root verbatim (possibly `undefined`). The
    // fallback to `document` is resolved lazily by the `_root` getter so that
    // *construction* never touches `document`. This keeps the controller usable
    // on the SSR-safe `@helixui/library/authoring` path: a Track-2 component can
    // do `new AdoptedStylesheetsController(this, css)` in a field initializer
    // and instantiate during SSR without a `ReferenceError: document is not
    // defined`. DOM is only resolved when a controller method actually runs
    // (`hostConnected`/`hostDisconnected`), which is client-side only.
    this._passedRoot = root;
    this._host.addController(this);
  }

  /**
   * Lazily resolves the effective root. Defers the `document` fallback to call
   * time so the constructor stays SSR-safe. `document` is a stable per-document
   * singleton, so omitting the argument always yields the same root object —
   * the WeakMap-keyed ref-counting (`_getRootId`) therefore stays consistent
   * across the instance lifetime, byte-identical to the previous eager default.
   */
  private get _root(): Document | ShadowRoot {
    return this._passedRoot ?? document;
  }

  /**
   * Produces a stable string key that uniquely identifies the combination of
   * cssText and the specific root so reference counts don't bleed across roots.
   */
  private _refKey(): string {
    // document has no unique property exposed safely, so we use a WeakMap tag.
    return `${this._cssText}__${AdoptedStylesheetsController._getRootId(this._root)}`;
  }

  /** WeakMap used to assign a stable numeric ID to each root instance. */
  private static _rootIds = new WeakMap<Document | ShadowRoot, number>();
  private static _nextRootId = 0;

  private static _getRootId(root: Document | ShadowRoot): number {
    let id = AdoptedStylesheetsController._rootIds.get(root);
    if (id === undefined) {
      id = AdoptedStylesheetsController._nextRootId++;
      AdoptedStylesheetsController._rootIds.set(root, id);
    }
    return id;
  }

  hostConnected(): void {
    // Reuse or create the CSSStyleSheet for this cssText.
    let sheet = AdoptedStylesheetsController._cache.get(this._cssText);

    if (!sheet) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(this._cssText);
      AdoptedStylesheetsController._cache.set(this._cssText, sheet);
    }

    this._sheet = sheet;

    // Only add if not already adopted on this root.
    if (!this._root.adoptedStyleSheets.includes(sheet)) {
      this._root.adoptedStyleSheets = [...this._root.adoptedStyleSheets, sheet];
    }

    // Increment reference count.
    const key = this._refKey();
    const current = AdoptedStylesheetsController._refCounts.get(key) ?? 0;
    AdoptedStylesheetsController._refCounts.set(key, current + 1);
  }

  hostDisconnected(): void {
    if (!this._sheet) return;

    const key = this._refKey();
    const current = AdoptedStylesheetsController._refCounts.get(key) ?? 0;
    const next = Math.max(0, current - 1);
    AdoptedStylesheetsController._refCounts.set(key, next);

    // Only remove the stylesheet from the root when no more instances are using it.
    if (next === 0) {
      this._root.adoptedStyleSheets = this._root.adoptedStyleSheets.filter(
        (s) => s !== this._sheet,
      );
    }
  }
}
