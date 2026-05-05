/**
 * AccName-aware text flattener. Walks the subtree of `root` and concatenates
 * text-node content, REJECTING any element subtree carrying `aria-hidden="true"`
 * or the `hidden` attribute per W3C AccName 1.2 §4.3.10. Used by host-canonical
 * components for both external IDREF flatten (host aria-labelledby/aria-describedby
 * targets) and slotted-label aggregation, so nested decorative content like
 * `<svg aria-hidden="true"><title>icon</title></svg>` does not leak into the
 * announced name/description.
 *
 * The TreeWalker filter only inspects elements VISITED during the walk — it
 * never tests the root itself, so a hidden ROOT (e.g. `<span slot="label" hidden>`)
 * would still contribute its descendants' text. Per AccName 1.2 §4.3.10, a
 * hidden root contributes the empty string. Gate the walk here so every caller
 * honors the rule symmetrically.
 *
 * ## Intentional divergence from AccName 1.2 §4.3.7 (LabelledBy Recursion)
 *
 * The AccName 1.2 spec (§4.3.7 + "Hidden Not Referenced") states that when an
 * element is DIRECTLY referenced by `aria-labelledby` / `aria-describedby`,
 * that referenced element's subtree contributes to the computed name even when
 * the element itself is hidden via `hidden` / `aria-hidden="true"`. The author's
 * explicit IDREF is treated as intent to use that subtree as the name.
 *
 * This helper deliberately diverges from §4.3.7 by applying the §4.3.10 hidden
 * gate uniformly to ALL callers, including the IDREF-target path. Rationale:
 *
 *   1. **Predictability across consumer mental models.** Consumers expect
 *      "visually hidden via `[hidden]` / `aria-hidden=true`" to mean
 *      "semantically removed", full stop. A label that disappears visually but
 *      keeps announcing creates a debugging trap, especially in CMS / Twig
 *      contexts where visibility toggles are often driven by template logic.
 *   2. **Standard accessible-hide pattern is already supported.** Authors who
 *      want a label that is visually hidden but contributes its text via
 *      `aria-labelledby` should use the established `.sr-only` / `.visually-hidden`
 *      pattern (clip-path / position:absolute / width:1px), which neither
 *      attribute affects. That pattern correctly contributes here.
 *   3. **Fail-safe for stale references.** A hidden referenced element is more
 *      often a stale or accidentally-toggled reference than an intentional
 *      hidden-name source. Returning the empty string lets the host fall back
 *      to its next AccName step (aria-label, slotted label, placeholder) rather
 *      than announcing surprising stale content.
 *
 * If a future component genuinely needs strict §4.3.7 behavior, add a second
 * entry point (e.g. `flattenAccNameForIdRef`) that skips the root-level gate
 * and reuses the TreeWalker logic; do not relax this gate globally.
 *
 * Single source of truth for accessible-name flattening across the library.
 * Used by hx-time-picker, hx-date-picker, hx-toggle-button, and any future
 * host-canonical component that aggregates slotted text into an accessible name.
 *
 * @param root - The element whose subtree text content should be flattened.
 * @returns The concatenated, whitespace-collapsed text content with hidden
 *   subtrees excluded.
 */
export function flattenAccName(root: Element): string {
  // §4.3.10 hidden-root gate. Applied uniformly to all callers (slot aggregation
  // AND IDREF-target paths) — see "Intentional divergence" in the JSDoc above for
  // the rationale and the supported sr-only escape hatch.
  if (root.getAttribute('aria-hidden') === 'true' || root.hasAttribute('hidden')) {
    return '';
  }
  let result = '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (el.getAttribute('aria-hidden') === 'true') {
          return NodeFilter.FILTER_REJECT;
        }
        if (el.hasAttribute('hidden')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_SKIP;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let textNode: Node | null = walker.nextNode();
  while (textNode) {
    result += textNode.textContent ?? '';
    textNode = walker.nextNode();
  }
  return result.replace(/\s+/g, ' ').trim();
}
