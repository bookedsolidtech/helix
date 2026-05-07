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

export const FORCED_COLORS_BUTTON_CSS = `/* author tokens — apply in every mode, including forced-colors */
:host {
  background: var(--hx-color-action-primary-bg);
  color: var(--hx-color-action-primary-text);
  border: 1px solid var(--hx-color-action-primary-border);
}

/* forced-colors layer — system keywords win for structural roles */
@media (forced-colors: active) {
  :host {
    /* Surface + text become the user's button palette. */
    background: ButtonFace;
    color: ButtonText;
    border-color: ButtonText;
  }

  :host(:focus-visible) {
    /* Focus ring tracks the user's selection accent. */
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  :host([variant='primary']) {
    /* Primary lifts to the selection accent in HC mode. */
    background: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }

  :host([disabled]) {
    /* GrayText is the user's "unavailable" cue. */
    color: GrayText;
    border-color: GrayText;
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
  color: var(--hx-color-action-primary-text);
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

export const FOCUS_RING_CSS = `/* Default — no ring on mouse activation. */
:host {
  outline: none;
}

/* Keyboard activation only. The user agent decides; we do not author it. */
:host(:focus-visible) {
  outline: 2px solid var(--hx-color-focus-ring);
  outline-offset: 2px;
}

/* Forced-colors — user palette wins. */
@media (forced-colors: active) {
  :host(:focus-visible) {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}`;

export const DIALOG_HTML = `<hx-button id="open-prefs">Open preferences</hx-button>

<hx-dialog id="prefs" aria-labelledby="prefs-title">
  <h2 id="prefs-title" slot="header">Preferences</h2>

  <hx-text-input label="Display name" autofocus></hx-text-input>
  <hx-text-input label="Email"></hx-text-input>

  <hx-button slot="footer" variant="ghost" data-dialog-close>Cancel</hx-button>
  <hx-button slot="footer" variant="primary" data-dialog-confirm>Save</hx-button>
</hx-dialog>`;

export const DIALOG_TS = `const trigger = document.querySelector<HXButton>('#open-prefs')!;
const dialog = document.querySelector<HXDialog>('#prefs')!;

trigger.addEventListener('hx-click', () => {
  // hx-dialog records the trigger and traps focus on open …
  dialog.show({ returnFocusTo: trigger });
});

dialog.addEventListener('hx-close', () => {
  // … then restores focus to the trigger on close. No work for the consumer.
});`;

export const ROVING_TABINDEX_TS = `/**
 * Reactive controller pattern shared across hx-tabs, hx-menu, hx-radio-group.
 *
 * The active item carries tabindex="0"; siblings carry tabindex="-1".
 * Arrow keys advance the active index; Home/End jump to ends.
 *
 * Tab leaves the group entirely — there is no internal Tab cycling.
 */
export class RovingTabindexController implements ReactiveController {
  #host: ReactiveControllerHost & HTMLElement;
  #items: () => HTMLElement[];

  constructor(host: ReactiveControllerHost & HTMLElement, items: () => HTMLElement[]) {
    this.#host = host;
    this.#items = items;
    host.addController(this);
  }

  hostConnected() {
    this.#host.addEventListener('keydown', this.#onKeydown);
  }

  hostDisconnected() {
    this.#host.removeEventListener('keydown', this.#onKeydown);
  }

  setActive(index: number) {
    const items = this.#items();
    items.forEach((el, i) => (el.tabIndex = i === index ? 0 : -1));
    items[index]?.focus();
  }

  // … #onKeydown wires Arrow / Home / End / type-ahead.
}`;

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
 * WCAG 2.1 contrast ratio for two sRGB hex colours.
 *
 *   1.4.3 (AA)  ≥ 4.5  for normal text
 *   1.4.6 (AAA) ≥ 7.0  for normal text
 *   1.4.11      ≥ 3.0  for non-text UI components
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
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  // ITU-R BT.709 luminance coefficients.
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}`;

export const REGENERATE_CONTRAST_BASH = `# Regenerate packages/hx-tokens/.cache/contrast-report.json from the
# current token cascade. Output is gitignored but consumed by the
# Storybook bundle at build time, so a stale cache shows stale numbers.

pnpm --filter=@helixui/tokens run contrast:report

# Then rebuild storybook (or restart dev) to surface the new matrix:
pnpm --filter=@helixui/storybook run build`;
