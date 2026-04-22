import proseScopedCss from '../../styles/prose/prose.scoped.css?raw';

/**
 * Scoped CSS for hx-prose (applied to light DOM via CSSStyleSheet adoption).
 *
 * @media (forced-colors: active) rules are authored directly in
 * `../../styles/prose/prose.scoped.css` so they remain co-located with the
 * selectors they override. See the bottom of that file for the complete
 * forced-colors block.
 */
export const helixProseScopedCss = proseScopedCss;
