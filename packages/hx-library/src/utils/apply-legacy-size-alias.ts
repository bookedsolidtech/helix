import { devWarn } from './dev-warn.js';

/**
 * Backward-compatibility shim for the legacy unprefixed `size` attribute.
 *
 * HELiX components expose sizing through the `hx-size` attribute (the `hx-`
 * prefix avoids colliding with the native `size` attribute on form controls
 * such as `<input size>`). Some components historically accepted a bare `size`
 * attribute; this helper preserves that contract without duplicating the
 * read-warn-assign block in every `connectedCallback`.
 *
 * When the host carries a legacy `size` attribute AND no explicit `hx-size`,
 * the value is forwarded to the component's `size` property and a one-time
 * deprecation warning is emitted (DEV/test only — `devWarn` is tree-shaken from
 * production builds). If `hx-size` is present it always wins; the legacy
 * attribute is ignored.
 *
 * This is an additive 3.x compatibility shim. The legacy `size` attribute is
 * slated for removal in 4.0 (see docs/audit/BREAKING-CHANGES-4.0.md).
 *
 * @typeParam Size - The component's size union (e.g. `'sm' | 'md' | 'lg'`).
 * @param el      - The host element (read `size`/`hx-size` attributes from it).
 * @param tagName - The component tag name, used as the deprecation-warning prefix.
 * @param assign  - Callback that writes the resolved value to the component's
 *                  `size` reactive property (kept as a callback so the call site
 *                  retains its concrete union type rather than widening to string).
 *
 * @example
 * ```ts
 * override connectedCallback(): void {
 *   super.connectedCallback();
 *   applyLegacySizeAlias<BadgeSize>(this, 'hx-badge', (v) => { this.size = v; });
 * }
 * ```
 *
 * @internal
 */
export function applyLegacySizeAlias<Size extends string>(
  el: HTMLElement,
  tagName: string,
  assign: (value: Size) => void,
): void {
  const legacySize = el.getAttribute('size');
  if (legacySize !== null && !el.hasAttribute('hx-size')) {
    devWarn(tagName, 'The "size" attribute is deprecated. Use "hx-size" instead.');
    assign(legacySize as Size);
  }
}
