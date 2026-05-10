import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { getIconLibrary } from '@helixui/icons';
import type { IconLibrary } from '@helixui/icons';
import { HelixElement } from '../../base/index.js';
import { helixIconStyles } from './hx-icon.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';

/**
 * An icon component that resolves through the `@helixui/icons` registry,
 * with sprite-sheet and inline-fetch escape hatches for legacy / consumer
 * patterns. Decorative icons are automatically hidden from assistive
 * technology. When a label is provided the icon is announced as an image
 * with that label.
 *
 * **Render modes (in resolution order):**
 * 1. **Inline fetch (`src`)** — Set `src` to a URL of a standalone SVG file.
 *    The component fetches, sanitizes, and embeds the SVG markup. Requires
 *    JavaScript; not server-side renderable. Library attribute is ignored.
 * 2. **Explicit sprite (`sprite-url` + `name`)** — Pin the sprite URL on the
 *    element instead of resolving through the registry. Library attribute is
 *    ignored.
 * 3. **Registry (`library` + `name`)** (recommended) — Resolves through the
 *    `@helixui/icons` registry. Defaults to `library="fa-free"` (the FA Free
 *    Solid set bundled with `@helixui/icons`). Set `library="helix"` for the
 *    curated 32-glyph helix set. Consumer libraries register via
 *    `registerIconLibrary()` and become resolvable here without modifying the
 *    component.
 * 4. **No name / no src** — Renders nothing.
 *
 * @summary SVG icon with registry resolution + sprite and inline-fetch escape hatches.
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
 * @cssprop [--hx-icon-stroke-width=2] - Default stroke width consumed by stroke-paint and mixed-paint icon libraries (Lucide, Heroicons-outline, Phosphor). Built-in helix + fa-free libraries are fill-only and ignore this token.
 * @cssprop [--hx-size-4] - Size token.
 * @cssprop [--hx-size-5] - Size token.
 * @cssprop [--hx-size-6] - Size token.
 * @cssprop [--hx-size-8] - Size token.
 * @cssprop [--hx-size-10] - Size token.
 *
 * @aaa-certified 2026-05-10
 * @aaa-criteria 1.4.9,3.2.5,forced-colors,apg-keyboard,non-text-contrast-icon
 * @aaa-audit src/components/hx-icon/AAA-AUDIT.md
 * @aria-pattern none
 * @forced-colors-supported true
 * @stability stable
 * @since 3.9.0
 * @priority-tier P0
 */
@customElement('hx-icon')
export class HelixIcon extends HelixElement {
  static override styles = [helixIconStyles, forcedColorsSurface];

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
   * Identifier of the icon library to resolve `name` through. Default is
   * the empty string — meaning bare `<hx-icon name="foo">` continues to
   * render a document-local sprite fragment (`<use href="#foo">`) per the
   * pre-3.9.0 contract. Set explicitly to `'fa-free'` for the FA Free Solid
   * set bundled with `@helixui/icons`, `'helix'` for the curated 32-glyph
   * helix set, or to any consumer-registered library identifier.
   *
   * Library resolution applies only when `src` is empty AND `sprite-url` is
   * not set; the inline-fetch and explicit-sprite paths are kept as escape
   * hatches and ignore the library attribute.
   * @attr library
   */
  @property({ type: String, reflect: true })
  library: string = '';

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
   * native HTMLInputElement `size` attribute in Drupal attribute-passthrough
   * scenarios.
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
   * Comma-separated list of allowed origins for cross-origin SVG fetches.
   * By default, only same-origin URLs are permitted. Set this to allow
   * specific CDN or asset server origins (e.g., "https://cdn.example.com,https://assets.example.com").
   * @attr allowed-origins
   */
  @property({ type: String, attribute: 'allowed-origins' })
  allowedOrigins = '';

  /**
   * Stores the sanitized inner markup of an externally fetched SVG.
   * @internal
   */
  @state()
  private _inlineSvg = '';

  /**
   * Tracks the `src` URL that was last successfully fetched so that we only
   * refetch when it genuinely changes.
   * @internal
   */
  @state()
  private _fetchedSrc: string | undefined = undefined;

