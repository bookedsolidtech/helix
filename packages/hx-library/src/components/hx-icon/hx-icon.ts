import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixIconStyles } from './hx-icon.styles.js';

/**
 * An icon component that supports inline SVG fetching and SVG sprite sheet references.
 * Decorative icons are automatically hidden from assistive technology.
 * When a label is provided the icon is announced as an image with that label.
 *
 * @summary SVG icon with sprite and inline fetch modes for healthcare applications.
 *
 * @tag hx-icon
 *
 * @csspart svg - The SVG element rendered in sprite mode or the wrapper in inline mode.
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
   * The `viewBox` attribute forwarded to the inner `<svg>` element in sprite
   * mode. Override this when your icon set uses a coordinate system other than
   * the default 24×24 grid.
   * @attr view-box
   */
  @property({ type: String, attribute: 'view-box' })
  viewBox = '0 0 24 24';

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

    try {
      const response = await fetch(url);
      if (seq !== this._fetchSeq) return;
      if (!response.ok) {
        this._inlineSvg = '';
        this._fetchedSrc = undefined;
        return;
      }

      const text = await response.text();
      if (seq !== this._fetchSeq) return;
      const sanitized = this._sanitizeSvg(text);
      this._inlineSvg = sanitized;
      this._fetchedSrc = url;
    } catch {
      if (seq !== this._fetchSeq) return;
      this._inlineSvg = '';
      this._fetchedSrc = undefined;
    }
  }

  /**
   * Parses the raw SVG text, strips script elements and event-handler
   * attributes, and returns the outer SVG markup safe for rendering via
   * `unsafeHTML`.
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
    // animate/set/animateTransform/animateMotion can inject javascript: URLs at runtime.
    svgEl
      .querySelectorAll('script, foreignObject, animate, set, animateTransform, animateMotion')
      .forEach((s) => {
        s.remove();
      });

    // URL-bearing attributes that can carry javascript:/data: payloads.
    const urlAttrs = new Set(['href', 'xlink:href', 'src', 'action', 'formaction']);

    // Sanitize every element including the root svg.
    const allElements: Element[] = [svgEl, ...svgEl.querySelectorAll('*')];
    allElements.forEach((el) => {
      const attrs = [...el.attributes];
      attrs.forEach((attr) => {
        const name = attr.name.toLowerCase();
        // Strip event-handler attributes.
        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          return;
        }
        // Strip javascript: and data: URIs from URL-bearing attributes.
        if (urlAttrs.has(name)) {
          const val = attr.value.replace(/\s/g, '').toLowerCase();
          if (val.startsWith('javascript:') || val.startsWith('data:')) {
            el.removeAttribute(attr.name);
          }
        }
      });
    });

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
        viewBox=${this.viewBox}
        xmlns="http://www.w3.org/2000/svg"
        role=${isDecorative ? nothing : 'img'}
        aria-label=${isDecorative ? nothing : this.label}
        aria-hidden=${isDecorative ? 'true' : nothing}
        focusable="false"
      >
        <use href=${this._spriteHref()}></use>
      </svg>
    `;
  }

  private _renderInline() {
    if (!this._inlineSvg) {
      return nothing;
    }

    const isDecorative = !this.label.trim();

    // The fetched SVG is rendered inside a wrapper div that carries the
    // csspart and ARIA semantics. The inner SVG from unsafeHTML fills the
    // container via the `.icon__inline svg` CSS rule.
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

declare global {
  interface HTMLElementTagNameMap {
    'hx-icon': HelixIcon;
  }
}
