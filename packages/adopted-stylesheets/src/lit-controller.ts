/**
 * @module lit-controller
 *
 * Lit ReactiveController wrapper for the adopted stylesheets registry.
 *
 * Attach this controller to any Lit element to automatically adopt stylesheets
 * when the element connects to the DOM and remove them (reference-counted) when
 * it disconnects.
 *
 * The controller targets the element's root node (`ShadowRoot` or `Document`),
 * so the same stylesheet instance can be shared across multiple elements in the
 * same shadow tree without duplicate adoption.
 *
 * Lit is an **optional** peer dependency. This file uses `import type` so that
 * the runtime bundle has no hard dependency on the `lit` package. Tree-shakers
 * will strip the import entirely in non-Lit projects.
 *
 * @example
 * ```ts
 * import { LitElement } from 'lit';
 * import { customElement } from 'lit/decorators.js';
 * import { AdoptedStylesheetsController, createStyleSheet } from '@helixui/adopted-stylesheets';
 *
 * const globalSheet = createStyleSheet(':root { --hx-color-primary: #2563EB; }');
 *
 * @customElement('my-element')
 * class MyElement extends LitElement {
 *   private _globalStyles = new AdoptedStylesheetsController(this, globalSheet);
 * }
 * ```
 */

import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { adoptStyles, removeStyles } from './adopt-styles.js';

// ---------------------------------------------------------------------------
// Controller implementation
// ---------------------------------------------------------------------------

/**
 * A Lit `ReactiveController` that adopts CSSStyleSheet instances on the
 * host element's root node when connected, and removes them (ref-counted)
 * when disconnected.
 *
 * Pass one or more pre-created `CSSStyleSheet` objects (use `createStyleSheet`
 * for content-hash deduplication) to the constructor alongside the host.
 */
export class AdoptedStylesheetsController implements ReactiveController {
  private readonly _host: ReactiveControllerHost & Element;
  private readonly _sheets: CSSStyleSheet[];

  /**
   * @param host - The Lit element that owns this controller.
   * @param sheets - One or more CSSStyleSheet instances to manage.
   */
  constructor(host: ReactiveControllerHost & Element, ...sheets: CSSStyleSheet[]) {
    this._host = host;
    this._sheets = sheets;
    host.addController(this);
  }

  /**
   * Called by Lit when the host element connects to the DOM.
   * Adopts all managed stylesheets on the host's root node.
   */
  hostConnected(): void {
    const root = this._host.getRootNode();
    if (root instanceof ShadowRoot || root instanceof Document) {
      adoptStyles(root, ...this._sheets);
    }
  }

  /**
   * Called by Lit when the host element disconnects from the DOM.
   * Decrements the reference count for all managed stylesheets; sheets are
   * removed from `adoptedStyleSheets` only when the count reaches zero.
   */
  hostDisconnected(): void {
    const root = this._host.getRootNode();
    if (root instanceof ShadowRoot || root instanceof Document) {
      removeStyles(root, ...this._sheets);
    }
  }
}
