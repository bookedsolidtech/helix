import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixIconStyles } from './hx-icon.styles.js';

/**
 * An icon component that supports inline SVG fetching and SVG sprite sheet references.
 * Decorative icons are automatically hidden from assistive technology.
 * When a label is provided the icon is announced as an image with that label.
 *
 * **Render modes:**
 * - **Sprite mode** (recommended for Drupal/SSR): Set `name` and optionally `sprite-url`.
 *   Renders an `<svg><use href="...#name">` — works server-side without JavaScript.
 * - **Inline mode**: Set `src` to a URL of a standalone SVG file. The component fetches,
 *   sanitizes, and embeds the SVG markup. Requires JavaScript; not server-side renderable.
 *   For Drupal/Twig templates use sprite mode to avoid content shift before hydration.
 *
 * @summary SVG icon with sprite and inline fetch modes for healthcare applications.
 *
 * @tag hx-icon
 *
 * @csspart svg - The SVG element rendered in sprite mode, or the inline SVG container
 *   in inline mode. In sprite mode this is an `<svg>` element; in inline mode it is a
 *   `<span>` element wrapping the fetched SVG. Both expose the same `part` name for
 *   consistent external styling via `::part(svg)`.
 *
 * @cssprop [--hx-icon-size=var(--hx-size-6,1.5rem)] - Width and height of the icon.
 * @cssprop [--hx-icon-color=currentColor] - Icon color.
 */
@customElement('hx-icon')
export class HelixIcon extends LitElement {
  static override styles = [tokenStyles, helixIconStyles];

  /**
   * Icon name used as the fragment identifier when referencing a sprite sheet.
   * For sprite mode provide the bare symbol id (e.g. `check`). The component
   * will build the full href as `${spriteUrl}#${name}`. If `name` already
   * starts with `#` it is used as-is (inline sprite reference without a base
   * URL).
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * URL of a standalone SVG file to fetch and render inline. Takes precedence
   * over sprite mode when both `src` and `spriteUrl`/`name` are set.
   *
   * **Note:** Inline mode requires browser JavaScript (`fetch` + `DOMParser`).
   * It is not server-side renderable. For Drupal/Twig use sprite mode instead.
   * @attr src
   */
  @property({ type: String })
  src: string | undefined = undefined;

  /**
   * Base URL of the SVG sprite sheet. Used together with `name` to construct
   * the `<use>` href: `${spriteUrl}#${name}`.
   * @attr sprite-url
   */
  @property({ type: String, attribute: 'sprite-url' })
  spriteUrl: string | undefined = undefined;

  /**
   * Size variant of the icon.
   *
   * Set via the `hx-size` HTML attribute (e.g. `hx-size="lg"`) or via the
   * `size` JavaScript property (e.g. `el.size = 'lg'`). Both are equivalent —
   * the `attribute: 'hx-size'` mapping is used to avoid colliding with the
   * native `<input>` `size` attribute in Drupal attribute-passthrough scenarios.
   * The CEM exposes both the JS property name (`size`) and the HTML attribute
   * name (`hx-size`).
   *
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';

  /**
   * Accessible label for the icon. When non-empty, `role="img"` and
   * `aria-label` are applied so assistive technology announces the icon.
   * When empty the icon is treated as decorative and `aria-hidden="true"` is
   * applied.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Stores the sanitized inner markup of an externally fetched SVG.
   */
  @state()
  private _inlineSvg = '';

  /**
   * Tracks the `src` URL that was last successfully fetched so that we only
   * refetch when it genuinely changes.
   */
  @state()
  private _fetchedSrc: string | undefined = undefined;

  /**
   * Monotonically-increasing sequence number. Incremented before each fetch so
   * that stale out-of-order responses can be discarded.
   */
  private _fetchSeq = 0;

