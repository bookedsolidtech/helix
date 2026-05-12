//
// Code snippets for the Accessibility section MDX pages. Lifted out of the
// MDX <CodeBlock code={`…`} /> props because prettier-mdx mishandles the
// CSS block-comment syntax inside JSX template literals — the inner `*`
// characters are interpreted as Markdown emphasis when the file is
// reformatted, and indentation is flattened.
//
// Plain `.ts` constants are formatted by prettier-typescript instead,
// which leaves CSS and JS comments alone. This module also doubles as
// the extraction surface a `create-helix-app` consumer can reach for if
// they want to mirror the canonical patterns in their own docs preset.
//

// Mirrors the real hx-button forced-colors block in
// packages/hx-library/src/components/hx-button/hx-button.styles.ts — paired
// with explicit forced-color-adjust: none so the system keywords below
// (ButtonFace/ButtonText/Highlight/HighlightText) win deterministically.
export const FORCED_COLORS_BUTTON_CSS = `/* author tokens — apply in every mode, including forced-colors */
:host {
  background: var(--hx-color-action-primary-bg);
  color: var(--hx-color-text-on-primary);
  border: 1px solid currentColor;
}

/* forced-colors layer — system keywords win for structural roles */
@media (forced-colors: active) {
  .button {
    /* Opt out of the UA's automatic palette substitution so the system
       keywords below apply deterministically. */
    forced-color-adjust: none;
    background-color: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonText;
  }

  .button:hover {
    /* Hover affordance must survive in HC. Highlight/HighlightText is the
       OS-level "selected" pair — applied on hover for ALL button variants,
       NOT as the resting style of variant='primary'. */
    background-color: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }

  .button:focus-visible {
    /* Focus ring tracks the user's selection accent. hx-button uses a
       3px outline with a 2px offset in this branch. */
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }

  .button[disabled] {
    /* GrayText is the user's "unavailable" cue. */
    background-color: ButtonFace;
    color: GrayText;
    border-color: GrayText;
    opacity: 1;
  }
}`;

export const FORCED_COLORS_DONT_CSS = `/* DON'T — opting out of forced-colors silences the user's palette. */
:host {
  forced-color-adjust: none;
  background: #003a8c;
  color: #ffffff;
}

/* DON'T — author colour overrides Highlight; the focus ring disappears
   on user palettes that map Highlight to a contrasting accent. */
@media (forced-colors: active) {
  :host(:focus-visible) {
    outline-color: #1f6feb;
  }
}

/* DON'T — image-as-icon: lost entirely in forced-colors. */
.icon {
  background-image: url('chevron.svg');
}`;

export const FORCED_COLORS_DO_CSS = `/* DO — let the cascade keep author colours in normal mode, swap to
   system keywords inside the forced-colors block. */
:host {
  background: var(--hx-color-action-primary-bg);
  color: var(--hx-color-text-on-primary);
}

@media (forced-colors: active) {
  :host {
    background: ButtonFace;
    color: ButtonText;
  }
  :host(:focus-visible) {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}

/* DO — use real SVG \`currentColor\` so the icon takes the user palette. */
.icon {
  fill: currentColor;
  stroke: currentColor;
}`;

export const FOCUS_RING_CSS = `/*
 * hx-button paints the focus ring on the inner .button element with
 * :focus-visible so keyboard users see the ring on Tab and mouse users
 * do not see it on click. Field components (hx-text-input, hx-select,
 * hx-textarea) render an outline-style focus indicator on every focus
 * regardless of pointer type — the inner input is :focus, not
 * :focus-visible.
 */
.button:focus-visible {
  outline: var(--hx-focus-ring-width, 2px) solid
    var(--hx-button-focus-ring-color, var(--hx-focus-ring-color));
  outline-offset: var(--hx-focus-ring-offset, 2px);
}

/* Forced-colors — user palette wins. */
@media (forced-colors: active) {
  .button:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}`;

export const DIALOG_HTML = `<hx-button id="open-prefs">Open preferences</hx-button>

<!-- Either set the heading attribute (recommended — renders the built-in <h2>)
     OR slot your own header element; do not do both, or the dialog renders two
     headings. The heading="..." attribute is the canonical pattern. -->
<hx-dialog id="prefs" heading="Preferences">
  <!-- Native focusable controls; hx-dialog gathers tabbable shadow-DOM
       focusables from slotted content, but the standard reliable
       initial-focus targets are native inputs / buttons. -->
  <input type="text" aria-label="Display name" autofocus>
  <input type="email" aria-label="Email">

  <hx-button id="prefs-cancel" slot="footer" variant="ghost">Cancel</hx-button>
  <hx-button id="prefs-save" slot="footer" variant="primary">Save</hx-button>
</hx-dialog>`;