  /**
   * Tracks the (library, name) pair that was last resolved to an inline-fetch
   * URL via the registry. Distinct from `_fetchedSrc` so the explicit `src`
   * attribute and registry-driven inline mode never thrash each other.
   * @internal
   */
  @state()
  private _fetchedLibraryKey: string | undefined = undefined;

  /**
   * De-duplication set for unknown-library warnings. Keyed by
   * `${library} ${name}` so each unique pair logs at most once.
   * @internal
   */
  private static readonly _unknownLibraryWarned = new Set<string>();

  /**
   * Monotonically-increasing sequence number. Incremented before each fetch so
   * that stale out-of-order responses can be discarded.
   */
  /** @internal */
  private _fetchSeq = 0;

  // ─── Lifecycle ───

  /**
   * Listener for late-registered icon libraries. When a consumer calls
   * `registerIconLibrary()` AFTER hx-icon instances have already rendered,
   * the registry fires `helixicon-library-registered` on globalThis. Each
   * mounted hx-icon listens and re-resolves so the new library takes
   * effect without manual re-render.
   * @internal
   */
  private _onLibraryRegistered = (e: Event): void => {
    const detail = (e as CustomEvent<{ name: string }>).detail;
    // Only re-resolve if the registered library matches our current one.
    // Avoids unnecessary re-renders for every other registration on the page.
    if (!detail || detail.name === this.library) {
      // Reset the cached fetch identity so library-driven inline mode re-fetches.
      this._fetchedLibraryKey = undefined;
      this.requestUpdate();
      // For fetch-mode (`spriteSheet: false`) libraries, requestUpdate alone
      // re-renders but doesn't trigger _maybeFetchLibraryIcon (which is gated
      // on changed-property detection in updated()). Fire it explicitly so
      // late-registered inline-fetch libraries actually fetch.
      void this._maybeFetchLibraryIcon();
    }
  };

