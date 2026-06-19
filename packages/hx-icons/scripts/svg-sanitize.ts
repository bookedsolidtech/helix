/**
 * Shared SVG sanitization for the sprite + tree-shake generators.
 *
 * Strips attributes that would either leak into the surrounding document
 * (`id` / `class` / `style`) or fight the host's `currentColor` / paint-mode
 * cascade (HARDCODED `fill` / `stroke` colors), plus every `aria-*` attribute
 * (`<hx-icon>` applies its own ARIA at the host level).
 *
 * Cascade-compatible / structural paint values — `currentColor`, `none`,
 * `inherit`, `context-fill`, `context-stroke` — are PRESERVED. This matters for
 * stroke glyphs that carry an explicit `<… fill="currentColor">` terminal dot
 * (e.g. Lucide `tag`, `key-round`, `chart-scatter`): stripping that fill would
 * leave the dot to inherit the stroke-mode `fill: none` and hollow it out.
 */

/** Paint values that are safe to keep because they cooperate with the cascade. */
const PRESERVED_PAINT = new Set([
  'currentColor',
  'none',
  'inherit',
  'context-fill',
  'context-stroke',
]);

/**
 * Sanitize a single element in place. `Element` is the DOM-lib shape; linkedom
 * elements are structurally compatible and passed through with a cast at the
 * call sites.
 */
export function sanitizeAttrs(el: Element): void {
  for (const attr of ['id', 'class', 'style']) {
    el.removeAttribute(attr);
  }
  for (const attr of ['fill', 'stroke']) {
    const value = el.getAttribute(attr);
    if (value !== null && !PRESERVED_PAINT.has(value.trim())) {
      el.removeAttribute(attr);
    }
  }
  for (const name of el.getAttributeNames()) {
    if (name.startsWith('aria-')) el.removeAttribute(name);
  }
}

/** Sanitize an element and all of its descendants. */
export function sanitizeTree(root: Element): void {
  sanitizeAttrs(root);
  for (const child of Array.from(root.children)) {
    sanitizeTree(child as Element);
  }
}