  // ─── Lifecycle ───

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('src') && this.src !== this._fetchedSrc) {
      void this._fetchInlineSvg(this.src);
    }
  }

  // ─── Inline SVG Fetch ───

  private async _fetchInlineSvg(url: string | undefined): Promise<void> {
    const seq = ++this._fetchSeq;

    if (!url) {
      this._inlineSvg = '';
      this._fetchedSrc = undefined;
      return;
    }

    // Use module-level cache to avoid duplicate network requests for the same URL.
    // Multiple hx-icon instances sharing the same src will share one in-flight fetch.
    try {
      let pending = _svgCache.get(url);
      if (!pending) {
        pending = fetch(url).then(async (response) => {
          if (!response.ok) {
            _svgCache.delete(url);
            return '';
          }
          return response.text();
        });
        _svgCache.set(url, pending);
      }

      const text = await pending;
      if (seq !== this._fetchSeq) return;

      if (!text) {
        this._inlineSvg = '';
        this._fetchedSrc = undefined;
        return;
      }

      const sanitized = this._sanitizeSvg(text);
      this._inlineSvg = sanitized;
      this._fetchedSrc = url;
    } catch {
      if (seq !== this._fetchSeq) return;
      _svgCache.delete(url);
      this._inlineSvg = '';
      this._fetchedSrc = undefined;
    }
  }

  /**
   * Parses the raw SVG text, strips dangerous content (script elements,
   * foreignObject, on* event-handler attributes, javascript:/data: URIs,
   * and style attributes that could carry CSS injection payloads), and
   * returns the outer SVG markup safe for rendering via `unsafeHTML`.
   *
   * Additionally injects `focusable="false"` on the root SVG element to
   * prevent IE11/old-Edge from making the SVG keyboard-focusable, and strips
   * any ARIA attributes from the inner SVG to prevent conflicts with the
   * wrapper's own ARIA semantics.
   */
  private _sanitizeSvg(raw: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'image/svg+xml');

    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      return '';
    }

    const svgEl = doc.querySelector('svg');
    if (!svgEl) {
      return '';
    }

    // Remove dangerous embedded elements.
    svgEl.querySelectorAll('script, foreignObject').forEach((s) => {
      s.remove();
    });

    // URL-bearing attributes that can carry javascript:/data: payloads.
    const urlAttrs = new Set(['href', 'xlink:href', 'src', 'action', 'formaction']);

    // ARIA attributes that may conflict with the wrapper element's own semantics.
    // The wrapper <span part="svg"> owns role/aria-label/aria-hidden — the inner
    // SVG must not duplicate or contradict these.
    const ariaAttrs = new Set(['role', 'aria-label', 'aria-labelledby', 'aria-hidden']);

    // Sanitize every element including the root svg.
    const allElements: Element[] = [svgEl, ...Array.from(svgEl.querySelectorAll('*'))];
    allElements.forEach((el) => {
      const attrs = Array.from(el.attributes);
      attrs.forEach((attr) => {
        const attrName = attr.name.toLowerCase();
        // Strip event-handler attributes.
        if (attrName.startsWith('on')) {
          el.removeAttribute(attr.name);
          return;
        }
        // Strip style attributes — CSS can carry injection payloads via
        // url(javascript:...), expression(), or external filter/clip-path references.
        if (attrName === 'style') {
          el.removeAttribute(attr.name);
          return;
        }
        // Strip javascript: and data: URIs from URL-bearing attributes.
        if (urlAttrs.has(attrName)) {
          const val = attr.value.replace(/\s/g, '').toLowerCase();
          if (val.startsWith('javascript:') || val.startsWith('data:')) {
            el.removeAttribute(attr.name);
          }
        }
      });
    });

    // Strip ARIA attributes from the root SVG only — they conflict with the
    // wrapper element's ARIA. Child elements' ARIA is left intact.
    ariaAttrs.forEach((a) => svgEl.removeAttribute(a));

    // Inject focusable="false" so IE11/old-Edge do not tab into the SVG.
    svgEl.setAttribute('focusable', 'false');

    return svgEl.outerHTML;
  }

  // ─── Render Helpers ───

  /**
   * Returns the href used in the `<use>` element for sprite mode.
   * If `name` already begins with `#` it is treated as an inline reference.
   */
  private _spriteHref(): string {
    const n = this.name;
    if (n.startsWith('#')) {
      return n;
    }
    const base = this.spriteUrl ?? '';
    return base ? `${base}#${n}` : `#${n}`;
  }

  private _renderSprite() {
    const isDecorative = !this.label.trim();

    return html`
      <svg
        part="svg"
        class="icon__svg"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        role=${isDecorative ? nothing : 'img'}
        aria-label=${isDecorative ? nothing : this.label}
        aria-hidden=${isDecorative ? 'true' : nothing}
        focusable="false"
      >
        ${isDecorative ? nothing : html`<title>${this.label}</title>`}
        <use href=${this._spriteHref()}></use>
      </svg>
    `;
  }

  private _renderInline() {
    if (!this._inlineSvg) {
      return nothing;
    }

    const isDecorative = !this.label.trim();

    // The fetched SVG is rendered inside a wrapper span that carries the
    // csspart and ARIA semantics. The inner SVG from unsafeHTML fills the
    // container via the `.icon__inline svg` CSS rule. ARIA attributes and
    // focusable="false" are injected into the inner SVG by _sanitizeSvg.
    return html`
      <span
        part="svg"
        class="icon__inline"
        role=${isDecorative ? nothing : 'img'}
        aria-label=${isDecorative ? nothing : this.label}
        aria-hidden=${isDecorative ? 'true' : nothing}
      >
        ${unsafeHTML(this._inlineSvg)}
      </span>
    `;
  }

  // ─── Render ───

  override render() {
    // Inline fetch mode takes precedence when src is a non-empty string.
    if (typeof this.src === 'string' && this.src.trim().length > 0) {
      return this._renderInline();
    }

    // Sprite mode: requires at least a name.
    if (this.name) {
      return this._renderSprite();
    }

    return nothing;
  }
}

/**
 * Module-level SVG fetch cache. Shared across all `hx-icon` instances so that
 * multiple icons sharing the same `src` URL issue only one network request.
 * The cache stores in-flight `Promise<string>` values — resolved entries remain
 * cached for the lifetime of the page to prevent redundant re-fetches.
 */
const _svgCache = new Map<string, Promise<string>>();

declare global {
  interface HTMLElementTagNameMap {
    'hx-icon': HelixIcon;
  }
}
