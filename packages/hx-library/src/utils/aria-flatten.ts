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
 * Single source of truth for accessible-name flattening across the library.
 * Used by hx-time-picker, hx-toggle-button, hx-color-picker, and any future
 * host-canonical component that aggregates slotted text into an accessible name.
 *
 * @param root - The element whose subtree text content should be flattened.
 * @returns The concatenated, whitespace-collapsed text content with hidden
 *   subtrees excluded.
 */
export function flattenAccName(root: Element): string {
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