export const DIALOG_TS = `const trigger = document.querySelector<HelixButton>('#open-prefs')!;
const dialog = document.querySelector<HelixDialog>('#prefs')!;
const cancelBtn = document.querySelector<HelixButton>('#prefs-cancel')!;

trigger.addEventListener('hx-click', () => {
  // showModal() guarantees the modal trap, inert backdrop, and
  // return-focus contract regardless of the \`modal\` property.
  // (show() opens non-modal by default.)
  dialog.showModal();
});

cancelBtn.addEventListener('hx-click', () => dialog.close());

dialog.addEventListener('hx-close', () => {
  // Focus returns to the element that opened the dialog automatically.
  // hx-cancel fires on Escape / backdrop dismiss; subscribe separately
  // if you need to distinguish a user dismissal from a code-driven close.
});`;

export const ROVING_TABINDEX_TS = `/**
 * Roving-tabindex behaviour is implemented per-component (hx-tabs,
 * hx-menu, hx-radio-group) rather than through a single shared controller
 * class; the canonical reference is hx-tabs' keydown handler below
 * (see TABS_KEYDOWN_TS) which most other roving-tabindex widgets follow.
 *
 * The contract every widget honours:
 *   - Active item: tabindex="0"; siblings: tabindex="-1".
 *   - Arrow keys advance the active index inside the widget.
 *   - Home/End jump to the first / last enabled item.
 *   - Tab leaves the widget entirely — no internal Tab cycling.
 */`;

export const TABS_KEYDOWN_TS = `#onKeydown = (event: KeyboardEvent) => {
  const tabs = this.#tabs;
  if (!tabs.length) return;

  const activeIndex = tabs.findIndex((tab) => tab === document.activeElement);
  let nextIndex = activeIndex;

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      nextIndex = (activeIndex + 1) % tabs.length;
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      nextIndex = (activeIndex - 1 + tabs.length) % tabs.length;
      break;
    case 'Home':
      nextIndex = 0;
      break;
    case 'End':
      nextIndex = tabs.length - 1;
      break;
    case 'Enter':
    case ' ':
      this.#activate(tabs[activeIndex]);
      event.preventDefault();
      return;
    default:
      return;
  }

  // Roving tabindex — only one stop in the group.
  tabs.forEach((tab, idx) => {
    tab.tabIndex = idx === nextIndex ? 0 : -1;
  });
  tabs[nextIndex].focus();
  event.preventDefault();
};`;

export const CONTRAST_RATIO_TS = `/**
 * WCAG 2.2 contrast ratio for two sRGB hex colours.
 *
 *   1.4.3 (AA)  ≥ 4.5  for normal text
 *   1.4.6 (AAA) ≥ 7.0  for normal text
 *   1.4.11      ≥ 3.0  for non-text UI components
 *
 * The WCAG 2.x formula and the formal sRGB linearization threshold
 * (0.04045 — the precise value from IEC 61966-2-1 sRGB) are unchanged
 * from WCAG 2.1. Older docs cite 0.03928 (the value WCAG 2.0 quoted
 * before the 2.1 erratum); HELiX uses 0.04045.
 *
 * Returns a number in the range [1.0, 21.0].
 */
export function contrastRatio(fgHex: string, bgHex: string): number {
  const lf = relativeLuminance(fgHex);
  const lb = relativeLuminance(bgHex);
  const [light, dark] = lf > lb ? [lf, lb] : [lb, lf];
  return (light + 0.05) / (dark + 0.05);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((c) => {
    const s = c / 255;
    // Per WCAG: linearise sRGB before luminance.
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  // ITU-R BT.709 luminance coefficients.
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}`;

export const REGENERATE_CONTRAST_BASH = `# Regenerate the committed @helixui/tokens contrast report module from
# the current token cascade. Storybook imports the committed module
# (not the gitignored .cache/contrast-report.json fixture) at build
# time, so commit the regenerated module to surface the new matrix.

pnpm --filter=@helixui/tokens run contrast:report

# Then rebuild storybook (or restart dev) to surface the new matrix:
pnpm --filter=@helixui/storybook run build`;
