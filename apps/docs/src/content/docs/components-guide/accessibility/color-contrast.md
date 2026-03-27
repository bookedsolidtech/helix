---
title: Color Contrast
description: WCAG AA contrast requirements, how HELiX tokens meet them, and how to verify contrast when building new components.
---

Color contrast is the most commonly failed WCAG criterion. HELiX design tokens are pre-validated against WCAG 2.1 AA thresholds so using them correctly keeps components compliant automatically.

## WCAG AA Requirements

| Content type | Minimum contrast ratio |
|---|---|
| Normal text (below 18pt / 14pt bold) | 4.5:1 |
| Large text (18pt+ / 14pt+ bold) | 3:1 |
| UI components (buttons, inputs, form controls) | 3:1 |
| Graphical objects (icons, charts, focus rings) | 3:1 |
| Disabled controls | No requirement |
| Decorative elements | No requirement |

Contrast is measured between the foreground color and the background directly behind it. For components with a gradient background, use the lightest point of the gradient as the background value.

## HELiX Tokens and Contrast

HELiX color tokens are organized around semantic roles and validated at design time:

| Token | Value | Use case |
|---|---|---|
| `--hx-color-primary-500` | #0052cc | Primary button background |
| `--hx-color-neutral-0` | #ffffff | Button text on dark backgrounds |
| `--hx-color-neutral-900` | #161616 | Body text on white |
| `--hx-color-error-600` | #da1e28 | Error text and borders |
| `--hx-color-success-600` | #198038 | Success text and borders |

Using the semantic token pairs as intended — for example, `--hx-color-neutral-0` text on a `--hx-color-primary-500` background — meets the 4.5:1 threshold. Do not mix tokens outside their intended pairs without verifying contrast.

## Focus Ring Contrast

Focus rings must meet the 3:1 non-text contrast requirement against the adjacent background. HELiX uses `--hx-focus-ring-color`, which resolves to a high-contrast blue that is visible against both white and dark backgrounds.

Components that render on inverted or colored surfaces override the focus ring:

```typescript
css`
  :host {
    --hx-button-focus-ring-color: var(--hx-button-inverted-focus-ring-color, rgba(255, 255, 255, 0.5));
  }
`
```

This ensures the focus ring remains visible when an inverted `hx-button` is on a dark background.

## Checking Contrast During Development

### Browser DevTools

Chrome DevTools: Inspect an element → click the color swatch in the Styles panel → the contrast ratio appears in the color picker. A checkmark indicates AA compliance.

Firefox DevTools: Accessibility panel → select the element → "Check web page for accessibility issues" → contrast violations are highlighted.

### `@storybook/addon-a11y`

The Storybook accessibility addon runs axe-core on every story. The "A11y" tab in the Storybook addons panel shows contrast violations with the specific elements and values that fail.

```typescript
// .storybook/main.ts
export default {
  addons: [
    '@storybook/addon-a11y',
    // ...
  ],
};
```

### Automated axe-core in Tests

`checkA11y` from HELiX test-utils includes the `color-contrast` rule by default:

```typescript
it('has no contrast violations', async () => {
  const el = await fixture<HelixButton>('<hx-button>Save</hx-button>');
  const { violations } = await checkA11y(el);
  const contrastViolations = violations.filter(v => v.id === 'color-contrast');
  expect(contrastViolations).toEqual([]);
});
```

Note: axe-core's contrast check requires the element to be rendered visually. Tests running headlessly with Playwright do detect contrast failures because Chromium computes computed styles.

## `forced-colors` Media Query — Windows High Contrast

Windows High Contrast Mode (and its CSS equivalent `forced-colors: active`) overrides all author-defined colors with system colors. Always test in this mode for components with custom color logic.

```typescript
css`
  @media (forced-colors: active) {
    :host {
      /* Use system color keywords to maintain meaning */
      --hx-button-bg: ButtonFace;
      --hx-button-color: ButtonText;
      --hx-button-border-color: ButtonBorder;
    }

    button:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`
```

System color keywords available in `forced-colors`:

| Keyword | Represents |
|---|---|
| `ButtonFace` | Button background |
| `ButtonText` | Button text |
| `ButtonBorder` | Button border |
| `Highlight` | Selected text background / focus |
| `HighlightText` | Selected text foreground |
| `LinkText` | Unvisited link color |
| `Canvas` | Page background |
| `CanvasText` | Page text |

## `currentColor` for Icon Fills

Icons rendered inside buttons or other colored elements should use `currentColor` for their fill or stroke. This ensures they inherit the text color of their container and maintain contrast automatically:

```html
<svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
  <path stroke="currentColor" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
</svg>
```

When `currentColor` is used, the icon color changes when the button is hovered, focused, or when Windows High Contrast overrides the text color — all without any additional CSS.

## Next Steps

- [WCAG Compliance](/components-guide/accessibility/wcag/) — full AA requirements
- [ARIA in Web Components](/components-guide/accessibility/aria/) — accessible names and roles
- [Accessibility Testing](/components-guide/testing/accessibility-testing/) — automated contrast checking in tests
