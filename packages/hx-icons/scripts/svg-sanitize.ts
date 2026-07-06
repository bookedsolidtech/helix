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

/**
 * Paint values that are safe to keep because they cooperate with the cascade.
 *
 * SVG/CSS paint keywords are case-INSENSITIVE, so the lookup lowercases both the
 * candidate value and these entries before comparing (see {@link sanitizeAttrs}).
 * Entries are stored lowercase; the ORIGINAL author-cased value is preserved in
 * the output — only the comparison is case-folded.
 */
const PRESERVED_PAINT = new Set(
  ['currentColor', 'none', 'inherit', 'context-fill', 'context-stroke', 'transparent'].map((v) =>
    v.toLowerCase(),
  ),
);

/**
 * Escape a string for safe interpolation into a double-quoted XML/SVG attribute
 * value. Third-party source SVGs (under node_modules) can carry malformed
 * attribute values containing `"`, `<`, `>`, or `&`; concatenating those raw
 * into a serialized `<symbol>` could break out of the attribute and inject
 * arbitrary markup into a published sprite artifact. Every preserved attribute
 * value MUST pass through this helper before interpolation.
 */
export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

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
    // Paint keywords are case-insensitive: compare lowercased against the
    // lowercased PRESERVED_PAINT set (e.g. `currentcolor`, `CONTEXT-STROKE`
    // must survive) while keeping the original author-cased value in output.
    if (value !== null && !PRESERVED_PAINT.has(value.trim().toLowerCase())) {
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