  /**
   * Listener for setBasePath() changes. When the registry's base path is
   * mutated after mount, sprite-mode icons need to re-resolve against the
   * new path; inline-fetch icons need to re-fetch with the new URL.
   * @internal
   */
  private _onBasePathChanged = (): void => {
    this._fetchedLibraryKey = undefined;
    this.requestUpdate();
    void this._maybeFetchLibraryIcon();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof globalThis.addEventListener === 'function') {
      globalThis.addEventListener('helixicon-library-registered', this._onLibraryRegistered);
      globalThis.addEventListener('helixicon-base-path-changed', this._onBasePathChanged);
    }
  }

  override disconnectedCallback(): void {
    if (typeof globalThis.removeEventListener === 'function') {
      globalThis.removeEventListener('helixicon-library-registered', this._onLibraryRegistered);
      globalThis.removeEventListener('helixicon-base-path-changed', this._onBasePathChanged);
    }
    super.disconnectedCallback();
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);

    // Inline-fetch via explicit `src` takes precedence and resets any
    // previous library-driven inline state so the two paths never overlay.
    if (changed.has('src') && this.src !== this._fetchedSrc) {
      this._fetchedLibraryKey = undefined;
      void this._fetchInlineSvg(this.src);
      // Don't return — fall through so a CLEARED src can still trigger
      // library fetch if the component falls back to registry resolution.
    }

    // When neither `src` nor `spriteUrl` is set, the library + name pair
    // drives resolution. Registry libraries that declare `spriteSheet: false`
    // require an inline fetch (with optional post-sanitize mutator). Detect
    // changes to library / name AND to src / sprite-url (so clearing an
    // explicit source falls back to library fetch instead of leaving the
    // icon stuck on empty inline content).
    const hasExplicitSrc = typeof this.src === 'string' && this.src.trim().length > 0;
    const hasExplicitSprite = typeof this.spriteUrl === 'string' && this.spriteUrl.length > 0;
    if (
      !hasExplicitSrc &&
      !hasExplicitSprite &&
      (changed.has('library') ||
        changed.has('name') ||
        changed.has('src') ||
        changed.has('spriteUrl'))
    ) {
      void this._maybeFetchLibraryIcon();
    }
  }

  // ─── Inline SVG Fetch ───

  /** @internal */
  private async _fetchInlineSvg(url: string | undefined): Promise<void> {
    const seq = ++this._fetchSeq;

    if (!url) {
      this._inlineSvg = '';
      this._fetchedSrc = undefined;
      return;
    }

    // Validate URL origin — only allow same-origin or data: URIs by default.
    // Cross-origin SVGs are blocked unless explicitly allowed via allowedOrigins.
    if (!this._isAllowedOrigin(url)) {
      console.warn(
        `[hx-icon] Blocked cross-origin SVG fetch: "${url}". ` +
          'Only same-origin URLs are allowed by default. ' +
          'Set the allowed-origins attribute to permit specific external origins.',
      );
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
   * Checks whether a URL is same-origin or matches the configured allowedOrigins.
   * Relative URLs and data: URIs are always allowed. Cross-origin URLs are blocked
   * unless their origin appears in the allowedOrigins list.
   * @internal
   */
  private _isAllowedOrigin(url: string): boolean {
    // Relative URLs are always same-origin
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return true;
    }

    try {
      const parsed = new URL(url, window.location.href);

      // Same-origin is always allowed
      if (parsed.origin === window.location.origin) {
        return true;
      }

      // Check configured allowlist
      if (this.allowedOrigins) {
        const allowed = this.allowedOrigins
          .split(',')
          .map((o) => o.trim().toLowerCase())
          .filter(Boolean);
        return allowed.includes(parsed.origin.toLowerCase());
      }

      return false;
    } catch {
      // Unparseable URL — block it
      return false;
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
  /** @internal */
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

    // Remove dangerous embedded elements:
    // - script: arbitrary code execution
    // - foreignObject: can embed arbitrary HTML including scripts
    // - style: CSS injection (url() payloads, expression(), external references)
    // - animate, animateTransform, animateMotion, set: SMIL animation elements
    //   can trigger event handlers and modify attributes to bypass sanitization
    const dangerousElements = [
      'script',
      'foreignObject',
      'style',
      'animate',
      'animateTransform',
      'animateMotion',
      'set',
    ];
    svgEl.querySelectorAll(dangerousElements.join(', ')).forEach((s) => {
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

  // ─── Registry Resolution ───

  /**
   * Looks up the configured library in the `@helixui/icons` registry and
   * returns either:
   *   - `{ kind: 'sprite', href }` for sprite-sheet libraries (the default
   *     `helix` and `fa-free` bundles)
   *   - `{ kind: 'inline', url, library }` for fetch-mode libraries that may
   *     also carry a post-sanitize mutator
   *   - `null` if the library is unknown (warning logged once per unique
   *     library+name pair)
   * @internal
   */
  private _resolveLibraryHref():
    | { kind: 'sprite'; href: string }
    | { kind: 'inline'; url: string; library: IconLibrary }
    | null {
    const lib = getIconLibrary(this.library);
    if (!lib) {
      // Empty `library` is the documented opt-out for legacy bare-name
      // + document-local sprite usage. Don't warn — the caller is opting
      // OUT of registry resolution, not asking for a missing library.
      if (this.library === '') return null;
      const key = `${this.library} ${this.name}`;
      if (!HelixIcon._unknownLibraryWarned.has(key)) {
        HelixIcon._unknownLibraryWarned.add(key);
        console.warn(
          `[hx-icon] Unknown icon library "${this.library}" requested for name "${this.name}". ` +
            'Register it via registerIconLibrary() from @helixui/icons before use.',
        );
      }
      return null;
    }
    let resolved: string;
    try {
      resolved = lib.resolver(this.name);
    } catch (err) {
      console.warn(
        `[hx-icon] Resolver for library "${this.library}" threw on name "${this.name}":`,
        err,
      );
      return null;
    }
    if (typeof resolved !== 'string' || resolved.length === 0) {
      return null;
    }
    if (lib.spriteSheet) {
      return { kind: 'sprite', href: resolved };
    }
    return { kind: 'inline', url: resolved, library: lib };
  }

  /**
   * Drives the inline-fetch path for registry libraries that declare
   * `spriteSheet: false`. Reuses `_fetchInlineSvg` for security sanitization
   * and the `_svgCache` module-level dedupe, then layers the optional
   * library mutator on top of the sanitized markup.
   * @internal
   */
  private async _maybeFetchLibraryIcon(): Promise<void> {
    const resolved = this._resolveLibraryHref();
    // Sprite libraries render synchronously via `<use>` — no fetch needed.
    if (!resolved || resolved.kind !== 'inline') {
      this._fetchedLibraryKey = undefined;
      // Clear any prior library-driven inline content so a sprite library
      // does not paint over with stale fetch markup.
      if (!this.src) {
        this._inlineSvg = '';
      }
      return;
    }
    const key = `${this.library} ${this.name} ${resolved.url}`;
    if (this._fetchedLibraryKey === key) return;
    this._fetchedLibraryKey = key;
    await this._fetchInlineSvg(resolved.url);
    // After sanitization, apply the optional library mutator on the parsed
    // SVG, then re-serialize. Mutation is best-effort: a thrown mutator
    // falls back to the un-mutated sanitized markup.
    // Race guard: between the await above and now, `library` or `name`
    // may have changed and a newer fetch may have superseded this one.
    // Re-check the fetch identity before mutating — otherwise library A's
    // mutator could apply to library B's already-rendered SVG.
    if (this._fetchedLibraryKey === key && resolved.library.mutator && this._inlineSvg) {
      this._inlineSvg = this._applyLibraryMutator(this._inlineSvg, resolved.library);
    }
  }

  /**
   * Re-parses sanitized SVG markup, runs the library's mutator on the root
   * SVGElement, and re-serializes. Sanitization always runs FIRST in
   * `_fetchInlineSvg`; the mutator never sees raw consumer SVG.
   * @internal
   */
  private _applyLibraryMutator(sanitized: string, library: IconLibrary): string {
    if (!library.mutator) return sanitized;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(sanitized, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) return sanitized;
      library.mutator(svg as unknown as SVGElement);
      return svg.outerHTML;
    } catch (err) {
      console.warn(
        `[hx-icon] Mutator for library "${library.name}" threw on name "${this.name}"; rendering un-mutated SVG.`,
        err,
      );
      return sanitized;
    }
  }

  // ─── Render Helpers ───

  /**
   * Returns the href used in the `<use>` element for explicit sprite mode.
   * If `name` already begins with `#` it is treated as an inline reference.
   */
  /** @internal */
  private _spriteHref(): string {
    const n = this.name;
    if (n.startsWith('#')) {
      return n;
    }
    const base = this.spriteUrl ?? '';
    return base ? `${base}#${n}` : `#${n}`;
  }

  /** @internal */
  private _renderSprite(href?: string) {
    const isDecorative = !this.label.trim();
    const useHref = href ?? this._spriteHref();

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
        <use href=${useHref}></use>
      </svg>
    `;
  }

  /** @internal */
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
    // 1. Inline fetch mode takes precedence when src is a non-empty string.
    //    Library attribute is ignored on this path.
    if (typeof this.src === 'string' && this.src.trim().length > 0) {
      return this._renderInline();
    }

    // 2. Explicit sprite-url + name. Library attribute is ignored — the
    //    consumer is pinning the sheet location explicitly. An empty
    //    string `sprite-url=""` is treated as an explicit opt-out of
    //    registry resolution and renders `<use href="#${name}">` —
    //    consumers who want strict document-local sprite behavior
    //    can pin it that way without setting `library=""`.
    if (typeof this.spriteUrl === 'string' && this.name) {
      return this._renderSprite();
    }

    // 2b. In-document fragment reference (`name="#custom-icon"`). Library
    //     attribute is ignored — the consumer is pointing at a sprite symbol
    //     embedded directly in the host page.
    if (this.name.startsWith('#')) {
      return this._renderSprite();
    }

    // 3. Registry resolution — only when `library` is explicitly set to a
    //    registered library name. The default empty `library` preserves
    //    the pre-3.9.0 contract (bare `name` → document-local sprite
    //    fragment) so existing markup keeps working unchanged. Consumers
    //    opt INTO registry resolution by setting `library="fa-free"`,
    //    `library="helix"`, or any registered custom library.
    if (this.name && this.library) {
      const resolved = this._resolveLibraryHref();
      if (!resolved) return nothing;
      if (resolved.kind === 'sprite') {
        return this._renderSprite(resolved.href);
      }
      // Inline fetch mode driven by the registry — markup populated by
      // `_maybeFetchLibraryIcon` after sanitization + mutator pass.
      return this._renderInline();
    }

    // 4. Bare `name` (no library) → document-local sprite fragment
    //    (`<use href="#<name>">`). Pre-3.9.0 contract preserved.
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
