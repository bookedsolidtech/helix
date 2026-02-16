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
 * ensuring each unique stylesheet is created only once and cleaned up on
 * disconnect.
 */
export class AdoptedStylesheetsController implements ReactiveController {
  /** Global cache keyed by cssText to avoid creating duplicate CSSStyleSheet instances. */
  private static _cache = new Map<string, CSSStyleSheet>();

  private readonly _host: ReactiveControllerHost & HTMLElement;
  private readonly _cssText: string;
  private readonly _root: Document | ShadowRoot;
  private _sheet: CSSStyleSheet | undefined;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    cssText: string,
    root: Document | ShadowRoot = document,
  ) {
    this._host = host;
    this._cssText = cssText;
    this._root = root;
    this._host.addController(this);
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
  }

  hostDisconnected(): void {
    if (this._sheet) {
      this._root.adoptedStyleSheets = this._root.adoptedStyleSheets.filter(
        (s) => s !== this._sheet,
      );
    }
  }
}
